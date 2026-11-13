// Renders carousel.html with headless Edge and slices it into 5 Instagram images (1080x1350).
// Run from the project folder:  node marketing/instagram/gosti-karusel/render.cjs
const { execFileSync } = require('child_process');
const path = require('path');
const sharp = require('sharp');

const dir = __dirname;
const html = path.join(dir, 'carousel.html');
const full = path.join(dir, 'ceo-karusel.png');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

execFileSync(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--window-size=5400,1350', '--virtual-time-budget=10000',
  `--screenshot=${full}`, 'file:///' + html.replace(/\\/g, '/'),
], { stdio: 'inherit' });

(async () => {
  for (let i = 0; i < 5; i++) {
    await sharp(full)
      .extract({ left: i * 1080, top: 0, width: 1080, height: 1350 })
      .jpeg({ quality: 92 })
      .toFile(path.join(dir, `vikendly-vlasnici-${i + 1}.jpg`));
  }
  await sharp(full).resize(2700).jpeg({ quality: 85 }).toFile(path.join(dir, 'pregled.jpg'));
  console.log('done');
})();
