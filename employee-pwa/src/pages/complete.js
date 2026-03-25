/**
 * 署名完了画面
 */
import { getUserInfo } from '../api.js';
import { navigateTo } from '../main.js';

export function renderComplete(sheetId, params = {}) {
  const user = getUserInfo();
  const name = user ? user.full_name : '従業員';
  const signedAt = params.signedAt ? new Date(params.signedAt).toLocaleString('ja-JP') : new Date().toLocaleString('ja-JP');
  const sheetName = params.sheetName || '';

  return `
    <div class="page complete-page">
      <div class="complete-icon">🎉</div>
      <h2 class="complete-title">署名が完了しました</h2>
      <p class="complete-message">
        契約書への署名が正常に記録されました。<br>
        管理者にも通知されます。
      </p>

      <div class="card complete-details" style="cursor:default;">
        <div class="complete-detail-row">
          <span class="complete-detail-row__label">署名者</span>
          <span class="complete-detail-row__value">${escapeHtml(name)}</span>
        </div>
        <div class="complete-detail-row">
          <span class="complete-detail-row__label">契約書</span>
          <span class="complete-detail-row__value">${escapeHtml(sheetName)}</span>
        </div>
        <div class="complete-detail-row">
          <span class="complete-detail-row__label">署名日時</span>
          <span class="complete-detail-row__value">${signedAt}</span>
        </div>
        <div class="complete-detail-row" style="border-bottom:none;">
          <span class="complete-detail-row__label">ステータス</span>
          <span class="complete-detail-row__value" style="color:var(--accent-green);">✅ 署名完了</span>
        </div>
      </div>
      
      <button class="btn btn--primary" id="backToListBtn" style="margin-bottom: 12px;">
        📋 契約書一覧に戻る
      </button>
    </div>
  `;
}

export function initComplete() {
  document.getElementById('backToListBtn').addEventListener('click', () => {
    navigateTo('/contracts');
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
