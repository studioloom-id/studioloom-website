// One-time migration: adds AVIF + a responsive "-sm" size tier to every image reference
// in src/pages/**/*.html. Handles three existing markup shapes:
//   A) <picture><source webp><img jpg></picture>  (hero/service-hero/full/grid everywhere)
//   B) bare <img src=".../X-full.jpg" ...>          (.split-img-inset — no picture wrapper at all)
//   C) bare <img src=".../X-full.jpg" ... loading="lazy"> inside .gallery-track (shared carousel)
// (B) and (C) currently serve JPEG only — no WebP, let alone AVIF — so this is the fix for
// a meaningful chunk of the site's images, not just a format upgrade on top of existing WebP.
// Run with: node scripts/add-avif-responsive.js
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IMG_BASE = '/assets/images/solanki-residence';

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(path.relative(ROOT, full));
  }
  return out;
}

const files = walk(path.join(ROOT, 'src', 'pages'));

// Actual pixel width of each derivative and its "-sm" companion — must match
// scripts/process-images.js's DERIVATIVES table exactly.
const WIDTHS = {
  hero: [2560, 1280],
  'service-hero': [1440, 720],
  full: [1440, 720],
};
// `sizes` per suffix — approximate but strictly better than the fixed-desktop-size status
// quo. hero/service-hero are always full-bleed; `full` appears both in half-width
// split-sections and full-width gallery cells, so this is a reasonable middle ground.
const SIZES = {
  hero: '100vw',
  'service-hero': '100vw',
  full: '(min-width: 1024px) 50vw, 100vw',
};

function responsiveSet(base, slug, suffix, ext) {
  const [big, small] = WIDTHS[suffix];
  return `${IMG_BASE}/${slug}-${suffix}-sm.${ext} ${small}w, ${base}.${ext} ${big}w`;
}

let totalBlocks = 0;
const touchedFiles = new Set();

