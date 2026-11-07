import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { apply } from '../dist/skills.js';

const doc = (name) =>
  `---\nname: ${name}\ndescription: About ${name}\n---\nBody ${name}`;

async function host(t, existingState) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'waycraft-org-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const base = join(root, 'base');
  for (const name of ['alpha', 'beta', 'gamma']) {
    await mkdir(join(base, name), { recursive: true });
    await writeFile(join(base, name, 'SKILL.md'), doc(name));
  }
  const other = join(root, 'other');
  for (const name of ['alpha', 'delta']) {
    await mkdir(join(other, name), { recursive: true });
    await writeFile(join(other, name, 'SKILL.md'), doc(name));
  }
  const app = join(root, 'app');
  await mkdir(join(app, '.git'), { recursive: true });
  await mkdir(join(app, '.agents', 'skills', 'alpha'), { recursive: true });
  await writeFile(
    join(app, '.agents', 'skills', 'alpha', 'SKILL.md'),
    doc('alpha'),
  );
  const statePath = existingState ?? join(root, 'state', 'state.json');
  const registry = { fail: false, paths: [app] };
  let route;
  let provider;
  const stops = [];
  const controller = new AbortController();
  const registryService = {
    list() {
      if (registry.fail) throw new Error('registry down');
      return registry.paths.map((path) => ({ path }));
    },
  };
  const ctx = {
    skills: {
      registerProvider(create) {
        provider = create({ signal: controller.signal, invalidate() {} });
        return () => controller.abort();
      },
    },
    effect(start) {
      stops.push(start());
    },
    inject(_names, callback) {
      callback({
        effect: ctx.effect,
        get(name) {
          if (name === 'workspaceRegistry')
            return { list: () => [{ path: app }] };
          return {
            fetch: {
              register(value) {
                route = value;
                return () => {};
              },
            },
          };
        },
      });
    },
    get(name) {
      if (name === 'workspaceRegistry') return registryService;
    },
  };
  const config = {
    sources: [
      { id: 'base', path: base },
      { id: 'other', path: other },
    ],
    statePath,
  };
  apply(ctx, config);
  t.after(async () => {
    for (const stop of stops) await stop?.();
  });
  const post = async (body, marked = true) => {
    const response = await route.fetch(
      new Request('http://localhost/api/waycraft-skills.catalog', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(marked ? { 'x-waycraft-skills': '1' } : {}),
        },
        body: JSON.stringify(body),
      }),
    );
    return {
      status: response.status,
      body: await response.json().catch(() => undefined),
    };
  };
  const project = async () => {
    const listed = await post({ action: 'list' });
    return listed.body.projects.find((x) => x.available).id;
  };
  return {
    root,
    base,
    other,
    app,
    statePath,
    post,
    project,
    config,
    ctx,
    stops,
    provider: () => provider,
    registry,
  };
}

const eligibleOf = (view, name, source) =>
  view.copies
    .filter((x) => x.name === name && x.source === source)
    .map((x) => x.eligible);
const org = (body, source = 'base') => body.organization[source];

