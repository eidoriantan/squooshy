<p align="center">
  <img src="public/logo.svg" width="120" alt="Squooshy mascot: a jelly cube under a press" />
</p>

<h1 align="center">Squooshy</h1>

<p align="center">Squoosh your images and PDFs right in the browser. Nothing gets uploaded.</p>

---

Squooshy makes JPEG, PNG, WebP, AVIF and PDF files smaller. All of the compression runs on your own device using WebAssembly, so your files never leave it. There is no server, no account and no tracking. Once loaded, Squooshy works offline and can be installed as an app.

## Features

- **Images:** JPEG (MozJPEG), PNG (OxiPNG), WebP and AVIF. Convert between any of them.
- **PDFs:** compressed with Ghostscript, keeping text selectable and searchable.
- **Presets:** Light, Balanced and Max squoosh. Advanced settings let you pick quality, output format, a maximum size and the image resolution inside PDFs.
- **Batch:** drop or paste many files at once. They are compressed in parallel in Web Workers. Download them one by one or as a ZIP.
- **Before/after:** compare the original and the result with a slider.
- **Never bigger:** if compressing doesn't help, you get your original file back.
- **Offline and installable:** the first visit downloads every engine (about 26 MB) behind a loading screen and keeps them on your device. After that, Squooshy starts instantly, with or without a connection.

## How it works

| Part             | Where                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UI               | React, TypeScript, Tailwind CSS, Vite                                                                                                                                    |
| Image codecs     | [jSquash](https://github.com/jamsinclair/jSquash) (the Squoosh codecs as npm packages)                                                                                   |
| PDF engine       | [Ghostscript](https://ghostscript.com) compiled to WebAssembly ([@okathira/ghostpdl-wasm](https://github.com/okathira/ghostpdl-wasm))                                    |
| Workers          | `src/workers/`, managed by a small pool in `src/lib/pool.ts`                                                                                                             |
| First-visit load | `build/engine-manifest.ts` lists every engine file at build time. `src/lib/preload.ts` downloads them with progress into Cache Storage. `src/sw.ts` serves them offline. |

The AVIF and PNG encoders use several threads when the page is cross-origin isolated. `public/_headers` sets the needed headers on Cloudflare Pages, and `vite.config.ts` sets them for local development.

## Development

You need Node.js 22 or newer.

```sh
npm install
npm run dev        # http://localhost:5173
```

In development the engines load straight from Vite, so there is no loading screen. To try the real first-visit flow and offline mode, run a production build:

```sh
npm run build
npm run preview    # http://localhost:4173
```

Other scripts:

```sh
npm run typecheck  # TypeScript
npm run lint       # oxlint
npm test           # unit tests (Vitest)
npm run e2e        # end-to-end tests (Playwright; run `npx playwright install chromium` once)
npm run format     # Prettier
npm run icons      # regenerate PWA icons from public/favicon.svg
```

## Deploying to Cloudflare Pages

Create a Pages project from this repository with:

- **Build command:** `npm run build`
- **Build output directory:** `dist`

`public/_headers` is copied into `dist` and applies the cross-origin isolation and caching headers.

## License

Copyright © 2026 [@eidoriantan](https://eidoriantan.com)

Squooshy is free software under the [GNU Affero General Public License v3.0](LICENSE). It bundles Ghostscript, which is AGPL-licensed, so the whole app is too. The jSquash codecs are Apache-2.0.

The mascot and logo are part of this project and share its license.
