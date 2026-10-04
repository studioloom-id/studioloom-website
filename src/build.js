// Studio Loom static site builder. Local authoring convenience only — GitHub Pages
// never runs this; the output committed to the repo is plain flat HTML/CSS/JS.
// Usage: npm run build
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE_URL = 'https://studioloom.co.in';

const nap = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'nap.json'), 'utf8'));
const nav = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'nav.json'), 'utf8'));
const shellTemplate = fs.readFileSync(path.join(__dirname, 'partials', 'shell.html'), 'utf8');

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------- NAV ----------
function renderNav(opts) {
  const solidClass = opts.solid ? ' solid' : '';
  const items = nav.primary
    .map((item) => {
      if (item.children) {
        const sub = item.children
          .map((c) => `<a href="${c.url}">${esc(c.label)}</a>`)
          .join('\n            ');
        return `<li>
          <a href="${item.url}">${esc(item.label)}</a>
          <div class="nav-dropdown">
            ${sub}
          </div>
        </li>`;
      }
      return `<li><a href="${item.url}">${esc(item.label)}</a></li>`;
    })
    .join('\n        ');

  return `<nav id="navbar" class="${solidClass.trim()}">
  <a class="nav-logo" href="/">
    <img class="nav-logo-mark" src="/assets/images/brand/studio-loom-mark.png" width="36" height="36" alt="Studio Loom mark">
    <div class="nav-logo-text">
      <span class="nav-logo-studio">Studio</span>
      <span class="nav-logo-loom">Loom</span>
    </div>
  </a>
  <ul class="nav-links">
        ${items}
  </ul>
  <div style="display:flex;align-items:center;gap:1.4rem;">
    <a class="nav-cta" href="${nav.ctaUrl}">${esc(nav.ctaLabel)}</a>
    <button class="nav-toggle" aria-label="Menu" aria-expanded="false"><span></span></button>
  </div>
</nav>`;
}

// ---------- FOOTER ----------
function renderFooter() {
  const cols = nav.footerSections
    .map(
      (section) => `<div class="footer-col">
        <div class="footer-col-title">${esc(section.title)}</div>
        <ul>
          ${section.links.map((l) => `<li><a href="${l.url}">${esc(l.label)}</a></li>`).join('\n          ')}
        </ul>
      </div>`
    )
    .join('\n      ');

  return `<footer>
  <div class="footer-main">
    <div class="footer-brand">
      <div class="footer-logo-row">
        <img class="nav-logo-mark" src="/assets/images/brand/studio-loom-mark.png" width="32" height="32" alt="Studio Loom mark">
        <div class="nav-logo-text">
          <span class="footer-logo-studio">Studio</span>
          <span class="footer-logo-loom">Loom</span>
        </div>
      </div>
      <p class="footer-tagline">${esc(nap.tagline)}</p>
    </div>
    <div class="footer-cols">
      ${cols}
    </div>
  </div>
  <div class="footer-contact">
    <div class="footer-contact-item">
      <span class="footer-contact-label">Address</span>
      <span class="footer-contact-value">${esc(nap.address.display)}</span>
    </div>
    <div class="footer-contact-item">
      <span class="footer-contact-label">Phone</span>
      <a class="footer-contact-value" href="tel:${nap.phone.tel}">${esc(nap.phone.display)}</a>
    </div>
    <div class="footer-contact-item">
      <span class="footer-contact-label">Email</span>
      <a class="footer-contact-value" href="mailto:${nap.email}">${esc(nap.email)}</a>
    </div>
    <div class="footer-contact-item">
      <span class="footer-contact-label">Social</span>
      <div class="footer-social">
        <a href="${nap.social.instagram}" target="_blank" rel="noopener">Instagram</a>
        <a href="${nap.social.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <span class="footer-copy">&copy; ${nap.copyrightYear} Studio Loom. All rights reserved.</span>
  </div>
</footer>`;
}

// ---------- SCHEMA ----------
function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: nap.name,
    url: nap.url,
  };
}

