const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'contract_approval.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ DB接続エラー:', err);
    process.exit(1);
  }
});

const newUser = {
  name: '清水恭子',
  email: 'shimizu.kyoko@company.com',
  employee_id: 'EMP006',
  role: 'employee'
};

db.run(
  'INSERT INTO users (name, email, employee_id, role, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
  [newUser.name, newUser.email, newUser.employee_id, newUser.role],
  function(err) {
    if (err) {
      console.error('❌ 追加エラー:', err);
      db.close();
      process.exit(1);
    }
    console.log('✅ 清水恭子を追加しました (ID: ' + this.lastID + ')');
    
    // 全従業員を表示
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) {
        console.error('❌ 読込エラー:', err);
      } else {
        console.log('\n🔍 現在の登録従業員一覧:');
        rows.forEach(row => {
          console.log(`  - ${row.name} (${row.employee_id})`);
        });
      }
      db.close();
      process.exit(0);
    });
  }
);
