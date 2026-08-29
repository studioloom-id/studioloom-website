# Studio Loom — studioloom.co.in

Static site, hosted on GitHub Pages via `CNAME`. No framework, no server — but
page content is authored once and stamped out to flat HTML by a small local
build script, so nav/footer/schema boilerplate isn't hand-copied across pages.

## Editing content

**Don't edit the generated `index.html`, `services/*/index.html`, etc. directly**
— those are build output and get overwritten. Edit the source instead:

- Page content + metadata: `src/pages/**/*.html` (JSON front matter block + body markup)
- Site-wide nav structure: `src/data/nav.json`
- Business details (NAP, hours, socials): `src/data/nap.json`
- Shared `<head>`/nav/footer skeleton: `src/partials/shell.html`
- Styles: `assets/css/main.css`
- Shared behavior (nav scroll, mobile menu, fade-up reveal): `assets/js/main.js`

Then rebuild:

```bash
npm install   # first time only
npm run build # regenerates every page + sitemap.xml from src/
```

## Images

Source photography lives outside the repo now (in `_originals/`, gitignored,
plus the original spec-package backup) — only processed WebP/JPEG derivatives
under `assets/images/` are committed. To reprocess or add new photography:

1. Add the source file and an entry to `scripts/image-manifest.json`
2. `npm run process-images` — generates hero/service-hero/full/grid/thumb/og
   sizes in both WebP and JPEG, under the Step 6 filename convention.

## Known follow-ups before this can be treated as fully launch-ready

- **Cost calculator pricing** (`assets/js/cost-calculator.js`) — every number
  in `PRICING_TABLE` is a placeholder extrapolated from a single confirmed
  data point. Needs business-owner sign-off before it's real published pricing.
- **Contact form** (`src/pages/contact.html`) — the form still posts to a
  placeholder Formspree-style URL (`TODO_REPLACE_WITH_REAL_FORM_ID`). Create a
  real form-backend account and swap in the real endpoint.
- **GA4 / Search Console** — scaffolded but commented out in
  `src/partials/shell.html` with `G-XXXXXXXXXX` placeholders. Fill in once
  those properties exist.
- **Logo** — only a raster PNG exists (decoded from the old site's base64
  embed). No vector source. Swap in an SVG if/when one exists.
- **Privacy Policy** (`src/pages/privacy-policy.html`) — standard boilerplate,
  not legal-reviewed.
- **Journal** — landing page is a stub; the 13 planned articles from the SEO
  spec package are not built yet.
