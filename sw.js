// スタンプラリー Service Worker
// 設定を変更したら CACHE_VERSION を上げること（古いキャッシュを混ぜないため）
const CACHE_VERSION = "stamp-rally-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manual.html",
  "./config.json",
  "./manifest.json",
  "./images/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  event.respondWith(
    // クエリ付きURL（?s=...&k=...）でもキャッシュした本体を返すため ignoreSearch を使う
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return res;
      }).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html", { ignoreSearch: true });
        }
        throw new Error("offline and not cached");
      });
    })
  );
});
