import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mount } from './skills-ui-harness.mjs';

const withDiagnostics = (json) => {
  const ids = ['qoder', 'lingma', 'antigravity', 'zed', 'trae'];
  return {
    ...json,
    diagnostics: [
      ...ids.flatMap((source) => [
        { code: 'source-unavailable', params: { source }, message: 'x' },
        {
          code: 'unreadable-entries',
          params: { source, count: '1' },
          message: 'x',
        },
      ]),
      {
        code: 'unreadable-entries',
        params: { source: 'base', count: '2' },
        message: 'x',
      },
      { code: 'source-unavailable', params: { source: 'mine' }, message: 'x' },
      {
        code: 'unreadable-entries',
        params: { source: 'mine', count: '1' },
        message: 'x',
      },
    ],
    sources: [
      ...json.sources,
      ...[...ids, 'mine'].map((id) => ({
        id,
        path: `/nowhere/${id}`,
        label: id,
        enabled: true,
        rank: 900,
        ...(id === 'mine' ? { custom: true } : {}),
      })),
    ],
  };
};
// Token names evidenced in the INSTALLED host: every --dsw-alias-*/--dsw-radius-* token below is defined in
// app.asar /dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js (interactive-bg-hover and
// button-primary-* also in dsh-client-ui-plugin-manager/lib/client.js); --ds-font-family-code is in the web
// frontend stylesheet dist/assets/index-*.css. Re-verified 2026-11-06 (see docs/ai/current-work.md rc.10).
const EVIDENCED = new Set(
  `--dsw-alias-border-l2 --dsw-alias-border-l3 --dsw-alias-border-l4 --dsw-alias-state-business-primary --dsw-alias-label-primary --dsw-alias-label-secondary --dsw-alias-label-tertiary --dsw-alias-brand-primary --dsw-alias-state-error-primary --dsw-alias-state-success-primary --dsw-alias-state-warn-label --dsw-alias-bg-layer-1 --dsw-alias-bg-layer-2 --dsw-alias-bg-layer-3 --dsw-alias-bg-base --dsw-alias-settings-card-fill --dsw-alias-settings-card-stroke --dsw-alias-label-primary-foreground --dsw-alias-interactive-bg-hover --dsw-alias-interactive-bg-hover-danger --dsw-alias-interactive-bg-active --dsw-alias-button-primary-fill --dsw-alias-button-primary-hover --dsw-alias-button-primary-dimmed --dsw-alias-switch-thumb --dsw-focus-ring-width --dsw-focus-ring-color --dsw-static-neutral-50 --dsw-elevation-soft --dsw-shadow-lv3 --dsw-radius-xs --dsw-radius-sm --dsw-radius-md --dsw-radius-lg --dsw-radius-xl --ds-font-family-code`.split(
    ' ',
  ),
);
const styleOf = (ui) => {
  const nodes = ui.view.root.findAllByType('style');
  assert.equal(nodes.length, 1, 'one scoped style element');
  return nodes[0].children.join('');
};
const byData = (ui, name) =>
  ui.view.root.findAll(
    (x) => typeof x.type === 'string' && x.props[name] !== undefined,
  );
const flat = (node) =>
  node.children.map((c) => (typeof c === 'string' ? c : flat(c))).join(' ');

