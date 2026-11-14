import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool } from '../../config/db.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.js';
import { pdfService } from '../../services/pdf.service.js';
import { legalChunkingService } from '../../services/chunking.service.js';
import { embeddingService } from '../../services/embedding.service.js';
import { cache } from '../../services/redis.service.js';
import { DocumentCategory } from '../../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

const router = Router();
router.use(authMiddleware);

// Upload & Ingest Document for a Case
router.post('/case/:caseId', upload.single('file'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { caseId } = req.params;
    const lawyerId = req.lawyerId;
    const file = req.file;
    const { document_category = 'PETITION', raw_text, custom_name } = req.body;

    // Verify case ownership
    const caseRes = await pool.query(
      `SELECT * FROM cases WHERE id = $1 AND lawyer_id = $2`,
      [caseId, lawyerId]
    );

    if (caseRes.rows.length === 0) {
      res.status(404).json({ error: 'Case not found or unauthorized' });
      return;
    }

    const caseData = caseRes.rows[0];
    let fileName = custom_name || file?.originalname || 'Legal_Document.pdf';
    let fileUrl = file ? `/uploads/${file.filename}` : '/uploads/direct-text.txt';
    let extractedText = '';
    let pageCount = 1;
    let ocrStatus = 'PROCESSING';

    if (file) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.pdf') {
        const extraction = await pdfService.extractText(file.path);
        extractedText = extraction.text;
        pageCount = extraction.pageCount;
        ocrStatus = extraction.requiresOcr ? 'COMPLETED' : 'COMPLETED';
      } else {
        extractedText = fs.readFileSync(file.path, 'utf-8');
        ocrStatus = 'COMPLETED';
      }
    } else if (raw_text) {
      extractedText = raw_text;
      ocrStatus = 'COMPLETED';
    } else {
      res.status(400).json({ error: 'Either a file or raw_text must be provided.' });
      return;
    }

    // 1. Insert documents record
    const docInsert = await pool.query(
      `INSERT INTO documents (case_id, lawyer_id, file_name, file_url, document_category, ocr_status, page_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [caseId, lawyerId, fileName, fileUrl, document_category as DocumentCategory, ocrStatus, pageCount]
    );

    const documentRecord = docInsert.rows[0];

    // 2. Hierarchical Legal Chunking
    const rawChunks = legalChunkingService.chunkLegalDocument(extractedText);

    // 3. Generate embeddings & insert chunks
    let chunksInserted = 0;
    for (const chunk of rawChunks) {
      const embedding = await embeddingService.generateEmbedding(chunk.content);
      const vectorString = `[${embedding.join(',')}]`;

      const chunkMetadata = {
        case_title: caseData.case_title,
        court_forum: caseData.court_forum,
        case_type: caseData.case_type,
        outcome_summary: caseData.outcome_summary,
        file_name: fileName,
        document_category,
      };

      await pool.query(
        `INSERT INTO document_chunks (
          document_id, case_id, lawyer_id, chunk_index, section_type, content, embedding, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)`,
        [
          documentRecord.id,
          caseId,
          lawyerId,
          chunk.chunk_index,
          chunk.section_type,
          chunk.content,
          vectorString,
          JSON.stringify(chunkMetadata),
        ]
      );
      chunksInserted++;
    }

    // Flush lawyer's search cache
    await cache.flushPattern(`prec:${lawyerId}`);

    res.status(201).json({
      message: 'Document uploaded and ingested successfully into chamber knowledge store',
      document: documentRecord,
      chunks_count: chunksInserted,
    });
  } catch (err: any) {
    console.error('Error during document ingestion:', err);
    res.status(500).json({ error: 'Failed to ingest document', details: err.message });
  }
});

// List documents for a case
router.get('/case/:caseId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { caseId } = req.params;
    const lawyerId = req.lawyerId;

    const result = await pool.query(
      `SELECT d.*, 
        (SELECT COUNT(*)::int FROM document_chunks dc WHERE dc.document_id = d.id) AS chunks_count
       FROM documents d
       WHERE d.case_id = $1 AND d.lawyer_id = $2
       ORDER BY d.uploaded_at DESC`,
      [caseId, lawyerId]
    );

    res.json({ documents: result.rows });
  } catch (err: any) {
    console.error('Error listing documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get chunks for a specific document (for slide-over preview)
router.get('/:id/chunks', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lawyerId = req.lawyerId;

    const docRes = await pool.query(
      `SELECT * FROM documents WHERE id = $1 AND lawyer_id = $2`,
      [id, lawyerId]
    );

    if (docRes.rows.length === 0) {
      res.status(404).json({ error: 'Document not found or unauthorized' });
      return;
    }

    const chunksRes = await pool.query(
      `SELECT id, chunk_index, section_type, content, metadata, created_at
       FROM document_chunks
       WHERE document_id = $1 AND lawyer_id = $2
       ORDER BY chunk_index ASC`,
      [id, lawyerId]
    );

    res.json({
      document: docRes.rows[0],
      chunks: chunksRes.rows,
    });
  } catch (err: any) {
    console.error('Error fetching document chunks:', err);
    res.status(500).json({ error: 'Failed to fetch document chunks' });
  }
});

// Delete document
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lawyerId = req.lawyerId;

    const result = await pool.query(
      `DELETE FROM documents WHERE id = $1 AND lawyer_id = $2 RETURNING id`,
      [id, lawyerId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Document not found or unauthorized' });
      return;
    }

    await cache.flushPattern(`prec:${lawyerId}`);
    res.json({ message: 'Document and its vector chunks deleted successfully', id });
  } catch (err: any) {
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;

