const assert = require('node:assert/strict');
const { realpathSync, readFileSync, writeFileSync } = require('node:fs');
const { basename, join } = require('node:path');
const { pathToFileURL } = require('node:url');
const { syncBuiltinESMExports } = require('node:module');
assert.equal(process.env.DSH_HOOK_APPROVAL_PROBE, '1', 'Use the isolated runner.');
const home = realpathSync(process.env.HOME);
assert.ok(basename(home).startsWith('dsh-hook-approval-'));
assert.equal(realpathSync(process.env.DSH_HOME), home); assert.equal(realpathSync(process.cwd()), home);
const [base, remoteFile, ...flags] = process.argv.slice(2);
assert.ok(flags.every(flag => ['--red-auth', '--red-watch'].includes(flag)));
function forbidden() { throw Error('Approval probe forbids network/listeners/DNS/subprocesses.'); }
for (const name of ['node:http', 'node:https']) for (const key of ['request', 'get']) require(name)[key] = forbidden;
require('node:net').Socket.prototype.connect = forbidden; require('node:net').Server.prototype.listen = forbidden;
require('node:tls').connect = forbidden;
for (const key of ['send', 'bind', 'connect']) require('node:dgram').Socket.prototype[key] = forbidden;
for (const dns of [require('node:dns'), require('node:dns/promises')]) for (const key of Object.keys(dns)) if (typeof dns[key] === 'function') dns[key] = forbidden;
for (const key of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) require('node:child_process')[key] = forbidden;
global.fetch = forbidden; global.WebSocket = forbidden; syncBuiltinESMExports();
let checkpoint = 'mount';
async function main() {
  const carrier = await require('./native-workflow-carrier.cjs').mountNativeCarrier(base, remoteFile);
  try {
    const { apply } = await import(pathToFileURL(join(__dirname, '../index.js')).href);
    const config = { hooksApproval: { enabled: true, stateDirectory: join(home, 'state'), userDirectory: home } };
    let product = await carrier.mount({ apply(ctx) { apply(ctx, config); } });
    const path = '/api/majed/hooks/approval'; const method = 'majed/hooks/approval';
    let rpc = 0;
    async function call(action, extra = {}, mode = 'local', headers = {}) {
      const result = await carrier.send(path, { type: 'client-request', method, rpcId: 'probe-' + ++rpc, payload: { action, scope: 'user', ...extra } }, mode, headers);
      return result;
    }
    checkpoint = 'native-auth-rejection';
    const rejected = await call('save', {}, 'local', flags.includes('--red-auth') ? { 'x-original-origin': 'local' } : { cookie: '', 'x-original-origin': 'local' });
    assert.equal(rejected.status, 401);
    assert.equal(require('node:fs').existsSync(join(home, 'state', 'commands.json')), false);
    const nonOwner = carrier.ctx.get('connection').createPeer({ principal: { kind: 'synthetic-non-owner' } });
    const nativeFetch = carrier.ctx.get('connection').createSharedFetchHandler('/api');
    assert.equal((await nativeFetch.fetch(new Request('http://dsh.internal' + path, { method: 'POST', body: '{}' }), nonOwner)).status, 403);
    await nonOwner.dispose();
    writeFileSync(join(home, 'watched.txt'), 'reviewed');
    const hook = { id: 'controlled', command: 'printf controlled', events: ['SessionStart'], source: 'inline', enabled: false, watchedFiles: ['watched.txt'] };
    for (const mode of ['local', 'remote']) {
      checkpoint = mode + '-review-approve-revoke';
      assert.equal((await call('save', { hook }, mode)).body.result.ok, true);
      const challenge = (await call('review', { id: hook.id }, mode, { 'x-dsh-origin': 'local' })).body.result.value;
      assert.equal(challenge.review.origin, 'unknown'); assert.equal(challenge.review.cwd, home);
      assert.equal(challenge.review.command, 'printf controlled');
      assert.equal((await call('approve', { id: hook.id, nonce: challenge.nonce, phrase: 'RUN AS DSH USER' }, mode)).body.result.ok, true);
      assert.equal((await call('approve', { id: hook.id, nonce: challenge.nonce, phrase: 'RUN AS DSH USER' }, mode)).body.result.error.code, 'invalid_approval');
      assert.equal((await call('list', {}, mode)).body.result.value.hooks[0].approval.origin, 'unknown');
      await product.dispose(); product = await carrier.mount({ apply(ctx) { apply(ctx, config); } });
      assert.equal((await call('list', {}, mode)).body.result.value.hooks[0].approval.valid, true);
      assert.equal((await call('revoke', { id: hook.id }, mode)).body.result.ok, true);
      assert.equal((await call('list', {}, mode)).body.result.value.hooks[0].approval, null);
    }
    checkpoint = 'mounted-settings-admitted-flow';
    const { createBaselineHarness } = await import(pathToFileURL(join(__dirname, '../test/accepted/helpers/baseline-client-harness.js')).href);
    const client = readFileSync(join(__dirname, '../client.js'), 'utf8');
    for (const mode of ['local', 'remote']) {
      const harness = createBaselineHarness(client, { language: mode === 'remote' ? 'ar' : 'en', connection: { rpc: { async call(channel, method, payload) {
        assert.equal(channel, '/api');
        const response = await carrier.send('/api/' + method, { type: 'client-request', rpcId: 'ui-' + ++rpc, method, payload }, mode);
        assert.equal(response.status, 200); return response.body.result;
      } } } });
      try {
        harness.apply(); const view = harness.render('majed-hooks');
        const settle = async () => { await new Promise(resolve => setTimeout(resolve, 10)); view.render(); };
        const text = { review: mode === 'remote' ? 'مراجعة الأمر' : 'Review command', approve: mode === 'remote' ? 'الموافقة على الأمر المطابق' : 'Approve exact command', revoke: mode === 'remote' ? 'إلغاء الموافقة' : 'Revoke Approval' };
        const button = label => view.one(node => node.type === 'button' && node.props.children.includes(label));
        await settle(); await button(text.review).props.onClick(); await settle();
        const field = view.one(node => node.type === 'input' && node.props.autoComplete === 'off');
        field.props.onChange({ target: { value: 'RUN AS DSH USER' } }); view.render();
        const form = view.one(node => node.type === 'form' && node.props.children.some(child => child?.type === 'button' && child.props.children.includes(text.approve)));
        form.props.onSubmit({ preventDefault() {} }); await settle();
        assert.equal((await call('list', {}, mode)).body.result.value.hooks[0].approval.valid, true);
        await button(text.revoke).props.onClick(); await settle();
        assert.equal((await call('list', {}, mode)).body.result.value.hooks[0].approval, null);
      } finally { harness.dispose(); }
    }
    checkpoint = 'watched-content';
    const challenge = (await call('review', { id: hook.id })).body.result.value;
    if (!flags.includes('--red-watch')) writeFileSync(join(home, 'watched.txt'), 'changed');
    const changed = (await call('approve', { id: hook.id, nonce: challenge.nonce, phrase: 'RUN AS DSH USER' })).body.result;
    assert.equal(changed.ok, false); assert.equal(changed.error.code, 'state_changed');
    for (const action of ['run', 'event', 'test']) assert.equal((await call(action)).body.result.ok, false);
    checkpoint = 'pairing-revocation';
    const before = carrier.counts().proxyCalls; carrier.revokePairing();
    assert.equal((await call('list', {}, 'remote')).status, 403);
    assert.equal(carrier.counts().proxyCalls, before);
    // Synthetic values only; no command body/nonce/cookie is printed.
    const state = JSON.parse(readFileSync(join(home, 'state', 'commands.json')));
    assert.equal(state.entries.length, 1);
    console.log(JSON.stringify({ runtime: carrier.runtime, checks: ['native missing/non-owner authentication rejected before effects', 'production entry and service local/paired review, exact phrase, approval, replay denial, restart and revoke', 'production Settings registration renderer fixture drives native admitted local English/paired Arabic review/approve/revoke', 'unknown origin despite client labels', 'watched-content invalidation', 'no execution actions', 'revoked device denied before proxy'], counts: carrier.counts(), limitations: ['Synthetic memory signing credentials and pairing registry; in-memory Node HTTP carrier.', 'Settings uses the portable hook/slot renderer and RPC boundary adapter, not native React/DOM or native browser RPC implementation.', 'No real browser/desktop/TLS/installed state or command execution.'] }, null, 2));
  } finally { await carrier.dispose(); }
}
main().catch(error => { console.error('Command Approval probe failed at ' + checkpoint + ': ' + (error.code || error.name || 'Error')); process.exitCode = 1; });
