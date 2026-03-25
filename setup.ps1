# ==========================================
# 📌 Windows セットアップスクリプト（PowerShell）
# ==========================================
# 使用方法:
#   powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "🚀 電子承認アプリ セットアップ開始" -ForegroundColor Green
Write-Host "=================================="

# ==========================================
# 1️⃣ Node.js 依存関係インストール
# ==========================================
Write-Host ""
Write-Host "📦 1️⃣ Node.js 依存関係をインストール中..." -ForegroundColor Cyan

@("backend", "mobile", "admin-dashboard") | ForEach-Object {
  if (Test-Path $_) {
    Write-Host "   → $_ をインストール中..."
    Push-Location $_
    npm install
    Pop-Location
  }
}

# ==========================================
# 2️⃣ JWT シークレットキーを生成
# ==========================================
Write-Host ""
Write-Host "🔐 2️⃣ JWT シークレットキーを生成中..." -ForegroundColor Cyan

$JWT_SECRET = -join ([char[]]'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' | Get-Random -Count 32)
$JWT_REFRESH = -join ([char[]]'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' | Get-Random -Count 32)

Write-Host "   ✅ キー生成完了"

# ==========================================
# 3️⃣ .env.local ファイル作成（開発用）
# ==========================================
Write-Host ""
Write-Host "📝 3️⃣ .env.local ファイルを作成中..." -ForegroundColor Cyan

$envContent = @"
# 自動生成: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# PostgreSQL（ローカル開発用）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_approval_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT キー
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# サーバー
PORT=5000
NODE_ENV=development

# ファイル
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads

# OneSignal（オプション）
ONESIGNAL_APP_ID=
ONESIGNAL_API_KEY=

# ログレベル
LOG_LEVEL=debug
"@

$envContent | Out-File -FilePath "backend\.env.local" -Encoding UTF8
Write-Host "   ✅ .env.local を作成しました"
Write-Host "      パス: backend\.env.local"

# ==========================================
# 4️⃣ Docker Compose ファイル作成
# ==========================================
Write-Host ""
Write-Host "🐘 4️⃣ Docker Compose ファイルを作成中..." -ForegroundColor Cyan

$dockerContent = @"
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: contract_approval_db
    environment:
      POSTGRES_DB: contract_approval_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
"@

$dockerContent | Out-File -FilePath "docker-compose.yml" -Encoding UTF8
Write-Host "   ✅ docker-compose.yml を作成しました"

# ==========================================
# 5️⃣ ディレクトリ作成
# ==========================================
Write-Host ""
Write-Host "📁 5️⃣ ディレクトリ構造を作成中..." -ForegroundColor Cyan

@("backend\uploads", "backend\logs", "database\backups") | ForEach-Object {
  if (-not (Test-Path $_)) {
    New-Item -ItemType Directory -Path $_ -Force | Out-Null
    Write-Host "   ✅ $_"
  }
}

# ==========================================
# 6️⃣ Git 設定
# ==========================================
Write-Host ""
Write-Host "📝 6️⃣ Git 設定中..." -ForegroundColor Cyan

if (Test-Path ".gitignore") {
  $gitignore = Get-Content ".gitignore"
  if ($gitignore -notcontains ".env.local") {
    Add-Content ".gitignore" ".env.local"
    Write-Host "   ✅ .gitignore を更新"
  }
}

# ==========================================
# 7️⃣ セットアップ完了
# ==========================================
Write-Host ""
Write-Host "=================================="
Write-Host "✅ セットアップ完了！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 次のステップ:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  PostgreSQL を起動:" -ForegroundColor Cyan
Write-Host "    docker-compose up -d"
Write-Host ""
Write-Host "2️⃣  バックエンドを起動:" -ForegroundColor Cyan
Write-Host "    cd backend"
Write-Host "    npm start"
Write-Host ""
Write-Host "3️⃣  モバイルアプリをテスト:" -ForegroundColor Cyan
Write-Host "    cd mobile"
Write-Host "    expo start"
Write-Host ""
Write-Host "4️⃣  管理画面を起動:" -ForegroundColor Cyan
Write-Host "    cd admin-dashboard"
Write-Host "    npm start"
Write-Host ""
Write-Host "💡 本番デプロイ（Render.com）:" -ForegroundColor Yellow
Write-Host "   docs/DEPLOYMENT_RENDER.md を参照"
Write-Host ""
Write-Host "🔐 JWT シークレットキー（保管してください）:" -ForegroundColor Magenta
Write-Host "   SECRET: $JWT_SECRET"
Write-Host "   REFRESH: $JWT_REFRESH"
Write-Host ""
Write-Host "=================================="

# ==========================================
# 参考：手動 PostgreSQL セットアップ
# ==========================================
Write-Host ""
Write-Host "📚 参考（Docker がない場合）:" -ForegroundColor Gray
Write-Host ""
Write-Host "1. PostgreSQL をインストール（Windows インストーラ）"
Write-Host "2. psql でデータベース作成:"
Write-Host "   psql -U postgres"
Write-Host "   postgres=# CREATE DATABASE contract_approval_db;"
Write-Host ""
Write-Host "3. スキーマ初期化:"
Write-Host "   psql -U postgres -d contract_approval_db < database\schema.sql"
Write-Host ""

# 成功コード
exit 0
