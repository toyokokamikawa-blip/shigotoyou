import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'contract_approval.db');

async function checkUsers() {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const users = await db.all('SELECT id, employee_id, first_name, last_name, full_name FROM users');
    
    console.log('\n📋 登録済み従業員一覧:');
    console.log('─'.repeat(70));
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.full_name}`);
      console.log(`   - 苗字: "${u.last_name}", 名: "${u.first_name}"`);
      console.log(`   - ID: ${u.employee_id}`);
    });
    console.log('─'.repeat(70));

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

checkUsers();
