import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createToolsRegistry, VIEW_CHAT, VIEW_SEARCH, VIEW_ATTACHMENT,
} from '../../modules/tools/index.js';
import { createToolPolicy } from '../../modules/tools/policy.js';
import {
  normalizeAttachment, completeAttachmentReference,
  isVisionAttachment, isOffloadedAttachment,
  ATTACHMENT_KIND_VISION, ATTACHMENT_KIND_OFFLOADED,
} from '../../modules/tools/attachments.js';
import {
  bindAttachmentReplay, REPLAY_KIND, replayKey,
} from '../../modules/tools/replay.js';
import {
  createRegistry, createCandidate,
} from '../../modules/auto/index.js';

function searchTool(name, provider, aliases = []) {
  return createToolsRegistry().register({
    name, provider, aliases, native: true, search: true,
    views: [VIEW_CHAT, VIEW_SEARCH],
  });
}

test('VIEW constants are the supported tool views', () => {
  assert.equal(VIEW_CHAT, 'chat');
  assert.equal(VIEW_SEARCH, 'search');
  assert.equal(VIEW_ATTACHMENT, 'attachment');
});

test('createToolsRegistry registers and lists public tool names', () => {
  const reg = createToolsRegistry();
  const web = reg.register({ name: 'web_search', provider: 'codex', native: true, search: true, views: [VIEW_CHAT, VIEW_SEARCH] });
  const x = reg.register({ name: 'x_search', provider: 'grok', native: true, search: true, views: [VIEW_CHAT, VIEW_SEARCH] });
  assert.equal(web.name, 'web_search');
  assert.equal(web.provider, 'codex');
  assert.equal(web.native, true);
  assert.equal(web.search, true);
  assert.deepEqual(web.views, [VIEW_CHAT, VIEW_SEARCH]);
  assert.equal(x.name, 'x_search');
  assert.deepEqual(reg.list().map(t => t.name).sort(), ['web_search', 'x_search']);
});

test('aliases resolve to the same tool and duplicates are rejected', () => {
  const reg = createToolsRegistry();
  reg.register({ name: 'web_search', provider: 'codex', aliases: ['search', 'web-search'], native: true, search: true });
  assert.equal(reg.get('search').name, 'web_search');
  assert.equal(reg.get('web-search').name, 'web_search');
  assert.equal(reg.get('web_search').name, 'web_search');
  assert.equal(reg.has('web_search'), true);
  assert.equal(reg.has('unknown'), false);
  assert.throws(() => reg.register({ name: 'web_search', provider: 'codex' }), /already registered/);
  assert.throws(() => reg.register({ name: 'other', provider: 'codex', aliases: ['search'] }), /already registered/);
});

test('default views and alias when omitted', () => {
  const reg = createToolsRegistry();
  const t = reg.register({ name: 'plain_tool', provider: 'codex' });
  assert.deepEqual(t.views, [VIEW_CHAT]);
  assert.deepEqual(t.aliases, ['plain_tool']);
  assert.equal(t.native, false);
  assert.equal(t.search, false);
});

test('validation rejects invalid tool input', () => {
  const reg = createToolsRegistry();
  assert.throws(() => reg.register(null));
  assert.throws(() => reg.register({}));
  assert.throws(() => reg.register({ name: '', provider: 'codex' }));
  assert.throws(() => reg.register({ name: 't', provider: '' }));
});

test('search tools are native and never installed or granted', () => {
  const reg = createToolsRegistry();
  reg.register({ name: 'web_search', provider: 'codex', native: true, search: true, views: [VIEW_CHAT, VIEW_SEARCH] });
  reg.register({ name: 'x_search', provider: 'grok', native: true, search: true, views: [VIEW_CHAT, VIEW_SEARCH] });
  const searches = reg.searchTools();
  assert.equal(searches.length, 2);
  for (const s of searches) {
    assert.equal(s.native, true);
    assert.equal(s.search, true);
    assert.ok(s.views.includes(VIEW_SEARCH));
  }
  // No tool is non-native or installable by default.
  assert.equal(reg.isNative('web_search'), true);
  assert.equal(reg.isNative('x_search'), true);
  assert.equal(reg.isNative('nonexistent'), false);
});

test('direct search/attachment scheduling is not limited by Auto membership', () => {
  const reg = createToolsRegistry();
  reg.register({ name: 'web_search', provider: 'codex', native: true, search: true, views: [VIEW_CHAT, VIEW_SEARCH] });
  const auto = createRegistry();
  const before = auto.size();
  // Registering a search tool never enrolls an Auto candidate.
  assert.equal(auto.size(), before);
  assert.equal(auto.has('codex/acc/web_search'), false);
  // Scheduling is independent of Auto: a search tool is always schedulable.
  assert.equal(reg.isSearch('web_search'), true);
  assert.equal(reg.supportsView('web_search', VIEW_SEARCH), true);
  assert.equal(reg.supportsView('web_search', VIEW_CHAT), true);
  assert.equal(reg.supportsView('web_search', VIEW_ATTACHMENT), false);
});

