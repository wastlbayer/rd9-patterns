// sw.js – Offline-Service-Worker für den RD9 Pattern Manager
// Muss als Datei "sw.js" im selben Ordner wie index.html liegen.

var CACHE = "rd9-pattern-manager-v1";
var ASSETS = [
  "./",
  "./index.html"
];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {
        // Falls index.html noch nicht erreichbar ist, zumindest Startseite cachen
        return cache.add("./");
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function(cache) {
          cache.put(e.request, copy);
        });
        return resp;
      }).catch(function() {
        // Offline-Fallback
        return caches.match("./index.html").then(function(fallback) {
          if (fallback) return fallback;
          return caches.match("./");
        });
      });
    })
  );
});