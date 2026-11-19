// Static site generator for TKJ.dev — zero dependencies.
// Usage: node build.mjs   → writes the site to ./dist

import { mkdir, rm, writeFile, cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import config from './site.config.mjs';
import projects from './src/projects.mjs';
import en from './src/i18n/en.mjs';
import it from './src/i18n/it.mjs';
import fr from './src/i18n/fr.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const DICTS = { en, it, fr };
const DEFAULT_LANG = config.languages[0];
const PROJECT_TYPES = ['client', 'internship', 'personal', 'demo', 'prototype', 'academic'];

const PAGES = [
  { key: 'home', path: '' },
  { key: 'services', path: 'services/' },
  { key: 'projects', path: 'projects/' },
  { key: 'about', path: 'about/' },
  { key: 'process', path: 'process/' },
  { key: 'contact', path: 'contact/' },
  { key: 'privacy', path: 'privacy/' },
  { key: 'demo', path: 'projects/csv-dashboard/' },
];
const NAV = ['services', 'projects', 'about', 'process', 'contact'];

// ---------- helpers ----------

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
const url = (lang, path = '') => (lang === DEFAULT_LANG ? `/${path}` : `/${lang}/${path}`);
const pageUrl = (lang, key) => url(lang, PAGES.find((p) => p.key === key).path);
const isTodo = (v) => !v || /TODO/.test(String(v));
const telHref = () => `tel:${config.contact.phoneIntl}`;
const waHref = () => `https://wa.me/${config.contact.whatsapp}`;
const pad = (n) => String(n).padStart(2, '0');
const map = (arr, fn) => arr.map(fn).join('');

const ICONS = {
  software: '<path d="M8 9l-3 3 3 3M16 9l3 3-3 3M13.5 6l-3 12"/>',
  ai: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15z"/>',
  automation: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H15a3 3 0 013 3v6.5M15.5 18H9a3 3 0 01-3-3V8.5"/>',
  data: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUpRight: '<path d="M7 17L17 7M8 7h9v9"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>',
  whatsapp: '<path d="M3 21l1.65-4.8A9 9 0 1112 21a8.9 8.9 0 01-4.2-1.05L3 21z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 01-1.8-1.8l.8-1-1-2L9 9.5z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
};
const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const logo = () =>
  `<span class="logo"><span class="logo-mark" aria-hidden="true"><i></i><i></i><i></i></span><span class="logo-text">TKJ<b>.dev</b></span></span>`;

const kicker = (num, label) => `<p class="kicker"><span class="kicker-num">${esc(num)}</span><span class="kicker-line" aria-hidden="true"></span>${esc(label)}</p>`;

const btn = (href, label, variant = 'primary', extra = '') =>
  `<a class="btn btn-${variant}" href="${href}" data-magnetic ${extra}><span class="btn-label" data-text="${esc(label)}"><span>${esc(label)}</span></span><span class="btn-icon">${icon('arrowUpRight', 'icon')}</span></a>`;

// Hero illustration: an automated workflow. Pulses travel along the connectors (SVG SMIL).
function diagram(caption) {
  const nodes = [
    { id: 'api', label: 'API', x: 96, y: 84 },
    { id: 'crm', label: 'CRM', x: 424, y: 84 },
    { id: 'mail', label: 'Email', x: 52, y: 226 },
    { id: 'erp', label: 'ERP', x: 468, y: 226 },
    { id: 'sheet', label: 'Sheets', x: 112, y: 362 },
    { id: 'dash', label: 'Dashboard', x: 408, y: 362 },
  ];
  const hub = { x: 260, y: 224 };
  const paths = nodes
    .map((n, i) => {
      const cx = (n.x + hub.x) / 2 + (i % 2 ? -30 : 30);
      const cy = (n.y + hub.y) / 2 + (n.y < hub.y ? 30 : -30);
      return `<path id="dp-${n.id}" class="dg-link" d="M${n.x} ${n.y} Q${cx} ${cy} ${hub.x} ${hub.y}"/>`;
    })
    .join('');
  const pulses = nodes
    .map((n, i) => {
      const reverse = i % 3 === 2;
      const dur = (2.2 + (i % 3) * 0.6).toFixed(1);
      const begin = (i * 0.45).toFixed(2);
      const kp = reverse ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : '';
      return `<circle class="dg-pulse${reverse ? ' dg-pulse-out' : ''}" r="4"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite"${kp}><mpath href="#dp-${n.id}"/></animateMotion></circle>`;
    })
    .join('');
  const boxes = nodes
    .map((n, i) => {
      const w = n.label.length * 9 + 34;
      return `<g class="dg-node" transform="translate(${n.x - w / 2} ${n.y - 17})"><rect width="${w}" height="34" rx="17"/><circle class="dg-dot" cx="15" cy="17" r="3.5"/><text x="26" y="21.5">${n.label}</text></g>`;
    })
    .join('');
  return `
                <figure class="hero-visual" data-reveal="fade" data-diagram>
                    <svg class="diagram" viewBox="0 0 520 440" role="img" aria-label="${esc(caption)}">
                        <defs>
                            <radialGradient id="dg-glow"><stop offset="0" stop-color="#22D3EE" stop-opacity=".55"/><stop offset="1" stop-color="#22D3EE" stop-opacity="0"/></radialGradient>
                            <linearGradient id="dg-core" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3B82F6"/><stop offset="1" stop-color="#22D3EE"/></linearGradient>
                        </defs>
                        <circle cx="${hub.x}" cy="${hub.y}" r="120" fill="url(#dg-glow)" class="dg-glow"/>
                        ${paths}
                        ${pulses}
                        <g class="dg-hub">
                            <circle class="dg-ring dg-ring-1" cx="${hub.x}" cy="${hub.y}" r="62"/>
                            <circle class="dg-ring dg-ring-2" cx="${hub.x}" cy="${hub.y}" r="78"/>
                            <circle cx="${hub.x}" cy="${hub.y}" r="44" fill="url(#dg-core)"/>
                            <text class="dg-hub-label" x="${hub.x}" y="${hub.y + 7}" text-anchor="middle">AI</text>
                        </g>
                        ${boxes}
                    </svg>
                    <figcaption>${esc(caption)}</figcaption>
                </figure>`;
}

// ---------- structured data (JSON-LD, not executed: allowed by the CSP) ----------

function structuredData(t, lang) {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: config.brand.name,
    slogan: config.brand.signature,
    description: t.meta.home.description,
    url: config.siteUrl + url(lang),
    logo: `${config.siteUrl}/assets/og.png`,
    image: `${config.siteUrl}/assets/og.png`,
    email: config.contact.email,
    ...(config.contact.phoneIntl ? { telephone: config.contact.phoneIntl } : {}),
    address: { '@type': 'PostalAddress', addressCountry: 'IT' },
    areaServed: [{ '@type': 'Country', name: 'Italy' }, { '@type': 'Place', name: 'Europe' }],
    knowsLanguage: config.languages,
    inLanguage: lang,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: t.services.title,
      itemListElement: t.services.domains.map((d) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: d.title, description: d.summary },
      })),
    },
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: t.faq.items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json(org)}</script>
    <script type="application/ld+json">${json(faq)}</script>`;
}

// ---------- layout ----------

function layout({ t, lang, key, path, body, noindex = false, scripts = [] }) {
  const meta = t.meta[key];
  const canonical = config.siteUrl + url(lang, path);
  const alternates = config.languages
    .map((l) => `<link rel="alternate" hreflang="${l}" href="${config.siteUrl + url(l, path)}">`)
    .join('\n    ');

  const navLinks = map(NAV.filter((k) => k !== 'contact'), (k) => {
    const current = k === key ? ' aria-current="page"' : '';
    return `<li><a class="nav-link" href="${pageUrl(lang, k)}"${current}><span data-text="${esc(t.nav[k])}"><span>${esc(t.nav[k])}</span></span></a></li>`;
  });

  const langSwitch = (cls = '') =>
    `<div class="lang ${cls}" role="group" aria-label="${esc(t.common.language)}">${map(config.languages, (l) => {
      const current = l === lang ? ' aria-current="true"' : '';
      return `<a href="${url(l, path)}" hreflang="${l}" lang="${l}"${current} title="${esc(DICTS[l].label)}">${l.toUpperCase()}</a>`;
    })}</div>`;

  const menuLinks = map(['home', ...NAV], (k, i) => {
    const current = k === key ? ' aria-current="page"' : '';
    return `<li><a href="${pageUrl(lang, k)}"${current}><span class="menu-num">${pad(i + 1)}</span><span class="menu-label">${esc(t.nav[k])}</span></a></li>`;
  });

  const legalLines = [];
  if (!isTodo(config.legal.legalName)) legalLines.push(esc(config.legal.legalName));
  if (!isTodo(config.legal.address)) legalLines.push(esc(config.legal.address));
  if (!isTodo(config.legal.vatNumber)) legalLines.push(`${esc(t.common.vat)} ${esc(config.legal.vatNumber)}`);
  if (config.legal.rea) legalLines.push(`${esc(t.common.rea)} ${esc(config.legal.rea)}`);
  if (config.legal.pec) legalLines.push(`${esc(t.common.pec)} ${esc(config.legal.pec)}`);

  return `<!doctype html>