test('categories are created, renamed, assigned in bulk, ordered and deleted as metadata only', async (t) => {
  const h = await host(t);
  const before = await readdir(join(h.base, 'alpha'));
  const S = { source: 'base' };
  let r = await h.post({ action: 'category-create', name: '  Work  ', ...S });
  assert.equal(r.status, 200);
  const [work] = org(r.body).categories;
  assert.equal(work.name, 'Work');
  assert.match(work.id, /^[a-f0-9]{16}$/);
  assert.deepEqual(
    r.body.organization.other,
    undefined,
    'other source untouched',
  );
  assert.equal(
    (await h.post({ action: 'category-create', name: 'Work', ...S })).body.code,
    'category-duplicate',
  );
  assert.equal(
    (await h.post({ action: 'category-create', name: ' ', ...S })).body.code,
    'category-name',
  );
  assert.equal(
    (await h.post({ action: 'category-create', name: 'x'.repeat(25), ...S }))
      .body.code,
    'category-name',
  );
  assert.equal(
    (await h.post({ action: 'category-create', name: 'A' })).body.code,
    'invalid-request',
  );
  assert.equal(
    (await h.post({ action: 'category-create', name: 'A', source: 'nope' }))
      .body.code,
    'source-unknown',
  );
  r = await h.post({
    action: 'category-rename',
    category: work.id,
    name: 'Jobs',
    ...S,
  });
  assert.equal(org(r.body).categories[0].name, 'Jobs');
  r = await h.post({
    action: 'category-assign',
    names: ['alpha', 'gamma', 'beta'],
    category: work.id,
    ...S,
  });
  assert.deepEqual(org(r.body).members, {
    alpha: work.id,
    gamma: work.id,
    beta: work.id,
  });
  assert.equal(
    (
      await h.post({
        action: 'category-assign',
        names: ['delta'],
        category: work.id,
        ...S,
      })
    ).body.code,
    'skill-unknown',
    'delta lives in another source',
  );
  assert.equal(
    (
      await h.post({
        action: 'category-assign',
        names: ['alpha'],
        category: 'nope',
        ...S,
      })
    ).body.code,
    'category-unknown',
  );
  // Reordering was removed: the retired action is an unknown action (clean 400).
  r = await h.post({
    action: 'category-move',
    name: 'gamma',
    category: work.id,
    ...S,
  });
  assert.equal(r.status, 400);
  await h.post({ action: 'category-create', name: 'Empty', ...S });
  r = await h.post({ action: 'category-delete', category: work.id, ...S });
  assert.deepEqual(org(r.body).members, {});
  assert.equal('order' in org(r.body), false);
  assert.equal(
    r.body.copies.filter((x) => x.source === 'base').length,
    3,
    'skills survive category deletion',
  );
  assert.deepEqual(
    await readdir(join(h.base, 'alpha')),
    before,
    'no file moved',
  );
  assert.equal(
    (await h.post({ action: 'category-delete', category: work.id, ...S })).body
      .code,
    'category-unknown',
  );
  assert.equal(
    (await h.post({ action: 'category-create', name: 'Late', ...S }, false))
      .status,
    403,
  );
});

test('same-named skills in different sources keep independent categories, notes and bulk toggles', async (t) => {
  const h = await host(t);
  const base = (
    await h.post({ action: 'category-create', name: 'Set', source: 'base' })
  ).body;
  const other = (
    await h.post({ action: 'category-create', name: 'Set', source: 'other' })
  ).body;
  const baseId = org(base).categories[0].id;
  const otherId = org(other, 'other').categories[0].id;
  assert.notEqual(baseId, otherId);
  await h.post({
    action: 'category-assign',
    names: ['alpha'],
    category: baseId,
    source: 'base',
  });
  assert.equal(
    (
      await h.post({
        action: 'category-assign',
        names: ['alpha'],
        category: baseId,
        source: 'other',
      })
    ).body.code,
    'category-unknown',
    'category ids are per source',
  );
  let r = await h.post({
    action: 'note',
    name: 'alpha',
    note: 'base note',
    source: 'base',
  });
  assert.equal(org(r.body, 'other')?.notes?.alpha, undefined);
  r = await h.post({
    action: 'note',
    name: 'alpha',
    note: 'other note',
    source: 'other',
  });
  assert.equal(org(r.body).notes.alpha, 'base note');
  assert.equal(org(r.body, 'other').notes.alpha, 'other note');
  // Bulk toggles touch only the selected source, via real provider availability.
  await h.post({
    action: 'category-assign',
    names: ['alpha'],
    category: otherId,
    source: 'other',
  });
  r = await h.post({
    action: 'category-toggle',
    category: baseId,
    enabled: false,
    source: 'base',
  });
  assert.deepEqual(eligibleOf(r.body, 'alpha', 'base'), [false]);
  assert.deepEqual(eligibleOf(r.body, 'alpha', 'other'), [true]);
  assert.deepEqual(eligibleOf(r.body, 'beta', 'base'), [true]);
  const listed = await h.provider().list();
  const alphaPaths = listed
    .filter((x) => x.name === 'alpha')
    .map((x) => x.locator ?? x.path);
  assert.ok(
    listed.some((x) => x.name === 'alpha'),
    'other-source alpha remains available to the provider',
  );
  assert.ok(
    !alphaPaths.some((x) => String(x).includes(join(h.base, 'alpha'))),
    'base alpha is denied',
  );
  r = await h.post({
    action: 'category-toggle',
    category: '',
    enabled: false,
    source: 'other',
  });
  assert.deepEqual(eligibleOf(r.body, 'delta', 'other'), [false]);
  assert.deepEqual(eligibleOf(r.body, 'alpha', 'other'), [true]);
  r = await h.post({
    action: 'category-toggle',
    category: '*',
    enabled: true,
    source: 'base',
  });
  assert.ok(
    r.body.copies
      .filter((x) => x.source === 'base')
      .every((x) => x.eligible !== false),
  );
  assert.deepEqual(
    eligibleOf(r.body, 'delta', 'other'),
    [false],
    'other source untouched by base bulk',
  );
  const persisted = JSON.parse(await readFile(h.statePath, 'utf8'));
  assert.ok(
    persisted.organization.global.base && persisted.organization.global.other,
  );
});

