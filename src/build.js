// Studio Loom static site builder. Local authoring convenience only — GitHub Pages
// never runs this; the output committed to the repo is plain flat HTML/CSS/JS.
// Usage: npm run build
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SITE_URL = 'https://studioloom.co.in';

const nap = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'nap.json'), 'utf8'));
const nav = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'nav.json'), 'utf8'));
const shellTemplate = fs.readFileSync(path.join(__dirname, 'partials', 'shell.html'), 'utf8');

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Renders a footer social link as a real <a> once nap.json has a URL for it, or as
// plain (non-clickable) text meanwhile — never ships a placeholder/dead href.
// Inline SVG paths (Simple Icons, CC0) so social icons don't need an external
// icon-font/CDN request — consistent with the rest of the site's asset budget.
const ICONS = {
  houzz: '<path d="M1.27 0V24H9.32V16.44H14.68V24H22.73V10.37L6.61 5.75V0H1.27Z"/>',
  pinterest:
    '<path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>',
};

// Renders a footer social icon as a real <a> once nap.json has a URL for it, or as a
// dimmed (non-clickable) icon meanwhile — never ships a placeholder/dead href.
function socialIcon(label, url, pathSvg) {
  const svg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">${pathSvg}</svg>`;
  return url
    ? `<a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${esc(label)} (opens in a new tab)">${svg}</a>`
    : `<span class="footer-social-pending" aria-label="${esc(label)} — link coming soon">${svg}</span>`;
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
function renderFooter(opts = {}) {
  const cta = opts.noCta ? '' : `  <div class="footer-cta">
    <div class="footer-cta-text">
      <h2 class="footer-cta-title">Ready to <em>begin?</em></h2>
      <p class="footer-cta-copy">Every project starts with a structured consultation.</p>
    </div>
    <a class="btn-primary" href="/contact">Send a brief</a>
  </div>
`;
  return `<footer>
${cta}  <div class="footer-main">
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
          ${socialIcon('Houzz', nap.social.houzz, ICONS.houzz)}
          ${socialIcon('Pinterest', nap.social.pinterest, ICONS.pinterest)}
        </div>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <span class="footer-copy">&copy; ${nap.copyrightYear} Studio Loom. All rights reserved.</span>
    <a class="footer-legal-link" href="/privacy-policy">Privacy Policy</a>
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
  // Only confirmed, real profile URLs belong in sameAs — a placeholder would be
  // inaccurate structured data, worse than omitting the field entirely.
  const sameAs = [nap.social.houzz, nap.social.pinterest, nap.social.gbp].filter(Boolean);
  const schema = {
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
  };
  if (sameAs.length) schema.sameAs = sameAs;
  return schema;
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
    <h2 class="section-title">Frequently <em>asked.</em></h2>
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
    <h2 class="section-title">Frequently <em>asked.</em></h2>
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

// Fingerprint local CSS/JS URLs (?v=<content hash>) so a changed file is never served from a
// visitor's cache (GitHub Pages sends max-age=600) against newer HTML.
const assetVersions = {};
function versionAssets(html) {
  return html.replace(/(["'])(\/assets\/(?:css|js)\/[\w.-]+\.(?:css|js))\1/g, (m, q, url) => {
    if (!assetVersions[url]) {
      const file = path.join(__dirname, '..', url);
      assetVersions[url] = fs.existsSync(file)
        ? crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 8)
        : '';
    }
    return assetVersions[url] ? `${q}${url}?v=${assetVersions[url]}${q}` : m;
  });
}

// Line icons for the "included" grids on service pages: write <i data-i="name"></i> in a page.
const INCLUDED_ICONS = {"chat": "M4 5h16v11H9l-5 4z", "plan": "M4 4h16v16H4z M4 11h8 M12 4v16 M12 15h8", "pencil": "M4 20l1-5L16 4l4 4L9 19z M14 6l4 4", "swatch": "M12 3l9 5-9 5-9-5z M3 12l9 5 9-5 M3 16l9 5 9-5", "chair": "M7 4h10v7H7z M5 11h14v4H5z M7 15v5 M17 15v5", "bulb": "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z", "drawings": "M5 3h10l4 4v14H5z M15 3v4h4 M8 12h8 M8 16h8", "box": "M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10", "site": "M4 21h16 M6 21V9h7v12 M13 21V5h5v16 M9 12h1 M9 15h1 M15 9h1 M15 13h1", "key": "M8 14a4 4 0 1 1 3.5-6H21v3h-2v2h-3v-2h-4.5A4 4 0 0 1 8 14z", "frame": "M4 5h16v14H4z M7 16l3.5-4 3 3 2-2 2.5 3", "textile": "M3 8c3-2 6 2 9 0s6 2 9 0 M3 13c3-2 6 2 9 0s6 2 9 0 M3 18c3-2 6 2 9 0s6 2 9 0", "eye": "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "sliders": "M4 7h10 M18 7h2 M4 17h2 M10 17h10 M14 4v6 M6 14v6", "sparkle": "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z", "home": "M3 11l9-7 9 7 M5 10v10h14V10 M10 20v-6h4v6", "refresh": "M20 12a8 8 0 1 1-2.5-5.8 M20 4v5h-5", "camera": "M3 8h4l2-3h6l2 3h4v12H3z M12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"};
function renderIcons(html) {
  return html.replace(/<i data-i="([a-z]+)"><\/i>/g, (m, name) =>
    INCLUDED_ICONS[name]
      ? `<span class="included-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${INCLUDED_ICONS[name]}"/></svg></span>`
      : m);
}

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
    .replace(/{{FOOTER}}/g, renderFooter({ noCta: ['/contact','/404','/privacy-policy'].includes(meta.url) }))
    .replace(/{{EXTRA_SCRIPTS}}/g, meta.extraScripts || '');

  return versionAssets(renderIcons(html));
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