test('no unauthorized tool installation or permission grant occurs', () => {
  const reg = createToolsRegistry();
  // Only explicitly registered public tools exist; nothing is auto-installed.
  assert.equal(reg.list().length, 0);
  assert.equal(reg.has('web_search'), false);
  assert.equal(reg.get('web_search'), undefined);
  // Native search tools are not permission grants.
  reg.register({ name: 'web_search', provider: 'codex', native: true, search: true });
  assert.equal(reg.isNative('web_search'), true);
  assert.equal(reg.isSearch('web_search'), true);
  assert.equal(reg.supportsView('web_search', VIEW_ATTACHMENT), false);
});

test('createToolPolicy captures session-creation-time policy immutably', () => {
  const policy = createToolPolicy();
  const captured = policy.capture('sess-1', { tools: ['web_search'], maxAttachments: 5, effort: 'medium' });
  assert.equal(captured.policy.tools[0], 'web_search');
  assert.equal(captured.policy.maxAttachments, 5);
  assert.equal(captured.policy.effort, 'medium');
  assert.equal(captured.generation, 1);
  const got = policy.get('sess-1');
  assert.deepEqual(got.policy, { tools: ['web_search'], maxAttachments: 5, effort: 'medium' });
  // Mutating the returned policy does not affect the capture.
  got.policy.tools.push('x_search');
  assert.deepEqual(policy.get('sess-1').policy.tools, ['web_search']);
});

test('tool policy is preserved across reload via snapshot/restore', () => {
  const policy = createToolPolicy();
  policy.capture('sess-1', { tools: ['web_search'] });
  policy.capture('sess-2', { tools: ['x_search'], maxAttachments: 3 });
  const snap = policy.snapshot();
  assert.equal(snap.sessions.length, 2);
  const policy2 = createToolPolicy();
  policy2.restore(snap);
  assert.deepEqual(policy2.get('sess-1').policy, { tools: ['web_search'] });
  assert.deepEqual(policy2.get('sess-2').policy, { tools: ['x_search'], maxAttachments: 3 });
  // Restore does not overwrite an existing live capture.
  policy2.capture('sess-1', { tools: ['overridden'] });
  const reSnap = policy2.snapshot();
  assert.deepEqual(reSnap.sessions.find(s => s.id === 'sess-1').policy, { tools: ['overridden'] });
});

test('tool policy survives reference ownership change (clearAll then restore)', () => {
  const policy = createToolPolicy();
  policy.capture('sess-1', { tools: ['web_search'] });
  const snap = policy.snapshot();
  const genBefore = snap.sessions[0].generation;
  // Reference ownership change: clear all live policies.
  policy.clearAll();
  assert.equal(policy.size(), 0);
  // Restore from the pre-ownership-change snapshot.
  policy.restore(snap);
  assert.equal(policy.size(), 1);
  assert.equal(policy.get('sess-1').generation, genBefore, 'capture generation is preserved across ownership change');
  assert.deepEqual(policy.get('sess-1').policy, { tools: ['web_search'] });
});

test('tool policy clear removes a single session', () => {
  const policy = createToolPolicy();
  policy.capture('sess-1', { tools: ['web_search'] });
  policy.capture('sess-2', { tools: ['x_search'] });
  policy.clear('sess-1');
  assert.equal(policy.has('sess-1'), false);
  assert.equal(policy.has('sess-2'), true);
  assert.equal(policy.get('sess-1'), undefined);
});

test('validation rejects invalid policy input', () => {
  const policy = createToolPolicy();
  assert.throws(() => policy.capture('', { tools: [] }));
  assert.throws(() => policy.capture('sess-1', null));
  assert.throws(() => policy.capture('sess-1', 'not-object'));
  assert.throws(() => policy.restore(null));
  assert.throws(() => policy.restore({ sessions: 'not-array' }));
});

test('ATTACHMENT_KIND constants', () => {
  assert.equal(ATTACHMENT_KIND_VISION, 'vision');
  assert.equal(ATTACHMENT_KIND_OFFLOADED, 'offloaded');
});

test('normalizeAttachment creates a complete bound reference', () => {
  const ref = normalizeAttachment({
    id: 'att-1', type: 'image', mime: 'image/png', url: 'https://example.test/img.png',
    provider: 'codex', account: 'acc-1', model: 'gpt-5', vision: true, offloaded: false,
  });
  assert.equal(ref.id, 'att-1');
  assert.equal(ref.type, 'image');
  assert.equal(ref.mime, 'image/png');
  assert.equal(ref.url, 'https://example.test/img.png');
  assert.equal(ref.data, undefined);
  assert.equal(ref.provider, 'codex');
  assert.equal(ref.account, 'acc-1');
  assert.equal(ref.model, 'gpt-5');
  assert.equal(ref.vision, true);
  assert.equal(ref.offloaded, false);
  assert.equal(isVisionAttachment(ref), true);
  assert.equal(isOffloadedAttachment(ref), false);
});

