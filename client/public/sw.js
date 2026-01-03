// Native Web Push Service Worker

// Service Worker for Marketing Team App PWA
// Update these version numbers to force cache refresh
const CACHE_VERSION = '3.0.0';
const CACHE_NAME = `mta-crm-v${CACHE_VERSION}`;
const STATIC_CACHE = `mta-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `mta-dynamic-v${CACHE_VERSION}`;

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// -----------------------------
// Minimal IndexedDB helpers (for offline API queue)
// -----------------------------
const DB_NAME = 'mta-pwa';
const DB_VERSION = 1;
const QUEUE_STORE = 'api-queue';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbAdd(value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.objectStore(QUEUE_STORE).add(value);
  });
}

async function idbGetAll() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.objectStore(QUEUE_STORE).delete(id);
  });
}

async function broadcastMessage(message) {
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientList) {
    client.postMessage(message);
  }
}

async function flushApiQueue() {
  const items = await idbGetAll();
  if (!items.length) return { flushed: 0, remaining: 0 };

  let flushed = 0;
  for (const item of items) {
    try {
      const headers = new Headers(item.headers || {});
      const res = await fetch(item.url, {
        method: item.method,
        headers,
        body: item.body ? item.body : undefined,
        credentials: 'include',
      });
      if (res && (res.ok || (res.status >= 200 && res.status < 500))) {
        await idbDelete(item.id);
        flushed += 1;
      }
    } catch (e) {
      // Keep item in queue
    }
  }

  const remaining = (await idbGetAll()).length;
  if (flushed > 0) {
    await broadcastMessage({ type: 'API_QUEUE_FLUSHED', flushed, remaining });
  }
  return { flushed, remaining };
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    (async () => {
      // Enable navigation preload when supported (faster first navigations)
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
          console.log('[SW] Navigation preload enabled');
        } catch (e) {}
      }

      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
      await broadcastMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
    })()
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // ----------------------------------------------------
  // Web Share Target: transform POST -> client route
  // ----------------------------------------------------
  if (request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith((async () => {
      try {
        const form = await request.formData();
        const payload = {
          title: form.get('title') || '',
          text: form.get('text') || '',
          url: form.get('url') || '',
          ts: Date.now(),
        };
        const hash = encodeURIComponent(JSON.stringify(payload));
        return Response.redirect(`/share-target#${hash}`, 303);
      } catch (e) {
        return Response.redirect('/share-target', 303);
      }
    })());
    return;
  }

  // Skip API requests (always fetch fresh)
  // For mutating API requests, queue when offline
  if (url.pathname.startsWith('/api/') && request.method !== 'GET') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch (e) {
        try {
          const clone = request.clone();
          const body = await clone.arrayBuffer();
          const headersObj = {};
          for (const [k, v] of clone.headers.entries()) headersObj[k] = v;

          await idbAdd({
            url: clone.url,
            method: clone.method,
            headers: headersObj,
            body,
            ts: Date.now(),
          });

          // Register background sync (best-effort)
          if (self.registration.sync) {
            try {
              await self.registration.sync.register('apiQueueSync');
            } catch (e) {}
          }

          await broadcastMessage({ type: 'API_QUEUED', url: clone.url, method: clone.method });

          return new Response(JSON.stringify({ queued: true, offline: true }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (e) {
          return new Response(JSON.stringify({ queued: false, offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    })());
    return;
  }

  // For GET API requests: network only (do not cache)
  if (url.pathname.startsWith('/api/') && request.method === 'GET') {
    return;
  }

  // ----------------------------------------------------
  // Navigations: network-first + preload + offline fallback
  // ----------------------------------------------------
  const isNavigation = request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (request.method === 'GET' && isNavigation) {
    event.respondWith(
      (async () => {
        try {
          // Use navigation preload response when available
          const preload = await event.preloadResponse;
          if (preload) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, preload.clone());
            return preload;
          }

          const response = await fetch(request);
          const cache = await caches.open(DYNAMIC_CACHE);
          cache.put(request, response.clone());
          return response;
        } catch (e) {
          const cached = await caches.match(request);
          if (cached) return cached;
          // Offline fallback page (nice UX vs blank)
          const offline = await caches.match('/offline.html');
          return offline || caches.match('/index.html');
        }
      })()
    );
    return;
  }

  // ----------------------------------------------------
  // Static assets: cache-first + background refresh (SWR)
  // ----------------------------------------------------
  if (request.method === 'GET') {
    event.respondWith((async () => {
      const cache = await caches.open(DYNAMIC_CACHE);
      const cached = await caches.match(request);

      // Only cache http/https requests
      const isHttp = url.protocol === 'http:' || url.protocol === 'https:';

      if (cached) {
        // Revalidate in background
        if (isHttp) {
          event.waitUntil(
            fetch(request).then((response) => {
              if (response && response.status === 200) {
                cache.put(request, response.clone());
              }
            }).catch(() => {})
          );
        }
        return cached;
      }

      try {
        const response = await fetch(request);
        if (response && response.status === 200 && isHttp) {
          cache.put(request, response.clone());
        }
        return response;
      } catch (e) {
        // As a last resort, go to offline page for navigations; otherwise fail
        const offline = await caches.match('/offline.html');
        return offline || new Response('Offline', { status: 503 });
      }
    })());
  }
});

// Background Sync: flush queued API writes
self.addEventListener('sync', (event) => {
  if (event.tag === 'apiQueueSync') {
    event.waitUntil(flushApiQueue());
  }
});

// Periodic background sync (experimental): best-effort refresh of core routes
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-refresh') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(DYNAMIC_CACHE);
          const res = await fetch('/index.html', { cache: 'no-store' });
          if (res && res.ok) await cache.put('/index.html', res.clone());
        } catch (e) {}
      })()
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Marketing Team App';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    timestamp: data.timestamp || Date.now(), // Use server timestamp or current time
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  console.log('[SW] Notification data:', event.notification.data);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data || '/';
  console.log('[SW] Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // App is open, focus it and navigate
          client.focus();
          client.postMessage({ 
            type: 'NAVIGATE', 
            url: urlToOpen 
          });
          return;
        }
      }
      // App is not open, open new window
      return clients.openWindow(urlToOpen);
    })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting - activating new service worker immediately');
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'FLUSH_API_QUEUE') {
    event.waitUntil(flushApiQueue());
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing all caches');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('[SW] All caches cleared');
        return self.clients.claim();
      })
    );
  }
});
