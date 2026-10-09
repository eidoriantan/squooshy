/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

// Must match ENGINE_CACHE in src/lib/preload.ts.
const ENGINE_CACHE = 'squooshy-engines'

// The app shell: index.html, the entry chunk, CSS, fonts and icons.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
clientsClaim()

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting()
})

// Engine files (WASM and worker code) were saved by the loading screen. Serve
// them from there so Squooshy works offline. The precache route above wins for
// shell files because it was registered first.
registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    url.origin === self.location.origin &&
    url.pathname.startsWith(`${import.meta.env.BASE_URL}assets/`),
  new CacheFirst({ cacheName: ENGINE_CACHE }),
)
