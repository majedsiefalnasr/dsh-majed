import assert from 'node:assert/strict';
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { Context } from '@deepseek-ai/cordis';
import {
  HostConnectionService,
  Peer,
} from '@deepseek-ai/dsh-client-connection';
import { apply } from '../dist/subscriptions.js';

async function mount() {
  const root = new Context();
  const auth = {
    isAuthenticated: () => true,
    authenticateApi: () => undefined,
  };
  const service = new HostConnectionService(root, [], auth);
  const ctx = {
    logger: { warn() {} },
    llm: { registerAdapter: () => ({ replace() {} }) },
    get: (name) => (name === 'connection' ? service : undefined),
    effect: (fn) => fn(),
    inject: (names, fn) => {
      if ([].concat(names).every((name) => name === 'connection')) fn(ctx);
    },
  };
  apply(ctx, { codexClientVersion: '1.2.3', models: { codex: [] } });
  const handler = service.createSharedFetchHandler('/api');
  return {
    get: (name, kind = 'owner') =>
      handler.fetch(
        new Request(
          `http://127.0.0.1/api/waycraft-subscriptions.videoFile?name=${encodeURIComponent(name)}`,
        ),
        new Peer(root, {
          principal:
            kind === 'owner' ? { kind: 'owner' } : { kind: 'api', id: 'x' },
        }),
      ),
  };
}

test('videoFile streams the stored MP4 as binary, owner-only, with traversal and invalid files refused', async () => {
  const home = await mkdtemp('/tmp/waycraft-t160-video-');
  process.env.DSH_HOME = home;
  const directory = join(home, 'plugins/waycraft/subscriptions/videos');
  await mkdir(directory, { recursive: true });
  const bytes = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('ftyp'),
    Buffer.alloc(600 * 1024, 7),
  ]);
  await writeFile(join(directory, 'video-ok.mp4'), bytes);
  await writeFile(join(directory, 'video-bad.mp4'), 'not an mp4 file');
  await symlink('/etc/hosts', join(directory, 'video-link.mp4'));
  const host = await mount();

  const ok = await host.get('video-ok.mp4');
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('content-type'), 'video/mp4');
  assert.equal(ok.headers.get('content-length'), String(bytes.length));
  assert.ok(Buffer.from(await ok.arrayBuffer()).equals(bytes));

  assert.equal((await host.get('video-ok.mp4', 'stranger')).status, 403);
  for (const name of [
    '../video-ok.mp4',
    '..%2Fvideo-ok.mp4',
    '/etc/passwd',
    'video-ok.mp4/../x',
    '',
    'video-link.mp4',
    'video-bad.mp4',
  ])
    assert.equal((await host.get(name)).status, 400, name);
  assert.equal((await host.get('video-missing.mp4')).status, 404);
});

test('videoFile enforces the 100 MiB cap without reading the file', async () => {
  const home = await mkdtemp('/tmp/waycraft-t160-video-cap-');
  process.env.DSH_HOME = home;
  const directory = join(home, 'plugins/waycraft/subscriptions/videos');
  await mkdir(directory, { recursive: true });
  const { open } = await import('node:fs/promises');
  const handle = await open(join(directory, 'video-big.mp4'), 'w');
  await handle.write(
    Buffer.concat([Buffer.alloc(4), Buffer.from('ftyp')]),
    0,
    8,
    0,
  );
  await handle.truncate(100 * 1024 * 1024 + 1); // sparse
  await handle.close();
  const host = await mount();
  assert.equal((await host.get('video-big.mp4')).status, 400);
});
