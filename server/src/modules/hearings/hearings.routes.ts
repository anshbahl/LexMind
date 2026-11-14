import { Router, Response } from 'express';
import { pool } from '../../config/db.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Get upcoming hearings across all cases
router.get('/upcoming', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const lawyerId = req.lawyerId;
    const result = await pool.query(
      `SELECT h.*, c.case_title, c.court_forum, c.case_type, c.cnr_number, c.client_name, c.opposing_party
       FROM hearings h
       JOIN cases c ON c.id = h.case_id
       WHERE h.lawyer_id = $1 AND h.hearing_date >= CURRENT_DATE
       ORDER BY h.hearing_date ASC
       LIMIT 20`,
      [lawyerId]
    );

    res.json({ hearings: result.rows });
  } catch (err: any) {
    console.error('Error fetching upcoming hearings:', err);
    res.status(500).json({ error: 'Failed to fetch upcoming hearings' });
  }
});

// Log new hearing for a case
router.post('/case/:caseId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { caseId } = req.params;
    const lawyerId = req.lawyerId;
    const { hearing_date, purpose, judge_coram, order_summary, next_action_items, next_hearing_date } = req.body;

    if (!hearing_date || !purpose || !order_summary) {
      res.status(400).json({ error: 'Hearing date, purpose, and order summary are required.' });
      return;
    }

    // Verify case ownership
    const caseCheck = await pool.query(
      `SELECT id FROM cases WHERE id = $1 AND lawyer_id = $2`,
      [caseId, lawyerId]
    );
    if (caseCheck.rows.length === 0) {
      res.status(404).json({ error: 'Case not found or unauthorized' });
      return;
    }

    const insertResult = await pool.query(
      `INSERT INTO hearings (case_id, lawyer_id, hearing_date, purpose, judge_coram, order_summary, next_action_items)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [caseId, lawyerId, hearing_date, purpose, judge_coram || null, order_summary, next_action_items || null]
    );

    // Optionally update next_hearing_date on the case
    if (next_hearing_date) {
      await pool.query(
        `UPDATE cases SET next_hearing_date = $1 WHERE id = $2 AND lawyer_id = $3`,
        [next_hearing_date, caseId, lawyerId]
      );
    }

    res.status(201).json({
      message: 'Hearing log recorded successfully',
      hearing: insertResult.rows[0],
    });
  } catch (err: any) {
    console.error('Error logging hearing:', err);
    res.status(500).json({ error: 'Failed to log hearing', details: err.message });
  }
});

// Update hearing
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lawyerId = req.lawyerId;
    const { hearing_date, purpose, judge_coram, order_summary, next_action_items } = req.body;

    const result = await pool.query(
      `UPDATE hearings
       SET hearing_date = COALESCE($1, hearing_date),
           purpose = COALESCE($2, purpose),
           judge_coram = COALESCE($3, judge_coram),
           order_summary = COALESCE($4, order_summary),
           next_action_items = COALESCE($5, next_action_items)
       WHERE id = $6 AND lawyer_id = $7
       RETURNING *`,
      [hearing_date || null, purpose || null, judge_coram || null, order_summary || null, next_action_items || null, id, lawyerId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Hearing not found or unauthorized' });
      return;
    }

    res.json({ message: 'Hearing updated successfully', hearing: result.rows[0] });
  } catch (err: any) {
    console.error('Error updating hearing:', err);
    res.status(500).json({ error: 'Failed to update hearing' });
  }
});

// Delete hearing
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lawyerId = req.lawyerId;

    const result = await pool.query(
      `DELETE FROM hearings WHERE id = $1 AND lawyer_id = $2 RETURNING id`,
      [id, lawyerId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Hearing not found or unauthorized' });
      return;
    }

    res.json({ message: 'Hearing deleted successfully', id });
  } catch (err: any) {
    console.error('Error deleting hearing:', err);
    res.status(500).json({ error: 'Failed to delete hearing' });
  }
});

export default router;