test('project scope keeps its own per-source organization and policy', async (t) => {
  const h = await host(t);
  const project = await h.project();
  const view = await h.post({ action: 'list', project });
  const projectSource = view.body.project.sources.find(
    (x) => x.kind !== 'dsh',
  ).id;
  let r = await h.post({
    action: 'category-create',
    name: 'Local',
    project,
    source: projectSource,
  });
  const local = r.body.project.organization[projectSource].categories[0].id;
  assert.deepEqual(r.body.organization, {}, 'global organization untouched');
  assert.equal(
    (
      await h.post({
        action: 'category-create',
        name: 'X',
        project,
        source: 'base',
      })
    ).body.code,
    'source-unknown',
  );
  await h.post({
    action: 'category-assign',
    names: ['alpha'],
    category: local,
    project,
    source: projectSource,
  });
  r = await h.post({
    action: 'category-toggle',
    category: local,
    enabled: false,
    project,
    source: projectSource,
  });
  assert.ok(
    r.body.project.copies.some(
      (x) => x.name === 'alpha' && x.eligible === false,
    ),
  );
  assert.ok(
    r.body.copies.every((x) => x.eligible !== false),
    'global scope untouched',
  );
});

test('removing a custom source purges its organization; unreadable registry keeps project organization', async (t) => {
  const h = await host(t);
  const folder = join(h.root, 'custom');
  await mkdir(join(folder, 'zeta'), { recursive: true });
  await writeFile(join(folder, 'zeta', 'SKILL.md'), doc('zeta'));
  const added = await h.post({
    action: 'custom-add',
    items: [{ path: folder, label: 'Custom' }],
  });
  assert.equal(added.status, 200);
  const id = added.body.sources.find((x) => x.custom).id;
  await h.post({ action: 'category-create', name: 'Z', source: id });
  await h.post({ action: 'note', name: 'zeta', note: 'n', source: id });
  let saved = JSON.parse(await readFile(h.statePath, 'utf8'));
  assert.ok(saved.organization.global[id]);
  const removed = await h.post({ action: 'custom-remove', id });
  assert.equal(removed.status, 200);
  saved = JSON.parse(await readFile(h.statePath, 'utf8'));
  assert.equal(saved.organization.global?.[id], undefined);
  // Project organization survives a failing registry and goes only after an authoritative read.
  const project = await h.project();
  const view = await h.post({ action: 'list', project });
  const ps = view.body.project.sources.find((x) => x.kind !== 'dsh').id;
  await h.post({
    action: 'category-create',
    name: 'Keep',
    project,
    source: ps,
  });
  h.registry.fail = true;
  await h.post({ action: 'category-create', name: 'Other', source: 'base' });
  saved = JSON.parse(await readFile(h.statePath, 'utf8'));
  assert.equal(
    Object.keys(saved.organization).filter((x) => x !== 'global').length,
    1,
    'kept while registry throws',
  );
  h.registry.fail = false;
  h.registry.paths = [];
  await h.post({ action: 'category-create', name: 'Third', source: 'base' });
  saved = JSON.parse(await readFile(h.statePath, 'utf8'));
  assert.equal(
    Object.keys(saved.organization).filter((x) => x !== 'global').length,
    0,
    'purged after authoritative read',
  );
});

test('notes persist separately from descriptions', async (t) => {
  const h = await host(t);
  const S = { source: 'base' };
  let r = await h.post({
    action: 'note',
    name: 'alpha',
    note: '  remember me  ',
    ...S,
  });
  assert.equal(org(r.body).notes.alpha, 'remember me');
  assert.equal(
    r.body.copies.find((x) => x.name === 'alpha' && x.source === 'base')
      .description,
    'About alpha',
  );
  assert.equal(
    (
      await h.post({
        action: 'note',
        name: 'alpha',
        note: 'x'.repeat(501),
        ...S,
      })
    ).body.code,
    'note-too-long',
  );
  assert.equal(
    (await h.post({ action: 'note', name: 'ghost', note: 'x', ...S })).body
      .code,
    'skill-unknown',
  );
  assert.equal(
    (await h.post({ action: 'note', name: 'alpha', note: 5, ...S })).body.code,
    'invalid-request',
  );
  const saved = JSON.parse(await readFile(h.statePath, 'utf8'));
  assert.equal(saved.organization.global.base.notes.alpha, 'remember me');
  r = await h.post({ action: 'note', name: 'alpha', note: '', ...S });
  assert.deepEqual(r.body.organization, {});
});