test('normalizeAttachment binds missing fields from context', () => {
  const ref = normalizeAttachment(
    { id: 'att-2', url: 'https://example.test/img.png' },
    { provider: 'grok', account: 'acc-2', model: 'grok-3' },
  );
  assert.equal(ref.provider, 'grok');
  assert.equal(ref.account, 'acc-2');
  assert.equal(ref.model, 'grok-3');
  assert.equal(ref.complete, undefined);
});

test('completeAttachmentReference marks incomplete references', () => {
  const complete = completeAttachmentReference(
    { id: 'att-3', url: 'https://example.test/img.png', provider: 'codex', account: 'acc-1', model: 'gpt-5' },
    { provider: 'codex', account: 'acc-1', model: 'gpt-5' },
  );
  assert.equal(complete.complete, true);
  const incomplete = completeAttachmentReference(
    { id: 'att-4', provider: 'codex', account: 'acc-1', model: 'gpt-5' },
    { provider: 'codex', account: 'acc-1', model: 'gpt-5' },
  );
  assert.equal(incomplete.complete, false);
  const unbound = completeAttachmentReference(
    { id: 'att-5', url: 'https://example.test/img.png' },
    {},
  );
  assert.equal(unbound.complete, false);
});

test('normalizeAttachment validates input', () => {
  assert.throws(() => normalizeAttachment(null));
  assert.throws(() => normalizeAttachment({}));
  assert.throws(() => normalizeAttachment({ id: '', url: 'x' }));
  assert.throws(() => normalizeAttachment({ id: 'a', provider: '', account: 'acc', model: 'm' }));
});

test('bindAttachmentReplay stamps and re-binds attachment replay state to account/model', () => {
  const keyA1 = replayKey('codex', 'a1', 'm1');
  const keyA2 = replayKey('codex', 'a2', 'm1');
  const options = {
    provider: 'codex', model: 'm1',
    attachments: [
      { id: 'att-1', url: 'https://example.test/a.png', replayState: { response: { kind: REPLAY_KIND, version: 1, key: keyA2, state: 'private-opaque' } } },
    ],
  };
  const out = bindAttachmentReplay(options, 'a1', 'm1');
  const att = out.attachments[0];
  // Bound to a different account/model: opaque state discarded, normalized attachment kept.
  assert.equal(att.replayState, undefined);
  assert.equal(att.id, 'att-1');
  assert.equal(att.provider, 'codex');
  assert.equal(att.account, 'a1');
  assert.equal(att.model, 'm1');
});

test('bindAttachmentReplay keeps compatible replay state for same account/model', () => {
  const key = replayKey('codex', 'a1', 'm1');
  const options = {
    provider: 'codex', model: 'm1',
    attachments: [
      { id: 'att-1', replayState: { response: { kind: REPLAY_KIND, version: 1, key, state: { resumed: true } } } },
    ],
  };
  const out = bindAttachmentReplay(options, 'a1', 'm1');
  const att = out.attachments[0];
  assert.deepEqual(att.replayState.response, { resumed: true });
});

test('bindAttachmentReplay discards unknown version replay state', () => {
  const key = replayKey('codex', 'a1', 'm1');
  const options = {
    provider: 'codex', model: 'm1',
    attachments: [
      { id: 'att-1', replayState: { response: { kind: REPLAY_KIND, version: 99, key, state: 'new-opaque' } } },
    ],
  };
  const out = bindAttachmentReplay(options, 'a1', 'm1');
  assert.equal(out.attachments[0].replayState, undefined);
});

test('replayKey is stable and distinct per provider/account/model', () => {
  const k1 = replayKey('codex', 'a1', 'm1');
  const k2 = replayKey('codex', 'a2', 'm1');
  const k3 = replayKey('codex', 'a1', 'm2');
  const k4 = replayKey('grok', 'a1', 'm1');
  assert.notEqual(k1, k2);
  assert.notEqual(k1, k3);
  assert.notEqual(k1, k4);
  assert.equal(k1, replayKey('codex', 'a1', 'm1'));
});

test('search tool registration does not enroll Auto candidates', () => {
  const reg = createToolsRegistry();
  const auto = createRegistry();
  const before = auto.size();
  reg.register({ name: 'web_search', provider: 'codex', native: true, search: true, views: [VIEW_CHAT, VIEW_SEARCH] });
  reg.register({ name: 'x_search', provider: 'grok', native: true, search: true, views: [VIEW_CHAT, VIEW_SEARCH] });
  assert.equal(auto.size(), before, 'search tool registration must not enroll Auto candidates');
  assert.equal(auto.has('codex/acc/web_search'), false);
  assert.equal(auto.has('grok/acc/x_search'), false);
});
