# VOBC FAULT ID SEARCH — Offline PWA Bundle

How to use:
1) Serve this folder with any static host (GitHub Pages / Netlify / local HTTP server).
2) Open `index.html`. You'll be prompted to install to Home Screen (Manifest).
3) After the first visit, the Service Worker precaches all data for offline use.

Notes:
- All data moved to `./assets/` and icons to `./icons/`.
- `sw.js` ignores querystrings for JSON/XLSX so cached data works offline.
- If you update data, bump the CACHE_NAME in `sw.js` (e.g. v2) and redeploy.