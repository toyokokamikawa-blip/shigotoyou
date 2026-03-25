import express from 'express';
import webpush from 'web-push';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbQuery, dbGet } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// VAPID鍵の設定（サーバー起動時に環境変数から読み込み、なければ生成）
let vapidKeys;
try {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY
    };
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    console.log('🔑 VAPID鍵を生成しました（環境変数に保存することを推奨）');
    console.log(`  VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    console.log(`  VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  }

  webpush.setVapidDetails(
    'mailto:admin@contract-approval.local',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
} catch (error) {
  console.warn('⚠️ Web Push初期化スキップ:', error.message);
}

/**
 * GET /api/push/vapid-public-key
 * クライアント側でプッシュ通知を購読するためのVAPID公開鍵を返す
 */
router.get('/vapid-public-key', (req, res) => {
  if (!vapidKeys) {
    return res.status(503).json({ success: false, error: 'プッシュ通知が利用できません。' });
  }
  res.json({ success: true, data: { publicKey: vapidKeys.publicKey } });
});

/**
 * POST /api/push/subscribe
 * プッシュ通知購読登録
 */
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        error: '購読情報が不正です。'
      });
    }

    // 既存の購読を確認
    const existing = await dbGet(
      'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [req.user.id, subscription.endpoint]
    );

    if (existing) {
      // 更新
      await dbRun(
        'UPDATE push_subscriptions SET keys = ?, updated_at = ? WHERE id = ?',
        [JSON.stringify(subscription.keys), new Date().toISOString(), existing.id]
      );
    } else {
      // 新規登録
      await dbRun(
        `INSERT INTO push_subscriptions (id, user_id, endpoint, keys, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(), req.user.id, subscription.endpoint,
          JSON.stringify(subscription.keys),
          new Date().toISOString(), new Date().toISOString()
        ]
      );
    }

    res.json({ success: true, message: 'プッシュ通知が登録されました。' });
  } catch (error) {
    console.error('❌ プッシュ通知登録エラー:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/push/unsubscribe
 * 購読解除
 */
router.delete('/unsubscribe', authenticate, async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ success: false, error: 'エンドポイントが必要です。' });
    }

    await dbRun(
      'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [req.user.id, endpoint]
    );

    res.json({ success: true, message: 'プッシュ通知を解除しました。' });
  } catch (error) {
    console.error('❌ プッシュ通知解除エラー:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ユーティリティ: 特定ユーザーにプッシュ通知を送信
 * (他のルートから呼び出し用)
 */
export const sendPushNotification = async (userId, payload) => {
  try {
    const subscriptions = await dbQuery(
      'SELECT * FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );

    const results = [];
    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: JSON.parse(sub.keys)
        };
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );
        results.push({ endpoint: sub.endpoint, status: 'sent' });
      } catch (err) {
        // 410 Gone: 購読が無効になった場合は削除
        if (err.statusCode === 410) {
          await dbRun('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
        }
        results.push({ endpoint: sub.endpoint, status: 'failed', error: err.message });
      }
    }

    return results;
  } catch (error) {
    console.error('❌ プッシュ通知送信エラー:', error);
    return [];
  }
};

export default router;
