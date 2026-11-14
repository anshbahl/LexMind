import { Router, Response } from 'express';
import { pool } from '../../config/db.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.js';
import { geminiService } from '../../services/gemini.service.js';
import { ragService } from '../../services/rag.service.js';

const router = Router();

// Apply auth middleware to all case routes
router.use(authMiddleware);

// Get overview stats for Dashboard
router.get('/stats/overview', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const lawyerId = req.lawyerId;

    // Counts by status
    const statusCounts = await pool.query(
      `SELECT status, COUNT(*)::int as count 
       FROM cases 
       WHERE lawyer_id = $1 
       GROUP BY status`,
      [lawyerId]
    );

    // Counts by forum
    const forumCounts = await pool.query(
      `SELECT court_forum, COUNT(*)::int as count 
       FROM cases 
       WHERE lawyer_id = $1 
       GROUP BY court_forum 
       ORDER BY count DESC 
       LIMIT 6`,
      [lawyerId]
    );

    // Counts by type
    const typeCounts = await pool.query(
      `SELECT case_type, COUNT(*)::int as count 
       FROM cases 
       WHERE lawyer_id = $1 
       GROUP BY case_type`,
      [lawyerId]
    );

    // Upcoming hearings in the next 14 days
    const upcomingHearings = await pool.query(
      `SELECT h.*, c.case_title, c.court_forum, c.case_type, c.cnr_number
       FROM hearings h
       JOIN cases c ON c.id = h.case_id
       WHERE h.lawyer_id = $1 
         AND h.hearing_date >= CURRENT_DATE
       ORDER BY h.hearing_date ASC
       LIMIT 8`,
      [lawyerId]
    );

    // Total documents and chunks indexed
    const docsCount = await pool.query(
      `SELECT COUNT(*)::int as doc_count FROM documents WHERE lawyer_id = $1`,
      [lawyerId]
    );
    const chunksCount = await pool.query(
      `SELECT COUNT(*)::int as chunk_count FROM document_chunks WHERE lawyer_id = $1`,
      [lawyerId]
    );

    const stats = {
      activeCases: 0,
      disposedCases: 0,
      archivedCases: 0,
      totalCases: 0,
      totalDocuments: docsCount.rows[0]?.doc_count || 0,
      totalChunksIndexed: chunksCount.rows[0]?.chunk_count || 0,
      upcomingHearingsCount: upcomingHearings.rows.length,
      forumDistribution: forumCounts.rows,
      typeDistribution: typeCounts.rows,
      upcomingHearings: upcomingHearings.rows,
    };

    for (const row of statusCounts.rows) {
      if (row.status === 'ACTIVE') stats.activeCases = row.count;
      if (row.status === 'DISPOSED') stats.disposedCases = row.count;
      if (row.status === 'ARCHIVED') stats.archivedCases = row.count;
      stats.totalCases += row.count;
    }

    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching dashboard overview stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// List all cases for current lawyer with filters
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const lawyerId = req.lawyerId;
    const { status, case_type, search } = req.query;

    let queryText = `
      SELECT 
        c.*,
        (SELECT COUNT(*)::int FROM hearings h WHERE h.case_id = c.id) AS hearings_count,
        (SELECT COUNT(*)::int FROM documents d WHERE d.case_id = c.id) AS documents_count
      FROM cases c
      WHERE c.lawyer_id = $1
    `;
    const params: any[] = [lawyerId];
    let paramIndex = 2;

    if (status && status !== 'ALL') {
      queryText += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (case_type && case_type !== 'ALL') {
      queryText += ` AND c.case_type = $${paramIndex}`;
      params.push(case_type);
      paramIndex++;
    }

    if (search && String(search).trim().length > 0) {
      queryText += ` AND (c.case_title ILIKE $${paramIndex} OR c.cnr_number ILIKE $${paramIndex} OR c.client_name ILIKE $${paramIndex} OR c.opposing_party ILIKE $${paramIndex} OR c.court_forum ILIKE $${paramIndex})`;
      params.push(`%${String(search).trim()}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY c.next_hearing_date ASC NULLS LAST, c.created_at DESC`;

    const result = await pool.query(queryText, params);
    res.json({ cases: result.rows });
  } catch (err: any) {
    console.error('Error listing cases:', err);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// Create new case
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const lawyerId = req.lawyerId;
    const {
      case_title,
      cnr_number,
      client_name,
      opposing_party,
      court_forum,
      case_type = 'CIVIL',
      status = 'ACTIVE',
      outcome_summary,
      next_hearing_date,
    } = req.body;

    if (!case_title || !client_name || !opposing_party || !court_forum) {
      res.status(400).json({ error: 'Case title, client name, opposing party, and court forum are required.' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO cases (lawyer_id, case_title, cnr_number, client_name, opposing_party, court_forum, case_type, status, outcome_summary, next_hearing_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        lawyerId,
        case_title,
        cnr_number || null,
        client_name,
        opposing_party,
        court_forum,
        case_type,
        status,
        outcome_summary || null,
        next_hearing_date || null,
      ]
    );

    res.status(201).json({
      message: 'Matter created successfully',
      case: result.rows[0],
    });
  } catch (err: any) {
    console.error('Error creating case:', err);
    res.status(500).json({ error: 'Failed to create case', details: err.message });
  }
});

// Get single case dossier
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lawyerId = req.lawyerId;

    const caseRes = await pool.query(
      `SELECT * FROM cases WHERE id = $1 AND lawyer_id = $2`,
      [id, lawyerId]
    );

    if (caseRes.rows.length === 0) {
      res.status(404).json({ error: 'Case not found or unauthorized' });
      return;
    }

    const caseData = caseRes.rows[0];

    // Fetch hearings
    const hearingsRes = await pool.query(
      `SELECT * FROM hearings WHERE case_id = $1 AND lawyer_id = $2 ORDER BY hearing_date DESC, created_at DESC`,
      [id, lawyerId]
    );

    // Fetch documents with chunk count
    const docsRes = await pool.query(
      `SELECT d.*, 
        (SELECT COUNT(*)::int FROM document_chunks dc WHERE dc.document_id = d.id) AS chunks_count
       FROM documents d
       WHERE d.case_id = $1 AND d.lawyer_id = $2
       ORDER BY d.uploaded_at DESC`,
      [id, lawyerId]
    );

    res.json({
      case: caseData,
      hearings: hearingsRes.rows,
      documents: docsRes.rows,
    });
  } catch (err: any) {
    console.error('Error fetching case dossier:', err);
    res.status(500).json({ error: 'Failed to fetch case dossier' });
  }
});

