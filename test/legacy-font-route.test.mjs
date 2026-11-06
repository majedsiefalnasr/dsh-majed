// Ticket #159: the legacy font route stays served for one release; index.js must not drift from legacy-names.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { apply } from '../index.js';
import { LEGACY_FONT_ROUTE } from '../dist/legacy-names.js';

function mount() {
  const routes = [];
  const webCtx = {
    reflect: {
      get: () => ({ register: (route) => (routes.push(route), () => {}) }),
    },
    effect: (fn) => fn(),
  };
  apply({ inject: (_names, fn) => fn(webCtx) });
  return routes;
}

async function status(route, url) {
  let code;
  await route.handler(
    { method: 'HEAD', url },
    { writeHead: (value) => (code = value), end() {} },
  );
  return code;
}

test('host serves the new and the legacy font prefix', async () => {
  const routes = mount();
  assert.deepEqual(
    routes.map((r) => r.path).sort(),
    ['/plugins/dsh-waycraft/fonts', LEGACY_FONT_ROUTE].sort(),
  );
  for (const prefix of [LEGACY_FONT_ROUTE, '/plugins/dsh-waycraft/fonts'])
    assert.equal(
      await status(routes[0], `${prefix}/inter-latin-wght-normal.woff2`),
      200,
      prefix,
    );
});

test('source inspection: index.js legacy font constant equals src/legacy-names.ts', () => {
  const text = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  assert.ok(text.includes(`const LEGACY_FONT_ROUTE = '${LEGACY_FONT_ROUTE}'`));
});
