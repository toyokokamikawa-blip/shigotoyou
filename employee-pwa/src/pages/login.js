/**
 * ログイン画面
 */
import { login } from '../api.js';
import { navigateTo } from '../main.js';

export function renderLogin() {
  return `
    <div class="login-page">
      <div class="login-logo">📋</div>
      <h1 class="login-title">契約書電子承認</h1>
      <p class="login-subtitle">従業員用アプリにログイン</p>
      
      <form class="login-form" id="loginForm">
        <div class="form-group">
          <label class="form-label" for="employeeId">従業員ID</label>
          <input
            type="text"
            id="employeeId"
            class="form-input"
            placeholder="例: EMP001"
            autocomplete="username"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label" for="password">パスワード</label>
          <input
            type="password"
            id="password"
            class="form-input"
            placeholder="パスワードを入力"
            autocomplete="current-password"
            required
          />
        </div>
        
        <div id="loginError" class="form-error" style="display:none; margin-bottom: 16px;"></div>
        
        <button type="submit" class="btn btn--primary" id="loginBtn">
          ログイン
        </button>
      </form>
      
      <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 24px; text-align: center;">
        初回ログイン時に入力したパスワードが<br>そのまま登録されます
      </p>
    </div>
  `;
}

export function initLogin() {
  const form = document.getElementById('loginForm');
  const errorDiv = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const employeeId = document.getElementById('employeeId').value.trim();
    const password = document.getElementById('password').value;
    
    if (!employeeId || !password) {
      errorDiv.textContent = '従業員IDとパスワードを入力してください';
      errorDiv.style.display = 'block';
      return;
    }
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'ログイン中...';
    errorDiv.style.display = 'none';
    
    try {
      await login(employeeId, password);
      navigateTo('/contracts');
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
      loginBtn.disabled = false;
      loginBtn.textContent = 'ログイン';
    }
  });
}