<html lang="${lang}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>${esc(meta.title)}</title>
    <meta name="description" content="${esc(meta.description)}">
    ${noindex ? '<meta name="robots" content="noindex">' : ''}
    <link rel="canonical" href="${canonical}">
    ${alternates}
    <link rel="alternate" hreflang="x-default" href="${config.siteUrl + url(DEFAULT_LANG, path)}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${esc(config.brand.name)}">
    <meta property="og:title" content="${esc(meta.title)}">
    <meta property="og:description" content="${esc(meta.description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:locale" content="${t.locale}">
    <meta property="og:image" content="${config.siteUrl}/assets/og.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${esc(config.brand.name)} — ${esc(config.brand.signature)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#0B111D">
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
    <link rel="preload" href="/assets/fonts/bricolage-grotesque-latin-standard-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/assets/styles.css">
    <script src="/assets/boot.js"></script>
    <script src="/assets/main.js" defer></script>
    ${scripts.map((src) => `<script src="${src}" defer></script>`).join('\n    ')}
    ${key === 'home' ? structuredData(t, lang) : ''}
</head>
<body class="page-${key}">
    <a class="skip-link" href="#main">${esc(t.common.skip)}</a>
    <div class="progress" aria-hidden="true" data-progress></div>

    <header class="hdr" data-header>
        <div class="wrap hdr-inner">
            <a href="${url(lang)}" class="brand" aria-label="${esc(config.brand.name)} — ${esc(t.nav.home)}">${logo()}</a>
            <nav class="hdr-nav" aria-label="${esc(t.common.footerNav)}">
                <ul>${navLinks}</ul>
            </nav>
            <div class="hdr-right">
                ${langSwitch('lang-hdr')}
                <a class="btn btn-small btn-primary hdr-cta" href="${pageUrl(lang, 'contact')}"${key === 'contact' ? ' aria-current="page"' : ''} data-magnetic><span class="btn-label" data-text="${esc(t.nav.contact)}"><span>${esc(t.nav.contact)}</span></span></a>
                <button class="burger" type="button" aria-expanded="false" aria-controls="menu" data-menu-toggle>
                    <span class="burger-lines" aria-hidden="true"><i></i><i></i></span>
                    <span class="burger-text" data-open="${esc(t.common.menu)}" data-close="${esc(t.common.close)}">${esc(t.common.menu)}</span>
                </button>
            </div>
        </div>
    </header>

    <div class="menu" id="menu" data-menu inert>
        <div class="menu-bg" aria-hidden="true"></div>
        <div class="wrap menu-inner">
            <nav aria-label="${esc(t.common.menu)}">
                <ul class="menu-list">${menuLinks}</ul>
            </nav>
            <div class="menu-foot">
                <div class="menu-contacts">
                    <a class="menu-mail" href="mailto:${esc(config.contact.email)}">${esc(config.contact.email)}</a>
                    ${config.contact.whatsapp ? `<a class="menu-mail" href="${waHref()}" rel="noopener">${icon('whatsapp', 'icon icon-inline')} ${esc(config.contact.phone)}</a>` : ''}
                </div>
                ${langSwitch('lang-menu')}
            </div>
        </div>
    </div>

    <main id="main">
