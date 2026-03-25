import sqlite3 from 'sqlite3';
const sqlite3Client = sqlite3.verbose();
const db = new sqlite3Client.Database('./data/contract_approval.db');

db.serialize(() => {
    db.all('SELECT id, full_name, employee_id, line_user_id FROM users', (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('=== User Database Status ===');
        let anyLinked = false;
        rows.forEach(row => {
            console.log(`- ID: ${row.id}, Name: ${row.full_name}, EmpID: ${row.employee_id}, LINE_ID: ${row.line_user_id || 'Not Linked'}`);
            if (row.line_user_id) anyLinked = true;
        });
        console.log('---');
        if (anyLinked) {
            console.log('SUCCESS: At least one user has successfully linked their LINE account! 🎉');
        } else {
            console.log('WARNING: No users have linked their LINE accounts yet.');
        }
    });
});
db.close();
