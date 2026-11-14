import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.js';
import { ragService } from '../../services/rag.service.js';
import { CaseType } from '../../types/index.js';

const router = Router();
router.use(authMiddleware);

// Hybrid Precedent Search (Vector Cosine + tsvector BM25 with RRF)
router.post('/search', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const lawyerId = req.lawyerId!;
    const { query, case_type, court_forum, limit = 6 } = req.body;

    if (!query || String(query).trim().length === 0) {
      res.status(400).json({ error: 'Search query is required.' });
      return;
    }

    const precedents = await ragService.searchPrecedents({
      lawyerId,
      query: String(query).trim(),
      caseType: case_type as CaseType,
      courtForum: court_forum ? String(court_forum) : undefined,
      limit: Math.min(Number(limit) || 6, 20),
    });

    res.json({
      query,
      count: precedents.length,
      precedents,
    });
  } catch (err: any) {
    console.error('Error during precedent search:', err);
    res.status(500).json({ error: 'Failed to search precedents', details: err.message });
  }
});

export default router;

