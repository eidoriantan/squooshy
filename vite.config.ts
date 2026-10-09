/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { engineManifest } from './build/engine-manifest.ts'

// Multi-threaded WASM (AVIF, OxiPNG) needs SharedArrayBuffer, which needs
// cross-origin isolation. Production sets the same headers in public/_headers.
const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    engineManifest(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      injectManifest: {
        // Only the small app shell is precached here. WASM and worker code are
        // downloaded by the loading screen (see src/lib/preload.ts).
        globPatterns: [
          'index.html',
          'engine-manifest.json',
          'assets/index-*.{js,css}',
          'assets/*.woff2',
          '*.{svg,ico}',
          'apple-touch-icon-*.png',
        ],
      },
      manifest: {
        name: 'Squooshy',
        short_name: 'Squooshy',
        description: 'Squoosh your images and PDFs right in the browser. Nothing gets uploaded.',
        theme_color: '#2EC4A6',
        background_color: '#F5FBF9',
        display: 'standalone',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  // The jSquash codecs locate their .wasm files with import.meta.url, which
  // pre-bundling would break.
  optimizeDeps: {
    exclude: [
      '@jsquash/avif',
      '@jsquash/jpeg',
      '@jsquash/oxipng',
      '@jsquash/png',
      '@jsquash/resize',
      '@jsquash/webp',
      '@okathira/ghostpdl-wasm',
    ],
  },
  worker: {
    format: 'es',
  },
  server: { headers: isolationHeaders },
  preview: { headers: isolationHeaders },
  test: {
    include: ['src/**/*.test.ts', 'build/**/*.test.ts'],
  },
})
