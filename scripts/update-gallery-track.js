// One-time migration: replaces the <div class="gallery-track">...</div> content on every
// page that uses the shared "Project Gallery" carousel with the full set of every image
// actually deployed somewhere on the site (all real project photos, plus the Coming Soon
// project banners), so the carousel is a complete showcase rather than a curated subset.
// Run with: node scripts/update-gallery-track.js
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'image-manifest.json'), 'utf8'));
const bySlug = {};
manifest.forEach((m) => (bySlug[m.slug] = m.alt));

const ORDER = [
  // Solanki Residence
  'gallery-family-room-terracotta-sofa-gurugram-01',
  'gallery-living-room-rattan-chair-gurugram-02',
  'solanki-residence-dining-room-brass-pendant-gurugram-02',
  'solanki-residence-guest-bedroom-blue-accents-gurugram',
  'solanki-residence-lounge-fireplace-gurugram-02',
  'solanki-residence-primary-bedroom-seating-gurugram',
  'solanki-residence-entry-foyer-gurugram',
  'solanki-residence-hallway-lotus-art-gurugram',
  'solanki-residence-dining-space-warm-neutrals-gurugram-01',
  'solanki-residence-lounge-contemporary-indian-gurugram-01',
  'solanki-residence-bedroom-quiet-luxury-gurugram-04',
  'solanki-residence-bathroom-contemporary-indian-gurugram-01',
  'solanki-residence-dresser-detail-gurugram-01',
  'solanki-residence-living-room-contemporary-indian-gurugram-01',
  // The Umber Office
  'umber-office-reception-gurugram-01',
  'umber-office-private-cabin-gurugram-02',
  'umber-office-workstations-gurugram-03',
  'umber-office-breakout-bar-gurugram-04',
  'umber-office-boardroom-gurugram-05',
  // Hardy's Cafe
  'hardys-cafe-courtyard-gurugram-01',
  'hardys-cafe-archway-gurugram-02',
  'hardys-cafe-table-detail-gurugram-03',
  'hardys-cafe-garden-path-gurugram-04',
  // The Record Bar
  'record-bar-lounge-gurugram-01',
  'record-bar-lounge-seating-gurugram-02',
  'record-bar-shelving-bar-gurugram-03',
  'record-bar-sofa-lounge-gurugram-04',
  'record-bar-counter-detail-gurugram-05',
  // Homepage hero banners (distinct rooms, deployed on the homepage hero)
  'home-hero-living-room-terracotta-bench-gurugram-08',
  'home-hero-bedroom-blue-headboard-gurugram-06',
  'home-hero-living-room-striped-wallpaper-gurugram-09',
  'home-hero-bedroom-dark-headboard-gurugram-10',
  'home-hero-living-room-wood-beam-gurugram-03',
  // Coming Soon projects (deployed via their Projects-page card banner)
  'pahuja-residence-bedroom-gurugram-01',
  'travertine-office-cabin-gurugram-01',
  'workbench-studio-desks-gurugram-01',
  'gro-food-hall-market-gurugram-01',
];

const IMG_BASE = '/assets/images/solanki-residence';

function picture(slug) {
  const alt = esc(bySlug[slug]);
  const base = `${IMG_BASE}/${slug}-full-sm`;
  return (
    `<picture><source srcset="${base}.avif" type="image/avif">` +
    `<source srcset="${base}.webp" type="image/webp">` +
    `<img src="${base}.jpg" alt="${alt}" loading="lazy"></picture>`
  );
}
function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const newTrackInner = ORDER.map(picture).join('\n    ');

const files = [
  'src/pages/home.html',
  'src/pages/studio.html',
  'src/pages/services/index.html',
  'src/pages/services/design-consultation.html',
  'src/pages/services/turnkey-interior-design.html',
  'src/pages/services/interior-styling.html',
];

const TRACK_PATTERN = /(<div class="gallery-track">\n?)([\s\S]*?)(\n?\s*<\/div>\s*\n\s*<div class="gallery-controls">)/;

let touched = 0;
for (const rel of files) {
  const file = path.join(ROOT, rel);
  const content = fs.readFileSync(file, 'utf8');
  if (!TRACK_PATTERN.test(content)) {
    console.warn(`SKIP (pattern not found): ${rel}`);
    continue;
  }
  const newContent = content.replace(TRACK_PATTERN, (m, open, _old, close) => `${open}    ${newTrackInner}${close}`);
  fs.writeFileSync(file, newContent);
  touched++;
  console.log(`${rel}: gallery-track replaced with ${ORDER.length} images`);
}

console.log(`\nDone. ${touched} files updated.`);