// Update case
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lawyerId = req.lawyerId;
    const {
      case_title,
      cnr_number,
      client_name,
      opposing_party,
      court_forum,
      case_type,
      status,
      outcome_summary,
      next_hearing_date,
    } = req.body;

    const result = await pool.query(
      `UPDATE cases
       SET case_title = COALESCE($1, case_title),
           cnr_number = COALESCE($2, cnr_number),
           client_name = COALESCE($3, client_name),
           opposing_party = COALESCE($4, opposing_party),
           court_forum = COALESCE($5, court_forum),
           case_type = COALESCE($6, case_type),
           status = COALESCE($7, status),
           outcome_summary = COALESCE($8, outcome_summary),
           next_hearing_date = $9
       WHERE id = $10 AND lawyer_id = $11
       RETURNING *`,
      [
        case_title || null,
        cnr_number || null,
        client_name || null,
        opposing_party || null,
        court_forum || null,
        case_type || null,
        status || null,
        outcome_summary || null,
        next_hearing_date !== undefined ? next_hearing_date : null,
        id,
        lawyerId,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Case not found or unauthorized' });
      return;
    }

    res.json({ message: 'Case updated successfully', case: result.rows[0] });
  } catch (err: any) {
    console.error('Error updating case:', err);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

// Delete case
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lawyerId = req.lawyerId;

    const result = await pool.query(
      `DELETE FROM cases WHERE id = $1 AND lawyer_id = $2 RETURNING id`,
      [id, lawyerId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Case not found or unauthorized' });
      return;
    }

    res.json({ message: 'Case deleted successfully', id });
  } catch (err: any) {
    console.error('Error deleting case:', err);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// Module D: One-Click "2-Minute Chamber Brief" (Hearing Prep)
router.post('/:id/chamber-brief', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lawyerId = req.lawyerId;

    // Fetch case data
    const caseRes = await pool.query(
      `SELECT * FROM cases WHERE id = $1 AND lawyer_id = $2`,
      [id, lawyerId]
    );

    if (caseRes.rows.length === 0) {
      res.status(404).json({ error: 'Case not found or unauthorized' });
      return;
    }

    const caseData = caseRes.rows[0];

    // Fetch all hearings
    const hearingsRes = await pool.query(
      `SELECT * FROM hearings WHERE case_id = $1 AND lawyer_id = $2 ORDER BY hearing_date DESC`,
      [id, lawyerId]
    );

    // Fetch COURT_ORDER chunks for this case
    const courtOrdersRes = await pool.query(
      `SELECT dc.* 
       FROM document_chunks dc
       JOIN documents d ON d.id = dc.document_id
       WHERE dc.case_id = $1 AND dc.lawyer_id = $2 
         AND (d.document_category = 'COURT_ORDER' OR dc.section_type = 'ORDER_OPERATIVE_PART')
       ORDER BY dc.created_at DESC
       LIMIT 5`,
      [id, lawyerId]
    );

    // Retrieve closest precedents for relevant statutory context
    const precedents = await ragService.searchPrecedents({
      lawyerId: lawyerId!,
      query: `${caseData.case_title} ${caseData.court_forum} ${caseData.case_type} order direction`,
      limit: 3,
    });

    const brief = await geminiService.generateChamberBrief(
      caseData,
      hearingsRes.rows,
      courtOrdersRes.rows,
      precedents
    );

    res.json({ brief });
  } catch (err: any) {
    console.error('Error generating chamber brief:', err);
    res.status(500).json({ error: 'Failed to generate chamber brief', details: err.message });
  }
});

export default router;

