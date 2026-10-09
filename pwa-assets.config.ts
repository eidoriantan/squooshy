import { defineConfig } from '@vite-pwa/assets-generator/config'

// Generates the PWA and Apple icons from the favicon: npm run icons
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    transparent: { sizes: [64, 192, 512], favicons: [[48, 'favicon.ico']], padding: 0 },
    maskable: { sizes: [512], padding: 0.25, resizeOptions: { background: '#DDF7F0' } },
    apple: { sizes: [180], padding: 0.25, resizeOptions: { background: '#DDF7F0' } },
  },
  images: ['public/favicon.svg'],
})
