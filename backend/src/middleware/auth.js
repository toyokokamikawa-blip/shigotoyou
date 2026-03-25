import jwt from 'jsonwebtoken';
import { dbGet } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'contract-approval-secret-key-2026';

/**
 * JWT認証ミドルウェア
 * Authorization: Bearer <token> ヘッダーからトークンを検証し、
 * req.user にユーザー情報を付与する
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です。ログインしてください。'
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);

    // ユーザーがDBに存在するか確認
    const user = await dbGet(
      'SELECT id, employee_id, first_name, last_name, full_name, email, department, position, status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'ユーザーが見つかりません。'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'アカウントが無効です。管理者にお問い合わせください。'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'セッションが期限切れです。再度ログインしてください。'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: '無効なトークンです。'
      });
    }
    console.error('認証エラー:', error);
    res.status(500).json({ success: false, error: '認証処理中にエラーが発生しました。' });
  }
};

export { JWT_SECRET };
