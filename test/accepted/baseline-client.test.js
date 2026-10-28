import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createBaselineHarness, SETTINGS_KEY } from './helpers/baseline-client-harness.js';

// Execute the built baseline (npm run build), never the untracked client-bundle/
// modules prototype. This is fixture-level client contract coverage, not proof of
// the installed host, React reconciliation, CSS layout, or browser permission UI.
// The separate package contract checks that these bytes come only from client.js.
const source = await readFile(new URL('../../dist/client.js', import.meta.url), 'utf8');
const expectedSlots = [
  ...['skills', 'mcp', 'hooks', 'subscriptions', 'routing'].map((module, index) => ['majed-' + module, 'settings.section', 60 + index]),
  ['majed-codex-speed', 'conversation.input.right', 0],
  ['majed-ui-font-size', 'settings.general.item', 11.5],
  ['majed-font-source', 'settings.general.item', 11.6],
  ['majed-bidi', 'settings.general.item', 13],
  ['majed-notify-mode', 'settings.general.item', 13.1],
  ['majed-notify-done', 'settings.general.item', 13.2],
  ['majed-notify-action', 'settings.general.item', 13.3],
  ['majed-notify-title', 'settings.general.item', 13.35],
  ['majed-account-menu', 'settings.general.item', 13.4],
  ['majed-auto-approve', 'conversation.input.left', 50],
  ['majed-auto-approver', 'conversation.session.header.utilities', 9999],
  ['majed-auto-copy', 'settings.general.item', 13.5],
  ['majed-notifications', 'shell.overlay', undefined],
];
const isType = (type) => (node) => node.type === type;
const hasLabel = (label) => (node) => node.props['aria-label'] === label;
const style = (harness, attr) => harness.document.querySelector(`[${attr}]`);
const persisted = (harness) => JSON.parse(harness.storage.get(SETTINGS_KEY));
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

function setup(t, options) {
  const harness = createBaselineHarness(source, options);
  t.after(() => harness.dispose());
  harness.apply();
  return harness;
}

function composer(harness, sessionId = 'session-a') {
  return harness.render('majed-auto-approve', { sessionId });
}
function choose(view, mode) {
  view.one(isType('fixture-menu')).props.onSelect(mode);
  view.render();
}
function selected(view) { return view.one(isType('fixture-menu')).props.selectedId; }

test('baseline ModuleLoader registers only dsh-majed and apply exposes existing public slots', (t) => {
  const harness = createBaselineHarness(source);
  t.after(() => harness.dispose());
  assert.deepEqual(harness.modules.map((module) => module.id), ['dsh-majed']);
  assert.equal(harness.registrations.size, 0, 'loading alone does not apply the plugin');
  assert.equal(harness.document.head.children.length, 0);
  const plugin = harness.apply();
  assert.deepEqual(Array.from(plugin.inject), ['slots', 'locale', 'uiWorkspace', 'connection']);
  assert.deepEqual(harness.imports, ['react', '@deepseek-ai/dsh-client-ui-primitives']);
  assert.deepEqual([...harness.registrations.values()].map(({ metadata }) => [metadata.id, metadata.name, metadata.order]), expectedSlots);
  assert.deepEqual(harness.injectCalls, ['settings.section', ...expectedSlots.slice(5).map(([, name]) => name)]);
  assert.ok([...harness.registrations.values()].every(({ metadata, Component }) => metadata.locale === 'majed' && typeof Component === 'function'));
  assert.deepEqual([...harness.dictionaries.keys()], ['majed']);
  assert.equal(harness.dictionaries.get('majed').en['bidi.title'], 'Bidirectional text');
  assert.equal(harness.dictionaries.get('majed').zh['bidi.title'], '\u53cc\u5411\u6587\u672c\uff08RTL\uff09');
  assert.deepEqual(harness.storageReads, [SETTINGS_KEY]);
  assert.equal(harness.storage.size, 0, 'defaults are not eagerly persisted');
  assert.ok(style(harness, 'data-majed-settings'));
  assert.ok(style(harness, 'data-majed-bidi'));
  assert.match(style(harness, 'data-majed-appearance').textContent, /--majed-ui-d:0px/);
  assert.equal(harness.document.listenerCount(), 0, 'copy on select defaults off');
  assert.equal(selected(composer(harness)), 'ask');
});