test('malformed requests, limits and oversize state are rejected without corrupting state', async (t) => {
  const h = await host(t);
  const S = { source: 'base' };
  assert.equal(
    (
      await h.post({
        action: 'category-toggle',
        category: '*',
        enabled: 'yes',
        ...S,
      })
    ).body.code,
    'invalid-request',
  );
  assert.equal(
    (
      await h.post({
        action: 'category-assign',
        names: 'alpha',
        category: '',
        ...S,
      })
    ).body.code,
    'invalid-request',
  );
  const names = Array.from({ length: 101 }, (_, i) => `s${i}`);
  assert.equal(
    (await h.post({ action: 'category-assign', names, category: '', ...S }))
      .body.code,
    'invalid-request',
  );
  for (let i = 0; i < 64; i++)
    assert.equal(
      (await h.post({ action: 'category-create', name: `c${i}`, ...S })).status,
      200,
    );
  assert.equal(
    (await h.post({ action: 'category-create', name: 'c64', ...S })).body.code,
    'category-limit',
  );
  assert.equal(
    (await h.post({ action: 'list' })).status,
    200,
    'state still working',
  );
});

test('malformed organization state is locked, never partially trusted', async (t) => {
  const cat = '{"id":"aaaaaaaaaaaaaaaa","name":"X"}';
  const entry = (categories, members, order, notes) =>
    `{"categories":${categories},"members":${members},"order":${order},"notes":${notes}}`;
  // Raw JSON text: an object literal would silently drop an own "__proto__" key.
  for (const organization of [
    `{"global":{"base":${entry('[]', '{"alpha":"zz"}', '{}', '{}')}}}`,
    `{"__proto__":{"base":${entry('[]', '{}', '{}', '{}')}}}`,
    '{"not-a-scope":{}}',
    `{"global":{"":${entry('[]', '{}', '{}', '{}')}}}`,
    `{"global":{"base":${entry(`[${cat}]`, '{"__proto__":"aaaaaaaaaaaaaaaa"}', '{}', '{}')}}}`,
    `{"global":{"base":${entry('[]', '{}', '{}', '{"alpha":""}')}}}`,
  ]) {
    const h = await host(t);
    await mkdir(join(h.root, 'state'), { recursive: true });
    await writeFile(
      h.statePath,
      `{"sources":{},"copies":{},"customSources":[],"projects":{},"organization":${organization},"placement":"settings"}`,
    );
    const fresh = await host(t, h.statePath);
    const listed = await fresh.post({ action: 'list' });
    assert.equal(listed.body.corrupt, true, organization);
    assert.equal(
      (
        await fresh.post({
          action: 'category-create',
          name: 'A',
          source: 'base',
        })
      ).status,
      409,
    );
  }
});

test('a mutation that would exceed the state size limit is rejected and leaves persisted and in-memory state unchanged', async (t) => {
  const seed = await host(t);
  await mkdir(join(seed.root, 'state'), { recursive: true });
  const note = 'n'.repeat(500);
  const fill = (count, prefix) =>
    Object.fromEntries(
      Array.from({ length: count }, (_, i) => [
        `${prefix}${String(i).padStart(4, '0')}`,
        note,
      ]),
    );
  const document = (extra) => ({
    sources: {},
    copies: {},
    customSources: [],
    projects: {},
    organization: {
      global: {
        ghost1: {
          categories: [],
          members: {},
          notes: fill(1000, 'a'),
        },
        ghost2: {
          categories: [],
          members: {},
          notes: fill(extra, 'b'),
        },
      },
    },
    placement: 'settings',
  });
  // Grow the second ghost source until the document sits just below the 0.9 MiB write limit.
  const limit = Math.floor(1024 * 1024 * 0.9);
  let extra = 0;
  while (
    Buffer.byteLength(JSON.stringify(document(extra + 1))) < limit - 300 &&
    extra < 1023
  )
    extra++;
  // Tune one filler note so the document ends within 100 bytes of the limit.
  const filler = (length) => {
    const value = document(extra);
    value.organization.global.ghost2.notes.zfill = 'f'.repeat(length);
    return JSON.stringify(value);
  };
  let fillLength = 1;
  while (
    fillLength < 499 &&
    Buffer.byteLength(filler(fillLength + 1)) < limit - 100
  )
    fillLength++;
  const text = filler(fillLength);
  assert.ok(
    Buffer.byteLength(text) < limit && Buffer.byteLength(text) > limit - 300,
  );
  await writeFile(seed.statePath, text);
  const h = await host(t, seed.statePath);
  const before = await readFile(h.statePath, 'utf8');
  assert.equal((await h.post({ action: 'list' })).body.corrupt, false);
  const rejected = await h.post({
    action: 'note',
    name: 'alpha',
    note,
    source: 'base',
  });
  assert.equal(rejected.status, 413);
  assert.equal(rejected.body.code, 'state-too-large');
  assert.equal(await readFile(h.statePath, 'utf8'), before, 'file untouched');
  const listed = await h.post({ action: 'list' });
  assert.equal(listed.body.corrupt, false);
  assert.equal(
    listed.body.organization.base,
    undefined,
    'no transient memory update',
  );
  assert.equal(Object.keys(listed.body.organization.ghost1.notes).length, 1000);
  // A fresh host still reads the persisted state, and a small mutation still works afterwards.
  const fresh = await host(t, h.statePath);
  assert.equal((await fresh.post({ action: 'list' })).body.corrupt, false);
  assert.equal(
    (await h.post({ action: 'placement', location: 'both' })).status,
    200,
  );
});

