/**
 * Host half of dsh-majed. Serves the bundled, OFL-licensed UI fonts (fonts/*.woff2) to the browser through
 * the host web server, so the font picker works offline, on the desktop app and on paired phones alike.
 * Also routes read_page through the native tool registry while enabled.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { registerNativeReadPage } from './lib/read-page-native.js';

const FONT_ROUTE = '/plugins/dsh-majed/fonts';
/** Flat file names only: no slashes or traversal, woff2 + the manifest. */
const FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.woff2$/;

async function serveFont(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  if (!pathname.startsWith(`${FONT_ROUTE}/`)) { res.writeHead(404); res.end(); return; }
  const file = pathname.slice(FONT_ROUTE.length + 1);
  if (!FILE_RE.test(file)) { res.writeHead(404); res.end(); return; }
  try {
    const dir = fileURLToPath(new URL('./fonts/', import.meta.url));
    const body = await readFile(join(dir, file));
    res.writeHead(200, {
      'content-type': 'font/woff2',
      'cache-control': 'public, max-age=31536000, immutable',
      'access-control-allow-origin': '*',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404); res.end();
  }
}

export function apply(ctx) {
  ctx.inject(['tools'], (toolsCtx) => {
    registerNativeReadPage(toolsCtx);
  });
  ctx.inject(['webServer'], (webCtx) => {
    const webServer = webCtx.reflect.get('webServer');
    webCtx.effect(() => webServer.register({ kind: 'prefix', path: FONT_ROUTE, handler: serveFont }), 'dsh-majed: font route');
  });
}