test('rendered General controls apply retained settings live and persist in isolated localStorage', (t) => {
  const harness = setup(t, { stored: { uiFontSize: 17, fontSource: 'inter', bidi: false, autoCopy: true, notifyMode: 'off', notifyDone: false, notifyAction: false, accountMenu: false } });
  assert.match(style(harness, 'data-majed-appearance').textContent, /--majed-ui-d:3px/);
  assert.match(style(harness, 'data-majed-fontfaces').textContent, /Inter Majed/);
  assert.match(harness.document.body.style.getPropertyValue('--dsw-font-family'), /Inter Majed/);
  assert.equal(harness.document.body.style.getPropertyPriority('--dsw-font-family'), 'important');
  assert.equal(style(harness, 'data-majed-bidi'), null);
  assert.equal(harness.document.listenerCount(), 3);

  const size = harness.render('majed-ui-font-size');
  size.one(hasLabel('Increase app UI font size')).props.onClick();
  size.render();
  assert.equal(persisted(harness).uiFontSize, 18);
  assert.match(style(harness, 'data-majed-appearance').textContent, /--majed-ui-d:4px/);
  const font = harness.render('majed-font-source');
  font.one(isType('fixture-menu')).props.onSelect('dsh');
  font.render();
  assert.equal(persisted(harness).fontSource, 'dsh');
  assert.equal(harness.document.body.style.getPropertyValue('--dsw-font-family'), '');
  assert.equal(style(harness, 'data-majed-fontfaces'), null);

  const bidi = harness.render('majed-bidi');
  assert.equal(bidi.one(isType('input')).props.checked, false);
  bidi.one(isType('input')).props.onChange({ target: { checked: true } });
  bidi.render();
  assert.ok(style(harness, 'data-majed-bidi'));
  assert.equal(persisted(harness).bidi, true);
  const copy = harness.render('majed-auto-copy');
  assert.equal(copy.one(isType('input')).props.checked, true);
  copy.one(isType('input')).props.onChange({ target: { checked: false } });
  assert.equal(harness.document.listenerCount(), 0);
  assert.equal(persisted(harness).autoCopy, false);
  for (const id of ['majed-notify-done', 'majed-notify-action', 'majed-account-menu']) {
    assert.equal(harness.render(id).one(isType('input')).props.checked, false);
  }
  const notify = harness.render('majed-notify-mode');
  assert.equal(notify.one(isType('fixture-menu')).props.selectedId, 'off');
  assert.notEqual(notify.one((node) => node.type === 'button' && node.props.className === 'majed-test' && !node.props['aria-label']).props.disabled, true, 'explicit Send test stays available in Off');
  assert.deepEqual([...harness.storage.keys()], [SETTINGS_KEY]);
});

test('malformed storage falls back safely and invalid retained appearance values are normalized', (t) => {
  const broken = setup(t, { stored: '{not json' });
  assert.equal(broken.render('majed-bidi').one(isType('input')).props.checked, true);
  assert.equal(selected(composer(broken)), 'ask');
  const invalid = setup(t, { stored: { uiFontSize: 999, fontSource: 'unknown', notifyMode: 'unknown' } });
  assert.equal(invalid.render('majed-ui-font-size').one(hasLabel('Increase app UI font size')).props.disabled, true);
  assert.match(style(invalid, 'data-majed-appearance').textContent, /--majed-ui-d:6px/);
  assert.equal(invalid.render('majed-font-source').one(isType('fixture-menu')).props.selectedId, 'dsh');
  assert.equal(invalid.render('majed-notify-mode').one(isType('fixture-menu')).props.selectedId, 'background');
  assert.equal(invalid.document.body.style.getPropertyValue('--dsw-font-family'), '');
});

// E10: command modes are host-owned. This fixture host stands in for majed/command-mode.
function modeHost(modes = {}) {
  const host = { modes, connection: { rpc: { async call(base, method, payload) {
    if (payload.action === 'set') { if (payload.mode === 'ask') delete host.modes[payload.sessionId]; else host.modes[payload.sessionId] = payload.mode; }
    return { ok: true, value: { modes: { ...host.modes } } };
  } } } };
  return host;
}