function interiorDesignerSchema() {
  const sameAs = [nap.social.instagram, nap.social.linkedin];
  if (nap.social.gbp) sameAs.push(nap.social.gbp);
  return {
    '@context': 'https://schema.org',
    '@type': 'InteriorDesigner',
    name: nap.name,
    legalName: nap.legalName,
    description:
      'Studio Loom is a contemporary Indian interior design studio based in Gurugram, designing residential, commercial, and hospitality interiors across Delhi NCR.',
    url: nap.url,
    logo: `${nap.url}/assets/images/brand/studio-loom-mark.png`,
    telephone: nap.phone.schema,
    email: nap.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: nap.address.streetAddress,
      addressLocality: nap.address.addressLocality,
      addressRegion: nap.address.addressRegion,
      postalCode: nap.address.postalCode,
      addressCountry: nap.address.addressCountry,
    },
    geo: { '@type': 'GeoCoordinates', latitude: nap.geo.latitude, longitude: nap.geo.longitude },
    areaServed: nap.areaServed.map((a) =>
      a === 'Delhi NCR' ? { '@type': 'State', name: a } : { '@type': 'City', name: a }
    ),
    priceRange: nap.priceRange,
    currenciesAccepted: 'INR',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: nap.openingHours.days,
      opens: nap.openingHours.opens,
      closes: nap.openingHours.closes,
    },
    sameAs,
  };
}

function breadcrumbSchema(breadcrumb) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumb.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: `${SITE_URL}${b.url}`,
    })),
  };
}

function serviceSchema(page, svc) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: svc.name,
    description: page.description,
    provider: { '@type': 'InteriorDesigner', name: nap.name, url: nap.url },
    areaServed: { '@type': typeof svc.areaServed === 'string' && svc.areaServed !== 'Delhi NCR' ? 'City' : 'State', name: svc.areaServed },
    serviceType: svc.serviceType,
    url: `${SITE_URL}${page.url}`,
  };
}

