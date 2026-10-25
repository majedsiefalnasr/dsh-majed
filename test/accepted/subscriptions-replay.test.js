import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { streamAccountWithReplay, REPLAY_KIND, bindReplayMessages } from '../../modules/subscriptions/replay.js';
import { collectAsync } from './_subscriptions-helpers.js';

function replayKey(provider, account, model) {
  return createHash('sha256').update(JSON.stringify([provider, account, model])).digest('hex');
}

test('replay is bound to provider/account/model: different account or model yields a different key', () => {
  const k1 = replayKey('codex', 'a1', 'm1');
  const k2 = replayKey('codex', 'a2', 'm1');
  const k3 = replayKey('codex', 'a1', 'm2');
  const k4 = replayKey('claude', 'a1', 'm1');
  assert.notEqual(k1, k2);
  assert.notEqual(k1, k3);
  assert.notEqual(k1, k4);
  assert.equal(k1, replayKey('codex', 'a1', 'm1'));
});

test('streamAccountWithReplay stamps the finish chunk with account/model-bound replay state', async () => {
  const adapter = {
    streamAccount: async function* () {
      yield { type: 'text', text: 'hello' };
      yield { type: 'finish', reason: { kind: 'stop' }, replayState: { response: 'continuation' } };
    },
  };
  const chunks = await collectAsync(streamAccountWithReplay(adapter, { provider: 'claude', model: 'claude-3', messages: [] }, 'acct-9', 'claude-3'));
  assert.equal(chunks[0].type, 'text');
  assert.equal(chunks[1].type, 'finish');
  const rs = chunks[1].replayState;
  assert.equal(rs.response.kind, REPLAY_KIND);
  assert.equal(rs.response.version, 1);
  assert.equal(rs.response.key, replayKey('claude', 'acct-9', 'claude-3'));
  assert.equal(rs.response.state, 'continuation');
});

test('streamAccountWithReplay re-binds raw opaque state to the current account/model key', async () => {
  const adapter = {
    streamAccount: async function* () {
      yield { type: 'finish', reason: { kind: 'stop' }, replayState: { response: 'stale-opaque-state' } };
    },
  };
  const chunks = await collectAsync(streamAccountWithReplay(adapter, { provider: 'codex', model: 'm1', messages: [] }, 'a1', 'm1'));
  assert.equal(chunks[0].type, 'finish');
  assert.equal(chunks[0].replayState.response.kind, REPLAY_KIND);
  assert.equal(chunks[0].replayState.response.key, replayKey('codex', 'a1', 'm1'));
  assert.equal(chunks[0].replayState.response.state, 'stale-opaque-state');
});

test('replay state is re-stamped with the current key while normalized history is kept', async () => {
  const adapter = {
    streamAccount: async function* () {
      yield { type: 'text', text: 'keep me' };
      yield { type: 'finish', reason: { kind: 'stop' }, replayState: { response: { opaque: 'blob' } } };
    },
  };
  const chunks = await collectAsync(streamAccountWithReplay(adapter, { provider: 'codex', model: 'm1', messages: [] }, 'a1', 'm1'));
  assert.equal(chunks[0].type, 'text');
  assert.equal(chunks[0].text, 'keep me');
  assert.equal(chunks[1].type, 'finish');
  assert.equal(chunks[1].replayState.response.kind, REPLAY_KIND);
  assert.equal(chunks[1].replayState.response.key, replayKey('codex', 'a1', 'm1'));
  assert.deepEqual(chunks[1].replayState.response.state, { opaque: 'blob' });
});

test('assistant messages with replay state bound to another account are unwrapped', () => {
  const keyForA2 = replayKey('codex', 'a2', 'm1');
  const messages = [
    { role: 'user', content: 'hi' },
    {
      role: 'assistant',
      content: 'partial',
      source: { provider: 'codex', model: 'm1', replayState: { response: { kind: REPLAY_KIND, version: 1, key: keyForA2, state: 'secret' } } },
    },
  ];
  const out = bindReplayMessages({ provider: 'codex', model: 'm1', messages }, 'a1', 'm1');
  assert.equal(out.messages[1].source.replayState, undefined);
  assert.equal(out.messages[1].source.provider, 'codex');
  assert.equal(out.messages[1].source.model, 'm1');
  assert.equal(out.messages[1].content, 'partial');
});

test('unwrapped older history for the same provider/model is retained as direct behavior', () => {
  const messages = [
    { role: 'assistant', content: 'old', source: { provider: 'codex', model: 'm1' } },
  ];
  const out = bindReplayMessages({ provider: 'codex', model: 'm1', messages }, 'a1', 'm1');
  assert.equal(out.messages[0].source.provider, 'codex');
  assert.equal(out.messages[0].source.model, 'm1');
});
