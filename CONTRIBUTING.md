# Contributing to Squooshy

Thanks for helping make files smaller! Bug reports, ideas and pull requests are all welcome.

## Ground rules

- **Files never leave the device.** Squooshy must not upload, log or send file contents or file names anywhere. Changes that add network requests for user data won't be accepted.
- **Engines load up front.** Every WASM engine is downloaded on the first visit by the loading screen and kept for offline use. Don't lazy-load engines. If you add one, make sure it ends up in `dist/engine-manifest.json` after a build.
- **Keep it friendly.** Copy is short and plain, and the UI should work with a keyboard, on a phone and in dark mode.

## Getting started

```sh
npm install
npm run dev
```

See the README for the full list of scripts.

## Before opening a pull request

```sh
npm run format
npm run lint
npm run typecheck
npm test
npm run e2e
```

Add or update tests for behaviour you change. Pure logic lives in `src/lib/` and has unit tests next to it. End-to-end tests live in `e2e/`.

## License

By contributing, you agree that your contributions are licensed under the AGPL-3.0, like the rest of the project.
