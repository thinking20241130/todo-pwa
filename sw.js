// ===================== Service Worker — 我的待办工作台 =====================
const CACHE_NAME = 'todo-pwa-v1';

// 需要预缓存的核心资源
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

// ---- 安装：预缓存核心文件 ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ---- 激活：清理旧版本缓存 ----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---- 拦截请求：缓存优先，网络兜底 ----
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // 只缓存同源的成功响应
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        // 网络失败且无缓存：如果是页面请求，返回主页
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
