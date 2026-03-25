# 📱 契約書電子承認アプリ システム

## 🎯 プロジェクト概要

このプロジェクトは、パートタイム労働契約書をExcelテンプレートから取得し、従業員がモバイルアプリで署名する包括的な電子承認システムです。

### 🔑 主な特徴

- ✅ **完全無料**： Firebase 不使用、PostgreSQL + Render.com で本番運用も無料
- ✅ **Excel契約書管理**: Excelファイルから従業員名を自動抽出
- ✅ **モバイルアプリ**: iOS/Android対応の署名アプリ（Expo）
- ✅ **デジタル署名**: タップ式の署名パッド＋デバイス保存
- ✅ **監査ログ完備**: 署名時の詳細情報を完全記録
  - ユーザー認証情報（User ID, Email）
  - タイムスタンプ（UTC ミリ秒精度）
  - IPアドレス（本社/支社判定）
  - デバイス情報（OS, ブラウザ, Device ID）
- ✅ **PDF ダウンロード**: 従業員が契約書をダウンロード可能
- ✅ **管理画面**: リアルタイム署名状況管理
- ✅ **スケーラビリティ**: 100人規模（別途要追加費用で1000人以上対応）

---

## プロジェクト構成

```
contract-approval-app/
├── backend/                  # Node.js + Express バックエンド
│   ├── src/
│   │   ├── server.js        # エントリーポイント
│   │   ├── db.js            # PostgreSQL接続
│   │   ├── routes/          # APIルート
│   │   ├── controllers/      # ビジネスロジック
│   │   ├── middleware/       # 認証など
│   │   ├── models/          # DBモデル
│   │   ├── services/        # Excel解析、PDF生成など
│   │   └── utils/           # ユーティリティ
│   ├── uploads/             # アップロードされたファイル
│   ├── package.json
│   └── .env.example
│
├── mobile/                   # React Native モバイルアプリ
│   ├── src/
│   │   ├── screens/         # スクリーン/ページ
│   │   ├── components/       # 再利用可能なコンポーネント
│   │   ├── services/        # API通信
│   │   └── utils/           # ユーティリティ
│   ├── app.json
│   └── package.json
│
├── admin-dashboard/         # React 管理画面
│   ├── src/
│   │   ├── pages/           # ページコンポーネント
│   │   ├── components/       # UIコンポーネント
│   │   └── services/        # API通信
│   ├── public/
│   └── package.json
│
├── database/                 # DB マイグレーション
│   ├── schema.sql           # テーブル定義
│   └── migrations/
│
└── docs/                     # ドキュメント
    ├── API.md               # API仕様書
    ├── DATABASE.md          # DB設計
    └── DEPLOYMENT.md        # デプロイメント手順
```

---

---

## 🚀 クイックスタート（5分）

### 前提条件

