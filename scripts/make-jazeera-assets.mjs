// One-off: derive Hotel Jazeera brand assets from the Aljazeera Garden lockup.
// Flood-fills the white background to transparent, crops the leaf-"A" emblem
// (top of the lockup), and emits the favicon/app-icon/header/footer marks.
//
//   node scripts/make-jazeera-assets.mjs
//
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.JAZEERA_SRC
  || 'C:/Users/hp/Downloads/486165086_122102124602808024_6072218659023833731_n.jpg';

// Make white (and near-white) pixels transparent; keep the green art crisp.
async function toTransparent(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // near-white background -> transparent (the art is saturated green)
    if (r > 235 && g > 235 && b > 235) data[i + 3] = 0;
  }
  return { data, info: { width, height, channels } };
}

// Tight bounding box of non-transparent pixels within an optional y-band.
function bbox(data, info, yMin = 0, yMax = info.height) {
  const { width, height, channels } = info;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = yMin; y < yMax; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * channels + 3];
      if (a > 16) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function main() {
  const { data, info } = await toTransparent(SRC);
  const transparentPng = await sharp(Buffer.from(data), {
    raw: { width: info.width, height: info.height, channels: info.channels },
  }).png().toBuffer();

  // Emblem = the leaf-"A" only (top band, strictly above the wordmark).
  // Restrict the scan band so wordmark letter-tops never leak into the crop.
  const box = bbox(data, info, 0, 950);
  const emblemBuf = await sharp(transparentPng)
    .extract({ left: box.left, top: box.top, width: box.width, height: box.height })
    .png().toBuffer();
  console.log('emblem bbox', box);

  const out = (rel) => path.join(ROOT, rel);
  // Pad the emblem onto a transparent square with a small breathing margin.
  const resize = (n) => sharp(emblemBuf).resize(Math.round(n * 0.86), Math.round(n * 0.86), {
    fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).extend({
    top: Math.round(n * 0.07), bottom: Math.round(n * 0.07),
    left: Math.round(n * 0.07), right: Math.round(n * 0.07),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).resize(n, n, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png();

  await resize(512).toFile(out('public/jazeera-icon.png'));
  await resize(512).toFile(out('src/app/icon.png'));
  await resize(180).toFile(out('src/app/apple-icon.png'));
  await resize(256).toFile(out('public/jazeera-logo.png'));
  // keep the full transparent lockup around (source of truth)
  await sharp(transparentPng).png().toFile(out('public/jazeera-source.png'));

  console.log('✓ Hotel Jazeera assets written.');
}

main().catch((e) => { console.error(e); process.exit(1); });
