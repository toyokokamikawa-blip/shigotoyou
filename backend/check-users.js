const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'contract_approval.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('DB接続エラー:', err);
    process.exit(1);
  }
});

db.all('SELECT id, employee_id, first_name, last_name, full_name FROM users', (err, rows) => {
  if (err) {
    console.error('クエリエラー:', err);
  } else {
    console.log('\n📋 登録済み従業員一覧:');
    console.log('─'.repeat(70));
    rows.forEach((u, i) => {
      console.log(`${i + 1}. ${u.full_name}`);
      console.log(`   - 苗字: "${u.last_name}", 名: "${u.first_name}"`);
      console.log(`   - ID: ${u.employee_id}`);
    });
    console.log('─'.repeat(70));
  }
  db.close();
  process.exit(0);
});
