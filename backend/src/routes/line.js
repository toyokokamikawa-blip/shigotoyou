import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { dbRun, dbGet } from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// LINEログインURLの生成
router.get('/login-url', (req, res) => {
  console.log('--- GET /api/line/login-url ---');
  console.log('Channel ID from env:', process.env.LINE_LOGIN_CHANNEL_ID);

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: '認証トークンがありません' });
  }

  // 念のためTokenを検証（不正/古いトークンの場合は先に401を返してフロントエンドでログアウトさせる）
  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, error: 'セッションが期限切れです' });
  }

  // クライアント側（ブラウザ）からアクセスされているホスト名を基準にコールバックURLを動的生成
  // 本番環境（Render等）ではhttps、ローカルはhttp
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host;
  const callbackUrl = `${protocol}://${host}/api/line/callback`;

  const state = token; // PWAユーザーのJWTをstateにする
  const clientId = process.env.LINE_LOGIN_CHANNEL_ID;

  const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=profile%20openid`;
  console.log('--- GENERATED LINE AUTH URL ---');
  console.log(lineAuthUrl);
  res.json({ success: true, url: lineAuthUrl });
});

// LINEからのコールバック
router.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  const pwaUrl = process.env.PWA_URL || 'http://localhost:5174';

  if (error) {
    console.error('LINE Login Error:', error, error_description);
    return res.redirect(`${pwaUrl}/contracts?line_error=declined`);
  }

  if (!code || !state) {
    return res.redirect(`${pwaUrl}/contracts?line_error=invalid_request`);
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host;
  const callbackUrl = `${protocol}://${host}/api/line/callback`;

  try {
    console.log('--- LINE Callback Debug ---');
    console.log('Received state (token):', state.substring(0, 20) + '...');

    // 1. JWTからユーザーIDを復元
    let decoded;
    try {
      decoded = jwt.verify(state, JWT_SECRET);
    } catch (verifyErr) {
      console.error('JWT Verification failed:', verifyErr.message, verifyErr.name);
      throw verifyErr;
    }
    const userId = decoded.userId;

    // 2. アクセストークンを取得
    const tokenResponse = await axios.post('https://api.line.me/oauth2/v2.1/token', new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: callbackUrl,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID,
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET,
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenResponse.data.access_token;

    // 3. プロフィール（LINE user ID）を取得
    const profileResponse = await axios.get('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const lineUserId = profileResponse.data.userId;

    // 4. DBに保存
    await dbRun(`UPDATE users SET line_user_id = ? WHERE id = ?`, [lineUserId, userId]);

    console.log(`✅ LINEアカウント連携完了: UserID=${userId}, LINE_UserID=${lineUserId}`);

    // PWAにリダイレクトして成功を通知
    return res.redirect(`${pwaUrl}/contracts?line_success=1`);

  } catch (err) {
    console.error('❌ LINE API連携エラー:', err.response?.data || err.message);
    return res.redirect(`${pwaUrl}/contracts?line_error=api_error`);
  }
});

// テスト用プッシュ（確認用）
router.post('/test-push', async (req, res) => {
  const { userId } = req.body; // PWAのuser.id

  try {
    const user = await dbGet('SELECT line_user_id FROM users WHERE id = ?', [userId]);
    if (!user || !user.line_user_id) {
      return res.status(400).json({ success: false, error: 'LINEが連携されていません' });
    }

    await axios.post('https://api.line.me/v2/bot/message/push', {
      to: user.line_user_id,
      messages: [{ type: 'text', text: 'システムからのテスト通知です！' }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LINE_MESSAGING_ACCESS_TOKEN}`
      }
    });

    res.json({ success: true, message: 'LINEテスト通知を送信しました' });
  } catch (err) {
    console.error('Test Push Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
