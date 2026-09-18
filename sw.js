const CACHE_NAME = 'sleep-compass-v24';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './config.js',
  './utils.js',
  './app.js',
  './manifest.json',
  './manifest-light.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          // 'theme-state' isn't a version-bumped app-shell cache -- it's the
          // one-entry handoff from app.js telling this worker which theme
          // is currently active (see the manifest.json interception below).
          // Wiping it on every SW upgrade would just make an already-
          // installed icon briefly forget its theme until next page load.
          if (name !== CACHE_NAME && name !== 'theme-state') return caches.delete(name);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Network-first: while the app is being actively built and shipped
// often, always try to get the latest version over the network first,
// and only fall back to the cached copy if there's no connection at
// all. This trades a tiny bit of offline freshness for never showing
// a stale build to someone who has a live connection -- the opposite
// tradeoff of the cache-first strategy this started with, which kept
// serving old builds even when a new one was already live on the
// server.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.pathname.endsWith('/manifest.json')) {
    // An *installed* ("Add to Home Screen") PWA's Android WebAPK wrapper
    // derives the status/gesture-nav bar colors strictly from whatever
    // manifest.json answered at install time, and keeps re-checking that
    // exact URL later -- it ignores this page's live theme-color meta tag
    // and <link rel="manifest"> swap entirely while running standalone.
    // So manifest.json itself has to answer with the currently active
    // theme's colors. app.js writes the current theme id into the
    // 'theme-state' cache on every theme change (and on load); read it
    // back here and serve manifest-light.json's content under
    // manifest.json's URL when Daylight is active.
    event.respondWith(themedManifestResponse());
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

async function themedManifestResponse() {
  let theme = null;
  try {
    const themeCache = await caches.open('theme-state');
    const stateResp = await themeCache.match('/__theme-state');
    if (stateResp) {
      const state = await stateResp.json();
      theme = state && state.theme;
    }
  } catch (e) {
    // no stored theme yet (first-ever load) -- fall through, theme stays
    // null, and the dark default manifest.json is served, same as before
    // this existed.
  }

  const sourceUrl = theme === 'daylight' ? './manifest-light.json' : './manifest.json';
  try {
    const response = await fetch(sourceUrl, { cache: 'no-store' });
    if (response && response.ok) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put('./manifest.json', clone)).catch(() => {});
      return response;
    }
  } catch (e) {
    // offline -- fall back to whatever's cached below
  }
  const cached = (await caches.match(sourceUrl)) || (await caches.match('./manifest.json'));
  return cached || fetch('./manifest.json');
}