${body}
    </main>

    <footer class="ftr">
        <div class="wrap">
            <div class="ftr-grid">
                <div class="ftr-brand">
                    <p class="ftr-tagline">${esc(t.common.footerTagline)}</p>
                    <p class="ftr-signature">${esc(config.brand.signature)}</p>
                </div>
                <div>
                    <h2 class="ftr-title">${esc(t.common.footerNav)}</h2>
                    <ul class="ftr-list">${map(['home', ...NAV], (k) => `<li><a href="${pageUrl(lang, k)}">${esc(t.nav[k])}</a></li>`)}</ul>
                </div>
                <div>
                    <h2 class="ftr-title">${esc(t.common.footerContact)}</h2>
                    <ul class="ftr-list">
                        <li><a href="mailto:${esc(config.contact.email)}">${esc(config.contact.email)}</a></li>
                        ${config.contact.phone ? `<li><a href="${telHref()}">${esc(config.contact.phone)}</a></li>` : ''}
                        ${config.contact.whatsapp ? `<li><a href="${waHref()}" rel="noopener">${esc(t.common.whatsapp)}</a></li>` : ''}
                        <li>${esc(t.common.basedIn)}</li>
                    </ul>
                </div>
                <div>
                    <h2 class="ftr-title">${esc(t.common.footerLegal)}</h2>
                    <ul class="ftr-list">
                        ${map(legalLines, (l) => `<li>${l}</li>`)}
                        <li><a href="${pageUrl(lang, 'privacy')}">${esc(t.nav.privacy)}</a></li>
                    </ul>
                </div>
            </div>
            <div class="ftr-bottom">
                <p>© ${new Date().getFullYear()} ${esc(config.brand.name)} — ${esc(t.common.rights)}</p>
                ${langSwitch('lang-ftr')}
                <button type="button" class="to-top" data-to-top aria-label="↑">↑</button>
            </div>
        </div>
        <div class="ftr-word" aria-hidden="true" data-reveal="rise"><span>TKJ</span><span class="ftr-word-tld">.dev</span></div>
    </footer>
    ${key !== 'contact' && config.contact.whatsapp ? `<a class="wa-float" href="${waHref()}" rel="noopener" aria-label="${esc(t.contact.whatsappLabel)}" data-wa-float>${icon('whatsapp', 'icon')}<span class="wa-float-label">WhatsApp</span></a>` : ''}
</body>
</html>
`;
}

// ---------- shared blocks ----------

const pageHero = (num, label, title, lead) => `
        <section class="phero">
            <div class="phero-grid" aria-hidden="true"></div>
            <div class="wrap">
                ${kicker(num, label)}
                <h1 class="display" data-split>${esc(title)}</h1>
                <p class="phero-lead" data-reveal>${esc(lead)}</p>
            </div>
        </section>`;

const marquee = (items, cls = '') => {
  const row = map(items, (i) => `<span>${esc(i)}</span><span class="mq-sep" aria-hidden="true">✦</span>`);
  return `
        <div class="marquee ${cls}" aria-hidden="true" data-marquee>
            <div class="mq-track"><div class="mq-group">${row}</div><div class="mq-group">${row}</div></div>
        </div>`;
};

const cta = (t, lang) => `
        <section class="cta">
            <div class="wrap">
                ${kicker('→', t.nav.contact)}
                <a class="cta-big" href="${pageUrl(lang, 'contact')}" data-cursor="link">
                    <span class="cta-text" data-split>${esc(t.home.ctaBig)}</span>
                    <span class="cta-arrow">${icon('arrowUpRight', 'icon')}</span>
                </a>
                <div class="cta-row" data-reveal>
                    <div>
                        <h2 class="cta-title">${esc(t.home.ctaTitle)}</h2>
                        <p>${esc(t.home.ctaLead)}</p>
                    </div>
                    ${btn(pageUrl(lang, 'contact'), t.common.ctaPrimary, 'light')}
                </div>
            </div>
        </section>`;

function projectCard(p, t, lang) {
  const links = [];
  if (p.page) links.push(`<a class="pj-main" href="${pageUrl(lang, p.page)}">${esc(t.projects.openDemo)} ${icon('arrowUpRight', 'icon icon-inline')}</a>`);
  if (p.url) links.push(`<a href="${esc(p.url)}" rel="noopener">${esc(t.projects.live)} ${icon('arrowUpRight', 'icon icon-inline')}</a>`);
  if (p.repo) links.push(`<a href="${esc(p.repo)}" rel="noopener">${esc(t.projects.source)} ${icon('arrowUpRight', 'icon icon-inline')}</a>`);
  return `
                <article class="pj" data-type="${p.type}" data-reveal>
                    <div class="pj-meta">
                        <span class="badge badge-${p.type}">${esc(t.projects.types[p.type])}</span>
                        ${p.year ? `<span class="pj-year">${esc(p.year)}</span>` : ''}
                    </div>
                    <h3>${esc(p.title[lang] ?? p.title[DEFAULT_LANG])}</h3>
                    <p>${esc(p.summary[lang] ?? p.summary[DEFAULT_LANG])}</p>
                    ${p.stack?.length ? `<ul class="tags">${map(p.stack, (s) => `<li>${esc(s)}</li>`)}</ul>` : ''}
                    ${links.length ? `<div class="pj-links">${links.join('')}</div>` : ''}
                </article>`;
}

const projectsEmpty = (t, lang) => `
            <div class="lab" data-reveal>
                <div class="lab-screen" aria-hidden="true">
                    <div class="lab-bar"><i></i><i></i><i></i><span>~/tkj.dev/lab</span></div>
                    <pre class="lab-code" data-typer><span class="c-muted">$</span> build --demo web-app<br><span class="c-muted">$</span> build --demo automation<br><span class="c-muted">$</span> build --demo ai-assistant</pre>
                    <div class="lab-progress"><span></span></div>
                </div>
                <div class="lab-copy">
                    <h3>${esc(t.projects.emptyTitle)}</h3>
                    <p>${esc(t.projects.emptyText)}</p>
                    ${btn(pageUrl(lang, 'contact'), t.common.ctaPrimary, 'dark')}
                </div>
            </div>`;

const nextCard = (t) => `
                <article class="pj pj-next" data-reveal>
                    <div class="pj-meta"><span class="badge badge-demo">${esc(t.projects.types.demo)}</span><span class="pj-year">…</span></div>
                    <h3>${esc(t.projects.nextTitle)}</h3>
                    <p>${esc(t.projects.nextText)}</p>
                    <div class="lab-progress" aria-hidden="true"><span></span></div>
                </article>`;

const faqSection = (t) => `
        <section class="sec sec-light faq-sec">
            <div class="wrap split">
                <div class="split-aside">
                    ${kicker('05', t.faq.title)}
                    <h2 class="h-xl" data-split>${esc(t.faq.title)}</h2>
                    <p class="sec-lead" data-reveal>${esc(t.faq.lead)}</p>
                </div>
                <div class="faq">
                    ${map(
                      t.faq.items,
                      (f, i) => `
                    <details class="faq-item" data-reveal>
                        <summary><span class="faq-num">${pad(i + 1)}</span><span class="faq-q">${esc(f.q)}</span><span class="faq-icon" aria-hidden="true"></span></summary>
                        <div class="faq-a"><p>${esc(f.a)}</p></div>
                    </details>`
                    )}
                </div>
            </div>
        </section>`;

const legend = (t) => `
                <div class="legend" data-reveal>
                    <p class="legend-title">${esc(t.projects.legendTitle)}</p>
                    <dl>${map(PROJECT_TYPES, (ty) => `<div><dt><span class="badge badge-${ty}">${esc(t.projects.types[ty])}</span></dt><dd>${esc(t.projects.legend[ty])}</dd></div>`)}</dl>
                </div>`;

// ---------- pages ----------

const pages = {
  home(t, lang) {
    const h = t.home;
    const featured = projects.slice(0, 3);
    return `
        <section class="hero" data-hero>
            <canvas class="hero-canvas" data-dots aria-hidden="true"></canvas>
            <div class="wrap hero-grid">
                <div class="hero-copy">
                    ${kicker('TKJ', h.eyebrow)}
                    <h1 class="display hero-title" data-split>${esc(h.title)}</h1>
                    <p class="hero-lead" data-reveal>${esc(h.lead)}</p>
                    <div class="hero-actions" data-reveal>
                        ${btn(pageUrl(lang, 'contact'), t.common.ctaPrimary, 'primary')}
                        ${btn(pageUrl(lang, 'services'), t.common.ctaServices, 'ghost')}
                    </div>
                </div>
                ${diagram(h.diagramCaption)}
            </div>
            <div class="wrap hero-foot" data-reveal="fade">
                <ul class="pillars">${map(h.pillars, (p, i) => `<li><span>${pad(i + 1)}</span>${esc(p)}</li>`)}</ul>
                <a class="scroll-hint" href="#services"><span>${esc(h.scroll)}</span><i aria-hidden="true"></i></a>
            </div>
        </section>
