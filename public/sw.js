// バージョン更新時はここを変更するとキャッシュ全クリア
const CACHE = 'gomi-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// インストール時に全アセットをキャッシュ
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// HTML/JS/CSSはネットワーク優先(古いキャッシュで真っ白を防ぐ)・失敗時にキャッシュ
// アイコンなど静的ファイルはキャッシュ優先(高速)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isAsset = /\.(html|js|css)$/.test(url.pathname) || url.pathname === '/';

  if (isAsset) {
    // network-first: 最新を優先、ネットワーク失敗時にキャッシュ
    e.respondWith(
      fetch(req)
        .then(res => {
          // 成功したらキャッシュも更新
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
          return res;
        })
        .catch(() => caches.match(req).then(c => c || caches.match('/index.html')))
    );
  } else {
    // cache-first: 静的画像など
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
  }
});
