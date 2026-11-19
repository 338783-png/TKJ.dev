// Minimal static server for local preview of ./dist — zero dependencies.
// Usage: node scripts/serve.mjs [port]

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../site.config.mjs';

const DIST = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const PORT = Number(process.argv[2] || process.env.PORT || 4321);
// Same security headers as dist/_headers, for hosts that run this server (e.g. a Render Web Service).
let formOrigin = '';
try {
  formOrigin = config.contact.formEndpoint ? ' ' + new URL(config.contact.formEndpoint).origin : '';
} catch {}
const SECURITY_HEADERS = {
  'Content-Security-Policy': `default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'${formOrigin}; form-action 'self'${formOrigin}; frame-ancestors 'none'; base-uri 'self'; object-src 'none'`,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0]));
  let file = join(DIST, clean);
  if (file !== DIST && !file.startsWith(DIST + sep)) return null;
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, 'index.html');
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const file = await resolveFile(req.url);
  if (file) {
    const cache = file.includes(`${sep}fonts${sep}`) ? 'public, max-age=31536000, immutable' : file.endsWith('.html') ? 'no-cache' : 'public, max-age=86400';
    res.writeHead(200, { ...SECURITY_HEADERS, 'Cache-Control': cache, 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
    return;
  }
  const lang = req.url.match(/^\/(it|fr)\//)?.[1];
  const notFound = join(DIST, lang ? `${lang}/404.html` : '404.html');
  res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': TYPES['.html'] });
  res.end(await readFile(notFound).catch(() => 'Not found'));
}).listen(PORT, () => console.log(`TKJ.dev preview → http://localhost:${PORT}`));