${marquee(h.marquee)}
        <section class="sec sec-light" id="services">
            <div class="wrap">
                <div class="sec-head">
                    ${kicker('01', t.nav.services)}
                    <h2 class="h-xl" data-split>${esc(h.servicesTitle)}</h2>
                    <p class="sec-lead" data-reveal>${esc(h.servicesLead)}</p>
                </div>
                <ol class="svc-list">
                    ${map(
                      t.services.domains,
                      (d, i) => `
                    <li data-reveal>
                        <a class="svc-row" href="${pageUrl(lang, 'services')}#${d.id}" data-cursor="link">
                            <span class="svc-num">${pad(i + 1)}</span>
                            <span class="svc-icon">${icon(d.id)}</span>
                            <span class="svc-title">${esc(d.title)}</span>
                            <span class="svc-summary">${esc(d.summary)}</span>
                            <span class="svc-tags">${map(d.items.slice(0, 3), (x) => `<span>${esc(x)}</span>`)}</span>
                            <span class="svc-arrow">${icon('arrowUpRight', 'icon')}</span>
                        </a>
                    </li>`
                    )}
                </ol>
            </div>
        </section>

        <section class="hs" data-hscroll>
            <div class="hs-sticky">
                <div class="wrap hs-head">
                    <div>
                        ${kicker('02', h.problemsTitle)}
                        <h2 class="h-xl" data-split>${esc(h.problemsLead)}</h2>
                    </div>
                    <p class="hs-count" aria-hidden="true"><span data-hs-current>01</span> / ${pad(h.problems.length)}</p>
                </div>
                <div class="hs-viewport">
                    <div class="hs-track" data-hs-track>
                        ${map(
                          h.problems,
                          (p, i) => `
                        <article class="pcard">
                            <span class="pcard-num">${pad(i + 1)}</span>
                            <div class="pcard-before">
                                <p class="pcard-label">${esc(h.beforeLabel)}</p>
                                <h3>${esc(p.t)}</h3>
                                <p>${esc(p.d)}</p>
                            </div>
                            <div class="pcard-after">
                                <p class="pcard-label">${icon('arrow', 'icon icon-inline')} ${esc(h.afterLabel)}</p>
                                <p class="pcard-fix">${esc(h.fixes[i])}</p>
                            </div>
                        </article>`
                        )}
                    </div>
                </div>
                <div class="wrap hs-bar" aria-hidden="true"><span data-hs-bar></span></div>
            </div>
        </section>

        <section class="sec sec-dark">
            <div class="wrap split">
                <div class="split-aside">
                    ${kicker('03', t.nav.process)}
                    <h2 class="h-xl" data-split>${esc(h.processTitle)}</h2>
                    <p class="sec-lead" data-reveal>${esc(h.processLead)}</p>
                    <p data-reveal>${btn(pageUrl(lang, 'process'), t.common.fullProcess, 'ghost')}</p>
                </div>
                <div class="flow" data-progress-line>
                    <span class="flow-line" aria-hidden="true"><span></span></span>
                    <ol class="flow-list">
                    ${map(
                      h.processShort,
                      (s, i) => `
                    <li class="flow-step" data-reveal data-step>
                        <span class="flow-num">${pad(i + 1)}</span>
                        <h3>${esc(s.t)}</h3>
                        <p>${esc(s.d)}</p>
                    </li>`
                    )}
                    </ol>
                </div>
            </div>
        </section>

        <section class="sec sec-light">
            <div class="wrap">
                <div class="sec-head">
                    ${kicker('04', t.nav.projects)}
                    <h2 class="h-xl" data-split>${esc(h.projectsTitle)}</h2>
                    <p class="sec-lead" data-reveal>${esc(h.projectsLead)}</p>
                </div>
                ${
                  featured.length
                    ? `<div class="pj-grid">${map(featured, (p) => projectCard(p, t, lang))}${featured.length < 3 ? nextCard(t) : ''}</div>
                <p class="sec-more" data-reveal>${btn(pageUrl(lang, 'projects'), t.common.allProjects, 'dark')}</p>`
                    : projectsEmpty(t, lang)
                }
            </div>
        </section>
