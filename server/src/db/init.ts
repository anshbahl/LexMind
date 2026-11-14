import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
  console.log('Connecting to PostgreSQL database to apply LexMind schema...');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schemaSql);
    console.log('✅ LexMind database schema and pgvector indexes initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
    throw error;
  }
}

// Allow direct execution
if (process.argv[1] && process.argv[1].includes('init.ts')) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
