// One-time/rerunnable image pipeline: decodes the old base64-embedded photos into
// real AVIF+WebP+JPEG derivative files per the Step 6 Technical SEO Requirements spec
// (formats, dimensions, file-size ceilings, filename convention). Run with:
//   npm run process-images
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, '_originals');
const OUT_DIR = path.join(ROOT, 'assets', 'images', 'solanki-residence');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'image-manifest.json'), 'utf8'));

// [name, width, height, maxKB, formats] — per Step 6 §5.2 / §5.3, extended with a
// responsive "-sm" tier (half linear size) for the three large derivatives that are
// actually rendered full-bleed/full-width, so mobile doesn't download desktop pixels,
// plus AVIF alongside WebP/JPEG for every derivative that's rendered in the browser.
// `og` stays JPEG-only: it's only ever read by social-share crawlers via the og:image
// meta tag (never fetched by a visitor's browser), and those crawlers need the widest
// possible format compatibility, not the smallest file. `thumb` was generated but never
// referenced by any page template — dropped.
const ALL = ['jpeg', 'webp', 'avif'];
const DERIVATIVES = [
  ['hero', 2560, 1440, 200, ALL],
  ['hero-sm', 1280, 720, 110, ALL],
  ['service-hero', 1440, 810, 180, ALL],
  ['service-hero-sm', 720, 405, 90, ALL],
  ['full', 1440, 960, 150, ALL],
  ['full-sm', 720, 480, 80, ALL],
  ['grid', 800, 600, 60, ALL],
  ['og', 1200, 630, 120, ['jpeg']],
];
// Opt-in 4:5 portrait tier (manifest entry needs "portrait": true; source must be portrait) —
// kept out of DERIVATIVES so landscape sources are never cropped into portrait.
const PORTRAIT_DERIVATIVES = [
  ['portrait', 960, 1200, 150, ALL],
  ['portrait-sm', 480, 600, 60, ALL],
];

const QUALITY = {
  webp: { start: 82, floor: 35, step: 8 },
  jpeg: { start: 84, floor: 35, step: 8 },
  avif: { start: 60, floor: 30, step: 6 },
};

async function encodeUnderBudget(pipeline, format, maxKB) {
  const maxBytes = maxKB * 1024;
  const { start, floor, step } = QUALITY[format];
  let quality = start;
  let buf;
  while (quality >= floor) {
    buf =
      format === 'webp'
        ? await pipeline.clone().webp({ quality }).toBuffer()
        : format === 'avif'
          ? await pipeline.clone().avif({ quality }).toBuffer()
          : await pipeline.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
    if (buf.length <= maxBytes) return buf;
    quality -= step;
  }
  return buf; // best effort at floor quality
}

const EXT = { jpeg: 'jpg', webp: 'webp', avif: 'avif' };

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let totalFiles = 0;

  for (const entry of manifest) {
    const srcPath = path.join(SRC_DIR, entry.source);
    if (!fs.existsSync(srcPath)) {
      console.warn(`SKIP (source not found): ${entry.source}`);
      continue;
    }
    const srcMeta = await sharp(srcPath).metadata();

    const derivatives = process.env.ONLY_PORTRAIT
      ? (entry.portrait ? PORTRAIT_DERIVATIVES : [])
      : DERIVATIVES.concat(entry.portrait ? PORTRAIT_DERIVATIVES : []);
    for (const [name, w, h, maxKB, formats] of derivatives) {
      const base = sharp(srcPath).resize(w, h, {
        fit: 'cover',
        position: entry.gravity || 'center',
      });

      const sizes = [];
      for (const format of formats) {
        const buf = await encodeUnderBudget(base, format, maxKB);
        const outPath = path.join(OUT_DIR, `${entry.slug}-${name}.${EXT[format]}`);
        fs.writeFileSync(outPath, buf);
        totalFiles += 1;
        sizes.push(`${format} ${(buf.length / 1024).toFixed(0)}KB`);
      }
      console.log(`${entry.slug}-${name}: ${sizes.join(', ')} (source ${srcMeta.width}x${srcMeta.height})`);
    }
  }

  console.log(`\nDone. ${totalFiles} derivative files written to ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