test('a transiently unreadable source keeps its metadata instead of being pruned', async (t) => {
  const h = await host(t);
  await h.post({
    action: 'note',
    name: 'delta',
    note: 'keep me',
    source: 'other',
  });
  const moved = `${h.other}.away`;
  await rename(h.other, moved);
  const during = await h.post({
    action: 'category-create',
    name: 'Z',
    source: 'other',
  });
  assert.equal(during.status, 200);
  assert.equal(during.body.organization.other.notes.delta, 'keep me');
  await rename(moved, h.other);
  const after = await h.post({ action: 'list' });
  assert.equal(after.body.organization.other.notes.delta, 'keep me');
  // A readable source still reconciles: removing the skill drops its note.
  await rm(join(h.other, 'delta'), { recursive: true });
  const pruned = await h.post({
    action: 'category-create',
    name: 'Y',
    source: 'other',
  });
  assert.equal(pruned.body.organization.other.notes.delta, undefined);
});

test('placement persists settings, sidebar-only and both', async (t) => {
  const h = await host(t);
  assert.equal(
    (await h.post({ action: 'ping', include: 'placement' })).body.placement,
    'settings',
  );
  for (const location of ['sidebar', 'both', 'settings', 'sidebar']) {
    const r = await h.post({ action: 'placement', location });
    assert.equal(r.status, 200);
    assert.equal(r.body.placement, location);
    assert.equal(
      (await h.post({ action: 'ping', include: 'placement' })).body.placement,
      location,
    );
    assert.equal(
      JSON.parse(await readFile(h.statePath, 'utf8')).placement,
      location,
    );
  }
  assert.equal(
    (await h.post({ action: 'placement', location: 'nowhere' })).body.code,
    'placement-invalid',
  );
  assert.equal(
    (await h.post({ action: 'placement', location: 'both' }, false)).status,
    403,
  );
  // A fresh host re-reads sidebar-only instead of normalizing it away.
  const fresh = await host(t, h.statePath);
  assert.equal(
    (await fresh.post({ action: 'ping', include: 'placement' })).body.placement,
    'sidebar',
  );
});

test('state saved before reordering was removed still loads: organization.order is ignored and pruned on write', async (t) => {
  const h = await host(t);
  await mkdir(join(h.root, 'state'), { recursive: true });
  const id = 'aaaaaaaaaaaaaaaa';
  await writeFile(
    h.statePath,
    JSON.stringify({
      sources: {},
      copies: {},
      customSources: [],
      projects: {},
      organization: {
        global: {
          base: {
            categories: [{ id, name: 'Old' }],
            members: { alpha: id },
            order: { [id]: ['alpha', 'beta'], '': ['gamma'] },
            notes: {},
          },
        },
      },
      placement: 'settings',
    }),
  );
  const fresh = await host(t, h.statePath);
  const listed = await fresh.post({ action: 'list' });
  assert.notEqual(listed.body.corrupt, true);
  assert.deepEqual(listed.body.organization.base.members, { alpha: id });
  assert.equal('order' in listed.body.organization.base, false);
  const r = await fresh.post({
    action: 'category-create',
    name: 'New',
    source: 'base',
  });
  assert.equal(r.status, 200);
  const saved = JSON.parse(await readFile(fresh.statePath, 'utf8'));
  assert.equal('order' in saved.organization.global.base, false);
});
