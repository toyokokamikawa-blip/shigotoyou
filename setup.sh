#!/bin/bash

# ==========================================
# 📌 セットアップスクリプト（初回実行用）
# ==========================================
# 使用方法:
#   chmod +x setup.sh
#   ./setup.sh

set -e

echo "🚀 電子承認アプリ セットアップ開始"
echo "=================================="

# ==========================================
# 1️⃣ Node.js 依存関係インストール
# ==========================================
echo ""
echo "📦 1️⃣ Node.js 依存関係をインストール中..."

if [ -d "backend" ]; then
  cd backend
  npm install
  cd ..
fi

if [ -d "mobile" ]; then
  cd mobile
  npm install
  cd ..
fi

if [ -d "admin-dashboard" ]; then
  cd admin-dashboard
  npm install
  cd ..
fi

# ==========================================
# 2️⃣ JWT シークレットキーを生成
# ==========================================
echo ""
echo "🔐 2️⃣ JWT シークレットキーを生成中..."

if ! command -v openssl &> /dev/null; then
  echo "⚠️  openssl がインストールされていません"
  echo "   Windows: choco install openssl または Git Bash を使用"
  echo "   macOS: brew install openssl"
  echo "   Linux: sudo apt install openssl"
  JWT_SECRET="your_failed_to_generate_use_manual_key_must_be_32_chars_minimum"
else
  JWT_SECRET=$(openssl rand -hex 32)
  JWT_REFRESH=$(openssl rand -hex 32)
fi

# ==========================================
# 3️⃣ .env ファイル作成（開発用）
# ==========================================
echo ""
echo "📝 3️⃣ .env.local ファイルを作成中..."

cat > backend/.env.local <<EOF
# 自動生成: $(date)

# PostgreSQL（ローカル開発用）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_approval_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT キー（自動生成）
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
EOF

echo "✅ .env.local を作成しました"
echo "   パス: backend/.env.local"

# ==========================================
# 4️⃣ PostgreSQL セットアップ（Docker 推奨）
# ==========================================
echo ""
echo "🐘 4️⃣ PostgreSQL セットアップ指示"

if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
  echo "   ✅ Docker が検出されました"
  
  cat > docker-compose.yml <<DOCKER_EOF
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
DOCKER_EOF
  
  echo "   📄 docker-compose.yml を作成しました"
  echo "   起動方法: docker-compose up -d"
  echo ""
else
  echo "   ⚠️  Docker がインストールされていません"
  echo "   手動セットアップ:"
  echo "   1. PostgreSQL をインストール"
  echo "   2. データベース作成:"
  echo "      createdb -U postgres contract_approval_db"
  echo "   3. スキーマ初期化:"
  echo "      psql -U postgres -d contract_approval_db < database/schema.sql"
fi

# ==========================================
# 5️⃣ uploads ディレクトリ作成
# ==========================================
echo ""
echo "📁 5️⃣ ディレクトリ構造を作成中..."

mkdir -p backend/uploads
mkdir -p backend/logs
mkdir -p database/backups

echo "✅ ディレクトリ作成完了"

# ==========================================
# 6️⃣ Git 設定（オプション）
# ==========================================
echo ""
echo "📝 6️⃣ Git 設定中..."

if [ -f ".gitignore" ]; then
  if ! grep -q "\.env\.local" .gitignore; then
    echo ".env.local" >> .gitignore
    echo "✅ .gitignore を更新"
  fi
fi

# ==========================================
# 7️⃣ セットアップ完了メッセージ
# ==========================================
echo ""
echo "=================================="
echo "✅ セットアップ完了！"
echo ""
echo "📋 次のステップ:"
echo ""
echo "1️⃣  PostgreSQL を起動:"
echo "    docker-compose up -d"
echo ""
echo "2️⃣  バックエンドを起動:"
echo "    cd backend && npm start"
echo ""
echo "3️⃣  モバイルアプリをテスト:"
echo "    cd mobile && expo start"
echo ""
echo "4️⃣  管理画面を起動:"
echo "    cd admin-dashboard && npm start"
echo ""
echo "💡 本番デプロイ（Render.com）:"
echo "   docs/DEPLOYMENT_RENDER.md を参照"
echo ""
echo "🔐 JWT シークレットキー（保管してください）:"
echo "   SECRET: $JWT_SECRET"
echo "   REFRESH: $JWT_REFRESH"
echo ""
echo "=================================="
