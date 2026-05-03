# gomi-pwa

iPhone PWA。ごみの日カレンダー。曜日別ごみ収集の通知＆一覧。

## ユーザー
日本語。非エンジニア。

## 構成
- 素のHTML/CSS/JS
- Vercel自動デプロイ
- データ: localStorage
- ローカル開発: `python3 -m http.server 3334 --directory public`

## ファイル
- `public/index.html`
- `public/js/app.js`
- `public/css/style.css`
- `public/sw.js`
- `public/manifest.json`

## デプロイ
git push origin main → Vercel自動公開

## 既知の注意点
- iOS PWAプライベートブラウジングではlocalStorage不可
- モバイル通信時もService Workerでオフライン動作
