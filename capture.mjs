// Renders a wallpaper page offline into a seamless-loop MP4 + GIF.
//
//   python3 -m http.server 8765 &        (serve this folder)
//   node capture.mjs [--page grass3d.html] [--seconds 10] [--fps 30] [--width 1062] [--height 2000] [--out out]
//                    [--model <hf id>] [--mask mask.png]     (depth-warp page, index.html, only)
//
// Needs Playwright (Chromium) and ffmpeg on PATH.
import { createRequire } from 'module';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';

const { chromium } = createRequire(import.meta.url)('playwright');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const seconds = parseFloat(args.seconds ?? 10);
const fps = parseInt(args.fps ?? 30, 10);
const out = args.out ?? 'out';
const base = args.url ?? `http://127.0.0.1:8765/${args.page ?? 'grass3d.html'}`;
const frames = Math.round(seconds * fps);

const query = new URLSearchParams({ capture: '1', loop: String(seconds) });
if (args.model) query.set('model', args.model);
if (args.mask) query.set('mask', args.mask);
if (args.width) query.set('w', args.width);
if (args.height) query.set('h', args.height);

const framesDir = join(out, 'frames');
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });
const savePng = (path, dataUrl) => writeFileSync(path, Buffer.from(dataUrl.split(',')[1], 'base64'));

const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (process.env.HTTPS_PROXY) launch.proxy = { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' };
const browser = await chromium.launch(launch);
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[page]', e.message));

console.log('Loading page…');
await page.goto(`${base}?${query}`);
await page.evaluate(() => window.__capture.ready);
const hasMask = await page.evaluate(() => typeof window.__capture.mask === 'function');
if (hasMask) savePng(join(out, 'mask.png'), await page.evaluate(() => window.__capture.mask()));
const { w, h } = await page.evaluate((width) => window.__capture.setup(width), args.width ? +args.width : 0);
if (hasMask) savePng(join(out, 'depth_view.png'), await page.evaluate(() => window.__capture.frame(0, true)));

console.log(`Rendering ${frames} frames at ${w}×${h}…`);
for (let i = 0; i < frames; i++) {
  const png = await page.evaluate((t) => window.__capture.frame(t), i / fps);
  savePng(join(framesDir, `f${String(i).padStart(5, '0')}.png`), png);
  if (i % fps === 0) process.stdout.write(`  ${i}/${frames}\r`);
}
await browser.close();

const input = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(framesDir, 'f%05d.png')];
console.log('\nEncoding MP4…');
execFileSync('ffmpeg', [...input, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(out, `${args.name ?? 'grass_wind_loop'}.mp4`)]);

// GIF is 256 colours and grass is worst-case texture — downscale and drop to 12 fps to keep it shareable.
console.log('Encoding GIF…');
execFileSync('ffmpeg', [...input, '-vf',
  'fps=12,scale=360:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
  '-loop', '0', join(out, `${args.name ?? 'grass_wind_loop'}.gif`)]);
console.log(`Done → ${out}/${args.name ?? 'grass_wind_loop'}.mp4 / .gif`);