test('composer takes its mode from the host, confirms aggressive mode, and never writes authority to storage', async (t) => {
  let allow = false;
  const host = modeHost({ 'session-a': 'safe' });
  const harness = setup(t, { stored: { autoApprove: { stale: 'aggressive', invalid: 'other' } }, confirm: () => allow, connection: host.connection });
  const view = composer(harness);
  await tick();
  assert.equal(selected(view.render()), 'safe');
  assert.equal(selected(composer(harness, 'stale')), 'ask', 'stale local value is not authority');
  const locked = harness.render('majed-auto-approve', { sessionId: 'locked', locked: true });
  assert.equal(locked.one(isType('fixture-menu')).props.anchor.props.disabled, true);
  choose(view, 'aggressive');
  assert.equal(selected(view), 'safe', 'declining confirmation preserves current mode');
  assert.equal(harness.confirms.length, 1);
  allow = true;
  choose(view, 'aggressive'); await tick();
  assert.equal(selected(view.render()), 'aggressive');
  assert.equal(host.modes['session-a'], 'aggressive');
  assert.match(harness.confirms[1], /resets when the app restarts/);
  assert.equal(harness.storage.get(SETTINGS_KEY).includes('autoApprove'), false, 'legacy authority was scrubbed and never written back');
  const second = composer(harness, 'second');
  choose(second, 'safe'); await tick();
  assert.equal(selected(view.render()), 'aggressive', 'another session does not overwrite the choice');
  second.render();
  choose(second, 'ask'); await tick();
  assert.equal(host.modes.second, undefined);
});

test('session approval slot uses safe/aggressive semantics and leaves destructive commands to owner', async (t) => {
  const host = modeHost();
  const harness = setup(t, { connection: host.connection });
  const picker = composer(harness);
  choose(picker, 'safe'); await tick();
  const answers = [];
  let pending;
  let chat = { nodes: new Map() };
  const useSessionStatus = (selector) => selector(new Map([['session-a', { pendingInteraction: pending }]]));
  const useChat = (selector) => selector(chat);
  const watcher = harness.render('majed-auto-approver', { sessionId: 'session-a', useSessionStatus, useChat });
  const offer = async (key, toolName, command) => {
    pending = { key, callId: key, kind: 'approval', toolName, answerable: true, answer: (outcome) => answers.push([key, outcome]) };
    chat = { nodes: new Map(command === undefined ? [] : [['call', { kind: 'tool-call', data: { root: { callId: key, phase: 'start', argsRaw: JSON.stringify({ command }) } } }]]) };
    watcher.render(); await tick();
  };
  await offer('read-1', 'read');
  watcher.render();
  assert.deepEqual(answers, [['read-1', 'allowed-once']], 'same pending key is answered only once');
  await offer('unknown-safe', 'unrecognized-tool');
  assert.equal(answers.length, 1, 'safe mode leaves unknown tools unanswered');
  choose(picker, 'aggressive'); await tick();
  await offer('unknown-aggressive', 'unrecognized-tool');
  assert.deepEqual(answers.at(-1), ['unknown-aggressive', 'allowed-once']);
  await offer('destructive', 'bash', 'rm -rf ./build');
  assert.equal(answers.length, 2, 'aggressive still does not answer hard-deny commands');
  await offer('readonly', 'bash', 'pwd');
  assert.deepEqual(answers.at(-1), ['readonly', 'allowed-once']);
  await tick();
});

test('notification overlay ignores initial snapshot, notifies completion/action, and opens session', async (t) => {
  const harness = setup(t, { stored: { notifyMode: 'always' } });
  let status = new Map([['session-a', { running: true }]]);
  const list = { byId: { 'session-a': { title: 'Fixture session' } } };
  const view = harness.render('majed-notifications', {
    useSessionStatus: (selector) => selector(status), useSessions: (selector) => selector(list),
  });
  await tick();
  assert.equal(harness.notifications.length, 0, 'mount establishes a baseline without sending old events');
  status = new Map([['session-a', { running: false }]]);
  view.render();
  await tick();
  assert.equal(harness.notifications.length, 1);
  assert.equal(harness.notifications[0].title, 'DeepSeek Harness', 'session titles are private by default');
  assert.equal(harness.notifications[0].options.body, 'Finished — ready for review');
  assert.equal(harness.notifications[0].options.silent, true);
  harness.notifications[0].onclick();
  assert.deepEqual(harness.openedSessions, ['session-a']);
  assert.equal(harness.notifications[0].closed, true);
  status = new Map([['session-a', { running: false, pendingInteraction: { kind: 'approval', key: 'new', toolName: 'bash' } }]]);
  view.render();
  await tick();
  assert.equal(harness.notifications.length, 2);
  assert.equal(harness.notifications[1].options.body, 'Approval needed', 'tool names are omitted from system alerts');
  view.render();
  await tick();
  assert.equal(harness.notifications.length, 2, 'same pending interaction is not notified twice');
  harness.dispose();
  assert.equal(harness.notifications[1].closed, true);
});

