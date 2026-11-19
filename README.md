# TKJ.dev — website

Static company website in English (default, at `/`), Italian (`/it/`) and French (`/fr/`).
No dependencies: a single Node script (≥ 18) generates plain HTML/CSS/JS into `dist/`.

## Commands

```bash
npm run build   # generate dist/
npm run serve   # preview dist/ at http://localhost:4321
npm run dev     # build + serve
```

## Structure

| Path | Purpose |
|---|---|
| `site.config.mjs` | URL, contact email, form endpoint, legal info, privacy settings |
| `src/i18n/{en,it,fr}.mjs` | All page text. Keys must stay identical across languages (the build checks this). |
| `src/projects.mjs` | Portfolio entries. Each entry needs a `type`: `client`, `personal`, `demo` or `prototype`. |
| `build.mjs` | Page templates and generator (pages, 404s, `sitemap.xml`, `robots.txt`, `_headers`) |
| `static/assets/` | `styles.css`, `main.js`, `favicon.svg`, copied as-is |
| `scripts/serve.mjs` | Local preview server |

Pages: Home, Services, Projects, About, Process, Contact, Privacy Policy, plus a 404 page for each language.

## Design choices tied to the business plan

- **Portfolio honesty**: every project shows a type badge and the projects page explains what each type means. With no entries yet, the site says demos are being prepared. It never shows a fake placeholder project.
- **No invented content**: no testimonials, client logos, statistics or prices. Offers are listed as "on quote".
- **No cookies, no trackers, no third-party requests**: fonts (Bricolage Grotesque, JetBrains Mono, both SIL OFL) are self-hosted in `static/assets/fonts/`, and there is no analytics. No cookie banner is needed while this stays true. If analytics are added later, the privacy policy and consent setup must be updated.
- **Motion design** (`static/assets/main.js`, vanilla JS, no library): word-by-word title reveals, scroll reveals, an interactive dot field and an animated workflow diagram in the hero, a marquee that follows scroll speed and direction, a pinned horizontal "problems" section on desktop (native swipe on mobile), a process line that fills as you scroll, a statement whose words light up on scroll, magnetic buttons, a custom cursor (mouse only), a full-screen animated menu, and cross-page transitions (View Transitions API). Everything is disabled under `prefers-reduced-motion`, and the content stays visible without JavaScript.
- **Responsive**: breakpoints at 1200 / 1024 / 800 / 560 px, fluid type (`clamp`), and a burger menu below 1024 px.
- **Contact form**: has the fields listed in the plan (section 8.6), client-side validation, a honeypot plus a minimum fill time against spam, and a privacy acknowledgement. If `contact.formEndpoint` is set, the form POSTs to it (works as-is with Formspree, Basin, etc.). Otherwise it opens the visitor's email client with the request already filled in.
- **Security headers**: `dist/_headers` (Netlify / Cloudflare Pages format) sets a strict CSP, HSTS, nosniff and the referrer policy. The form endpoint origin is added automatically.

## Demos

- **CSV dashboard** (`/projects/csv-dashboard/`, script `static/assets/demo-csv.js`, sample data `static/demos/sample-sales.csv`, fictitious). Reads a CSV entirely in the browser, auto-detects separator, decimal mark, date format and columns, then shows KPIs, a monthly column chart, top categories, an import report and a data preview. Charts are hand-drawn SVG with tooltips (hover and keyboard focus) and a table view. The summary can be exported to CSV or printed.
- To add a demo: create its page in `build.mjs` (`PAGES` + a `pages.<key>` function), add its texts to the three dictionaries, and add a portfolio entry in `src/projects.mjs` with `type: 'demo'` and `page: '<key>'`.

## SEO & sharing

- `static/assets/og.png` (1200×630) is the image shown when a link is shared (LinkedIn, WhatsApp…).
- The home page includes structured data (JSON-LD): `ProfessionalService` (services, contact, languages, area served) and `FAQPage`.
- `sitemap.xml` and `hreflang` links are generated for every language.

## Before going live

The build lists the remaining items each time it runs. In particular:

1. **Legal info** (`legal.*` in `site.config.mjs`): only fill this in after the commercialista has validated the legal form. Italian law requires the Partita IVA on the website once the business is registered.
2. **Contact email**: set up the professional address on the tkj.dev domain.
3. **Form endpoint**: choose a provider, sign a data processing agreement with it, and mention it in the privacy policy (the "form-processing service" sentence appears automatically).
4. **Hosting provider**: name it in `privacy.hostingProvider`.
5. **Privacy policy**: the text is a starting draft based on what the site actually does (contact form + server logs, no cookies). Have it reviewed before publication, and update it whenever the site's data processing changes.
6. **Portfolio**: add two or three real demos to `src/projects.mjs`.
7. **Domain**: confirm `siteUrl` once tkj.dev is registered.

## Deploying

Upload `dist/` to any static host. Netlify and Cloudflare Pages read `_headers` and serve `404.html` automatically. For other hosts, set the equivalent headers and error page in their configuration.
