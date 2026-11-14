import { Router, Response } from 'express';
import { pool } from '../../config/db.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.js';
import { ragService } from '../../services/rag.service.js';
import { geminiService } from '../../services/gemini.service.js';

const router = Router();
router.use(authMiddleware);

// POST /api/ai/draft (with SSE streaming)
router.post('/draft', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const lawyerId = req.lawyerId!;
    const { case_id, drafting_intent, selected_text, stream = true } = req.body;

    if (!case_id || !drafting_intent) {
      res.status(400).json({ error: 'case_id and drafting_intent are required.' });
      return;
    }

    // 1. Fetch case details
    const caseRes = await pool.query(
      `SELECT * FROM cases WHERE id = $1 AND lawyer_id = $2`,
      [case_id, lawyerId]
    );

    if (caseRes.rows.length === 0) {
      res.status(404).json({ error: 'Case not found or unauthorized' });
      return;
    }

    const currentCase = caseRes.rows[0];

    // 2. Fetch lawyer's drafting style profile
    const lawyerRes = await pool.query(
      `SELECT drafting_style_profile FROM lawyers WHERE id = $1`,
      [lawyerId]
    );
    const styleProfile = lawyerRes.rows[0]?.drafting_style_profile || {};

    // 3. Retrieve top 5 most relevant chunks from the lawyer's OWN past documents
    const searchQuery = `${drafting_intent} ${currentCase.case_type} ${currentCase.court_forum} ${selected_text || ''}`;
    const precedents = await ragService.searchPrecedents({
      lawyerId,
      query: searchQuery,
      caseType: currentCase.case_type,
      limit: 5,
    });

    const highestSimilarity = precedents.length > 0 ? precedents[0].semantic_similarity : 0.0;

    const draftingContext = {
      draftingIntent: drafting_intent,
      selectedText: selected_text,
      caseTitle: currentCase.case_title,
      courtForum: currentCase.court_forum,
      caseType: currentCase.case_type,
      clientName: currentCase.client_name,
      opposingParty: currentCase.opposing_party,
      styleProfile,
      precedents,
      highestSimilarity,
    };

    if (stream) {
      // Setup SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      // Send initial metadata event
      res.write(
        `data: ${JSON.stringify({
          type: 'meta',
          highestSimilarity,
          isBelowThreshold: highestSimilarity < 0.70,
          precedents: precedents.map((p) => ({
            chunk_id: p.chunk_id,
            document_id: p.document_id,
            case_title: p.case_title,
            file_name: p.file_name,
            section_type: p.section_type,
            similarity: p.semantic_similarity,
            citation_label: p.citation_label,
          })),
        })}\n\n`
      );

      // Stream generated clause tokens
      await geminiService.streamDrafting(draftingContext, (token: string) => {
        res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
      });

      // Send completion event
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } else {
      let fullOutput = '';
      await geminiService.streamDrafting(draftingContext, (token: string) => {
        fullOutput += token;
      });

      res.json({
        draft: fullOutput,
        highestSimilarity,
        isBelowThreshold: highestSimilarity < 0.70,
        precedents,
      });
    }
  } catch (err: any) {
    console.error('Error in AI drafting endpoint:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate draft', details: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
  }
});

// POST /api/ai/refine (refines or styles an existing clause)
router.post('/refine', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const lawyerId = req.lawyerId!;
    const { clause_text, action, tone = 'formal' } = req.body;

    if (!clause_text) {
      res.status(400).json({ error: 'clause_text is required.' });
      return;
    }

    // Lawyer profile
    const lawyerRes = await pool.query(
      `SELECT drafting_style_profile FROM lawyers WHERE id = $1`,
      [lawyerId]
    );
    const styleProfile = lawyerRes.rows[0]?.drafting_style_profile || {};

    let refinedText = clause_text;
    if (action === 'make_numbered') {
      const sentences = clause_text.split(/(?<=\.)\s+/).filter((s: string) => s.trim().length > 0);
      refinedText = sentences.map((s: string, idx: number) => `${idx + 1}. That ${s.trim()}`).join('\n\n');
    } else if (action === 'make_concise') {
      refinedText = clause_text
        .replace(/It is respectfully submitted that /gi, '')
        .replace(/In the humble submission of the petitioner /gi, '')
        .replace(/with the utmost respect and reverence /gi, '');
    } else if (action === 'harden_assertions') {
      refinedText = `${clause_text}\n\nAny contrary assertion by the opposing party is vehemently denied as baseless, frivolous, and calculated solely to mislead this Hon'ble Court.`;
    }

    res.json({
      original: clause_text,
      refined: refinedText,
      applied_action: action,
    });
  } catch (err: any) {
    console.error('Error refining clause:', err);
    res.status(500).json({ error: 'Failed to refine clause' });
  }
});

export default router;

