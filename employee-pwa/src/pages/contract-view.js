/**
 * 契約書内容確認画面
 * スクロール完了を検知して署名ボタンを有効にする
 */
import { getContractDetail } from '../api.js';
import { navigateTo, showToast } from '../main.js';

let currentSheetId = null;

export function renderContractView(sheetId) {
  currentSheetId = sheetId;
  return `
    <header class="app-header">
      <button class="app-header__back" id="backBtn">← 戻る</button>
      <div class="app-header__title">契約書確認</div>
      <div style="width: 60px;"></div>
    </header>
    <div class="page">
      <div id="contractContent">
        <div class="loading-page">
          <div class="spinner"></div>
          <div class="loading-text">契約書を読み込み中...</div>
        </div>
      </div>
    </div>
  `;
}

export async function initContractView() {
  document.getElementById('backBtn').addEventListener('click', () => {
    navigateTo('/contracts');
  });

  try {
    const result = await getContractDetail(currentSheetId);
    const data = result.data;
    const isSigned = data.status === 'signed' || data.status === 'completed';

    const contentEl = document.getElementById('contractContent');

    // シートデータをHTMLに変換（新しいHTML対応、旧データ構造のフォールバック含む）
    let contentHtml = '';
    if (data.sheet_data && data.sheet_data.html) {
      // SheetJSからのHTML出力をそのまま注入
      contentHtml = `<div style="overflow-x: auto; max-width: 100%;">${data.sheet_data.html}</div>`;
    } else if (data.sheet_data && data.sheet_data.data) {
      contentHtml = buildSheetTable(data.sheet_data.data);
    } else {
      contentHtml = `
        <div style="padding: 24px; text-align: center; color: #666;">
          <p style="font-size: 1.25rem; margin-bottom: 8px;">📄 ${escapeHtml(data.sheet_name)}</p>
          <p>契約書の内容は管理者から配布されたファイルをご確認ください。</p>
        </div>
      `;
    }

    const API_HOST = window.location.hostname || 'localhost';
    const downloadUrl = `http://${API_HOST}:5000/api/employee/contracts/${currentSheetId}/download?token=${localStorage.getItem('auth_token')}`;

    const statusBadge = isSigned
      ? '<span class="tag tag--signed">✅ 署名済み</span>'
      : '<span class="tag tag--pending">📝 署名待ち</span>';

    contentEl.innerHTML = `
      <div class="card" style="cursor:default;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="word-break: break-all;">${escapeHtml(data.sheet_name)}</h3>
          ${statusBadge}
        </div>
        <div style="font-size:0.8125rem; color:var(--text-muted); margin-bottom: 12px;">
          アップロード日: ${data.uploaded_at ? new Date(data.uploaded_at).toLocaleDateString('ja-JP') : '-'}
        </div>
        <a href="${downloadUrl}" class="btn btn--outline btn--sm" download>
          ⬇️ Excelファイルをダウンロード
        </a>
      </div>

      <div id="scrollNotice" class="contract-view__scroll-notice">
        ⬇️ 内容を最後までスクロールしてください
      </div>

      <div class="contract-view__content" id="contractScroll">
        ${contentHtml}
      </div>

      ${isSigned ? `
        <div class="card card--glow-green" style="text-align:center; cursor:default;">
          <div style="font-size:2rem; margin-bottom:8px;">✅</div>
          <div style="font-weight:600; color:var(--accent-green);">署名完了</div>
          <div style="font-size:0.8125rem; color:var(--text-muted); margin-top:4px;">
            署名日時: ${data.signed_at ? new Date(data.signed_at).toLocaleString('ja-JP') : '-'}
          </div>
        </div>
      ` : `
        <button class="btn btn--primary" id="goSignBtn" disabled>
          🔒 署名するには最後までスクロールしてください
        </button>
      `}
    `;

    // スクロール検知
    if (!isSigned) {
      const scrollEl = document.getElementById('contractScroll');
      const signBtn = document.getElementById('goSignBtn');
      const notice = document.getElementById('scrollNotice');

      const checkScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = scrollEl;
        // スクロール可能量が少ない場合（コンテンツが短い場合）は最初から有効
        if (scrollHeight <= clientHeight + 10) {
          enableSignButton();
          return;
        }
        if (scrollTop + clientHeight >= scrollHeight - 20) {
          enableSignButton();
        }
      };

      function enableSignButton() {
        signBtn.disabled = false;
        signBtn.innerHTML = '✍️ 署名に進む';
        notice.classList.add('contract-view__scroll-done');
        notice.innerHTML = '✅ 内容を確認しました';
      }

      scrollEl.addEventListener('scroll', checkScroll);
      // 初回チェック（コンテンツが短い場合）
      setTimeout(checkScroll, 300);

      signBtn.addEventListener('click', () => {
        navigateTo(`/sign/${currentSheetId}`);
      });
    }

  } catch (error) {
    document.getElementById('contractContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__text">読み込みに失敗しました: ${escapeHtml(error.message)}</div>
      </div>
    `;
  }
}

function buildSheetTable(data) {
  if (!data || data.length === 0) return '<p>データがありません</p>';
  
  let html = '<div style="overflow-x: auto; max-width: 100%;"><table class="contract-view__table" style="white-space: pre-wrap; word-break: break-all; min-width: max-content;">';
  data.forEach((row, i) => {
    html += '<tr>';
    if (Array.isArray(row)) {
      row.forEach(cell => {
        let val = cell;
        if (val && typeof val === 'object') {
          if (val.result !== undefined) val = val.result;
          else if (val.text !== undefined) val = val.text;
          else val = JSON.stringify(val);
        }
        
        // 空セルの場合はボーダーを消すなど、少しExcelっぽく見せる工夫
        const isEmpty = val === null || val === undefined || String(val).trim() === '';
        const style = isEmpty ? 'border-color: transparent; background: transparent;' : '';
        const tag = i === 0 ? 'th' : 'td';
        
        html += `<${tag} style="${style}">${escapeHtml(String(val ?? ''))}</${tag}>`;
      });
    }
    html += '</tr>';
  });
  html += '</table></div>';
  return html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
