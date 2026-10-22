/** Accepted 0.2.0 host behavior, isolated from replacement Manager runtimes. */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { registerNativeReadPage } from '../read-page-native.js';

const FONT_ROUTE = '/plugins/dsh-majed/fonts';
/** Only flat woff2 file names are served. */
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
    const dir = fileURLToPath(new URL('../../fonts/', import.meta.url));
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
  ctx.inject(['tools'], toolsCtx => {
    registerNativeReadPage(toolsCtx);
  });
  ctx.inject(['webServer'], webCtx => {
    const webServer = webCtx.reflect.get('webServer');
    webCtx.effect(() => webServer.register({ kind: 'prefix', path: FONT_ROUTE, handler: serveFont }), 'dsh-majed: font route');
  });
}
