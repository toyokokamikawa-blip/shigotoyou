/**
 * メインエントリーポイント + ルーター
 * 契約書電子承認 PWA
 */
import './styles/index.css';
import { isAuthenticated, getVapidPublicKey, subscribePush } from './api.js';
import { renderLogin, initLogin } from './pages/login.js';
import { renderContracts, initContracts } from './pages/contracts.js';
import { renderContractView, initContractView } from './pages/contract-view.js';
import { renderSign, initSign } from './pages/sign.js';
import { renderComplete, initComplete } from './pages/complete.js';

const app = document.getElementById('app');
let currentParams = {};

// ===== ルーター =====
const routes = {
  '/login': { render: renderLogin, init: initLogin },
  '/contracts': { render: renderContracts, init: initContracts },
  '/contracts/:id': { render: (id) => renderContractView(id), init: initContractView },
  '/sign/:id': { render: (id) => renderSign(id), init: initSign },
  '/complete/:id': { render: (id, params) => renderComplete(id, params), init: initComplete },
};

export function navigateTo(path, params = {}) {
  currentParams = params;
  window.history.pushState({}, '', path);
  renderRoute();
}

function renderRoute() {
  const path = window.location.pathname;

  // 認証チェック
  if (!isAuthenticated() && path !== '/login') {
    navigateTo('/login');
    return;
  }
  if (isAuthenticated() && path === '/login') {
    navigateTo('/contracts');
    return;
  }

  // ルートマッチング
  let matched = false;
  for (const [pattern, handler] of Object.entries(routes)) {
    const regex = new RegExp('^' + pattern.replace(/:id/g, '([^/]+)') + '$');
    const match = path.match(regex);
    if (match) {
      const id = match[1] || null;
      app.innerHTML = handler.render(id, currentParams);
      if (handler.init) handler.init();
      matched = true;
      break;
    }
  }

  if (!matched) {
    // デフォルトルート
    if (isAuthenticated()) {
      navigateTo('/contracts');
    } else {
      navigateTo('/login');
    }
  }
}

// ブラウザの戻る/進むボタン対応
window.addEventListener('popstate', renderRoute);

// セッション期限切れイベント
window.addEventListener('auth:expired', () => {
  showToast('セッションが期限切れです。再度ログインしてください。', 'error');
  navigateTo('/login');
});

// ===== トースト通知 =====
export function showToast(message, type = 'info') {
  // 既存のトーストを削除
  document.querySelectorAll('.toast').forEach(el => el.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // アニメーション
  requestAnimationFrame(() => {
    toast.classList.add('toast--show');
  });

  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ===== Service Worker 登録/解除 =====
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // 開発環境のViteでService Workerが有効だとESモジュール読み込みが壊れて画面が真っ白になるため、登録を解除する
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ 古いService Workerを解除しました');
      }
    } catch (error) {
      console.warn('⚠️ Service Worker 解除エラー:', error.message);
    }
  }
}

export async function requestPushPermission() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  await subscribeToPush(registration);
}

export async function subscribeToPush(registration) {
  try {
    if (!('PushManager' in window)) {
      throw new Error('プッシュ通知はこのブラウザでサポートされていません');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('プッシュ通知の許可が拒否されました');
    }

    // VAPID公開鍵を取得
    const keyResult = await getVapidPublicKey();
    const publicKey = keyResult.data.publicKey;

    // 購読
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // サーバーに登録
    await subscribePush(subscription);
    console.log('✅ プッシュ通知購読完了');
  } catch (error) {
    console.warn('⚠️ プッシュ通知購読エラー:', error.message);
    throw error;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

// ===== 初期化 =====
function init() {
  renderRoute();
  registerServiceWorker();
}

init();