${faqSection(t)}
${cta(t, lang)}`;
  },

  services(t, lang) {
    const s = t.services;
    return `${pageHero('01', t.nav.services, s.title, s.lead)}
${marquee(s.domains.map((d) => d.title), 'marquee-small')}
        <section class="sec sec-light">
            <div class="wrap">
                ${map(
                  s.domains,
                  (d, i) => `
                <article class="domain" id="${d.id}">
                    <div class="domain-aside">
                        <span class="domain-num">${pad(i + 1)}</span>
                        <span class="domain-icon">${icon(d.id)}</span>
                    </div>
                    <div class="domain-body">
                        <h2 class="h-lg" data-split>${esc(d.title)}</h2>
                        <p class="sec-lead" data-reveal>${esc(d.summary)}</p>
                        <ul class="rows">
                            ${map(d.items, (x, j) => `<li data-reveal><span class="rows-num">${pad(j + 1)}</span>${esc(x)}</li>`)}
                        </ul>
                        <p class="domain-for" data-reveal><span>→</span> ${esc(d.for)}</p>
                    </div>
                </article>`
                )}
            </div>
        </section>

        <section class="sec sec-dark">
            <div class="wrap">
                <div class="sec-head">
                    ${kicker('02', s.offersTitle)}
                    <h2 class="h-xl" data-split>${esc(s.offersTitle)}</h2>
                    <p class="sec-lead" data-reveal>${esc(s.offersLead)}</p>
                </div>
                <ul class="offers">
                    ${map(
                      s.offers,
                      (o, i) => `
                    <li class="offer" data-reveal>
                        <span class="offer-num">${pad(i + 1)}</span>
                        <h3>${esc(o.name)}</h3>
                        <p>${esc(o.d)}</p>
                        <span class="offer-price">${esc(s.onQuote)}</span>
                    </li>`
                    )}
                </ul>
                <div class="quote" data-reveal>
                    <div>
                        <h3 class="h-md">${esc(s.quoteTitle)}</h3>
                        <ol class="quote-list">${map(s.quoteItems, (x) => `<li>${esc(x)}</li>`)}</ol>
                    </div>
                    <p class="quote-note">${esc(s.paymentNote)}</p>
                </div>
            </div>
        </section>
${cta(t, lang)}`;
  },

  projects(t, lang) {
    const p = t.projects;
    const typesPresent = PROJECT_TYPES.filter((ty) => projects.some((pr) => pr.type === ty));
    const filters = projects.length
      ? `<div class="filters" role="group" aria-label="${esc(p.filterLabel)}" data-filters>
                    <button type="button" class="chip" aria-pressed="true" data-filter="all">${esc(p.filterAll)}</button>
                    ${map(typesPresent, (ty) => `<button type="button" class="chip" aria-pressed="false" data-filter="${ty}">${esc(p.typesPlural[ty])}</button>`)}
                </div>`
      : '';
    return `${pageHero('02', t.nav.projects, p.title, p.lead)}
        <section class="sec sec-light">
            <div class="wrap">
                ${legend(t)}
                ${filters}
                ${
                  projects.length
                    ? `<div class="pj-grid" data-project-grid>${map(projects, (pr) => projectCard(pr, t, lang))}${nextCard(t)}</div>
                <p class="empty-filter" hidden data-empty-filter>${esc(p.noneOfType)}</p>`
                    : projectsEmpty(t, lang)
                }
            </div>
        </section>
${cta(t, lang)}`;
  },

  about(t, lang) {
    const a = t.about;
    return `${pageHero('03', t.nav.about, a.title, a.lead)}
        <section class="sec sec-light">
            <div class="wrap">
                <p class="statement" data-scrub>${esc(a.mission)}</p>
                <div class="about-cols">
                    ${map(a.paragraphs, (p) => `<p data-reveal>${esc(p)}</p>`)}
                </div>
                <div class="founder-card" data-reveal>
                    <div class="founder-avatar" aria-hidden="true">JT</div>
                    <div class="founder-body">
                        <p class="aside-title">${esc(a.founderTitle)}</p>
                        <p>${esc(a.founderText)}</p>
                    </div>
                    ${btn(a.founderUrl, a.founderLink, 'dark', 'rel="noopener"')}
                </div>
            </div>
        </section>

        <section class="sec sec-dark">
            <div class="wrap">
                <div class="vm">
                    <div class="vm-item" data-reveal>
                        ${kicker('V', a.visionTitle)}
                        <p>${esc(a.vision)}</p>
                    </div>
                    <div class="vm-item" data-reveal>
                        ${kicker('M', a.missionTitle)}
                        <p>${esc(a.mission)}</p>
                    </div>
                </div>
                <div class="sec-head sec-head-spaced">
                    ${kicker('01', a.valuesTitle)}
                    <h2 class="h-xl" data-split>${esc(a.valuesTitle)}</h2>
                </div>
                <ol class="values">
                    ${map(
                      a.values,
                      (v, i) => `
                    <li data-reveal>
                        <span class="values-num">${pad(i + 1)}</span>
                        <h3>${esc(v.t)}</h3>
                        <p>${esc(v.d)}</p>
                    </li>`
                    )}
                </ol>
            </div>
        </section>

        <section class="sec sec-light">
            <div class="wrap split">
                <div class="split-aside">
                    ${kicker('02', a.diffTitle)}
                    <h2 class="h-xl" data-split>${esc(a.diffTitle)}</h2>
                </div>
                <ul class="rows rows-large">
                    ${map(a.diff, (d, j) => `<li data-reveal><span class="rows-num">${pad(j + 1)}</span>${esc(d)}</li>`)}
                </ul>
            </div>
        </section>
