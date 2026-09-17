// One-time/rerunnable image pipeline: decodes the old base64-embedded photos into
// real WebP+JPEG derivative files per the Step 6 Technical SEO Requirements spec
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

// [name, width, height, maxKB] — per Step 6 §5.2 / §5.3
const DERIVATIVES = [
  ['hero', 2560, 1440, 200],
  ['service-hero', 1440, 810, 180],
  ['full', 1440, 960, 150],
  ['grid', 800, 600, 60],
  ['thumb', 400, 267, 40],
  ['og', 1200, 630, 120],
];

async function encodeUnderBudget(pipeline, format, maxKB) {
  const maxBytes = maxKB * 1024;
  let quality = format === 'webp' ? 82 : 84;
  let buf;
  while (quality >= 35) {
    buf =
      format === 'webp'
        ? await pipeline.clone().webp({ quality }).toBuffer()
        : await pipeline.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
    if (buf.length <= maxBytes) return buf;
    quality -= 8;
  }
  return buf; // best effort at floor quality
}

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

    for (const [name, w, h, maxKB] of DERIVATIVES) {
      const base = sharp(srcPath).resize(w, h, {
        fit: 'cover',
        position: entry.gravity || 'center',
      });

      const webpBuf = await encodeUnderBudget(base, 'webp', maxKB);
      const webpPath = path.join(OUT_DIR, `${entry.slug}-${name}.webp`);
      fs.writeFileSync(webpPath, webpBuf);

      const jpgBuf = await encodeUnderBudget(base, 'jpeg', maxKB);
      const jpgPath = path.join(OUT_DIR, `${entry.slug}-${name}.jpg`);
      fs.writeFileSync(jpgPath, jpgBuf);

      totalFiles += 2;
      console.log(
        `${entry.slug}-${name}: webp ${(webpBuf.length / 1024).toFixed(0)}KB, jpg ${(jpgBuf.length / 1024).toFixed(0)}KB (source ${srcMeta.width}x${srcMeta.height})`
      );
    }
  }

  console.log(`\nDone. ${totalFiles} derivative files written to ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
