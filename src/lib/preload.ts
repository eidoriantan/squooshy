import type { EngineAsset, EngineManifest } from '../../build/engine-manifest'

/** Shared with the service worker, which serves these files cache-first. */
export const ENGINE_CACHE = 'squooshy-engines'
const MANIFEST_URL = `${import.meta.env.BASE_URL}engine-manifest.json`
const PARALLEL = 3

export interface Progress {
  loaded: number
  total: number
  label: string
}

async function fetchManifest(fresh: boolean): Promise<EngineManifest | null> {
  // A query string skips the precached copy, so an old page can see what a new
  // deploy needs.
  const response = await fetch(fresh ? `${MANIFEST_URL}?fresh=${Date.now()}` : MANIFEST_URL, {
    cache: fresh ? 'no-store' : 'default',
  })
  // The dev server has no manifest; Vite serves the engines directly there.
  if (!response.ok || !response.headers.get('content-type')?.includes('json')) return null
  return response.json()
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function download(asset: EngineAsset, cache: Cache, onBytes: (n: number) => void): Promise<void> {
  const offline = `Couldn't download the ${asset.label}. Check your connection and try again.`
  let response: Response
  try {
    response = await fetch(asset.url, { cache: 'no-cache' })
  } catch {
    throw new Error(offline)
  }
  if (!response.ok || !response.body) throw new Error(`Couldn't download the ${asset.label} (HTTP ${response.status}).`)

  const reader = response.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      onBytes(value.byteLength)
    }
  } catch {
    throw new Error(offline)
  }

  const blob = new Blob(chunks)
  if ((await sha256(await blob.arrayBuffer())) !== asset.sha256) {
    throw new Error(`The ${asset.label} arrived damaged. Check your connection and try again.`)
  }

  // The body is already decoded, so drop headers that describe the wire format.
  const headers = new Headers(response.headers)
  headers.delete('content-encoding')
  headers.delete('content-length')
  await cache.put(asset.url, new Response(blob, { status: 200, headers }))
}

export interface Plan {
  manifest: EngineManifest
  missing: EngineAsset[]
}

/** Works out which engine files this browser still needs. Null in dev. */
export async function planDownload(fresh = false): Promise<Plan | null> {
  if (!('caches' in self)) return null
  const manifest = await fetchManifest(fresh)
  if (!manifest) return null
  const cache = await caches.open(ENGINE_CACHE)
  const cached = new Set((await cache.keys()).map((r) => new URL(r.url).pathname))
  const missing = manifest.assets.filter((a) => !cached.has(new URL(a.url, location.href).pathname))
  return { manifest, missing }
}

/** Downloads the missing engine files into Cache Storage, reporting bytes as they arrive. */
export async function downloadEngines(plan: Plan, onProgress: (p: Progress) => void): Promise<void> {
  const cache = await caches.open(ENGINE_CACHE)
  const total = plan.missing.reduce((sum, a) => sum + a.size, 0)
  const queue = [...plan.missing].sort((a, b) => b.size - a.size)
  let loaded = 0
  let label = queue[0]?.label ?? ''

  onProgress({ loaded, total, label })
  const workers = Array.from({ length: PARALLEL }, async () => {
    for (let asset = queue.shift(); asset; asset = queue.shift()) {
      label = asset.label
      await download(asset, cache, (n) => {
        loaded += n
        onProgress({ loaded: Math.min(loaded, total), total, label })
      })
    }
  })
  await Promise.all(workers)

  // Ask the browser not to evict the engines when storage gets tight.
  await navigator.storage?.persist?.().catch(() => false)
}

/** Removes engine files that the current version no longer uses. */
export async function pruneEngines(manifest: EngineManifest): Promise<void> {
  const cache = await caches.open(ENGINE_CACHE)
  const keep = new Set(manifest.assets.map((a) => new URL(a.url, location.href).pathname))
  for (const request of await cache.keys()) {
    if (!keep.has(new URL(request.url).pathname)) await cache.delete(request)
  }
}
