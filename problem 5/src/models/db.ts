import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data.db');
const db = new Database(dbPath);

// Create users table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;