// Copies MapLibre's background helper (web worker) into public/maplibre/, named with the
// library version. The bundler can't serve it from node_modules, so lib/map-style.ts points
// MapLibre at this copy. Runs automatically before dev and build (package.json); the copy is
// not committed (.gitignore).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const { version } = require(path.join(root, 'node_modules/maplibre-gl/package.json'));
const from = path.join(root, 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs');
const dir = path.join(root, 'public/maplibre');
const to = path.join(dir, `worker-${version}.mjs`);

fs.mkdirSync(dir, { recursive: true });
for (const old of fs.readdirSync(dir)) if (old !== path.basename(to)) fs.rmSync(path.join(dir, old));
fs.copyFileSync(from, to);
console.log(`Map worker ready: public/maplibre/worker-${version}.mjs`);
