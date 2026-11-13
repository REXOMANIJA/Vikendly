// Renders logo.html with headless Edge into 3 profile pictures (1080x1080) + a preview as Instagram shows them (circles).
// Run from the project folder:  node marketing/instagram/profil/render.cjs
const { execFileSync } = require('child_process');
const path = require('path');
const sharp = require('sharp');

const dir = __dirname;
const full = path.join(dir, 'sve.png');
execFileSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--window-size=3240,1080', '--virtual-time-budget=8000',
  `--screenshot=${full}`, 'file:///' + path.join(dir, 'logo.html').replace(/\\/g, '/'),
], { stdio: 'ignore' });

(async () => {
  const names = ['A-kucica', 'B-kucica-i-ime', 'C-svetla'];
  const circle = Buffer.from('<svg width="320" height="320"><circle cx="160" cy="160" r="160"/></svg>');
  const small = [];
  for (let i = 0; i < 3; i++) {
    const tile = sharp(full).extract({ left: i * 1080, top: 0, width: 1080, height: 1080 });
    await tile.clone().png().toFile(path.join(dir, `vikendly-profil-${names[i]}.png`));
    small.push(await tile.clone().resize(320).composite([{ input: circle, blend: 'dest-in' }]).png().toBuffer());
  }
  // preview: the three as round profile pictures on a white strip
  await sharp({ create: { width: 1180, height: 420, channels: 4, background: '#ffffff' } })
    .composite(small.map((input, i) => ({ input, left: 50 + i * 380, top: 50 })))
    .png().toFile(path.join(dir, 'pregled-krug.png'));
  console.log('done');
})();
