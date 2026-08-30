// Generates sitemap.xml from the built page front matter, per Step 6 §2 priority/changefreq rules.
// Run with: node scripts/generate-sitemap.js (also invoked by `npm run build` via package.json if wired up)
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE_URL = 'https://studioloom.co.in';

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

function priorityFor(url) {
  if (url === '/') return { priority: '1.0', changefreq: 'weekly' };
  if (url.startsWith('/services/')) return { priority: '0.9', changefreq: 'monthly' };
  if (url === '/work') return { priority: '0.8', changefreq: 'monthly' };
  if (url === '/studio' || url === '/contact' || url === '/services') return { priority: '0.8', changefreq: 'monthly' };
  if (url.startsWith('/work/')) return { priority: '0.7', changefreq: 'yearly' };
  if (url.startsWith('/journal')) return { priority: url === '/journal' ? '0.6' : '0.7', changefreq: url === '/journal' ? 'weekly' : 'monthly' };
  if (url === '/privacy-policy') return { priority: '0.3', changefreq: 'yearly' };
  return { priority: '0.5', changefreq: 'monthly' };
}

function main() {
  const files = walk(path.join(ROOT, 'src', 'pages'));
  const urls = [];
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const match = raw.match(/^<!--json([\s\S]*?)-->/);
    if (!match) continue;
    const meta = JSON.parse(match[1]);
    if (meta.url === '/404' || (meta.robots && meta.robots.includes('noindex'))) continue;
    urls.push(meta.url);
  }
  urls.sort();

  const entries = urls
    .map((url) => {
      const { priority, changefreq } = priorityFor(url);
      const loc = `${SITE_URL}${url === '/' ? '/' : url}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
  console.log(`sitemap.xml written with ${urls.length} URLs.`);
}

main();
