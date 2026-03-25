import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'contract_approval.db');

async function testQuery() {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('\n🧪 「清水」でのマッチングテスト:');
    console.log('─'.repeat(70));

    // テスト1: 完全一致
    let result = await db.get('SELECT id, full_name, last_name FROM users WHERE last_name = ?', ['清水']);
    console.log(`1. WHERE last_name = '清水':`);
    console.log(`   結果:`, result || 'なし');

    // テスト2: LIKE検索
    result = await db.get('SELECT id, full_name, last_name FROM users WHERE last_name LIKE ?', ['%清水%']);
    console.log(`\n2. WHERE last_name LIKE '%清水%':`);
    console.log(`   結果:`, result || 'なし');

    // テスト3: 方法6のコード通り
    result = await db.get(
      'SELECT id, full_name, employee_id, email FROM users WHERE last_name = ? OR last_name LIKE ?',
      ['清水', '%清水%']
    );
    console.log(`\n3. WHERE last_name = '清水' OR last_name LIKE '%清水%':`);
    console.log(`   結果:`, result || 'なし');

    // テスト4: すべての従業員リスト
    const all = await db.all('SELECT full_name, last_name FROM users');
    console.log(`\n4. 全従業員（last_nameで）:`);
    all.forEach(u => console.log(`   - ${u.full_name} (last_name: "${u.last_name}")`));

    console.log('─'.repeat(70));
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

testQuery();