${cta(t, lang)}`;
  },

  process(t, lang) {
    const p = t.process;
    return `${pageHero('04', t.nav.process, p.title, p.lead)}
        <section class="sec sec-light">
            <div class="wrap">
                <div class="flow flow-large" data-progress-line>
                    <span class="flow-line" aria-hidden="true"><span></span></span>
                    <ol class="flow-list">
                    ${map(
                      p.steps,
                      (s, i) => `
                    <li class="flow-step" data-reveal data-step>
                        <span class="flow-num">${pad(i + 1)}</span>
                        <h2 class="h-md">${esc(s.t)}</h2>
                        <p>${esc(s.d)}</p>
                    </li>`
                    )}
                    </ol>
                </div>
            </div>
        </section>

        <section class="sec sec-dark">
            <div class="wrap split">
                <div class="split-aside">
                    ${kicker('✓', p.commitmentsTitle)}
                    <h2 class="h-xl" data-split>${esc(p.commitmentsTitle)}</h2>
                </div>
                <ul class="rows rows-large rows-dark">
                    ${map(p.commitments, (c, j) => `<li data-reveal><span class="rows-num">${pad(j + 1)}</span>${esc(c)}</li>`)}
                </ul>
            </div>
        </section>
${cta(t, lang)}`;
  },

  contact(t, lang) {
    const c = t.contact;
    const f = c.fields;
    const opt = `<span class="optional">${esc(c.optional)}</span>`;
    const chips = (name, obj, required = false) =>
      `<div class="chips">${map(
        Object.entries(obj),
        ([v, l], i) =>
          `<label class="chip-radio"><input type="radio" name="${name}" value="${esc(v)}"${required && i === 0 ? ' required' : ''}><span>${esc(l)}</span></label>`
      )}</div>`;
    const i18n = {
      errors: c.errors,
      invalid: c.invalid,
      sending: c.sending,
      submit: c.submit,
      success: c.success,
      error: c.error,
      mailtoNotice: c.mailtoNotice,
      mailSubject: c.mailSubject,
      labels: f,
    };
    return `
        <section class="phero phero-contact">
            <div class="phero-grid" aria-hidden="true"></div>
            <div class="wrap">
                ${kicker('05', t.nav.contact)}
                <h1 class="display" data-split>${esc(c.title)}</h1>
                <p class="phero-lead" data-reveal>${esc(c.lead)}</p>
            </div>
        </section>
        <section class="sec sec-light">
            <div class="wrap contact">
                <form class="form" novalidate data-contact-form
                      data-endpoint="${esc(config.contact.formEndpoint)}"
                      data-email="${esc(config.contact.email)}">
                    <fieldset class="field field-group" data-reveal data-group="service">
                        <legend><span class="field-num">01</span>${esc(f.service)}</legend>
                        ${chips('service', c.serviceOptions, true)}
                    </fieldset>
                    <div class="form-row" data-reveal>
                        <div class="field">
                            <label for="cf-name"><span class="field-num">02</span>${esc(f.name)}</label>
                            <input id="cf-name" name="name" type="text" autocomplete="name" required maxlength="120">
                        </div>
                        <div class="field">
                            <label for="cf-email"><span class="field-num">03</span>${esc(f.email)}</label>
                            <input id="cf-email" name="email" type="email" autocomplete="email" required maxlength="200">
                        </div>
                    </div>
                    <div class="form-row" data-reveal>
                        <div class="field">
                            <label for="cf-company"><span class="field-num">04</span>${esc(f.company)} ${opt}</label>
                            <input id="cf-company" name="company" type="text" autocomplete="organization" maxlength="160">
                        </div>
                        <div class="field">
                            <label for="cf-country"><span class="field-num">05</span>${esc(f.country)}</label>
                            <input id="cf-country" name="country" type="text" autocomplete="country-name" required maxlength="80">
                        </div>
                    </div>
                    <div class="field" data-reveal>
                        <label for="cf-message"><span class="field-num">06</span>${esc(f.message)}</label>
                        <textarea id="cf-message" name="message" rows="5" required minlength="20" maxlength="5000" placeholder="${esc(c.placeholders.message)}" data-autosize></textarea>
                    </div>
                    <fieldset class="field field-group" data-reveal>
                        <legend><span class="field-num">07</span>${esc(f.budget)} ${opt}</legend>
                        ${chips('budget', c.budgetOptions)}
                    </fieldset>
                    <fieldset class="field field-group" data-reveal>
                        <legend><span class="field-num">08</span>${esc(f.timeline)} ${opt}</legend>
                        ${chips('timeline', c.timelineOptions)}
                    </fieldset>
                    <div class="hp" aria-hidden="true">
                        <label for="cf-website">Website</label>
                        <input id="cf-website" name="website" type="text" tabindex="-1" autocomplete="off">
                    </div>
                    <div class="field field-check" data-reveal>
                        <input id="cf-privacy" name="privacy" type="checkbox" required>
                        <label for="cf-privacy">${fill(c.privacyAck, { privacyUrl: pageUrl(lang, 'privacy') })}</label>
                    </div>
                    <input type="hidden" name="language" value="${lang}">
                    <div class="form-status" role="status" aria-live="polite" data-form-status></div>
                    <div data-reveal>
                        <button class="btn btn-primary btn-submit" type="submit" data-magnetic><span class="btn-label" data-text="${esc(c.submit)}"><span>${esc(c.submit)}</span></span><span class="btn-icon">${icon('arrowUpRight', 'icon')}</span></button>
                    </div>
                    <script type="application/json" data-form-i18n>${JSON.stringify(i18n).replace(/</g, '\\u003c')}</script>
                </form>

                <aside class="contact-aside">
                    <div class="aside-block" data-reveal>
                        <p class="aside-title">${esc(c.nextTitle)}</p>
                        <ol class="aside-steps">${map(c.next, (n, i) => `<li><span>${pad(i + 1)}</span>${esc(n)}</li>`)}</ol>
                    </div>
                    <div class="aside-block" data-reveal>
                        <p class="aside-title">${esc(c.directTitle)}</p>
                        <p>${esc(c.directText)}</p>
                        <a class="aside-mail" href="mailto:${esc(config.contact.email)}" data-cursor="link">${esc(config.contact.email)}</a>
                        <div class="aside-actions">
                            ${config.contact.phone ? `<a class="aside-btn" href="${telHref()}">${icon('phone', 'icon')}<span><small>${esc(c.callLabel)}</small>${esc(config.contact.phone)}</span></a>` : ''}
                            ${config.contact.whatsapp ? `<a class="aside-btn aside-btn-wa" href="${waHref()}" rel="noopener">${icon('whatsapp', 'icon')}<span><small>WhatsApp</small>${esc(c.whatsappLabel)}</span></a>` : ''}
                        </div>
                    </div>
                </aside>
            </div>
        </section>`;
  },

  demo(t, lang) {
    const d = t.demo;
    const i18n = { ...d, month: d.month, errors: d.errors };
    return `
        <section class="phero">
            <div class="phero-grid" aria-hidden="true"></div>
            <div class="wrap">
                <p class="kicker"><a class="kicker-back" href="${pageUrl(lang, 'projects')}">← ${esc(d.back)}</a><span class="kicker-line" aria-hidden="true"></span><span class="badge badge-demo">${esc(d.kicker)}</span></p>
                <h1 class="display" data-split>${esc(d.title)}</h1>
                <p class="phero-lead" data-reveal>${esc(d.lead)}</p>
            </div>
        </section>

        <section class="sec sec-light demo-intro">
            <div class="wrap">
                <div class="demo-facts">
                    ${map(
                      [
                        [d.problemTitle, d.problem],
                        [d.solutionTitle, d.solution],
                        [d.stackTitle, d.stack],
                      ],
                      ([h, p], i) => `
                    <div data-reveal>
                        <p class="aside-title">${pad(i + 1)} — ${esc(h)}</p>
                        <p>${esc(p)}</p>
                    </div>`
                    )}
                </div>
                <p class="demo-honesty" data-reveal>${esc(d.honesty)}</p>

                <div class="dz" data-demo-csv data-sample="/demos/sample-sales.csv" data-lang="${lang}">
                    <div class="dz-start" data-demo-start data-reveal>
                        <div class="dz-drop" data-demo-drop>
                            <div class="dz-drop-icon" aria-hidden="true">${icon('data', 'icon')}</div>
                            <div class="dz-actions">
                                <button type="button" class="btn btn-primary" data-demo-sample><span class="btn-label" data-text="${esc(d.loadSample)}"><span>${esc(d.loadSample)}</span></span><span class="btn-icon">${icon('arrow', 'icon')}</span></button>
                                <label class="btn btn-ghost-light dz-file">
                                    <input type="file" accept=".csv,text/csv,text/plain" data-demo-file>
                                    <span>${esc(d.upload)}</span>
                                </label>
                            </div>
                            <p class="dz-hint">${esc(d.drop)} · ${esc(d.privacy)}</p>
                        </div>
                        <p class="dz-error" role="alert" data-demo-error hidden></p>
                    </div>

                    <div class="dz-results" data-demo-results hidden>
                        <div class="dz-toolbar">
                            <div class="dz-source"><span class="dz-dot" aria-hidden="true"></span><span data-demo-source></span></div>
                            <div class="dz-selects">
                                <label>${esc(d.dateCol)}<select data-sel="date"></select></label>
                                <label>${esc(d.valueCol)}<select data-sel="value"></select></label>
                                <label>${esc(d.catCol)}<select data-sel="cat"></select></label>
                            </div>
                        </div>

                        <div class="dz-kpis" data-demo-kpis></div>

                        <div class="dz-grid">
                            <figure class="dz-card dz-card-wide">
                                <figcaption>${esc(d.chartMonthly)}</figcaption>
                                <div class="dz-chart" data-chart="monthly"></div>
                                <details class="dz-table-toggle"><summary>${esc(d.tableToggle)}</summary><div class="dz-table-wrap"><table class="dz-table" data-table="monthly"></table></div></details>
                            </figure>
                            <figure class="dz-card" data-card="top">
                                <figcaption>${esc(d.chartTop)}</figcaption>
                                <div class="dz-chart" data-chart="top"></div>
                                <details class="dz-table-toggle"><summary>${esc(d.tableToggle)}</summary><div class="dz-table-wrap"><table class="dz-table" data-table="top"></table></div></details>
                            </figure>
                            <div class="dz-card">
                                <p class="dz-card-title">${esc(d.report)}</p>
                                <ul class="dz-report" data-demo-report></ul>
                                <p class="dz-card-title dz-card-title-spaced">${esc(d.previewTitle)} <span class="dz-muted" data-preview-note></span></p>
                                <div class="dz-table-wrap"><table class="dz-table" data-table="preview"></table></div>
                            </div>
                        </div>

                        <div class="dz-footer" data-wa-avoid>
                            <button type="button" class="btn btn-dark" data-demo-export><span class="btn-label" data-text="${esc(d.exportCsv)}"><span>${esc(d.exportCsv)}</span></span><span class="btn-icon">${icon('arrow', 'icon')}</span></button>
                            <button type="button" class="chip" data-demo-print>${esc(d.print)}</button>
                            <button type="button" class="chip" data-demo-reset>${esc(d.reset)}</button>
                        </div>

                        <div class="dz-done" data-demo-done data-wa-avoid hidden tabindex="-1">
                            <div class="dz-done-msg" role="status">
                                <span class="dz-done-check" aria-hidden="true">✓</span>
                                <div>
                                    <p class="dz-done-title" data-demo-done-title></p>
                                    <p class="dz-done-hint">${esc(d.exportedHint)}</p>
                                </div>
                            </div>
                            <div class="dz-done-next">
                                <p>${esc(d.nextStep)}</p>
                                ${btn(pageUrl(lang, 'contact') + '?service=data', d.validate, 'primary')}
                            </div>
                        </div>
                    </div>
                    <script type="application/json" data-demo-i18n>${JSON.stringify(i18n).replace(/</g, '\\u003c')}</script>
                </div>
            </div>
        </section>

        <section class="cta">
            <div class="wrap">
                <div class="cta-row cta-row-top" data-reveal>
                    <div>
                        <h2 class="cta-title">${esc(d.ctaTitle)}</h2>
                        <p>${esc(d.ctaText)}</p>
                    </div>
                    ${btn(pageUrl(lang, 'contact'), t.common.ctaPrimary, 'light')}
                </div>
            </div>
        </section>`;
  },

  privacy(t, lang) {
    const p = t.privacy;
    const vars = {
      legalName: esc(config.legal.legalName),
      address: esc(config.legal.address),
      email: esc(config.contact.email),
      pecSentence: config.legal.pec ? fill(p.pecSentence, { pec: esc(config.legal.pec) }) : '',
      retentionMonths: esc(config.privacy.retentionMonths),
      hostingProvider: esc(config.privacy.hostingProvider),
      formProviderSentence: config.contact.formEndpoint ? p.formProviderSentence : '',
    };
    const date = new Date(config.privacy.lastUpdated + 'T00:00:00Z').toLocaleDateString(t.locale.replace('_', '-'), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
    return `${pageHero('§', t.nav.privacy, p.title, p.intro)}
        <section class="sec sec-light">
            <div class="wrap legal">
                <p class="legal-date">${esc(p.updated)}: <time datetime="${esc(config.privacy.lastUpdated)}">${esc(date)}</time></p>
                ${map(
                  p.sections,
                  (s, i) => `
                <section class="legal-sec">
                    <h2><span>${pad(i + 1)}</span>${esc(s.h)}</h2>
                    <div>${map(s.p, (para) => `<p>${fill(para, vars)}</p>`)}</div>
                </section>`
                )}
            </div>
        </section>`;
  },
};

function notFoundBody(t, lang) {
  const n = t.notFound;
  return `
        <section class="phero phero-404">
            <div class="phero-grid" aria-hidden="true"></div>
            <div class="wrap">
                <p class="big-404" aria-hidden="true" data-glitch="404">404</p>
                <h1 class="h-xl" data-split>${esc(n.title)}</h1>
                <p class="phero-lead" data-reveal>${esc(n.text)}</p>
                <p data-reveal>${btn(url(lang), n.back, 'primary')}</p>
            </div>
        </section>`;
}

// ---------- extra files ----------

function sitemap() {
  const entries = PAGES.map((p) => {
    const links = config.languages
      .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${config.siteUrl + url(l, p.path)}"/>`)
      .join('\n');
    return config.languages
      .map((l) => `  <url>\n    <loc>${config.siteUrl + url(l, p.path)}</loc>\n${links}\n  </url>`)
      .join('\n');
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;
}

