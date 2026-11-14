import { pool } from '../config/db.js';
import { embeddingService } from './embedding.service.js';
import { cache } from './redis.service.js';
import { RetrievedPrecedent, CaseType } from '../types/index.js';

export interface HybridSearchParams {
  lawyerId: string;
  query: string;
  caseType?: CaseType;
  courtForum?: string;
  limit?: number;
}

export class RagService {
  /**
   * Executes a hybrid search combining Vector Cosine Similarity and PostgreSQL BM25 tsvector
   * with Reciprocal Rank Fusion (RRF), strictly tenant-isolated to the authenticated lawyer.
   */
  async searchPrecedents(params: HybridSearchParams): Promise<RetrievedPrecedent[]> {
    const { lawyerId, query, caseType, courtForum, limit = 6 } = params;

    if (!lawyerId || !query || query.trim().length === 0) {
      return [];
    }

    const cleanQuery = query.trim();
    const cacheKey = `prec:${lawyerId}:${cleanQuery.toLowerCase()}:${caseType || 'all'}:${courtForum || 'all'}:${limit}`;

    // Check Redis cache first
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Proceed to DB
    }

    // 1. Generate query embedding vector (768 dimensions)
    const queryEmbedding = await embeddingService.generateEmbedding(cleanQuery);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // 2. Formulate Hybrid RRF SQL Query
    // Parameters:
    // $1: query embedding vector
    // $2: lawyerId (strict tenant isolation)
    // $3: search text for plainto_tsquery
    // $4: limit
    let filterClause = '';
    const queryArgs: any[] = [vectorString, lawyerId, cleanQuery, limit];
    let argIndex = 5;

    if (caseType) {
      filterClause += ` AND c.case_type = $${argIndex}`;
      queryArgs.push(caseType);
      argIndex++;
    }

    if (courtForum) {
      filterClause += ` AND c.court_forum ILIKE $${argIndex}`;
      queryArgs.push(`%${courtForum}%`);
      argIndex++;
    }

    const sql = `
      WITH semantic_search AS (
        SELECT 
          dc.id,
          ROUND((1 - (dc.embedding <=> $1::vector))::numeric, 4) AS semantic_sim,
          ROW_NUMBER() OVER (ORDER BY dc.embedding <=> $1::vector) AS semantic_rank
        FROM document_chunks dc
        JOIN cases c ON c.id = dc.case_id
        WHERE dc.lawyer_id = $2 ${filterClause}
        ORDER BY dc.embedding <=> $1::vector
        LIMIT 25
      ),
      lexical_search AS (
        SELECT 
          dc.id,
          ts_rank_cd(dc.search_vector, plainto_tsquery('english', $3)) AS lexical_rank_val,
          ROW_NUMBER() OVER (ORDER BY ts_rank_cd(dc.search_vector, plainto_tsquery('english', $3)) DESC) AS lexical_rank
        FROM document_chunks dc
        JOIN cases c ON c.id = dc.case_id
        WHERE dc.lawyer_id = $2 
          AND dc.search_vector @@ plainto_tsquery('english', $3)
          ${filterClause}
        ORDER BY lexical_rank_val DESC
        LIMIT 25
      )
      SELECT 
        dc.id AS chunk_id,
        dc.document_id,
        dc.case_id,
        dc.chunk_index,
        dc.section_type,
        dc.content,
        c.case_title,
        c.court_forum,
        c.case_type,
        c.outcome_summary,
        d.file_name,
        d.document_category,
        COALESCE(s.semantic_sim, 0.0)::float AS semantic_similarity,
        COALESCE(s.semantic_rank, 100)::int AS s_rank,
        COALESCE(l.lexical_rank, 100)::int AS l_rank,
        ROUND((
          COALESCE(1.0 / (60.0 + s.semantic_rank), 0.0) +
          COALESCE(1.0 / (60.0 + l.lexical_rank), 0.0)
        )::numeric, 5)::float AS rrf_score
      FROM document_chunks dc
      JOIN cases c ON c.id = dc.case_id
      JOIN documents d ON d.id = dc.document_id
      LEFT JOIN semantic_search s ON s.id = dc.id
      LEFT JOIN lexical_search l ON l.id = dc.id
      WHERE dc.lawyer_id = $2 
        AND (s.id IS NOT NULL OR l.id IS NOT NULL)
      ORDER BY rrf_score DESC, semantic_similarity DESC
      LIMIT $4;
    `;

    try {
      const result = await pool.query(sql, queryArgs);

      const precedents: RetrievedPrecedent[] = result.rows.map((row) => {
        // Label format: "Case Title (Document File Name, Section Type)"
        const citationLabel = `${row.case_title} [Doc: ${row.file_name}, §${row.section_type}]`;
        return {
          chunk_id: row.chunk_id,
          document_id: row.document_id,
          case_id: row.case_id,
          case_title: row.case_title,
          court_forum: row.court_forum,
          case_type: row.case_type,
          file_name: row.file_name,
          document_category: row.document_category,
          section_type: row.section_type,
          content: row.content,
          outcome_summary: row.outcome_summary,
          semantic_similarity: Math.min(1.0, Math.max(0.0, Number(row.semantic_similarity))),
          lexical_rank: row.l_rank < 100 ? row.l_rank : undefined,
          rrf_score: Number(row.rrf_score),
          citation_label: citationLabel,
        };
      });

      // Cache top results in Redis for 10 minutes
      if (precedents.length > 0) {
        await cache.set(cacheKey, JSON.stringify(precedents), 600);
      }

      return precedents;
    } catch (err: any) {
      console.error('Error during hybrid precedent search:', err);
      // Fallback: simple text match if vector query had issues
      return this.fallbackSearch(lawyerId, cleanQuery, limit);
    }
  }

  private async fallbackSearch(lawyerId: string, query: string, limit: number): Promise<RetrievedPrecedent[]> {
    const fallbackSql = `
      SELECT 
        dc.id AS chunk_id,
        dc.document_id,
        dc.case_id,
        dc.chunk_index,
        dc.section_type,
        dc.content,
        c.case_title,
        c.court_forum,
        c.case_type,
        c.outcome_summary,
        d.file_name,
        d.document_category,
        0.75 AS semantic_similarity,
        1 AS s_rank,
        1 AS l_rank,
        0.033 AS rrf_score
      FROM document_chunks dc
      JOIN cases c ON c.id = dc.case_id
      JOIN documents d ON d.id = dc.document_id
      WHERE dc.lawyer_id = $1 
        AND (dc.content ILIKE $2 OR c.case_title ILIKE $2)
      LIMIT $3;
    `;
    const res = await pool.query(fallbackSql, [lawyerId, `%${query}%`, limit]);
    return res.rows.map((row) => ({
      chunk_id: row.chunk_id,
      document_id: row.document_id,
      case_id: row.case_id,
      case_title: row.case_title,
      court_forum: row.court_forum,
      case_type: row.case_type,
      file_name: row.file_name,
      document_category: row.document_category,
      section_type: row.section_type,
      content: row.content,
      outcome_summary: row.outcome_summary,
      semantic_similarity: 0.75,
      rrf_score: 0.033,
      citation_label: `${row.case_title} [Doc: ${row.file_name}, §${row.section_type}]`,
    }));
  }
}

export const ragService = new RagService();