for (const rel of files) {
  const file = path.join(ROOT, rel);
  let content = fs.readFileSync(file, 'utf8');
  let fileCount = 0;

  // --- Pattern A: existing <picture><source webp><img jpg></picture> ---
  const PICTURE_PATTERN = new RegExp(
    `<source srcset="(${IMG_BASE}/([a-z0-9-]+)-(hero|service-hero|full|grid))\\.webp" type="image/webp">` +
      '(\\s*\\n\\s*)' +
      '<img src="\\1\\.jpg"',
    'g'
  );
  content = content.replace(PICTURE_PATTERN, (match, base, slug, suffix, ws) => {
    fileCount++;
    const sizesAttr = SIZES[suffix];
    if (sizesAttr) {
      const avifSrcset = responsiveSet(base, slug, suffix, 'avif');
      const webpSrcset = responsiveSet(base, slug, suffix, 'webp');
      const jpgSrcset = responsiveSet(base, slug, suffix, 'jpg');
      return (
        `<source srcset="${avifSrcset}" sizes="${sizesAttr}" type="image/avif">${ws}` +
        `<source srcset="${webpSrcset}" sizes="${sizesAttr}" type="image/webp">${ws}` +
        `<img srcset="${jpgSrcset}" sizes="${sizesAttr}" src="${base}.jpg"`
      );
    }
    // grid — no responsive tier (already 800x600, small), just add avif
    return (
      `<source srcset="${base}.avif" type="image/avif">${ws}` +
      `<source srcset="${base}.webp" type="image/webp">${ws}` +
      `<img src="${base}.jpg"`
    );
  });

  // --- Pattern B: bare <img> inside .split-img-inset (full suffix, no picture wrapper) ---
  // Matches the opening <div class="split-img-inset">\n<img src="...-full.jpg" ... up to the
  // closing > of that single img tag (non-greedy, no nested tags expected here).
  const INSET_PATTERN = new RegExp(
    '(<div class="split-img-inset">\\s*\\n(\\s*))<img src="(' + IMG_BASE + '/([a-z0-9-]+)-full)\\.jpg"([^>]*)>',
    'g'
  );
  content = content.replace(INSET_PATTERN, (match, prefix, indent, base, slug, imgAttrs) => {
    fileCount++;
    const sizesAttr = SIZES.full;
    const avifSrcset = responsiveSet(base, slug, 'full', 'avif');
    const webpSrcset = responsiveSet(base, slug, 'full', 'webp');
    const jpgSrcset = responsiveSet(base, slug, 'full', 'jpg');
    return (
      `${prefix}${indent}<picture>\n` +
      `${indent}  <source srcset="${avifSrcset}" sizes="${sizesAttr}" type="image/avif">\n` +
      `${indent}  <source srcset="${webpSrcset}" sizes="${sizesAttr}" type="image/webp">\n` +
      `${indent}  <img srcset="${jpgSrcset}" sizes="${sizesAttr}" src="${base}.jpg"${imgAttrs}>\n` +
      `${indent}</picture>`
    );
  });

  // --- Pattern B2: bare <img class="split-img"> (direct grid child, no wrapper div) ---
  const SPLITIMG_PATTERN = new RegExp(
    '<img class="split-img" src="(' + IMG_BASE + '/([a-z0-9-]+)-full)\\.jpg"\\s*\\n(\\s*)alt="([^"]*)"([^>]*)>',
    'g'
  );
  content = content.replace(SPLITIMG_PATTERN, (match, base, slug, indent, alt, rest) => {
    fileCount++;
    const sizesAttr = SIZES.full;
    const avifSrcset = responsiveSet(base, slug, 'full', 'avif');
    const webpSrcset = responsiveSet(base, slug, 'full', 'webp');
    const jpgSrcset = responsiveSet(base, slug, 'full', 'jpg');
    return (
      `<picture>\n` +
      `${indent}<source srcset="${avifSrcset}" sizes="${sizesAttr}" type="image/avif">\n` +
      `${indent}<source srcset="${webpSrcset}" sizes="${sizesAttr}" type="image/webp">\n` +
      `${indent}<img class="split-img" srcset="${jpgSrcset}" sizes="${sizesAttr}" src="${base}.jpg"\n` +
      `${indent}     alt="${alt}"${rest}>\n` +
      `</picture>`
    );
  });

  // --- Pattern C: bare <img> inside .gallery-track (full suffix, no picture wrapper) ---
  // The carousel never displays wider than 480px (see .gallery-track img in main.css), so the
  // existing "full-sm" (720w) derivative alone is more than enough — no need for the 1440w tier.
  const TRACK_PATTERN = new RegExp(
    '<img src="(' + IMG_BASE + '/([a-z0-9-]+)-full)\\.jpg"([^>]*)>',
    'g'
  );
  // (gallery-track images are matched contextually below, not globally, to avoid touching
  // visually-identical `-full.jpg` img tags that might appear outside the carousel)
  const trackSections = content.split(/(<div class="gallery-track">[\s\S]*?<\/div>)/);
  content = trackSections
    .map((section) => {
      if (!section.startsWith('<div class="gallery-track">')) return section;
      return section.replace(TRACK_PATTERN, (m, base, slug, imgAttrs) => {
        fileCount++;
        const avifSrcset = `${IMG_BASE}/${slug}-full-sm.avif`;
        const webpSrcset = `${IMG_BASE}/${slug}-full-sm.webp`;
        const jpgSrcset = `${IMG_BASE}/${slug}-full-sm.jpg`;
        return (
          `<picture>` +
          `<source srcset="${avifSrcset}" type="image/avif">` +
          `<source srcset="${webpSrcset}" type="image/webp">` +
          `<img src="${jpgSrcset}"${imgAttrs}>` +
          `</picture>`
        );
      });
    })
    .join('');

  if (fileCount > 0) {
    fs.writeFileSync(file, content);
    touchedFiles.add(rel);
    totalBlocks += fileCount;
    console.log(`${rel}: ${fileCount} image(s) updated`);
  }
}

console.log(`\nDone. ${totalBlocks} images updated across ${touchedFiles.size} files.`);
