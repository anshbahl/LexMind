import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes.js';
import casesRoutes from './modules/cases/cases.routes.js';
import hearingsRoutes from './modules/hearings/hearings.routes.js';
import documentsRoutes from './modules/documents/documents.routes.js';
import ragRoutes from './modules/rag/rag.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import { pool } from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development ports and standard requests
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads directory
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/hearings', hearingsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/precedents', ragRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW() as current_time, 1 as status');
    res.json({
      status: 'healthy',
      service: 'LexMind Legal Case Management & RAG Intelligence API',
      timestamp: dbRes.rows[0].current_time,
      database: 'PostgreSQL 16 with pgvector extension connected',
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'Disconnected',
      error: err.message,
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`⚖️  LexMind Backend API running on port ${PORT}`);
  console.log(`📚 Database: PostgreSQL + pgvector connected`);
  console.log(`🔗 Health check available at http://localhost:${PORT}/api/health`);
});

export default app;
