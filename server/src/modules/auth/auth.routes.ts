import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../../config/db.js';
import { authMiddleware, AuthenticatedRequest, signToken } from '../../middleware/auth.js';

const router = Router();

// Register new lawyer
router.post('/register', async (req, res: Response): Promise<void> => {
  try {
    const { full_name, email, password, bar_council_id, role = 'ADVOCATE', drafting_style_profile } = req.body;

    if (!full_name || !email || !password) {
      res.status(400).json({ error: 'Full name, email, and password are required.' });
      return;
    }

    const existing = await pool.query('SELECT id FROM lawyers WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'A lawyer with this email is already registered.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const defaultProfile = {
      preferredSalutation: 'MOST RESPECTFULLY SHOWETH',
      courtAddressingHonorific: 'This Hon’ble Court',
      formattingPreferences: {
        useNumberedParagraphs: true,
        includeVerificationClause: true,
        prayerStyle: 'traditional',
      },
      recurringPhrasing: [
        'grave prejudice and irreparable injury',
        'bona fide exercise of rights',
        'prima facie case',
        'settled proposition of law',
      ],
      firmHeader: 'CHAMBERS OF ADVOCATE',
      ...drafting_style_profile,
    };

    const insertResult = await pool.query(
      `INSERT INTO lawyers (full_name, email, password_hash, bar_council_id, role, drafting_style_profile)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email, bar_council_id, role, drafting_style_profile, created_at`,
      [full_name, email.toLowerCase().trim(), password_hash, bar_council_id || null, role, JSON.stringify(defaultProfile)]
    );

    const lawyer = insertResult.rows[0];
    const token = signToken(lawyer);

    res.status(201).json({
      message: 'Lawyer profile registered successfully',
      token,
      lawyer: {
        id: lawyer.id,
        full_name: lawyer.full_name,
        email: lawyer.email,
        bar_council_id: lawyer.bar_council_id,
        role: lawyer.role,
        drafting_style_profile: lawyer.drafting_style_profile,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register lawyer', details: err.message });
  }
});

// Login
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const result = await pool.query(
      `SELECT id, full_name, email, password_hash, bar_council_id, role, drafting_style_profile, created_at
       FROM lawyers WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials. Lawyer account not found.' });
      return;
    }

    const lawyer = result.rows[0];
    const isValid = await bcrypt.compare(password, lawyer.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signToken(lawyer);

    res.json({
      message: 'Login successful',
      token,
      lawyer: {
        id: lawyer.id,
        full_name: lawyer.full_name,
        email: lawyer.email,
        bar_council_id: lawyer.bar_council_id,
        role: lawyer.role,
        drafting_style_profile: lawyer.drafting_style_profile,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// Get current profile
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, bar_council_id, role, drafting_style_profile, created_at
       FROM lawyers WHERE id = $1`,
      [req.lawyerId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Lawyer profile not found.' });
      return;
    }

    res.json({ lawyer: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch lawyer profile' });
  }
});

// Update profile / drafting style
router.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { full_name, bar_council_id, drafting_style_profile } = req.body;

    const result = await pool.query(
      `UPDATE lawyers 
       SET full_name = COALESCE($1, full_name),
           bar_council_id = COALESCE($2, bar_council_id),
           drafting_style_profile = COALESCE($3, drafting_style_profile)
       WHERE id = $4
       RETURNING id, full_name, email, bar_council_id, role, drafting_style_profile`,
      [
        full_name || null,
        bar_council_id || null,
        drafting_style_profile ? JSON.stringify(drafting_style_profile) : null,
        req.lawyerId,
      ]
    );

    res.json({
      message: 'Drafting style profile updated successfully',
      lawyer: result.rows[0],
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;

