import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'contract_approval.db');

async function initDB() {
  let db;
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // テーブル作成SQL
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        employee_id TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        phone TEXT,
        department TEXT,
        position TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_login_at TEXT
      );

      CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        contract_id TEXT UNIQUE NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT,
        file_size INTEGER,
        uploaded_by TEXT NOT NULL,
        uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
        total_sheets INTEGER DEFAULT 0,
        completed_sheets INTEGER DEFAULT 0,
        status TEXT DEFAULT 'in_progress',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS contract_sheets (
        id TEXT PRIMARY KEY,
        contract_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        sheet_name TEXT NOT NULL,
        sheet_index INTEGER,
        sheet_data TEXT,
        pdf_url TEXT,
        status TEXT DEFAULT 'pending',
        sent_at TEXT,
        viewed_at TEXT,
        signed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(contract_id, user_id),
        FOREIGN KEY (contract_id) REFERENCES contracts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS signatures (
        id TEXT PRIMARY KEY,
        contract_sheet_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        signature_data TEXT NOT NULL,
        signature_image_url TEXT,
        signed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        device_os TEXT,
        device_model TEXT,
        browser_user_agent TEXT,
        location TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_sheet_id) REFERENCES contract_sheets(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        description TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        refresh_token TEXT NOT NULL UNIQUE,
        ip_address TEXT,
        user_agent TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;

    await db.exec(createTablesSQL);
    console.log('✅ テーブル作成完了');

    // サンプルデータの確認
    const existingUsers = await db.get('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers && existingUsers.count === 0) {
      // サンプル従業員データ
      const sampleUsers = [
        { id: uuidv4(), employee_id: 'EMP001', first_name: '太郎', last_name: '田中', full_name: '田中 太郎', email: 'tanaka.taro@example.com', department: '営業部', position: 'パートタイマー' },
        { id: uuidv4(), employee_id: 'EMP002', first_name: '花子', last_name: '鈴木', full_name: '鈴木 花子', email: 'suzuki.hanako@example.com', department: '事務部', position: 'アルバイト' },
        { id: uuidv4(), employee_id: 'EMP003', first_name: '次郎', last_name: '佐藤', full_name: '佐藤 次郎', email: 'sato.jiro@example.com', department: '営業部', position: 'パートタイマー' },
        { id: uuidv4(), employee_id: 'EMP004', first_name: '美咲', last_name: '高橋', full_name: '高橋 美咲', email: 'takahashi.misaki@example.com', department: '企画部', position: 'アルバイト' },
        { id: uuidv4(), employee_id: 'EMP005', first_name: '一郎', last_name: '山田', full_name: '山田 一郎', email: 'yamada.ichiro@example.com', department: '営業部', position: 'パートタイマー' }
      ];

      for (const user of sampleUsers) {
        await db.run(
          `INSERT INTO users (id, employee_id, first_name, last_name, full_name, email, department, position, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
          [user.id, user.employee_id, user.first_name, user.last_name, user.full_name, user.email, user.department, user.position]
        );
      }
      console.log('✅ サンプル従業員 5 名を挿入しました');
    } else {
      console.log('✅ サンプルデータは既に存在します');
    }

    // 清水恭子を追加
    const userId = uuidv4();
    try {
      await db.run(
        `INSERT INTO users (id, employee_id, first_name, last_name, full_name, email, department, position, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [userId, 'EMP006', '恭子', '清水', '清水 恭子', 'shimizu.kyoko@example.com', '営業部', 'パートタイマー']
      );
      console.log('✅ 清水恭子を追加しました (ID: EMP006)');
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log('ℹ️ 清水恭子は既に登録されています');
      } else {
        throw error;
      }
    }

    // 全従業員一覧を表示
    const allUsers = await db.all('SELECT id, employee_id, full_name, email FROM users ORDER BY employee_id');
    console.log('\n🔍 現在の登録従業員一覧:');
    console.log('─'.repeat(60));
    allUsers.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.full_name} (${user.employee_id}) - ${user.email}`);
    });
    console.log('─'.repeat(60));

    await db.close();
    console.log('\n✅ データベース初期化完了！');
    process.exit(0);
  } catch (error) {
    console.error('❌ エラー:', error);
    if (db) await db.close();
    process.exit(1);
  }
}

initDB();