test('notification overlay respects background/off modes and rendered notification preferences', async (t) => {
  const harness = setup(t);
  let status = new Map([['session-a', { running: true }]]);
  const list = { byId: { 'session-a': { title: 'Fixture session' } } };
  const view = harness.render('majed-notifications', {
    useSessionStatus: (selector) => selector(status), useSessions: (selector) => selector(list),
  });
  status = new Map([['session-a', { running: false }]]);
  view.render();
  await tick();
  assert.equal(harness.notifications.length, 0, 'background mode suppresses delivery while app is focused');
  harness.document.hidden = true;
  status = new Map([['session-a', { running: true }]]);
  view.render();
  status = new Map([['session-a', { running: false }]]);
  view.render();
  await tick();
  assert.equal(harness.notifications.length, 1);
  assert.equal(harness.notifications[0].options.silent, false);
  const done = harness.render('majed-notify-done');
  done.one(isType('input')).props.onChange({ target: { checked: false } });
  status = new Map([['session-a', { running: true }]]);
  view.render();
  status = new Map([['session-a', { running: false }]]);
  view.render();
  await tick();
  assert.equal(harness.notifications.length, 1, 'completion preference disables completion notifications');
  const action = harness.render('majed-notify-action');
  action.one(isType('input')).props.onChange({ target: { checked: false } });
  status = new Map([['session-a', { pendingInteraction: { key: 'disabled', questions: [] } }]]);
  view.render();
  await tick();
  assert.equal(harness.notifications.length, 1);
  action.render().one(isType('input')).props.onChange({ target: { checked: true } });
  const mode = harness.render('majed-notify-mode');
  mode.one(isType('fixture-menu')).props.onSelect('off');
  status = new Map([['session-a', { pendingInteraction: { key: 'off', kind: 'plan-review' } }]]);
  view.render();
  await tick();
  assert.equal(harness.notifications.length, 1, 'off mode suppresses actions even when enabled and backgrounded');
});

test('disposal removes applied styles, RTL markers, observers, listeners, slots, and own extension', (t) => {
  const existingExtension = { unrelated: { marker: 'preserved' } };
  const harness = createBaselineHarness(source, { stored: { autoCopy: true, fontSource: 'inter' }, extension: existingExtension });
  t.after(() => harness.dispose());
  const paragraph = harness.element('p');
  paragraph.textContent = '\u0645\u0631\u062d\u0628\u0627 \u0628\u0627\u0644\u0639\u0627\u0644\u0645';
  harness.document.body.appendChild(paragraph);
  const footer = harness.element('div', { 'data-slot': 'sidebar.footer.action' });
  const trigger = harness.element('button', { 'aria-label': 'Remote access' });
  footer.appendChild(trigger);
  harness.document.body.appendChild(footer);
  const hostStyle = harness.element('style', { 'data-host-style': '' });
  harness.document.head.appendChild(hostStyle);
  harness.document.body.style.setProperty('--unrelated', 'keep');
  harness.apply();
  harness.flushFrames();
  assert.equal(paragraph.getAttribute('dir'), 'rtl');
  assert.equal(paragraph.hasAttribute('data-dsh-rtl'), true);
  assert.equal(trigger.hasAttribute('data-majed-menu-trigger'), true);
  assert.equal(typeof harness.window.__dshMajed.accountMenu.register, 'function');
  assert.equal(harness.document.listenerCount(), 3);
  assert.ok(harness.observers.some((observer) => observer.targets.length));
  assert.equal(harness.registrations.size, expectedSlots.length);
  harness.dispose();
  assert.deepEqual(harness.document.head.children, [hostStyle]);
  assert.equal(paragraph.hasAttribute('dir'), false);
  assert.equal(paragraph.hasAttribute('data-dsh-rtl'), false);
  assert.equal(trigger.hasAttribute('data-majed-menu-trigger'), false);
  assert.equal(harness.document.body.style.getPropertyValue('--dsw-font-family'), '');
  assert.equal(harness.document.body.style.getPropertyValue('--unrelated'), 'keep');
  assert.equal(harness.document.listenerCount(), 0);
  assert.ok(harness.observers.every((observer) => observer.targets.length === 0));
  assert.equal(harness.timers.size, 0);
  assert.equal(harness.frames.size, 0);
  assert.equal(harness.registrations.size, 0);
  assert.equal(harness.dictionaries.size, 0);
  assert.equal(harness.window.__dshMajed, existingExtension);
  assert.deepEqual(existingExtension, { unrelated: { marker: 'preserved' } });
  harness.dispose();
});

