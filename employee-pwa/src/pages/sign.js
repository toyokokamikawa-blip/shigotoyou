/**
 * デジタル署名画面
 * Canvas署名パッド
 */
import { signContract, getUserInfo } from '../api.js';
import { navigateTo, showToast } from '../main.js';

let currentSheetId = null;
let canvas = null;
let ctx = null;
let isDrawing = false;
let hasDrawn = false;
let lastX = 0;
let lastY = 0;

export function renderSign(sheetId) {
  currentSheetId = sheetId;
  const user = getUserInfo();
  const name = user ? user.full_name : '';

  return `
    <header class="app-header">
      <button class="app-header__back" id="backBtn">← 戻る</button>
      <div class="app-header__title">デジタル署名</div>
      <div style="width: 60px;"></div>
    </header>
    <div class="page">
      <div class="card" style="cursor:default;">
        <h3 style="margin-bottom: 8px;">✍️ 署名してください</h3>
        <p style="font-size: 0.875rem; color: var(--text-secondary);">
          署名者: <strong>${escapeHtml(name)}</strong>
        </p>
      </div>

      <div class="signature-pad" id="signaturePad">
        <canvas id="signatureCanvas"></canvas>
        <div class="signature-pad__placeholder" id="padPlaceholder">
          ここに指で署名してください
        </div>
      </div>

      <div class="signature-actions">
        <button class="btn btn--outline btn--sm" id="clearBtn" style="flex:1;">
          🗑️ やり直す
        </button>
      </div>

      <div class="divider"></div>

      <label class="agreement" id="agreementLabel">
        <input type="checkbox" id="agreeCheck" />
        <span class="agreement__text">
          上記の契約内容を確認し、署名することに同意します。
          この署名は電子的に記録され、法的拘束力を持ちます。
        </span>
      </label>

      <button class="btn btn--success" id="submitBtn" disabled>
        ✅ 署名を送信する
      </button>
    </div>
  `;
}

export function initSign() {
  document.getElementById('backBtn').addEventListener('click', () => {
    navigateTo(`/contracts/${currentSheetId}`);
  });

  // Canvas初期化
  const padEl = document.getElementById('signaturePad');
  canvas = document.getElementById('signatureCanvas');
  ctx = canvas.getContext('2d');
  hasDrawn = false;

  // Canvas サイズ設定
  const resizeCanvas = () => {
    const rect = padEl.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // 描画イベント
  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    
    if (!hasDrawn) {
      hasDrawn = true;
      padEl.classList.add('signature-pad--active');
    }
    updateSubmitButton();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  };

  const stopDraw = () => {
    isDrawing = false;
  };

  // マウスイベント
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);

  // タッチイベント
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDraw);

  // クリアボタン
  document.getElementById('clearBtn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn = false;
    padEl.classList.remove('signature-pad--active');
    document.getElementById('padPlaceholder').style.opacity = '1';
    updateSubmitButton();
  });

  // 同意チェック
  document.getElementById('agreeCheck').addEventListener('change', updateSubmitButton);

  // 送信ボタン
  document.getElementById('submitBtn').addEventListener('click', handleSubmit);
}

function updateSubmitButton() {
  const agreed = document.getElementById('agreeCheck').checked;
  const btn = document.getElementById('submitBtn');
  btn.disabled = !(hasDrawn && agreed);
}

async function handleSubmit() {
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = '送信中...';

  try {
    // Canvas から署名データを取得 (Base64)
    const signatureData = canvas.toDataURL('image/png');

    const result = await signContract(currentSheetId, signatureData);
    
    if (result.success) {
      navigateTo(`/complete/${currentSheetId}`, {
        signedAt: result.data.signed_at,
        sheetName: result.data.sheet_name
      });
    }
  } catch (error) {
    showToast(error.message, 'error');
    btn.disabled = false;
    btn.textContent = '✅ 署名を送信する';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
