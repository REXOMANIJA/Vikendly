import fs from 'fs';
import path from 'path';

// Maps need MapLibre's worker file in public/maplibre/ with the installed version in its name
// (lib/map-style.ts). After updating maplibre-gl run `node scripts/copy-map-worker.cjs` and commit it.
it('the map worker file matches the installed maplibre-gl version', () => {
  const { version } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'node_modules/maplibre-gl/package.json'), 'utf8'));
  expect(fs.existsSync(path.join(process.cwd(), `public/maplibre/worker-${version}.mjs`))).toBe(true);
});
