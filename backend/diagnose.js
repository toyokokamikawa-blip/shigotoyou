import 'dotenv/config';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data', 'contract_approval.db');

console.log('--- DIAGNOSTIC START ---');
console.log('CWD:', process.cwd());
console.log('LINE_LOGIN_CHANNEL_ID:', process.env.LINE_LOGIN_CHANNEL_ID || 'MISSING');
console.log('LINE_MESSAGING_CHANNEL_SECRET:', process.env.LINE_MESSAGING_CHANNEL_SECRET ? 'PRESENT' : 'MISSING');

try {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  const rows = await db.all("PRAGMA table_info(users)");
  const hasCol = rows.some(r => r.name === 'line_user_id');
  console.log('Database Column line_user_id:', hasCol ? 'EXISTS' : 'NOT FOUND');
  await db.close();
} catch (e) {
  console.log('Database Access Error:', e.message);
}
console.log('--- DIAGNOSTIC END ---');