test('disposal restores a preexisting accountMenu extension rather than deleting it', (t) => {
  const previous = { register() {} };
  const extension = { accountMenu: previous, unrelated: 'keep' };
  const harness = setup(t, { extension });
  assert.notEqual(harness.window.__dshMajed.accountMenu, previous);
  const unregister = harness.window.__dshMajed.accountMenu.register({ id: 'fixture-item', label: 'Fixture item', onSelect() {} });
  assert.equal(typeof unregister, 'function');
  unregister();
  harness.dispose();
  assert.equal(harness.window.__dshMajed, extension);
  assert.equal(harness.window.__dshMajed.accountMenu, previous);
  assert.equal(extension.unrelated, 'keep');
});

test('disposal restores absence of the global extension namespace when it created it', (t) => {
  const harness = setup(t);
  assert.equal(typeof harness.window.__dshMajed.accountMenu.register, 'function');
  harness.dispose();
  assert.equal(Object.hasOwn(harness.window, '__dshMajed'), false);
});

test('disposal preserves unrelated extensions registered after baseline apply', (t) => {
  const harness = setup(t);
  const later = { marker: 'later plugin' };
  harness.window.__dshMajed.unrelated = later;
  harness.dispose();
  assert.equal(harness.window.__dshMajed.unrelated, later);
  assert.equal(Object.hasOwn(harness.window.__dshMajed, 'accountMenu'), false);
});

test('disposal restores the host inline font value and priority', (t) => {
  const harness = createBaselineHarness(source, { stored: { fontSource: 'inter' } });
  t.after(() => harness.dispose());
  harness.document.body.style.setProperty('--dsw-font-family', 'HostExistingFont', 'important');
  harness.apply();
  assert.match(harness.document.body.style.getPropertyValue('--dsw-font-family'), /Inter Majed/);
  harness.dispose();
  assert.equal(harness.document.body.style.getPropertyValue('--dsw-font-family'), 'HostExistingFont');
  assert.equal(harness.document.body.style.getPropertyPriority('--dsw-font-family'), 'important');
});

test('disposal invalidates notification delivery still awaiting permission or registration', async (t) => {
  const harness = setup(t, { stored: { notifyMode: 'always' } });
  let status = new Map([['session-a', { running: true }]]);
  const view = harness.render('majed-notifications', {
    useSessionStatus: selector => selector(status),
    useSessions: selector => selector({ byId: { 'session-a': { title: 'Fixture session' } } }),
  });
  status = new Map([['session-a', { running: false }]]);
  view.render();
  harness.dispose();
  await tick();
  assert.equal(harness.notifications.length, 0, 'pending delivery must not create a notification after teardown');
});

test('lazy stylesheet rescan scales text and disposal removes pending load listeners', (t) => {
  const harness = setup(t, { stored: { uiFontSize: 16 } });
  const link = harness.element('link', { rel: 'stylesheet' });
  link.sheet = { cssRules: [{ type: 1, selectorText: '.fixture-navigation', style: { getPropertyValue: (name) => name === 'font-size' ? '14px' : '' } }] };
  harness.document.head.appendChild(link);
  harness.mutate({ type: 'childList', target: harness.document.head, addedNodes: [link] });
  assert.equal(link.listenerCount(), 1);
  harness.runTimers(120);
  assert.match(style(harness, 'data-majed-ui-font').textContent, /\.fixture-navigation\{font-size:calc\(14px \+ var\(--majed-ui-d\)\)!important;/);
  harness.dispose();
  assert.equal(link.listenerCount(), 0, 'a stylesheet that has not loaded must not retain a plugin callback');
  link.dispatch('load');
  assert.equal(harness.timers.size, 0, 'late load cannot schedule work after disposal');
});