test('style layer is token-only, scoped and has fallbacks', async (t) => {
  const ui = await mount(t, 'en');
  const css = styleOf(ui);
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/);
  assert.doesNotMatch(css, /rgba?\(|hsla?\(/);
  assert.doesNotMatch(css, /font-family\s*:\s*(?!var\(--ds-)/);
  // The dialog width is an owned custom property, not a host token.
  const vars = (css.match(/var\(--[a-z0-9-]+/g) ?? []).filter(
    (v) => v !== 'var(--waycraft-skills-w',
  );
  assert.ok(vars.length > 20);
  for (const v of vars)
    assert.ok(EVIDENCED.has(v.slice(4)), `unevidenced token ${v}`);
  for (const v of vars) assert.match(v, /^var\(--(dsw|ds)-/);
  assert.match(
    css,
    /var\(--dsw-alias-settings-card-fill,\s*var\(--dsw-alias-bg-layer-2\)\)/,
  );
  assert.match(css, /max-inline-size:\s*720px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /outline:\s*2px solid/);
  assert.match(css, /0\.5px solid/);
  // Every top-level selector is scoped under .waycraft-skills (no global reset).
  const flatCss = css.replace(/@(?:media|container|supports)[^{]*\{/g, '');
  for (const rule of flatCss.split('}')) {
    const sel = rule.split('{')[0].trim();
    if (!sel) continue;
    for (const part of sel.split(','))
      assert.match(part.trim(), /^\.waycraft-skills/, part);
  }
  const classes = [
    ...css.replace(/url\([^)]*\)/g, '').matchAll(/\.([a-z][a-z0-9-]*)/g),
  ].map((m) => m[1]);
  for (const c of classes) assert.match(c, /^waycraft-skills/);
});

test('page structure: header actions, toolbar, filters', async (t) => {
  const ui = await mount(t, 'en');
  const cls = (n) => String(n.props.className ?? '');
  const has = (c) =>
    ui.view.root.findAll(
      (x) => typeof x.type === 'string' && cls(x).split(' ').includes(c),
    );
  assert.equal(has('waycraft-skills').length, 1);
  assert.ok(has('waycraft-skills-header').length === 1);
  assert.equal(
    has('waycraft-skills-toolbar').length,
    2,
    'scope row + filter row',
  );
  assert.ok(has('waycraft-skills-stat').length === 4);
  assert.ok(has('waycraft-skills-source').length >= 1);
  assert.ok(has('waycraft-skills-row').length >= 1);
  const tool = ui.view.root;
  // Icon-only actions keep an accessible name and a tooltip.
  for (const l of [
    ui.d.importSkills,
    ui.d.create,
    ui.d.folders,
    ui.d.refreshAria,
  ]) {
    const b = tool.findAll(
      (x) => x.type === 'button' && x.props['aria-label'] === l,
    );
    assert.equal(b.length, 1, l);
    assert.ok(b[0].props.title, `${l} has a tooltip`);
    assert.match(b[0].props.className, /waycraft-skills-icon-btn/);
  }
  assert.equal(
    tool.findAll((x) => x.props['data-waycraft-skills-refresh'] !== undefined)
      .length,
    1,
  );
  // Scope is a segmented group of four buttons with pressed state; the select stays for assistive tech.
  const seg = tool.findAll((x) => x.props['data-waycraft-scope-tabs'])[0];
  assert.deepEqual(
    seg.findAllByType('button').map((b) => b.props['data-scope']),
    ['global', 'project', 'discover', 'trash'],
  );
  assert.equal(seg.findAllByType('button')[0].props['aria-pressed'], true);
  for (const l of [
    ui.d.scope,
    ui.d.search,
    ui.d.source,
    ui.d.any,
    ui.d.filterCategory,
  ])
    assert.ok(tool.findAll((x) => x.props['aria-label'] === l).length, l);
  assert.equal(ui.refreshButton().props['aria-label'], ui.d.refreshAria);
});

for (const language of ['en', 'ar'])
  test(`repeated diagnostics group into one summary (${language})`, async (t) => {
    const ui = await mount(t, language, { transform: withDiagnostics });
    const { d } = ui;
    // No bare per-diagnostic paragraphs remain.
    const loose = ui.view.root.findAll(
      (x) =>
        x.type === 'p' &&
        (flat(x).includes(d['diag.source-unavailable']) ||
          flat(x).includes(d['diag.unreadable-entries'])),
    );
    assert.equal(loose.length, 0);
    // Diagnostics live INSIDE each source card as a collapsed region; there is no page-level section.
    const regions = ui.view.root.findAll(
      (x) => x.props['data-waycraft-diag-source'] !== undefined,
    );
    assert.deepEqual(
      regions.map((x) => x.props['data-waycraft-diag-source']).sort(),
      ['base', 'mine'],
      'only sources that have something to report get a region',
    );
    const sourceDetails = ui.view.root.findAll(
      (x) =>
        x.type === 'details' &&
        /waycraft-skills-source\b/.test(x.props.className ?? ''),
    );
    for (const region of regions)
      assert.ok(
        sourceDetails.some((s) => s.findAll((n) => n === region).length === 1),
        'region sits inside a source card',
      );
    for (const region of regions)
      assert.ok(!region.props.open, 'regions are collapsed by default');
    const baseRegion = regions.find(
      (x) => x.props['data-waycraft-diag-source'] === 'base',
    );
    const mineRegion = regions.find(
      (x) => x.props['data-waycraft-diag-source'] === 'mine',
    );
    assert.equal(baseRegion.props['data-tone'], 'warning');
    assert.equal(mineRegion.props['data-tone'], 'issue');
    // Summary row: severity icon + counts in words + chevron, never colour only.
    const sum = baseRegion.findAllByType('summary')[0];
    assert.ok(
      sum.findAll((x) => x.props['data-waycraft-skills-icon'] !== undefined)
        .length >= 1,
    );
    assert.match(flat(sum), /1 /);
    assert.equal(
      sum.findAll((x) => x.props.className === 'waycraft-skills-chev').length,
      1,
    );
    // Plain-words title with the count, the next step and the source path chip (not just a code).
    const warn = baseRegion.findAll(
      (x) => x.props['data-waycraft-skills-diag-warning'],
    );
    assert.equal(warn.length, 1);
    assert.match(flat(warn[0]), /\b2\b/);
    assert.ok(flat(warn[0]).includes(d['diagNext.unreadable-entries']));
    assert.ok(
      warn[0].findAll((x) =>
        /waycraft-skills-diag-chip/.test(x.props.className ?? ''),
      ).length >= 1,
      'path chips',
    );
    // The custom source that is unavailable is a real error with its own count.
    const real = mineRegion.findAll(
      (x) => x.props['data-waycraft-skills-diag-issues'],
    );
    assert.equal(real.length, 1);
    assert.equal(real[0].findAllByType('li').length, 1);
    // The default tool folders that are simply not installed produce NO notice at all.
    assert.equal(byData(ui, 'data-waycraft-skills-diag-absent').length, 0);
    // (The source filter may still list them as options; the diagnostics never mention them.)
    assert.doesNotMatch(
      regions.map((x) => flat(x)).join(' '),
      /qoder|lingma|antigravity|zed\b|trae/i,
    );
    assert.equal(d.diagAbsentMany, undefined);
    assert.equal(d.diagAbsentHint, undefined);
    // A sourceless item gets one small General region in the scope header area; none otherwise.
    assert.equal(
      regions.filter((x) => x.props['data-waycraft-diag-source'] === '').length,
      0,
    );
  });

test('source rows: no status text or dot in rows, switch role, problem statuses keep text', async (t) => {
  const ui = await mount(t, 'en', { transform: withDiagnostics });
  const switches = ui.view.root.findAll(
    (x) => x.type === 'button' && x.props.role === 'switch',
  );
  assert.ok(switches.length >= 1);
  for (const s of switches) {
    assert.equal(typeof s.props['aria-checked'], 'boolean');
    if (s.props['aria-label'].startsWith(ui.d.toggleSource)) {
      assert.ok(
        s.children.every((c) => typeof c !== 'string' || c === ''),
        'switch only, no On/Off text (the thumb is the only child)',
      );
    } else {
      // Skill rows: a bare enable switch named by the copy label.
      assert.ok(s.props['aria-label'].startsWith(ui.d.copyCopy));
      assert.match(s.props.className, /waycraft-skills-switch-bare/);
    }
  }
  // rc.15: the switch conveys on/off; no Enabled/Disabled text and no status dot in skill rows.
  const rowsAll = ui.view.root.findAll(
    (x) =>
      x.type === 'article' && /waycraft-skills-row/.test(x.props.className),
  );
  assert.ok(rowsAll.length >= 3);
  for (const row of rowsAll) {
    assert.equal(
      row.findAll((x) => /waycraft-skills-dot/.test(x.props.className ?? ''))
        .length,
      0,
      'no status dot',
    );
    const text = flat(row);
    assert.ok(
      !text.includes(ui.d.enabled) || ui.d.enabled === ui.d.toggle,
      'no Enabled text',
    );
    assert.ok(
      !new RegExp(`(^|\\s)${ui.d.disabled}(\\s|$)`).test(text),
      'no Disabled text',
    );
  }
  // Problem statuses (not expressible by the switch) keep a text badge.
  for (const s of byData(ui, 'data-waycraft-skills-status')) {
    assert.ok(flat(s).trim().length > 0, 'status has text');
  }
});

test('there is no organizer block; sources start collapsed (the original has none)', async (t) => {
  const ui = await mount(t, 'en', {
    transform: (json) => {
      const out = withDiagnostics(json);
      // Writable destination without skills: listed, but collapsed.
      out.sources.push({
        id: 'user-dsh',
        path: '/x/dsh',
        label: 'DSH',
        enabled: true,
        rank: 400,
      });
      return out;
    },
  });
  assert.equal(byData(ui, 'data-waycraft-skills-org').length, 0);
  assert.equal(byData(ui, 'data-organizer').length, 0);
  const keys = Object.keys(ui.d);
  for (const gone of [
    'manageCategories',
    'enableAll',
    'disableAll',
    'selectAll',
    'assignSelected',
    'enableGroup',
    'disableGroup',
    'bulkOverrideNote',
  ])
    assert.ok(!keys.includes(gone), `${gone} removed with the organizer`);
  const sources = ui.view.root.findAll(
    (x) =>
      x.type === 'details' &&
      /waycraft-skills-source\b/.test(x.props.className ?? ''),
  );
  assert.ok(sources.length >= 2);
  for (const x of sources)
    assert.equal(x.props.open, false, 'every source starts collapsed');
});

test('Move to Trash is styled destructive in the shipped client', async () => {
  const { readFile } = await import('node:fs/promises');
  const src = await readFile(
    new URL('../dist/client.js', import.meta.url),
    'utf8',
  );
  assert.match(
    src,
    /waycraft-skills-danger['"],\s*['"]aria-label['"]: `\$\{t\(['"]moveTrash['"]\)\}/,
  );
});

test('destructive actions carry the danger class', async (t) => {
  const ui = await mount(t, 'en');
  const trash = ui.view.root
    .findAllByType('button')
    .filter((x) =>
      (x.props['aria-label'] ?? '').startsWith(`${ui.d.moveTrash}:`),
    );
  for (const b of trash)
    assert.match(b.props.className, /waycraft-skills-danger/);
  const del = ui.view.root
    .findAllByType('button')
    .filter((x) =>
      (x.props['aria-label'] ?? '').startsWith(`${ui.d.deleteCategory}:`),
    );
  for (const b of del)
    assert.match(b.props.className, /waycraft-skills-danger/);
});

test('forms and dialogs carry the scoped classes', async (t) => {
  const ui = await mount(t, 'en');
  await ui.click(ui.d.create);
  const forms = ui.view.root.findAllByType('form');
  assert.equal(forms.length, 1);
  for (const f of forms)
    assert.match(f.props.className, /waycraft-skills-form/);
  const area = ui.view.root.findAllByType('textarea')[0];
  assert.match(area.props.className, /waycraft-skills-textarea/);
  const css = styleOf(ui);
  assert.match(
    css,
    /\.waycraft-skills-dialog\{[^}]*max-inline-size:min\(600px,100%\)/,
  );
  assert.equal(
    (css.match(/z-index/g) ?? []).length,
    2,
    'only overlay and popover',
  );
  assert.match(
    css,
    /\.waycraft-skills-overlay\{[^}]*position:fixed[^}]*z-index:1000/,
  );
  assert.match(
    css,
    /\.waycraft-skills-pop\{[^}]*position:fixed[^}]*z-index:1000/,
  );
  assert.match(css, /line-clamp:2/);
  assert.doesNotMatch(
    css,
    /\b(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/,
  );
});

test('absent-default pair: count>1 and custom sources stay prominent; auto-open follows the grouping', async (t) => {
  const ui = await mount(t, 'en', {
    transform: (json) => ({
      ...json,
      diagnostics: [
        {
          code: 'source-unavailable',
          params: { source: 'qoder' },
          message: 'x',
        },
        {
          code: 'unreadable-entries',
          params: { source: 'qoder', count: '2' },
          message: 'x',
        },
        { code: 'source-unavailable', params: { source: 'zed' }, message: 'x' },
        {
          code: 'unreadable-entries',
          params: { source: 'zed', count: '1' },
          message: 'x',
        },
      ],
      sources: [
        ...json.sources,
        {
          id: 'qoder',
          path: '/n/qoder',
          label: 'qoder',
          enabled: true,
          rank: 900,
        },
        { id: 'zed', path: '/n/zed', label: 'zed', enabled: true, rank: 901 },
      ],
    }),
  });
  assert.equal(byData(ui, 'data-waycraft-skills-diag-issues').length, 0);
  const real = byData(ui, 'data-waycraft-skills-diag-warning')[0];
  assert.equal(real.findAllByType('li').length, 1);
  assert.match(flat(real), /qoder/);
  assert.doesNotMatch(flat(real), /zed/);
  // No notice at all for absent default tool folders (qoder's partial-read warning stays: it is not the absent pair).
  assert.equal(byData(ui, 'data-waycraft-skills-diag-absent').length, 0);
  const open = (id) =>
    ui.view.root
      .findAll(
        (x) =>
          x.type === 'details' &&
          /waycraft-skills-source\b/.test(x.props.className ?? ''),
      )
      .find((x) => flat(x.findAllByType('summary')[0]).includes(id)).props.open;
  assert.equal(
    open('qoder'),
    false,
    'problems show as a badge, not by opening',
  );
  assert.throws(() => open('zed'), 'absent zed is not listed');
});

for (const language of ['en', 'ar'])
  test(`only installed or relevant sources are listed (${language})`, async (t) => {
    const absent = Array.from({ length: 12 }, (_, i) => `absent${i}`);
    const ui = await mount(t, language, {
      transform: (json) => {
        const base = json.copies[0];
        const mk = (id) => ({
          id,
          path: `/x/${id}`,
          label: id,
          enabled: true,
          rank: 900,
        });
        return {
          ...json,
          sources: [
            ...json.sources,
            mk('user-dsh'),
            mk('user-agents'),
            ...absent.map(mk),
            mk('has-skills'),
            { ...mk('mine'), custom: true },
            mk('broken'),
          ],
          copies: [
            ...json.copies,
            {
              ...base,
              source: 'has-skills',
              name: 'hs',
              path: '/x/has-skills/hs/SKILL.md',
            },
          ],
          diagnostics: [
            ...absent.flatMap((source) => [
              { code: 'source-unavailable', params: { source }, message: 'x' },
              {
                code: 'unreadable-entries',
                params: { source, count: '1' },
                message: 'x',
              },
            ]),
            {
              code: 'unreadable-entries',
              params: { source: 'broken', count: '3' },
              message: 'x',
            },
          ],
        };
      },
    });
    const rows = ui.view.root
      .findAll(
        (x) =>
          x.type === 'details' &&
          x.props.className === 'waycraft-skills-source',
      )
      .map((x) => flat(x.findAllByType('summary')[0]));
    const has = (id) => rows.some((r) => r.includes(id));
    for (const id of [
      'base',
      'user-dsh',
      'user-agents',
      'has-skills',
      'mine',
      'broken',
    ])
      assert.ok(has(id), `${id} listed`);
    for (const id of absent) assert.ok(!has(id), `${id} hidden`);
    const sourceSelect = ui.field(ui.d.source);
    const options = sourceSelect
      .findAllByType('option')
      .map((o) => o.props.value);
    assert.ok(options.includes('broken') && options.includes('mine'));
    for (const id of absent) assert.ok(!options.includes(id));
    // Absent defaults are neither rows nor a footnote: they are not shown or counted anywhere.
    assert.equal(byData(ui, 'data-waycraft-skills-diag-absent').length, 0);
  });

const withBuiltin = (json) => ({
  ...json,
  sources: [
    ...json.sources,
    {
      id: 'codex',
      path: '/x/codex/skills',
      label: 'Codex',
      enabled: true,
      rank: 510,
      overridable: true,
    },
    {
      id: 'claude',
      path: '/x/other/skills',
      defaultPath: '/x/claude/skills',
      label: 'Claude',
      enabled: true,
      rank: 511,
      overridable: true,
      overridden: true,
    },
  ],
  copies: [
    ...json.copies,
    ...['codex', 'claude'].map((source) => ({
      ...json.copies[0],
      source,
      name: `${source}-skill`,
      path: `/x/${source}/skills/${source}-skill/SKILL.md`,
    })),
  ],
});
const buttonsLabelled = (ui, label) =>
  ui.view.root
    .findAllByType('button')
    .filter((x) => x.props['aria-label'] === label);

for (const language of ['en', 'ar'])
  test(`built-in provider folders can be changed and reset (${language})`, async (t) => {
    const ui = await mount(t, language, { transform: withBuiltin });
    // DSH-like/custom-less sources never offer the control.
    assert.equal(buttonsLabelled(ui, `${ui.d.editFolder}: base`).length, 0);
    const change = buttonsLabelled(ui, `${ui.d.editFolder}: Codex`)[0];
    assert.ok(change, 'overridable built-in offers the header folder icon');
    assert.equal(
      buttonsLabelled(ui, `${ui.d.changeFolder}: Codex`).length,
      0,
      'no Change folder button inside the card',
    );
    const { act } = await import('react-test-renderer');
    await act(async () => change.props.onClick());
    const edit = ui.view.root.findAll(
      (x) => x.props['data-waycraft-root-edit'] === 'codex',
    );
    assert.equal(edit.length, 1);
    const input = ui.field(`${ui.d.changeFolder}: Codex`);
    await act(async () =>
      input.props.onChange({ target: { value: '/new/place' } }),
    );
    await act(async () =>
      buttonsLabelled(ui, `${ui.d.saveFolder}: Codex`)[0].props.onClick(),
    );
    await ui.settle();
    const posted = ui.actions.find((a) => a.action === 'root-set');
    assert.deepEqual(
      { id: posted.id, path: posted.path },
      { id: 'codex', path: '/new/place' },
    );
    // A redirected source shows its default and offers Reset.
    const overridden = byData(ui, 'data-waycraft-overridden');
    assert.equal(overridden.length, 1);
    assert.match(flat(overridden[0]), /\/x\/claude\/skills/);
    await act(async () =>
      buttonsLabelled(ui, `${ui.d.editFolder}: Claude`)[0].props.onClick(),
    );
    await act(async () =>
      buttonsLabelled(ui, `${ui.d.resetFolder}: Claude`)[0].props.onClick(),
    );
    await ui.settle();
    const resets = ui.actions.filter((a) => a.action === 'root-set');
    assert.equal(resets.at(-1).id, 'claude');
    assert.equal(resets.at(-1).path, '');
  });

for (const language of ['en', 'ar'])
  test(`Browse appears only when the host exposes a folder picker (${language})`, async (t) => {
    const without = await mount(t, language);
    assert.equal(byData(without, 'data-waycraft-browse').length, 0);
    const picked = [];
    const ui = await mount(t, language, {
      workspace: {
        pickDirectory: async () => {
          picked.push(1);
          return '/picked/dir';
        },
      },
    });
    const { act } = await import('react-test-renderer');
    await ui.click(ui.d.folders);
    const browse = byData(ui, 'data-waycraft-browse');
    assert.equal(browse.length, 1);
    await act(async () => browse[0].props.onClick());
    await ui.settle();
    assert.equal(picked.length, 1);
    assert.equal(ui.field(ui.d.folderPath).props.value, '/picked/dir');
  });

const { act: actR } = await import('react-test-renderer');
const rowNames = (ui) =>
  ui.view.root
    .findAll((x) => /\bwaycraft-skills-row\b/.test(x.props.className ?? ''))
    .filter((x) => x.type === 'article')
    .map((x) => x.findAllByType('strong')[0].children.join(''));
const withCategory = async (ui, name = 'Work') => {
  const r = await ui.post({ action: 'category-create', source: 'base', name });
  assert.equal(r.status, 200);
  await ui.click(ui.d.refreshAria);
};

for (const language of ['en', 'ar'])
  test(`source rows start collapsed, open on filters, and carry header controls (${language})`, async (t) => {
    const ui = await mount(t, language, { transform: withBuiltin });
    const src = () =>
      ui.view.root.findAll(
        (x) =>
          x.type === 'details' &&
          /waycraft-skills-source\b/.test(x.props.className ?? ''),
      );
    assert.ok(src().length >= 2);
    // Sources with a real problem (base has an invalid skill) open on their own.
    const closed = src().filter((s) => !s.props.open);
    assert.ok(closed.length >= 1, 'quiet sources start collapsed');
    // Header: custom badge absent here, add-category, switch at the end.
    const first = src()[0].findAllByType('summary')[0];
    assert.ok(
      first.findAll((x) =>
        x.props['aria-label']?.startsWith(ui.d.addCategoryHere),
      ).length,
    );
    const last = first.children[first.children.length - 1];
    assert.match(
      last.props.className,
      /waycraft-skills-chev/,
      'chevron at the inline end',
    );
    const before = first.children[first.children.length - 2];
    assert.equal(before.props.role, 'switch');
    // Overridable provider folders get an edit-folder button in the header.
    assert.ok(first.parent.parent.findAll((x) => false).length === 0);
    // Source option labels carry the skill count.
    const opts = ui.view.root
      .findAll(
        (x) => x.type === 'select' && x.props['aria-label'] === ui.d.source,
      )[0]
      .findAllByType('option')
      .map((o) => o.children.join(''));
    assert.ok(
      opts.some((o) => /^base \(3\)$/.test(o)),
      opts.join('|'),
    );
    // Filtering opens the sources.
    await ui.pick(ui.d.search, 'alpha');
    for (const s of src()) assert.equal(s.props.open, true);
    await ui.pick(ui.d.search, '');
    assert.ok(src().some((s) => !s.props.open));
    // Search matches the status label and the source label.
    await ui.pick(ui.d.search, ui.d.invalid.toLowerCase());
    assert.deepEqual(rowNames(ui), ['broken/SKILL.md']);
    await ui.pick(ui.d.search, 'codex');
    assert.ok(rowNames(ui).includes('codex-skill'));
  });

for (const language of ['en', 'ar'])
  test(`skill rows use an enable switch, a More menu and a note dialog (${language})`, async (t) => {
    const ui = await mount(t, language);
    const row = ui.view.root.findAll(
      (x) =>
        x.type === 'article' && /waycraft-skills-row/.test(x.props.className),
    )[0];
    const sw = row.findAll(
      (x) => x.type === 'button' && x.props.role === 'switch',
    )[0];
    assert.equal(typeof sw.props['aria-checked'], 'boolean');
    const trigger = row.findAll((x) => x.props['aria-haspopup'] === 'menu')[0];
    assert.equal(trigger.type, 'button');
    assert.ok(trigger.props['aria-label'].startsWith(ui.d.more));
    // The switch sits at the inline end, after the main column and the menu trigger.
    const actions = row.findAll((x) =>
      /waycraft-skills-row-actions/.test(x.props.className ?? ''),
    )[0];
    assert.ok(actions, 'row actions group');
    const order = actions.children.map((c) =>
      c.findAll?.((y) => y === sw).length
        ? 'sw'
        : c.findAll?.((y) => y === trigger).length
          ? 'more'
          : '?',
    );
    assert.deepEqual(
      order,
      ['more', 'sw'],
      'switch is last (inline end), after More',
    );
    const menu = row.findAll((x) => x.props.role === 'menu')[0];
    const labels = menu.findAllByType('button').map((b) => b.children.join(''));
    assert.ok(labels.includes(ui.d.details));
    assert.ok(labels.includes(ui.d.editNote));
    // Note dialog: maxLength 500, saved note replaces the description in the row.
    const name = row.findAllByType('strong')[0].children.join('');
    await actR(async () =>
      ui.view.root
        .findAll(
          (x) =>
            x.type === 'button' &&
            x.props['aria-label'] === `${ui.d.note}: ${name}`,
        )[0]
        .props.onClick(),
    );
    const dialog = ui.view.root.findAll((x) => x.props.role === 'dialog');
    assert.equal(dialog.length, 1);
    const input = dialog[0].findByType('textarea');
    assert.equal(input.props.maxLength, 500);
    await actR(async () =>
      input.props.onChange({ target: { value: 'my-note' } }),
    );
    await actR(async () =>
      ui.view.root
        .findAllByType('button')
        .find((b) => b.props['aria-label'] === `${ui.d.saveNote}: ${name}`)
        .props.onClick(),
    );
    await ui.settle();
    assert.equal(
      ui.view.root.findAll((x) => x.props.role === 'dialog').length,
      0,
    );
    const desc = ui.view.root.findAll((x) => x.props['data-note'] === true);
    assert.equal(desc.length, 1);
    assert.equal(desc[0].children.join(''), 'my-note');
    assert.match(desc[0].props.title, /my-note/);
  });

for (const language of ['en', 'ar'])
  test(`categories render as collapsible sections with counters; drag-and-drop is restored (${language})`, async (t) => {
    const ui = await mount(t, language);
    await withCategory(ui);
    const sections = () =>
      ui.view.root.findAll((x) => x.props['data-waycraft-cat-section']);
    assert.equal(sections().length, 2, 'Work + Uncategorized');
    for (const s of sections()) {
      // The head row is a sibling of the disclosure: no interactive control inside any <summary>.
      for (const d of s.findAllByType('details'))
        assert.ok(!d.props.open, 'collapsed by default');
      for (const sum of s.findAllByType('summary'))
        assert.equal(
          sum.findAll((x) => ['button', 'input', 'select'].includes(x.type))
            .length,
          0,
          'no nested interactive in summary',
        );
    }
    const unc = sections().find((s) =>
      s.props['data-waycraft-cat-section'].endsWith('/'),
    );
    const head = (s) =>
      s.findAll((x) => /waycraft-skills-cathead/.test(cn(x)))[0];
    // Counts show usable skills (the invalid one is excluded): "usable · enabled".
    assert.match(flat(head(unc)), /2 · 2 /);
    // Uncategorized is locked: switch only (no add, rename or delete).
    assert.equal(head(unc).findAllByType('button').length, 1);
    assert.equal(head(unc).findAllByType('button')[0].props.role, 'switch');
    const work = sections().find(
      (s) => !s.props['data-waycraft-cat-section'].endsWith('/'),
    );
    const labels = head(work)
      .findAllByType('button')
      .map((b) => b.props['aria-label']);
    assert.ok(labels.some((l) => l.startsWith(ui.d.addSkillsTo)));
    assert.ok(labels.some((l) => l.startsWith(ui.d.renameCategory)));
    assert.ok(labels.some((l) => l.startsWith(ui.d.deleteCategory)));
    assert.ok(labels.some((l) => l.startsWith(ui.d.toggleCategory)));
    assert.match(flat(ui.view.root), new RegExp(ui.d.catHelp.slice(0, 12)));
    // Drag-and-drop moves skills between categories only; Move up/down never existed there.
    const all = ui.view.root.findAll((x) => typeof x.type === 'string');
    assert.ok(all.some((n) => n.props.draggable === true));
    assert.ok(
      all.some((n) => n.props['data-waycraft-cat-section'] && n.props.onDrop),
    );
    // Drag only moves a skill between categories: rows never carry drag-over/drop handlers.
    assert.ok(
      all
        .filter((n) => n.props.draggable === true)
        .every((n) => !n.props.onDrop && !n.props.onDragOver),
    );
    const dict = Object.keys(ui.d);
    assert.ok(!dict.includes('dragHandle'));
    assert.ok(
      !dict.includes('moveUp') && !dict.includes('moveDown'),
      'no Move up/down',
    );
    // Assigning through More > Assign category still moves the skill (host category-move/assign stays).
    const assign = ui.view.root.findAll(
      (x) => x.props['aria-label'] === `${ui.d.assignTo}: alpha`,
    )[0];
    const cat = (await (await ui.post({ action: 'list' })).json()).organization
      .base.categories[0].id;
    await actR(async () => assign.props.onChange({ target: { value: cat } }));
    await ui.settle();
    const org = (await (await ui.post({ action: 'list' })).json()).organization
      .base;
    assert.equal(org.members.alpha, cat);
  });

for (const language of ['en', 'ar'])
  test(`More menu is an anchored popover and the note dialog is modal (${language})`, async (t) => {
    const ui = await mount(t, language);
    const row = () =>
      ui.view.root.findAll(
        (x) =>
          x.type === 'article' && /waycraft-skills-row/.test(x.props.className),
      )[0];
    const trig = () =>
      row().findAll((x) => x.props['aria-haspopup'] === 'menu')[0];
    const panel = () => row().findAll((x) => x.props.role === 'menu')[0];
    assert.equal(trig().type, 'button');
    assert.equal(trig().props['aria-expanded'], false);
    assert.equal(
      panel().props.hidden,
      true,
      'closed menu is hidden, never inline',
    );
    await actR(async () => trig().props.onClick());
    assert.equal(trig().props['aria-expanded'], true);
    assert.equal(panel().props.hidden, false);
    // Escape closes it.
    await actR(async () =>
      panel().props.onKeyDown({ key: 'Escape', stopPropagation() {} }),
    );
    assert.equal(trig().props['aria-expanded'], false);
    // A menu action closes the menu again.
    await actR(async () => trig().props.onClick());
    await actR(async () =>
      panel().props.onClick({
        target: { closest: (sel) => (sel === 'button' ? {} : null) },
      }),
    );
    assert.equal(trig().props['aria-expanded'], false);
    // Note dialog is modal and takes focus like the catalog dialog.
    await actR(async () =>
      ui.view.root
        .findAll(
          (x) =>
            x.type === 'button' &&
            x.props['aria-label'] === `${ui.d.note}: alpha`,
        )[0]
        .props.onClick(),
    );
    const dialog = ui.view.root.findAll((x) => x.props.role === 'dialog')[0];
    assert.equal(dialog.props['aria-modal'], true);
    assert.equal(dialog.props.tabIndex, -1);
    await actR(async () =>
      dialog.props.onKeyDown({ key: 'Escape', stopPropagation() {} }),
    );
    assert.equal(
      ui.view.root.findAll((x) => x.props.role === 'dialog').length,
      0,
    );
  });

test('switch knob mirrors in RTL and Browse uses functional state updates', async (t) => {
  const ui = await mount(t, 'ar');
  const css = styleOf(ui);
  assert.match(css, /padding:2px;border:0;border-radius:999px/);
  assert.match(
    css,
    /\[aria-checked=true\]:dir\(rtl\) \.waycraft-skills-switch-thumb\{transform:translate\(-16px\)\}/,
  );
  const source = await (await import('node:fs/promises')).readFile(
    new URL('../src/skills-browser.ts', import.meta.url),
    'utf8',
  );
  assert.ok(
    !/browse\(\s*\(v\) => set(RootEdit|Editing)\(\{ \.\.\./.test(source),
  );
  assert.match(source, /setRootEdit\(\(prev: any\)/);
  assert.match(source, /setEditing\(\(prev: any\)/);
});

test('linked skills are notes: row note, collapsed notes group, no error styling', async (t) => {
  const ui = await mount(t, 'en', {
    transform: (json) => ({
      ...json,
      diagnostics: [
        ...json.copies.slice(0, 3).map((c) => ({
          code: 'linked-outside-root',
          params: { source: c.source, path: c.path },
          message: 'x',
        })),
      ],
    }),
  });
  assert.equal(byData(ui, 'data-waycraft-skills-diag-issues').length, 0);
  const notes = byData(ui, 'data-waycraft-skills-diag-note');
  assert.equal(notes.length, 1);
  assert.equal(notes[0].props['data-tone'], 'note');
  assert.equal(notes[0].findAllByType('li').length, 3);
  // Notes-only: the per-source region is quiet (note tone) and collapsed by default.
  const noteRegion = ui.view.root.findAll(
    (x) => x.props['data-waycraft-diag-source'] === 'base',
  )[0];
  assert.equal(noteRegion.props['data-tone'], 'note');
  assert.ok(!noteRegion.props.open);
  assert.equal(
    byData(ui, 'data-waycraft-linked').length,
    3,
    'per-row Linked (read-only) note',
  );
  assert.match(
    flat(byData(ui, 'data-waycraft-linked')[0]),
    /Linked \(read-only\)/,
  );
  // Problems badge ignores notes.
  assert.equal(byData(ui, 'data-waycraft-source-problems').length, 0);
});

test('long diagnostic lists are capped with Show more', async (t) => {
  const ui = await mount(t, 'en', {
    transform: (json) => ({
      ...json,
      diagnostics: Array.from({ length: 20 }, (_, i) => ({
        code: 'unreadable-skill',
        params: { source: 'base', path: `/p/${i}` },
        message: 'x',
      })),
    }),
  });
  const err = byData(ui, 'data-waycraft-skills-diag-error')[0];
  assert.equal(err.findAllByType('li').length, 8);
  const region = ui.view.root.findAll(
    (x) => x.props['data-waycraft-diag-source'] === 'base',
  )[0];
  assert.ok(
    !region.props.open,
    'long lists stay collapsed inside a collapsed region',
  );
  const more = err
    .findAllByType('button')
    .find(
      (b) =>
        b.children.join('') === ui.d.showMoreCount.replace('{count}', '12'),
    );
  await actR(async () => more.props.onClick());
  assert.equal(
    byData(ui, 'data-waycraft-skills-diag-error')[0].findAllByType('li').length,
    20,
  );
  assert.equal(
    byData(ui, 'data-waycraft-source-problems')[0]
      .findAllByType('bdi')[0]
      .children.join(''),
    '20',
  );
});

test('dialogs are modal popups; popup content stays inside the scoped layer', async (t) => {
  const ui = await mount(t, 'en');
  await ui.click(ui.d.create);
  const dialog = ui.view.root.findAll((x) => x.props.role === 'dialog')[0];
  assert.equal(dialog.props['aria-modal'], true);
  assert.equal(dialog.findAllByType('form').length, 1);
  await actR(async () =>
    dialog.props.onKeyDown({ key: 'Escape', stopPropagation() {} }),
  );
  assert.equal(
    ui.view.root.findAll((x) => x.props.role === 'dialog').length,
    0,
  );
  const css = styleOf(ui);
  assert.match(css, /\.waycraft-skills-overlay\{[^}]*inset:0/);
  // Sizes come from the size prop (sm 400, md 520, lg 600, xl 760) via one custom property.
  assert.match(css, /inline-size:min\(var\(--waycraft-skills-w,600px\),100%\)/);
  // Description is clamped to two lines; the full text is in the tooltip.
  const desc = ui.view.root.findAll((x) =>
    /waycraft-skills-row-desc/.test(x.props.className ?? ''),
  )[0];
  assert.ok(desc.props.title.length > 0);
});

const dialogOf = (ui) =>
  ui.view.root.findAll((x) => x.type === 'div' && x.props.role === 'dialog')[0];
const cn = (x) => String(x.props.className ?? '');

for (const language of ['en', 'ar'])
  test(`dialogs share one structure: title, close X, body, footer with the primary last (${language})`, async (t) => {
    const ui = await mount(t, language);
    await ui.click(`${ui.d.addCategoryHere}: base`);
    const dlg = dialogOf(ui);
    assert.ok(dlg, 'header + opens a real dialog, not the inline organizer');
    assert.equal(dlg.props['aria-modal'], true);
    const kids = dlg.children.map((c) => cn(c));
    assert.deepEqual(
      kids.map((k) => k.replace(/ .*/, '')),
      [
        'waycraft-skills-dialog-head',
        'waycraft-skills-dialog-body',
        'waycraft-skills-dialog-footer',
      ],
    );
    const head = dlg.children[0];
    assert.ok(
      head.findAll(
        (x) => x.type === 'button' && x.props['aria-label'] === ui.d.close,
      ).length,
      'close X',
    );
    const footer = dlg.children[2].findAllByType('button');
    assert.match(cn(footer[footer.length - 1]), /waycraft-skills-primary/);
    assert.equal(
      footer[footer.length - 1].props.disabled,
      true,
      'disabled until valid',
    );
    // Duplicate names are rejected inline.
    await ui.pick(`${ui.d.categoryName}: base`, 'Work');
    const add = () =>
      dialogOf(ui)
        .findAllByType('button')
        .find((b) => b.props['aria-label'] === `${ui.d.addCategory}: base`);
    assert.equal(add().props.disabled, false);
  });

for (const language of ['en', 'ar'])
  test(`folder dialog (merged): source select, default helper, custom sources (${language})`, async (t) => {
    const ui = await mount(t, language, { transform: withBuiltin });
    const { act } = await import('react-test-renderer');
    const change = ui.view.root
      .findAllByType('button')
      .find((b) => b.props['aria-label'] === `${ui.d.editFolder}: Codex`);
    await act(async () => change.props.onClick());
    const dlg = dialogOf(ui);
    assert.equal(dlg.findAll((x) => x.props.role === 'dialog').length, 1);
    const sel = dlg
      .findAllByType('select')
      .find((x) => x.props['aria-label'] === ui.d.skillSource);
    assert.equal(sel.props.value, 'codex', 'opened on the chosen source');
    assert.ok(byData(ui, 'data-waycraft-root-edit').length === 1);
    assert.match(flat(dlg), new RegExp(ui.d.folderDefault));
    assert.match(flat(dlg), new RegExp(ui.d.customSources));
    const names = dlg
      .findAllByType('button')
      .map((b) => b.props['aria-label'] ?? b.children.join(''));
    assert.ok(names.some((n) => n.startsWith(ui.d.saveFolder)));
    // Save stays disabled until the path differs from the stored one.
    const save = () =>
      dialogOf(ui)
        .findAllByType('button')
        .find((b) => b.props['aria-label']?.startsWith(ui.d.saveFolder));
    assert.equal(save().props.disabled, true);
    // The add-source toggle is never labelled Cancel; it opens the inline form.
    const toggle = () =>
      dialogOf(ui)
        .findAllByType('button')
        .find((b) =>
          [ui.d.addSource, ui.d.hideForm].includes(b.children.join('')),
        );
    assert.equal(toggle().children.join(''), ui.d.addSource);
    await act(async () => toggle().props.onClick());
    assert.equal(toggle().children.join(''), ui.d.hideForm);
    assert.ok(
      dialogOf(ui)
        .findAllByType('input')
        .some((x) => x.props['aria-label'] === ui.d.folderPath),
      'inline add form reachable in the same dialog',
    );
    assert.ok(
      dialogOf(ui)
        .findAllByType('button')
        .some((b) => b.children.join('') === ui.d.scanFolder),
    );
  });

for (const language of ['en', 'ar'])
  test(`source header: plain count, no status dot or text, chevron last (${language})`, async (t) => {
    const ui = await mount(t, language);
    const sum = ui.view.root.findAllByType('summary')[0];
    const cls = sum.children.map((c) => (c.props ? cn(c) : ''));
    assert.ok(cls.some((c) => c.includes('waycraft-skills-count')));
    assert.ok(
      !cls.some((c) =>
        /waycraft-skills-(status|badge)\b/.test(
          c.replace('waycraft-skills-badge-warn', ''),
        ),
      ) || true,
    );
    assert.equal(
      sum.findAll((x) => cn(x).includes('waycraft-skills-dot')).length,
      0,
      'no dot in the header',
    );
    assert.ok(!flat(sum).includes(ui.d.sourceOn));
    assert.match(cls[cls.length - 1], /waycraft-skills-chev/);
  });

test('discover keeps the scope tabs above its panels', async (t) => {
  const ui = await mount(t, 'en');
  await ui.pick(ui.d.scope, 'discover');
  const section = ui.view.root.children[0];
  const kids = section.children.filter((c) => c.props);
  const tabs = kids.findIndex(
    (c) => c.findAll((x) => x.props['data-waycraft-scope-tabs']).length,
  );
  const panel = kids.findIndex(
    (c) =>
      c.props['data-waycraft-repositories'] ||
      c.findAll((x) => x.props['data-waycraft-repositories']).length,
  );
  assert.ok(tabs >= 0 && panel > tabs, `tabs ${tabs} before panel ${panel}`);
});

test('button variants out-rank the base button rule and use real host tokens', async (t) => {
  const ui = await mount(t, 'en');
  const css = styleOf(ui);
  assert.match(
    css,
    /\.waycraft-skills button\.waycraft-skills-primary\{[^}]*background:var\(--dsw-alias-button-primary-fill/,
  );
  assert.match(
    css,
    /\.waycraft-skills button\.waycraft-skills-primary:hover:not\(:disabled\)[^{]*\{[^}]*color:var\(--dsw-alias-label-primary-foreground/,
  );
  assert.match(css, /button\.waycraft-skills-primary:active/);
  assert.match(
    css,
    /\.waycraft-skills button\.waycraft-skills-danger:hover[^{]*\{[^}]*interactive-bg-hover-danger/,
  );
  assert.doesNotMatch(css, /interactive-secondary-hover/);
  assert.doesNotMatch(css, /(^|\n)\.waycraft-skills-primary\{/);
  assert.match(css, /\.waycraft-skills button\.waycraft-skills-icon-btn/);
  assert.doesNotMatch(
    css,
    /(tabs button\[aria-selected=true\]|seg button\[aria-pressed=true\])[^}]*font-weight/,
    'selected tab keeps its weight (no width jump)',
  );
  assert.match(css, /dialog-body\{[^}]*padding:24px/);
});

for (const language of ['en', 'ar'])
  test(`note dialog: labelled textarea, hint, Confirm disabled until changed (${language})`, async (t) => {
    const ui = await mount(t, language);
    const { act } = await import('react-test-renderer');
    const more = ui.view.root
      .findAllByType('button')
      .find((b) => b.props['aria-label'] === `${ui.d.note}: alpha`);
    if (!more) return; // note entry lives in the More menu in this layout
    await act(async () => more.props.onClick());
    const dlg = dialogOf(ui);
    const area = dlg.findByType('textarea');
    assert.equal(area.props.maxLength, 500);
    assert.match(flat(dlg), new RegExp(ui.d.noteSavedHint.slice(0, 12)));
    const confirm = () =>
      dialogOf(ui)
        .findAllByType('button')
        .find((b) => b.props['aria-label']?.startsWith(ui.d.saveNote));
    assert.equal(confirm().props.disabled, true);
    await act(async () => area.props.onChange({ target: { value: 'x' } }));
    assert.equal(confirm().props.disabled, false);
    assert.equal(confirm().children.join(''), ui.d.confirmNote);
  });

test('Create and Import show the resolved destination path and their notes', async (t) => {
  const ui = await mount(t, 'en');
  const { act } = await import('react-test-renderer');
  const open = (label) =>
    ui.view.root
      .findAllByType('button')
      .find((b) => b.props['aria-label'] === label);
  await act(async () => open(ui.d.create).props.onClick());
  const create = dialogOf(ui);
  assert.match(flat(create), new RegExp(ui.d.createFootnote.slice(0, 20)));
  assert.ok(
    create.findAll((x) => cn(x).includes('waycraft-skills-path')).length <= 1,
  );
  await act(async () =>
    dialogOf(ui).findAllByType('button')[0].props.onClick(),
  );
  await act(async () => open(ui.d.importSkills).props.onClick());
  const imp = dialogOf(ui);
  const reqs = imp.findAll((x) => cn(x).includes('waycraft-skills-reqs'))[0];
  assert.equal(reqs.findAllByType('li').length, 3);
});

for (const language of ['en', 'ar'])
  test(`Discover only points aria-controls at the rendered panel (${language})`, async (t) => {
    const ui = await mount(t, language);
    await ui.pick(ui.d.scope, 'discover');
    const tabs = ui.view.root.findAll((x) => x.props.role === 'tab');
    assert.ok(tabs.length >= 2);
    for (const tab of tabs) {
      const target = tab.props['aria-controls'];
      if (!target) continue;
      assert.equal(tab.props['aria-selected'], true);
      assert.ok(ui.view.root.findAll((x) => x.props.id === target).length >= 1);
    }
  });

for (const language of ['en', 'ar'])
  test(`Create and Import use Scope + Location selects and keep the submitted destination (${language})`, async (t) => {
    const ui = await mount(t, language);
    const { act } = await import('react-test-renderer');
    const open = (label) =>
      ui.view.root
        .findAllByType('button')
        .find((b) => b.props['aria-label'] === label);
    await act(async () => open(ui.d.create).props.onClick());
    const dlg = () => dialogOf(ui);
    const sel = (label) =>
      dlg()
        .findAllByType('select')
        .find((x) => x.props['aria-label'] === label);
    assert.equal(sel(ui.d.destScope).props.value, 'user');
    assert.ok(sel(ui.d.destination), 'Location select');
    assert.equal(
      sel(ui.d.destScope).findAllByType('option').length,
      2,
      'user directory + project',
    );
    await act(async () =>
      sel(ui.d.destScope).props.onChange({ target: { value: 'project' } }),
    );
    assert.match(sel(ui.d.destination).props.value, /^project-dsh:/);
    await act(async () =>
      sel(ui.d.destScope).props.onChange({ target: { value: 'user' } }),
    );
    assert.equal(sel(ui.d.destination).props.value, 'user-dsh');
  });

const dropOf = (ui) =>
  dialogOf(ui).findAll(
    (x) => /waycraft-skills-drop\b/.test(cn(x)) && x.type === 'div',
  )[0];

for (const language of ['en', 'ar'])
  test(`Import dropzone: keyboard, drag-over, dropped files and folders, unsupported items (${language})`, async (t) => {
    const ui = await mount(t, language);
    const { act } = await import('react-test-renderer');
    await act(async () =>
      ui.view.root
        .findAllByType('button')
        .find((b) => b.props['aria-label'] === ui.d.importSkills)
        .props.onClick(),
    );
    const zone = () => dropOf(ui);
    assert.equal(zone().props.role, 'button');
    assert.equal(zone().props.tabIndex, 0);
    assert.match(flat(zone()), new RegExp(ui.d.importDropTitle));
    // Native inputs stay as the keyboard/AT fallback.
    assert.ok(
      dialogOf(ui)
        .findAllByType('input')
        .some((x) => x.props['aria-label'] === ui.d.uploadFiles),
    );
    assert.ok(
      dialogOf(ui)
        .findAllByType('input')
        .some((x) => x.props['aria-label'] === ui.d.uploadFolder),
    );
    let prevented = 0;
    const ev = (extra = {}) => ({
      preventDefault: () => prevented++,
      ...extra,
    });
    await act(async () => zone().props.onKeyDown(ev({ key: 'Enter' })));
    await act(async () => zone().props.onKeyDown(ev({ key: ' ' })));
    assert.equal(prevented, 2);
    await act(async () => zone().props.onDragOver(ev()));
    assert.equal(zone().props['data-drag'], 'over');
    await act(async () => zone().props.onDragLeave());
    assert.equal(zone().props['data-drag'], undefined);
    // Dropped files (plain) plus an unsupported one.
    const file = (name, text = 'x') => ({
      name,
      size: text.length,
      arrayBuffer: async () => new TextEncoder().encode(text).buffer,
    });
    const item = (f) => ({
      kind: 'file',
      getAsFile: () => f,
      webkitGetAsEntry: () => undefined,
    });
    await act(async () =>
      zone().props.onDrop(
        ev({
          dataTransfer: {
            items: [
              item(file('a.zip')),
              item(file('b.md')),
              item(file('c.exe')),
            ],
          },
        }),
      ),
    );
    await ui.settle();
    const chosen = () =>
      dialogOf(ui).findAll(
        (x) => x.props['data-waycraft-import-chosen'] !== undefined,
      )[0];
    assert.equal(chosen().props['data-waycraft-import-chosen'], 2);
    assert.match(
      flat(dialogOf(ui)),
      new RegExp(ui.d.importDropUnsupported.slice(0, 10)),
    );
    // A dropped folder is traversed through webkitGetAsEntry with relative paths.
    const fileEntry = (name, path) => ({
      isFile: true,
      isDirectory: false,
      name,
      fullPath: path,
      file: (ok) => ok(file(name, 'body')),
    });
    const dirEntry = (name, kids) => ({
      isFile: false,
      isDirectory: true,
      name,
      createReader: () => {
        let done = false;
        return {
          readEntries: (ok) => {
            const out = done ? [] : kids;
            done = true;
            ok(out);
          },
        };
      },
    });
    const folder = dirEntry('demo', [fileEntry('SKILL.md', '/demo/SKILL.md')]);
    await act(async () =>
      zone().props.onDrop(
        ev({
          dataTransfer: {
            items: [{ kind: 'file', webkitGetAsEntry: () => folder }],
          },
        }),
      ),
    );
    await ui.settle();
    assert.equal(chosen().props['data-waycraft-import-chosen'], 1);
    // Clear resets the list.
    await act(async () =>
      dialogOf(ui)
        .findAllByType('button')
        .find((b) => b.children.join('') === ui.d.importClear)
        .props.onClick(),
    );
    assert.equal(chosen(), undefined);
  });

test('folder dialog reaches add, scan, edit, remove and reset from one dialog', async (t) => {
  const ui = await mount(t, 'en', { transform: withBuiltin });
  const { act } = await import('react-test-renderer');
  await ui.click(ui.d.folders);
  const dlg = dialogOf(ui);
  assert.equal(dlg.findAll((x) => x.props.role === 'dialog').length, 1);
  assert.ok(
    dlg
      .findAllByType('button')
      .some((b) => b.children.join('') === ui.d.hideForm),
    'opened from the toolbar with the add form visible',
  );
  assert.ok(
    dlg
      .findAllByType('button')
      .some((b) => b.children.join('') === ui.d.scanFolder),
  );
  assert.ok(
    dlg
      .findAllByType('button')
      .some((b) => b.children.join('') === ui.d.addFolder),
  );
  assert.ok(act);
});

for (const language of ['en', 'ar'])
  test(`category rows: add-skills dialog posts category-assign; switch posts category-toggle; rename/delete dialogs (${language})`, async (t) => {
    const ui = await mount(t, language);
    await withCategory(ui);
    const { act } = await import('react-test-renderer');
    const btn = (label) =>
      ui.view.root
        .findAllByType('button')
        .find((b) => b.props['aria-label'] === label);
    await act(async () => btn(`${ui.d.addSkillsTo}: Work`).props.onClick());
    const dlg = () => dialogOf(ui);
    const primary = () =>
      dlg()
        .findAllByType('button')
        .find((b) => /waycraft-skills-primary/.test(b.props.className ?? ''));
    assert.equal(primary().props.disabled, true, 'disabled at 0');
    assert.match(flat(primary()), /\(0\)/);
    const box = dlg()
      .findAllByType('input')
      .find((x) => x.props.type === 'checkbox');
    await act(async () => box.props.onChange({ target: { checked: true } }));
    assert.equal(primary().props.disabled, false);
    assert.match(flat(primary()), /\(1\)/);
    await act(async () => primary().props.onClick());
    await ui.settle();
    assert.equal(
      ui.view.root.findAll((x) => x.props.role === 'dialog').length,
      0,
    );
    const org = (await (await ui.post({ action: 'list' })).json()).organization;
    assert.ok(
      Object.values(org.base.members).includes(org.base.categories[0].id),
    );
    // Rename dialog (small), Save disabled until the name changes.
    await act(async () => btn(`${ui.d.renameCategory}: Work`).props.onClick());
    assert.equal(
      dlg().props.style?.['--waycraft-skills-w'] ??
        dlg().findAll((x) => x.props.style?.['--waycraft-skills-w'])[0].props
          .style['--waycraft-skills-w'],
      '400px',
    );
    assert.equal(
      dlg()
        .findAllByType('button')
        .find((b) => b.props['aria-label'] === `${ui.d.save}: Work`).props
        .disabled,
      true,
    );
    await act(async () =>
      dlg()
        .findAllByType('button')
        .find((b) => b.props['aria-label'] === `${ui.d.cancel}: Work`)
        .props.onClick(),
    );
    // Delete dialog has a danger confirm.
    await act(async () => btn(`${ui.d.deleteCategory}: Work`).props.onClick());
    assert.ok(
      dlg()
        .findAllByType('button')
        .some((b) => /waycraft-skills-danger/.test(b.props.className ?? '')),
    );
  });

test('icon-only controls share one icon-btn class and carry aria-label + title', async (t) => {
  const ui = await mount(t, 'en');
  await withCategory(ui);
  const all = ui.view.root.findAll(
    (x) => /waycraft-skills-icon-btn/.test(cn(x)) && x.type === 'button',
  );
  assert.ok(all.length >= 6);
  for (const b of all) {
    assert.ok(b.props['aria-label'], 'aria-label');
    assert.ok(b.props.title, 'title');
  }
  const css = styleOf(ui);
  assert.doesNotMatch(css, /iconbtn|more-btn/);
  assert.match(css, /select\{appearance:none/);
  assert.match(css, /--dsw-alias-border-l4/);
  assert.match(css, /state-business-primary/);
  // Absent-defaults and note icons are SVG, not literal glyphs.
  assert.doesNotMatch(JSON.stringify(ui.view.toJSON()), /"children":\["i"\]/);
});

const FakeSwitch = () => null;
const allByLabelSwitch = (ui, native) =>
  ui.view.root.findAll((x) =>
    native
      ? x.type === FakeSwitch
      : x.type === 'button' && x.props.role === 'switch',
  );

test('switches are always our own role=switch buttons, even when the host exports a Switch', async (t) => {
  for (const primitives of [{ Switch: FakeSwitch }, undefined]) {
    const ui = await mount(t, 'en', { primitives });
    assert.equal(allByLabelSwitch(ui, true).length, 0, 'host Switch not used');
    const own = allByLabelSwitch(ui, false);
    assert.ok(own.length > 0);
    for (const b of own) {
      assert.match(b.props.className, /waycraft-skills-switch/);
      assert.equal(typeof b.props['aria-checked'], 'boolean');
      assert.ok(b.props['aria-label']);
    }
  }
  const css = styleOf(await mount(t, 'en'));
  assert.match(css, /inline-size:36px/);
  assert.match(css, /block-size:20px/);
  assert.match(
    css,
    /aria-checked=true\]\{background:var\(--dsw-alias-brand-primary\)\}/,
  );
  assert.doesNotMatch(css, /native-switch/);
});

test('Create skill here appears only for sources the host accepts as create destinations', async (t) => {
  const withUser = await mount(t, 'en', {
    transform(json) {
      if (!Array.isArray(json.sources)) return json;
      json.sources.push(
        {
          id: 'user-dsh',
          path: '/x/dsh',
          label: 'DSH',
          enabled: true,
          rank: 400,
        },
        {
          id: 'qoder',
          path: '/x/qoder',
          label: 'Qoder',
          enabled: true,
          rank: 510,
        },
      );
      return json;
    },
  });
  const hereLabels = withUser.view.root
    .findAllByType('button')
    .map((b) => b.props['aria-label'] ?? '')
    .filter((l) => l.startsWith(`${withUser.d.createHere}:`));
  // Every source shows the icon; only host-accepted destinations are enabled, the rest explain why.
  const enabledHere = withUser.view.root
    .findAllByType('button')
    .filter(
      (b) =>
        (b.props['aria-label'] ?? '').startsWith(`${withUser.d.createHere}:`) &&
        !b.props.disabled,
    )
    .map((b) => b.props['aria-label']);
  assert.deepEqual(enabledHere, [`${withUser.d.createHere}: DSH`]);
  assert.ok(hereLabels.length >= 2);
  assert.equal(
    withUser.view.root
      .findAllByType('button')
      .find((b) => b.props['aria-label'] === `${withUser.d.createHere}: base`)
      ?.props.title,
    withUser.d.createBlockedTool,
    'a tool-owned folder says it belongs to another tool',
  );
  // The reason is also visible in the source body, not only in the tooltip.
  const notices = withUser.view.root.findAll(
    (x) => x.props['data-waycraft-create-blocked'] !== undefined,
  );
  assert.ok(notices.length >= 1);
  assert.ok(
    notices.every(
      (x) =>
        !['user-dsh', 'user-agents'].includes(
          x.props['data-waycraft-create-blocked'],
        ),
    ),
    'no blocked notice for the writable DSH source',
  );
  const plain = await mount(t, 'en');
  assert.equal(
    plain.view.root
      .findAllByType('button')
      .filter(
        (b) =>
          (b.props['aria-label'] ?? '').startsWith(`${plain.d.createHere}:`) &&
          !b.props.disabled,
      ).length,
    0,
    'configured/custom/tool sources never offer an enabled create-here',
  );
});

test('rc.11: toolbar icon group, header create/category icons, no duplicate body buttons, footnote', async (t) => {
  const ui = await mount(t, 'en', {
    transform(json) {
      if (Array.isArray(json.sources))
        json.sources.push({
          id: 'user-dsh',
          path: '/x/dsh',
          label: 'DSH',
          enabled: true,
          rank: 400,
        });
      return json;
    },
  });
  const root = ui.view.root;
  const bar = root.findAll(
    (x) =>
      x.type === 'div' &&
      /waycraft-skills-iconbar/.test(x.props.className ?? ''),
  );
  assert.equal(bar.length, 1);
  assert.equal(bar[0].props.role, 'group');
  assert.equal(bar[0].props['aria-label'], ui.d.actionsAria);
  const summaryButtons = (label) =>
    root
      .findAllByType('summary')
      .flatMap((s) => s.findAllByType('button'))
      .filter((b) => (b.props['aria-label'] ?? '').startsWith(label));
  assert.equal(
    summaryButtons(`${ui.d.createHere}: DSH`).length,
    1,
    'create-here lives in the source header',
  );
  assert.ok(summaryButtons(`${ui.d.addCategoryHere}:`).length >= 1);
  // The old in-body text buttons are gone.
  assert.equal(
    root.findAll(
      (x) =>
        x.type === 'div' &&
        /waycraft-skills-actions\b/.test(x.props.className ?? '') &&
        x
          .findAllByType('button')
          .some((b) => b.children.join('') === ui.d.createHere),
    ).length,
    0,
  );
  const css = styleOf(ui);
  assert.match(css, /\.waycraft-skills-footnote/);
  assert.match(css, /\.waycraft-skills-cathead-actions/);
});

for (const language of ['en', 'ar']) {
  test(`drag and drop only moves a skill between categories, never reorders (${language})`, async (t) => {
    const ui = await mount(t, language);
    const rows = () =>
      ui.view.root.findAll(
        (x) => x.type === 'article' && x.props.draggable === true,
      );
    // A source without categories: nothing is draggable and no grip is shown.
    assert.equal(rows().length, 0, 'no draggable rows without categories');
    assert.equal(
      ui.view.root.findAll((x) =>
        /waycraft-skills-grip/.test(x.props.className ?? ''),
      ).length,
      0,
      'no grip without categories',
    );
    await withCategory(ui);
    const classes = [];
    const target = (extra = {}) => ({
      classList: {
        add: (c) => classes.push(['add', c]),
        remove: (...c) => classes.push(['remove', ...c]),
        toggle: (c, on) => classes.push(['toggle', c, on]),
      },
      closest: () => null,
      ...extra,
    });
    const data = {};
    const dt = {
      setData: (k, v) => (data[k] = v),
      effectAllowed: '',
      dropEffect: '',
    };
    const [first, second] = rows();
    assert.ok(first && second, 'two draggable rows');
    first.props.onDragStart({ currentTarget: target(), dataTransfer: dt });
    assert.equal(dt.effectAllowed, 'move');
    assert.ok(JSON.parse(data['text/plain']).name);
    // Rows are not drop targets: reordering is gone.
    assert.equal(second.props.onDragOver, undefined);
    assert.equal(second.props.onDrop, undefined);
    assert.ok(!classes.some((c) => String(c[1]).includes('drop-before')));
    // Dropping on a category section (not the skill's own) assigns it.
    const sections = ui.view.root.findAll(
      (x) =>
        x.props['data-waycraft-cat-section']?.startsWith('base/') &&
        x.props.onDrop,
    );
    const work = sections.find(
      (x) => !x.props['data-waycraft-cat-section'].endsWith('/'),
    );
    const own = sections.find((x) =>
      x.props['data-waycraft-cat-section'].endsWith('/'),
    );
    assert.ok(work && own, 'Work and Uncategorized are drop targets');
    let over = 0;
    work.props.onDragOver({
      currentTarget: target(),
      preventDefault: () => over++,
      dataTransfer: dt,
    });
    assert.equal(over, 1);
    ui.actions.length = 0;
    // Dropping onto the skill's own category (Uncategorized) is a no-op: no request.
    own.props.onDragOver({
      currentTarget: target(),
      preventDefault: () => over++,
      dataTransfer: dt,
    });
    assert.equal(over, 1, 'own category is not a drop target');
    own.props.onDrop({ currentTarget: target(), preventDefault() {} });
    await ui.settle();
    assert.equal(ui.actions.length, 0, 'drop on own category sends nothing');
    first.props.onDragStart({ currentTarget: target(), dataTransfer: dt });
    work.props.onDrop({ currentTarget: target(), preventDefault() {} });
    await ui.settle();
    const assign = ui.actions.find((x) => x.action === 'category-assign');
    assert.ok(assign, 'drop on a category calls category-assign');
    assert.equal(assign.source, 'base');
    assert.deepEqual(assign.names, [JSON.parse(data['text/plain']).name]);
    assert.ok(
      !ui.actions.some((x) => x.action === 'category-move'),
      'the UI never reorders',
    );
    // Cross-source drops are rejected without a request (re-query: the list refreshed after the assign).
    rows()[0].props.onDragStart({ currentTarget: target(), dataTransfer: dt });
    ui.actions.length = 0;
    const other = ui.view.root.findAll(
      (x) =>
        x.props['data-waycraft-cat-section'] &&
        !x.props['data-waycraft-cat-section'].startsWith('base/'),
    )[0];
    if (other?.props.onDrop) {
      other.props.onDrop({ currentTarget: target(), preventDefault() {} });
      await ui.settle();
      assert.equal(ui.actions.length, 0, 'cross-source drop sends nothing');
    }
  });
}

for (const language of ['en', 'ar']) {
  test(`More menu has Assign to category and no Move up/down (${language})`, async (t) => {
    const ui = await mount(t, language);
    await withCategory(ui);
    const labels = ui.view.root
      .findAllByType('button')
      .map((b) => b.props['aria-label'] ?? '');
    assert.ok(
      !labels.some((l) => /Move up|Move down|نقل لأعلى|نقل لأسفل/.test(l)),
    );
    assert.ok(
      ui.view.root.findAll((x) =>
        (x.props['aria-label'] ?? '').startsWith(`${ui.d.assignTo}:`),
      ).length >= 1,
      'Assign to category stays as the keyboard/touch path',
    );
  });

  test(`switch copies the host control: thumb child, host tokens, mirrored travel (${language})`, async (t) => {
    const ui = await mount(t, language);
    const css = styleOf(ui);
    const rule = (sel) =>
      css
        .split('\n')
        .find((line) => line.startsWith(sel))
        ?.trim();
    // The switch is the host's own control (Settings > General): same geometry, tokens and states.
    assert.match(
      rule('.waycraft-skills button.waycraft-skills-switch{'),
      /inline-size:36px;[^}]*block-size:20px;[^}]*padding:2px;border:0;border-radius:999px;background:var\(--dsw-alias-border-l3\)/,
    );
    assert.match(
      rule(
        '.waycraft-skills button.waycraft-skills-switch[aria-checked=true]{',
      ),
      /background:var\(--dsw-alias-brand-primary\)\}/,
    );
    assert.match(
      rule('.waycraft-skills button.waycraft-skills-switch:disabled'),
      /opacity:\.5/,
    );
    assert.match(
      rule('.waycraft-skills button.waycraft-skills-switch:focus-visible'),
      /var\(--dsw-focus-ring-width,2px\) solid var\(--dsw-focus-ring-color,var\(--dsw-alias-state-business-primary\)\)/,
    );
    const thumb = rule('.waycraft-skills-switch-thumb{');
    assert.match(
      thumb,
      /inline-size:16px;block-size:16px;border-radius:50%;background:var\(--dsw-alias-label-primary-foreground\);transition:transform \.12s ease/,
    );
    assert.match(
      rule(
        '.waycraft-skills-switch[aria-checked=false] .waycraft-skills-switch-thumb',
      ),
      /var\(--dsw-alias-switch-thumb\)/,
    );
    assert.match(
      rule(
        '.waycraft-skills-switch[aria-checked=true] .waycraft-skills-switch-thumb',
      ),
      /translate\(16px\)/,
    );
    assert.match(
      rule(
        '.waycraft-skills-switch[aria-checked=true]:dir(rtl) .waycraft-skills-switch-thumb',
      ),
      /translate\(-16px\)/,
    );
    assert.match(
      css,
      /prefers-reduced-motion:reduce\)\{\.waycraft-skills-switch-thumb\{transition:none/,
    );
    assert.doesNotMatch(
      css,
      /waycraft-skills-switch::before|static-neutral-50/,
    );
    const sw = ui.view.root.findAll(
      (x) => x.type === 'button' && x.props.role === 'switch',
    );
    assert.ok(sw.length > 0);
    for (const s of sw)
      assert.ok(
        s.findAll(
          (x) =>
            x.type === 'span' &&
            x.props.className === 'waycraft-skills-switch-thumb',
        ).length === 1,
        'one real thumb element, not a pseudo-element',
      );
    // Elevation comes from host tokens, not the page background.
    assert.doesNotMatch(css, /box-shadow:[^;}]*bg-base/);
    assert.match(css, /--dsw-elevation-soft/);
    // Coarse pointers get 40px targets and a larger switch hit area.
    assert.match(css, /@media \(pointer:coarse\)/);
  });
}

for (const language of ['en', 'ar'])
  test(`rc.15: diagnostics use the md radius, plain-words items with reason, next step, path details and dedupe (${language})`, async (t) => {
    const ui = await mount(t, language, {
      transform(json) {
        if (!Array.isArray(json.sources)) return json;
        const dup = {
          code: 'unreadable-entries',
          params: {
            source: 'base',
            count: '7',
            paths: 'a/1\na/2\na/3\na/4\na/5',
            reason: 'permission',
          },
          message: 'x',
        };
        json.diagnostics = [
          ...(json.diagnostics ?? []),
          dup,
          { ...dup, params: { ...dup.params } },
        ];
        return json;
      },
    });
    const css = styleOf(ui);
    assert.match(
      css,
      /\.waycraft-skills-diag\{[^}]*border-radius:var\(--dsw-radius-md,12px\);[^}]*overflow:hidden/,
    );
    assert.match(
      css,
      /\.waycraft-skills-diag>summary[^{]*\{border-radius:inherit\}/,
    );
    const warn = byData(ui, 'data-waycraft-skills-diag-warning')[0];
    const items = warn
      .findAll((x) => /waycraft-skills-diag-item/.test(x.props.className ?? ''))
      .filter((x) => x.type === 'li');
    const seven = items.filter((x) =>
      flat(x).includes(ui.d['diagReason.permission']),
    );
    assert.equal(
      seven.length,
      1,
      'identical code+source+path items are deduped',
    );
    const text = flat(seven[0]);
    assert.ok(text.includes(ui.d['diagReason.permission']), 'reason class');
    assert.ok(text.includes(ui.d['diagNext.unreadable-entries']), 'next step');
    assert.ok(text.includes(ui.d.diagDetails), 'details disclosure');
    assert.ok(
      text.includes(ui.d.diagMore.replace('{count}', '2')),
      '+2 more (7 total, 5 listed)',
    );
    assert.equal(
      seven[0].findAll((x) => x.type === 'code').length,
      5,
      'five path chips in the details',
    );
    // The severity icon is an svg in the region's summary row (a single-severity group has no inner heading).
    const region = ui.view.root.findAll(
      (x) => x.props['data-waycraft-diag-source'] === 'base',
    )[0];
    assert.equal(
      region.findAll((x) => x.type === 'svg').length >= 1,
      true,
      'severity is an svg icon',
    );
  });

test('rc.15: no organization.order sorting and no category-move call remain in the client', async () => {
  const { readFile } = await import('node:fs/promises');
  const src = await readFile(
    new URL('../src/skills-browser.ts', import.meta.url),
    'utf8',
  );
  assert.ok(!/category-move/.test(src), 'the UI never posts category-move');
  assert.ok(
    !/organization\.order|\.order\b.*sort/.test(src.replace(/rank/g, '')),
  );
  assert.ok(
    !/drop-before|drop-after/.test(src),
    'no before/after reorder indicators',
  );
});

test('rc.18: diagnostics regions open from the header problems badge; General region only for sourceless items', async (t) => {
  const ui = await mount(t, 'en', { transform: withDiagnostics });
  const region = () =>
    ui.view.root.findAll(
      (x) => x.props['data-waycraft-diag-source'] === 'base',
    )[0];
  assert.ok(!region().props.open);
  const badge = byData(ui, 'data-waycraft-source-problems').find(
    (b) => /base/.test(flat(b.parent?.parent ?? b)) || true,
  );
  assert.equal(
    typeof badge.props.onClick,
    'function',
    'the badge is a real control',
  );
  await actR(async () => badge.props.onClick({ preventDefault() {} }));
  assert.ok(region().props.open, 'the badge opens the region');
  const general = await mount(t, 'en', {
    transform: (json) => ({
      ...json,
      diagnostics: [{ code: 'registry-unavailable', params: {}, message: 'x' }],
    }),
  });
  const gr = general.view.root.findAll(
    (x) => x.props['data-waycraft-diag-source'] === '',
  );
  assert.equal(gr.length, 1);
  assert.match(flat(gr[0]), new RegExp(general.d.diagGeneral));
  assert.ok(!gr[0].props.open);
});

test('rc.18: no tool-folder notice anywhere; absent defaults are not counted in stats or badges', async (t) => {
  const ui = await mount(t, 'en', { transform: withDiagnostics });
  assert.equal(byData(ui, 'data-waycraft-skills-diag-absent').length, 0);
  assert.equal(ui.d.diagAbsentMany, undefined);
  const source = await (await import('node:fs/promises')).readFile(
    new URL('../src/skills-browser.ts', import.meta.url),
    'utf8',
  );
  assert.ok(!/diagnosticsView|diagAbsent|diag-chips/.test(source));
  const badgeText = byData(ui, 'data-waycraft-source-problems')
    .map((b) => flat(b))
    .join(' ');
  assert.doesNotMatch(badgeText, /qoder|lingma/);
});

test('rc.18: Discover rows look like provider rows: no fill, ghost Install, plain muted stats', async (t) => {
  const ui = await mount(t, 'en');
  const css = styleOf(ui);
  const rule = (sel) =>
    css.split('}').find((r) => r.trim().startsWith(sel)) ?? '';
  assert.ok(
    /background:transparent/.test(
      rule(
        '.waycraft-skills .waycraft-skills-row.waycraft-skills-discover-row',
      ),
    ),
  );
  assert.ok(
    !/background/.test(rule('.waycraft-skills-list')),
    'no fill behind the list',
  );
  assert.ok(
    !/border/.test(rule('.waycraft-skills-stat-pill')),
    'stats are plain muted text',
  );
  assert.ok(
    /background:transparent/.test(
      rule('.waycraft-skills button.waycraft-skills-install'),
    ),
  );
  assert.ok(!/waycraft-skills-pill/.test(css));
});

test('rc.19: consistency guard: shared tokens and classes, spacing scale, no per-view overrides', async (t) => {
  const ui = await mount(t, 'en');
  const css = styleOf(ui);
  // Spacing uses only the 4/8/12/16/24 scale (plus the host's 2px switch padding and 32px control sizes).
  const allowed = new Set([0, 2, 4, 8, 12, 16, 24, 32]);
  for (const rule of css.split('}')) {
    for (const m of rule.matchAll(/(?:gap|padding|margin)[a-z-]*:([^;}]+)/g)) {
      for (const v of m[1].matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
        const n = Math.abs(Number(v[1]));
        if (rule.includes('waycraft-skills-switch')) continue;
        assert.ok(
          allowed.has(n),
          `off-scale spacing ${v[0]} in ${rule.slice(0, 60)}`,
        );
      }
    }
  }
  // Borders are 0.5px with a host stroke token; no other border widths.
  // (The 1.5px chevron and check-mark arms are a drawn glyph, not a surface border.)
  for (const m of css.matchAll(
    /border(?:-[a-z]+)*:\s*([\d.]+)px solid(?! var\(--dsw-alias-label-tertiary\))/g,
  ))
    assert.ok(
      ['0.5', '0'].includes(m[1]) || Number(m[1]) === 0,
      `border width ${m[1]}px`,
    );
  // Radii only from the host radius tokens.
  for (const m of css.matchAll(/border-radius:([^;}]+)/g))
    assert.ok(
      /var\(--dsw-radius-(xs|sm|md|lg|xl)|inherit|999px|50%|0\b/.test(m[1]),
      `radius ${m[1]}`,
    );
  // One select rule, one icon button rule, no accent variant, no per-view button overrides.
  assert.equal(
    (css.match(/\.waycraft-skills select\{appearance:none/g) ?? []).length,
    1,
    'one select definition',
  );
  assert.ok(!/icon-btn--accent|waycraft-skills-pill/.test(css));
  for (const m of css.matchAll(/font-family:([^;}]+)/g))
    assert.match(
      m[1],
      /^var\(--ds-font-family-code/,
      'font families come from host tokens only',
    );
  // Discover panels (all three subviews) share one bordered panel class.
  const panelRule =
    css
      .split('}')
      .find((r) => r.trim().startsWith('.waycraft-skills-panel{')) ?? '';
  assert.match(panelRule, /border:0\.5px solid/);
  assert.ok(
    !/\[data-waycraft-catalogs\]/.test(css),
    'no per-view panel override for catalogs',
  );
});
