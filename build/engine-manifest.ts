import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'

export const ENGINE_MANIFEST = 'engine-manifest.json'

export interface EngineAsset {
  url: string
  size: number
  sha256: string
  label: string
}

export interface EngineManifest {
  assets: EngineAsset[]
  totalBytes: number
}

// Names a file the way the loading screen talks about it.
export function labelFor(file: string): string {
  if (/^gs[-.]/.test(file)) return 'PDF engine'
  if (/avif/.test(file)) return 'AVIF codec'
  if (/mozjpeg|jpeg/.test(file)) return 'JPEG codec'
  if (/webp/.test(file)) return 'WebP codec'
  if (/oxipng|png/.test(file)) return 'PNG codec'
  if (/resize|hqx|magic_kernel/.test(file)) return 'Image resizer'
  return 'Workers'
}

/**
 * Lists every heavy asset (WASM and worker code) so the loading screen can
 * download them all on the first visit. The small app shell (index.html, the
 * entry chunk, CSS, fonts, icons) is left to the Workbox precache instead.
 */
export function engineManifest(): Plugin {
  let config: ResolvedConfig
  const shellChunks = new Set<string>()

  return {
    name: 'squooshy:engine-manifest',
    apply: 'build',
    configResolved(resolved) {
      config = resolved
    },
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type === 'chunk' && output.isEntry) shellChunks.add(output.fileName)
        if (output.type === 'asset' && output.fileName.endsWith('.css')) shellChunks.add(output.fileName)
      }
    },
    writeBundle() {
      const outDir = join(config.root, config.build.outDir)
      const assetsDir = config.build.assetsDir
      const assets: EngineAsset[] = []

      for (const file of readdirSync(join(outDir, assetsDir)).sort()) {
        const path = `${assetsDir}/${file}`
        if (shellChunks.has(path)) continue
        if (!/\.(wasm|m?js)$/.test(file)) continue
        const bytes = readFileSync(join(outDir, path))
        assets.push({
          url: `${config.base}${path}`,
          size: bytes.byteLength,
          sha256: createHash('sha256').update(bytes).digest('hex'),
          label: labelFor(file),
        })
      }

      const manifest: EngineManifest = {
        assets,
        totalBytes: assets.reduce((sum, a) => sum + a.size, 0),
      }
      writeFileSync(join(outDir, ENGINE_MANIFEST), JSON.stringify(manifest, null, 2))
    },
  }
}
