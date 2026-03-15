const CACHE_NAME = 'smart-todo-v3';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

// ── Install: cache app shell ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
});

// ── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// ── Fetch: network-first for API, cache-first for assets ────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.pathname.startsWith('/api/')) return;

  // API requests: network only (no caching)
  if (url.pathname.startsWith('/api/')) return;

  // Handle PWA share target: /?share → redirect to home with prefilled input
  if (url.searchParams.has('share')) {
    event.respondWith(caches.match('/index.html').then((r) => r || fetch('/index.html')));
    return;
  }

  // App shell: cache-first, fallback to network, fallback to /index.html (SPA)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});

// ── Push: show notification with snooze action ──────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.data?.taskId ?? 'task',
      data: data.data ?? {},
      actions: [
        { action: 'snooze10', title: '⏰ 10 min' },
        { action: 'snooze60', title: '⏰ 1 hour' },
      ],
    })
  );
});

// ── Notification click / action ──────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  const taskId = event.notification.data?.taskId;
  event.notification.close();

  // Snooze actions — POST to backend
  if ((event.action === 'snooze10' || event.action === 'snooze60') && taskId) {
    const minutes = event.action === 'snooze10' ? 10 : 60;
    event.waitUntil(
      fetch(`/api/tasks/${taskId}/snooze`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      }).catch(() => {})
    );
    return;
  }

  // Default: open/focus app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});
