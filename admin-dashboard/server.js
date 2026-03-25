const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// CORS 設定
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:3000'],
  credentials: true
}));

// 静的ファイル（public フォルダ）
app.use(express.static(path.join(__dirname, 'public')));

// ルートへのアクセス
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`\n📊 ダッシュボード サーバー起動`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`✅ バックエンド API: http://localhost:5000\n`);
});