function faqSchema(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function renderSchemaTag(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
}

// ---------- FAQ visible markup ----------
function renderFaqSection(faq, image) {
  const items = faq
    .map(
      (f, i) => `        <details class="faq-item"${i === 0 ? ' open' : ''}>
          <summary>${esc(f.q)}</summary>
          <p class="faq-answer">${esc(f.a)}</p>
        </details>`
    )
    .join('\n');

  if (!image) {
    return `
<section class="faq-section">
  <div class="fade-up">
    <span class="section-label">Common Questions</span>
    <h2 class="section-title">Frequently asked.</h2>
    <div class="faq-list">
${items}
    </div>
  </div>
</section>`;
  }

  return `
<section class="split-section faq-split fade-up">
  <div class="split-text">
    <span class="section-label">Common Questions</span>
    <h2 class="section-title">Frequently asked.</h2>
    <div class="faq-list">
${items}
    </div>
  </div>
  <div class="split-img-inset">
    <img src="${image.src}" alt="${esc(image.alt)}" width="1440" height="960" loading="lazy">
  </div>
</section>`;
}

// ---------- Front matter parsing ----------
function parsePage(raw) {
  const match = raw.match(/^<!--json([\s\S]*?)-->\s*([\s\S]*)$/);
  if (!match) throw new Error('Page missing <!--json ... --> front matter block');
  const meta = JSON.parse(match[1]);
  const body = match[2];
  return { meta, body };
}

// ---------- Build one page ----------
function buildPage(meta, body) {
  const canonical = `${SITE_URL}${meta.url === '/' ? '' : meta.url}`;
  const schemaBlocks = [];

  if (meta.url === '/') {
    schemaBlocks.push(websiteSchema());
    schemaBlocks.push(interiorDesignerSchema());
  }
  if (meta.schema?.custom) meta.schema.custom.forEach((s) => schemaBlocks.push(s));
  if (meta.breadcrumb) schemaBlocks.push(breadcrumbSchema(meta.breadcrumb));
  if (meta.schema?.service) schemaBlocks.push(serviceSchema(meta, meta.schema.service));
  if (meta.schema?.faq) schemaBlocks.push(faqSchema(meta.schema.faq));

  let fullBody = body;
  if (meta.schema?.faq) fullBody += renderFaqSection(meta.schema.faq, meta.faqImage);

  const ogImage = meta.ogImage ? `${SITE_URL}${meta.ogImage}` : `${SITE_URL}/assets/images/og/default-og.jpg`;
  // Responsive preload: the LCP image now ships a smaller "-sm" variant for narrow
  // viewports via srcset (see src/pages/**/*.html and scripts/process-images.js). A plain
  // `href`-only preload would always fetch the large desktop file regardless of viewport,
  // which on mobile means paying for BOTH that wasted preload AND the correctly-sized file
  // the <picture> srcset actually renders. `imagesrcset`/`imagesizes` lets the preload scanner
  // pick the same candidate the picture element will, so mobile preloads the small one.
  //
  // Preloaded as AVIF, not WebP: the <picture> markup lists <source type="image/avif"> before
  // webp, so any browser that reaches this preload also ends up choosing avif in the picture
  // element itself. Preloading webp while the picture picks avif would fetch BOTH (the
  // preload, unused, plus the avif the picture actually renders) — strictly worse than no
  // preload. A browser without AVIF support just ignores a `type="image/avif"` preload
  // (per spec, a `type` it can't render means the preload is skipped, not a fallback fetch)
  // and gets the same un-preloaded webp/jpg it always would have.
  const RESPONSIVE_WIDTHS = { hero: [2560, 1280], 'service-hero': [1440, 720] };
  const preload = (() => {
    if (!meta.preloadImage) return '';
    const m = meta.preloadImage.match(/^(.*\/[a-z0-9-]+-(hero|service-hero))\.webp$/);
    if (!m) return `<link rel="preload" as="image" href="${meta.preloadImage}" type="image/webp">`;
    const [, base, suffix] = m;
    const [big, small] = RESPONSIVE_WIDTHS[suffix];
    const smBase = base.replace(new RegExp(`-${suffix}$`), `-${suffix}-sm`);
    const imagesrcset = `${smBase}.avif ${small}w, ${base}.avif ${big}w`;
    return `<link rel="preload" as="image" href="${base}.avif" imagesrcset="${imagesrcset}" imagesizes="100vw" type="image/avif">`;
  })();

  let html = shellTemplate
    .replace(/{{TITLE}}/g, esc(meta.title))
    .replace(/{{DESCRIPTION}}/g, esc(meta.description))
    .replace(/{{ROBOTS}}/g, meta.robots || 'index, follow')
    .replace(/{{CANONICAL}}/g, canonical)
    .replace(/{{OG_TYPE}}/g, meta.ogType || 'website')
    .replace(/{{OG_IMAGE}}/g, ogImage)
    .replace(/{{PRELOAD}}/g, preload)
    .replace(/{{SCHEMA}}/g, schemaBlocks.map(renderSchemaTag).join('\n'))
    .replace(/{{EXTRA_HEAD}}/g, meta.extraHead || '')
    .replace(/{{NAV}}/g, renderNav({ solid: !!meta.solidNav }))
    .replace(/{{BODY}}/g, fullBody)
    .replace(/{{FOOTER}}/g, renderFooter())
    .replace(/{{EXTRA_SCRIPTS}}/g, meta.extraScripts || '');

  return html;
}

function outputPathFor(url) {
  if (url === '/') return path.join(ROOT, 'index.html');
  if (url === '/404') return path.join(ROOT, '404.html'); // GitHub Pages looks for /404.html at repo root
  return path.join(ROOT, url.replace(/^\//, ''), 'index.html');
}

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

function main() {
  const pagesDir = path.join(__dirname, 'pages');
  const files = walk(pagesDir);
  let count = 0;
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const { meta, body } = parsePage(raw);
    const html = buildPage(meta, body);
    const outPath = outputPathFor(meta.url);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    count++;
    console.log(`built ${meta.url} -> ${path.relative(ROOT, outPath)}`);
  }
  console.log(`\n${count} pages built.`);
}

main();

module.exports = { websiteSchema, interiorDesignerSchema, breadcrumbSchema, faqSchema, serviceSchema, nap, nav, SITE_URL };