function headersFile() {
  let endpointOrigin = '';
  if (config.contact.formEndpoint) {
    try {
      endpointOrigin = ' ' + new URL(config.contact.formEndpoint).origin;
    } catch {
      warn(`contact.formEndpoint is not a valid URL: ${config.contact.formEndpoint}`);
    }
  }
  const csp = [
    "default-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "style-src 'self'",
    "script-src 'self'",
    `connect-src 'self'${endpointOrigin}`,
    `form-action 'self'${endpointOrigin}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
  // Netlify / Cloudflare Pages format. Adapt for other hosts.
  return `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/assets/*
  Cache-Control: public, max-age=86400

/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable
`;
}

// ---------- checks ----------

const warnings = [];
function warn(msg) {
  warnings.push(msg);
}

function validate() {
  if (isTodo(config.contact.email)) warn('contact.email is not set (site.config.mjs).');
  for (const k of ['legalName', 'vatNumber', 'address']) {
    if (isTodo(config.legal[k])) warn(`legal.${k} is not set — required before the site goes public.`);
  }
  if (isTodo(config.privacy.hostingProvider)) warn('privacy.hostingProvider is not set (used in the privacy policy).');
  if (!config.contact.formEndpoint) warn('contact.formEndpoint is empty — the form will fall back to mailto.');

  projects.forEach((p, i) => {
    if (!PROJECT_TYPES.includes(p.type)) {
      throw new Error(`projects[${i}] (${p.slug ?? '?'}): type must be one of ${PROJECT_TYPES.join(', ')}.`);
    }
    if (p.page && !PAGES.some((pg) => pg.key === p.page)) {
      throw new Error(`projects[${i}] (${p.slug ?? '?'}): page "${p.page}" does not exist in PAGES.`);
    }
    if (!p.title?.[DEFAULT_LANG] || !p.summary?.[DEFAULT_LANG]) {
      throw new Error(`projects[${i}] (${p.slug ?? '?'}): title and summary are required in "${DEFAULT_LANG}".`);
    }
  });

  const keys = (o, prefix = '') =>
    Object.entries(o).flatMap(([k, v]) =>
      v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
    );
  const ref = new Set(keys(DICTS[DEFAULT_LANG]));
  for (const l of config.languages) {
    const ks = new Set(keys(DICTS[l]));
    const missing = [...ref].filter((k) => !ks.has(k));
    if (missing.length) throw new Error(`Translation "${l}" is missing keys: ${missing.join(', ')}`);
    if (DICTS[l].home.fixes.length !== DICTS[l].home.problems.length) {
      throw new Error(`Translation "${l}": home.fixes must have one entry per home.problems entry.`);
    }
  }
}

// ---------- build ----------

async function write(rel, content) {
  const file = join(DIST, rel);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}

async function build() {
  validate();
  await rm(DIST, { recursive: true, force: true });
  await cp(join(ROOT, 'static'), DIST, { recursive: true });

  let count = 0;
  for (const lang of config.languages) {
    const t = DICTS[lang];
    const prefix = lang === DEFAULT_LANG ? '' : `${lang}/`;
    for (const page of PAGES) {
      const body = pages[page.key](t, lang);
      const scripts = page.key === 'demo' ? ['/assets/demo-csv.js'] : [];
      await write(`${prefix}${page.path}index.html`, layout({ t, lang, key: page.key, path: page.path, body, scripts }));
      count++;
    }
    await write(`${prefix}404.html`, layout({ t, lang, key: 'notFound', path: '', body: notFoundBody(t, lang), noindex: true }));
  }

  await write('sitemap.xml', sitemap());
  await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
  await write('_headers', headersFile());

  console.log(`Built ${count} pages in ${config.languages.length} languages → dist/`);
  if (warnings.length) {
    console.log(`\n⚠ ${warnings.length} item(s) to complete before going live:`);
    warnings.forEach((w) => console.log(`  - ${w}`));
  }
}

build().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