| ツール | バージョン | 確認方法 |
|--------|-----------|---------|
| Node.js | 16.x 以上 | `node -v` |
| npm | 8.x 以上 | `npm -v` |
| PostgreSQL | 12 以上 or Docker | [セットアップガイド](#📚-セットアップガイド) |

### Windows（PowerShell）

```powershell
# 1️⃣ セットアップスクリプト実行（自動で全セットアップ）
powershell -ExecutionPolicy Bypass -File setup.ps1

# 2️⃣ PostgreSQL 起動（Docker 推奨）
docker-compose up -d

# 3️⃣ バックエンド起動
cd backend
npm start

# 別のターミナルで：
# 4️⃣ モバイルアプリ起動
cd mobile
expo start

# さらに別のターミナルで：
# 5️⃣ 管理画面起動
cd admin-dashboard
npm start
```

### macOS / Linux（Bash）

```bash
# 1️⃣ セットアップスクリプト実行
chmod +x setup.sh
./setup.sh

# 2️⃣ PostgreSQL 起動
docker-compose up -d

# 3️⃣ バックエンド起動
cd backend && npm start

# 別のターミナルで：
# 4️⃣ モバイルアプリ起動
cd mobile && expo start

# さらに別のターミナルで：
# 5️⃣ 管理画面起動
cd admin-dashboard && npm start
```

✅ **完了！** モバイルアプリで QR コードをスキャンして開始

---

## 📚 セットアップガイド

詳細なセットアップ手順は、[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) を参照してください。

このドキュメントにはトラブルシューティング、エラー対応、手動セットアップ方法が含まれています。

---

## 💾 テクノロジースタック

| レイヤー | テクノロジー | 備考 |
|---------|------------|------|
| **バックエンド** | Node.js 16+ + Express.js | 無期限無料（Render.com） |
| **データベース** | PostgreSQL 15 | 無期限無料（Render.com） |
| **認証** | JWT | 自社管理（Firebase 不使用）|
| **モバイル** | React Native + Expo | iOS/Android対応 |
| **管理画面** | React 18 | 無期限無料（Netlify） |
| **ホスティング** | Render.com | 月額 $0（本番環境） |
| **ストレージ** | PostgreSQL | 無制限 |

### 💰 月額コスト

```
開発環境: $0
本番環境: $0
年間合計: $0 ✅
```

### 📊 スケーラビリティ

```
100名:  Render 無料ティア対応 ✅
500名:  Render $7/月 → 約700円/月
1000名: Render $12/月 → 約1,200円/月
```

```
# DB接続
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_approval_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret

# サーバー
PORT=5000
NODE_ENV=development

# ファイル
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
```

---

## 主要なAPI エンドポイント

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/api/auth/register` | ユーザー登録 |
| POST | `/api/auth/login` | ログイン |
| POST | `/api/contracts/upload` | 契約書アップロード |
| GET | `/api/contracts/:id` | 契約書取得 |
| POST | `/api/signatures` | 署名保存 |
| GET | `/api/audit/logs` | 監査ログ取得 |
| GET | `/api/employees` | 従業員一覧 |

詳細は [API.md](docs/API.md) を参照

---

## データベース設計

- **users**: ユーザー情報
- **contracts**: 契約書情報
- **contract_distributions**: 配布状況
- **signatures**: 署名データ＆メタデータ
- **audit_logs**: 監査ログ
- **sessions**: ログインセッション

詳細は [DATABASE.md](docs/DATABASE.md) を参照

---

## 認証フロー

1. **ユーザーログイン** → JWT トークン発行
2. **リフレッシュトークン** で 30日延長可能
3. **デバイス認証** → Device IDで同時ログイン制御可
4. **セッション記録** → IP, User-Agent, デバイス情報保存

---

## 監査機能

### 記録される情報

- ✅ **本人認証情報**: User ID, Email, Login時刻
- ✅ **タイムスタンプ**: UTC時刻（精密度: ミリ秒）
- ✅ **IPアドレス**: 本社/支社判定に活用
- ✅ **デバイス情報**: OS, ブラウザ, Device ID
- ✅ **署名画像**: 2値画像として保存
- ✅ **契約内容確認**: 確認画面の表示記録

### 監査ログの活用

```
SELECT * FROM audit_logs 
WHERE action = 'signature_created'
  AND timestamp >= NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC;
```

---

## セキュリティ対策

- ✅ **パスワード**: bcryptハッシュ化（salt rounds: 10）
- ✅ **JWT**: HS256署名、7日有効期限
- ✅ **HTTPS**: 本番環境では必須
- ✅ **CORS**: 許可ドメイン設定
- ✅ **レート制限**: 開発中に追加予定
- ✅ **SQL インジェクション**: Prepared Statements使用

---

## 🌐 本番デプロイ（2026-04-01）

Render.com + Netlify を使用した完全無料のデプロイメント手順：

📖 **詳細ガイド**: [docs/DEPLOYMENT_RENDER.md](docs/DEPLOYMENT_RENDER.md)

### デプロイ概要

```
GitHub repository
    ↓
Render.com (バックエンド)
    ↓
PostgreSQL (Render)
    
Netlify (管理画面)
    ↓
React Admin Dashboard

EAS Build (モバイル)
    ↓
iOS TestFlight
Android APK
```

### デプロイ前チェックリスト

- [ ] Render.com アカウント作成
- [ ] GitHub にコード push
- [ ] PostgreSQL 環境変数設定
- [ ] JWT シークレットキー生成
- [ ] モバイルアプリ配布設定

---

## 🔄 Firebase からの移行

従来の Firebase ベースから、完全無料の PostgreSQL + Render.com へ移行しました。

詳細は [docs/FIREBASE_MIGRATION.md](docs/FIREBASE_MIGRATION.md) を参照してください。

```
Firebase (日本円: ¥50,000～100,000/年)
    ↓
PostgreSQL + Render.com (無料)
```

**年間節約額: ¥50,000～¥100,000** 💰

---

## 🐛 トラブルシューティング

### よくある問題

| 問題 | 原因 | 解決方法 |
|------|------|---------|
| PostgreSQL 接続エラー | DB が起動していない | `docker-compose up -d` で起動 |
| Port 5000 が使用中 | 他のプロセスが使用 | `.env` で `PORT=5001` に変更 |
| モバイル app が接続できない | `apiUrl` が間違っている | `mobile/app.json` を確認 |
| npm install に失敗 | Node.js バージョン | `node -v` で 16.x 以上確認 |

### さらに詳しく

問題解決についての詳細は、[docs/SETUP_GUIDE.md #トラブルシューティング](docs/SETUP_GUIDE.md) を参照してください。

---

## 💬 お問い合わせ

- 🐛 **バグ報告**: GitHub Issues を作成
- 💡 **機能リクエスト**: GitHub Discussions で提案
- 📧 **その他**: [docs/](docs/) フォルダを参照

---

## 📜 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

---

## 🎉 プロジェクト統計

- **バックエンド API エンドポイント**: 20+
- **データベーステーブル**: 7（最適化済み）
- **モバイルスクリーン**: 4
- **管理画面ページ**: 2+
- **ドキュメントページ**: 8

---

**作成日**: 2026-03-14  
**バージョン**: 1.0.0 (Firebase-free)  
**ステータス**: ✅ 開発完了 → 本番デプロイ準備中  
**本番稼働予定日**: 2026-04-01
