import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet } from '../db.js';
import { authenticate, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

const TOKEN_EXPIRY = '30d'; // 30日有効

/**
 * POST /api/auth/login
 * 従業員ログイン（従業員ID + パスワード）
 */
router.post('/login', async (req, res) => {
  try {
    const { employee_id, password } = req.body;

    if (!employee_id || !password) {
      return res.status(400).json({
        success: false,
        error: '従業員IDとパスワードを入力してください。'
      });
    }

    // 従業員IDでユーザー検索
    const user = await dbGet(
      'SELECT * FROM users WHERE employee_id = ?',
      [employee_id]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '従業員IDまたはパスワードが正しくありません。'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'アカウントが無効です。管理者にお問い合わせください。'
      });
    }

    // パスワード未設定の場合（初回ログイン）
    if (!user.password_hash) {
      // 初回ログイン: パスワードをハッシュ化して保存
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      await dbRun(
        'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
        [hash, new Date().toISOString(), user.id]
      );
      console.log(`🔑 初回ログイン: ${user.full_name} のパスワードを設定しました`);
    } else {
      // パスワード検証
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: '従業員IDまたはパスワードが正しくありません。'
        });
      }
    }

    // JWT トークン生成
    const token = jwt.sign(
      { userId: user.id, employeeId: user.employee_id },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // 最終ログイン日時を更新
    await dbRun(
      'UPDATE users SET last_login_at = ? WHERE id = ?',
      [new Date().toISOString(), user.id]
    );

    // 監査ログ記録
    await dbRun(
      `INSERT INTO audit_logs (id, user_id, action, target_type, description, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        user.id,
        'LOGIN',
        'user',
        `${user.full_name} がログインしました`,
        req.ip,
        req.headers['user-agent']
      ]
    );

    res.json({
      success: true,
      message: 'ログイン成功',
      data: {
        token,
        user: {
          id: user.id,
          employee_id: user.employee_id,
          full_name: user.full_name,
          email: user.email,
          department: user.department,
          position: user.position
        }
      }
    });
  } catch (error) {
    console.error('❌ ログインエラー:', error);
    res.status(500).json({ success: false, error: 'ログイン処理中にエラーが発生しました。' });
  }
});

/**
 * GET /api/auth/me
 * 現在のユーザー情報取得
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user.id,
        employee_id: req.user.employee_id,
        full_name: req.user.full_name,
        email: req.user.email,
        department: req.user.department,
        position: req.user.position
      }
    });
  } catch (error) {
    console.error('❌ ユーザー情報取得エラー:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/change-password
 * パスワード変更
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: '現在のパスワードと新しいパスワードを入力してください。'
      });
    }

    if (new_password.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'パスワードは4文字以上にしてください。'
      });
    }

    // 現在のユーザーのパスワードハッシュを取得
    const user = await dbGet('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);

    if (user.password_hash) {
      const isValid = await bcrypt.compare(current_password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: '現在のパスワードが正しくありません。'
        });
      }
    }

    // 新しいパスワードをハッシュ化
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(new_password, salt);

    await dbRun(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      [hash, new Date().toISOString(), req.user.id]
    );

    res.json({
      success: true,
      message: 'パスワードが変更されました。'
    });
  } catch (error) {
    console.error('❌ パスワード変更エラー:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
