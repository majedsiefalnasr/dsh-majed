import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runManagementSuite } from '../../scripts/test-management-suite.mjs';

const pointers = {
  DSH_PROBE_NODE: '/fixture/ASAR-aware executable',
  DSH_PROBE_RUNTIME: '/fixture/runtime',
  DSH_PROBE_REMOTE: '/fixture/remote-api.js',
};

function fixture(overrides = {}) {
  const calls = [];
  let stdout = '';
  let stderr = '';
  const exitCode = runManagementSuite({
    args: [], env: pointers,
    stdout: text => { stdout += text; },
    stderr: text => { stderr += text; },
    spawn: (executable, args, options) => {
      calls.push({ executable, args, options });
      return { status: 0, signal: null, stdout: 'fixture proof\n', stderr: '' };
    },
    ...overrides,
  });
  return { exitCode, calls, stdout, stderr };
}

test('explicit suite runs all six existing runners serially and limits its acceptance claim', () => {
  const result = fixture();
  assert.equal(result.exitCode, 0);
  assert.deepEqual(result.calls.map(call => call.args), [
    'admission', 'skills', 'settings', 'mcp', 'composition', 'remote',
  ].map(name => [fileURLToPath(new URL(`../../scripts/test-management-${name}.mjs`, import.meta.url))]));
  for (const call of result.calls) {
    assert.equal(call.executable, process.execPath);
    assert.equal(call.options.shell, false);
    assert.equal(call.options.timeout, 45000);
    assert.equal(call.options.maxBuffer, 3 * 1024 * 1024);
    assert.equal(call.options.killSignal, 'SIGKILL');
    assert.equal(call.options.env.DSH_PROBE_REMOTE, '/fixture/remote-api.js');
  }
  assert.equal((result.stdout.match(/fixture proof/g) || []).length, 6);
  assert.match(result.stdout, /Management suite: PASS\nadmission: PASS\nskills: PASS\nsettings: PASS\nmcp: PASS\ncomposition: PASS\nremote: PASS\n/);
  assert.match(result.stdout, /Bounded runner evidence only; not full T02A acceptance\./);
});

test('any failed runner stops the suite and reports remaining runners as not run', () => {
  for (let failure = 0; failure < 6; failure++) {
    let count = 0;
    const result = fixture({ spawn: () => ({
      status: count++ === failure ? 7 : 0, signal: null, stdout: 'proof output\n', stderr: 'child diagnostic\n',
    }) });
    assert.equal(result.exitCode, 1);
    assert.equal(count, failure + 1);
    assert.match(result.stdout, /Management suite: FAIL/);
    assert.equal((result.stdout.match(/: FAIL/g) || []).length, 2);
    assert.equal((result.stdout.match(/: NOT RUN/g) || []).length, 5 - failure);
    assert.match(result.stderr, /child diagnostic/);
    assert.match(result.stderr, /exit 7/);
    assert.match(result.stdout, /not full T02A acceptance/);
  }
});

test('signals, spawn errors, timeouts, overflow and absent exit status cannot pass', () => {
  const failures = [
    { status: 0, signal: 'SIGTERM' },
    { status: null, signal: null },
    { status: 0, error: { code: 'ETIMEDOUT', message: 'not forwarded' } },
    { status: null, error: { code: 'ENOBUFS' } },
    { status: null, error: { code: 'ENOENT' } },
  ];
  for (const failure of failures) {
    let count = 0;
    const result = fixture({ spawn: () => { count++; return failure; } });
    assert.equal(result.exitCode, 1);
    assert.equal(count, 1);
    assert.match(result.stdout, /admission: FAIL\nskills: NOT RUN/);
    assert.doesNotMatch(result.stderr, /not forwarded/);
    if (failure.error) assert.match(result.stderr, new RegExp(failure.error.code));
    if (failure.signal) assert.match(result.stderr, /SIGTERM/);
  }
  const thrown = fixture({ spawn: () => { throw Object.assign(new Error('private detail'), { code: 'EINVAL' }); } });
  assert.equal(thrown.exitCode, 1);
  assert.match(thrown.stderr, /EINVAL/);
  assert.doesNotMatch(thrown.stderr, /private detail/);
});

test('child stdout and stderr propagation is bounded even on spawn failure', () => {
  const result = fixture({ spawn: () => ({
    status: null, error: { code: 'ENOBUFS' },
    stdout: 'x'.repeat(4 * 1024 * 1024), stderr: 'y'.repeat(4 * 1024 * 1024),
  }) });
  assert.equal(result.exitCode, 1);
  assert.ok(result.stdout.length < 3 * 1024 * 1024 + 1024);
  assert.ok(result.stderr.length < 3 * 1024 * 1024 + 1024);
  assert.match(result.stdout, /output truncated/);
  assert.match(result.stderr, /output truncated/);
});

test('direct CLI fails missing pointers and unknown flags without loading a host', () => {
  const script = fileURLToPath(new URL('../../scripts/test-management-suite.mjs', import.meta.url));
  for (const args of [[], ['--unknown']]) {
    const child = spawnSync(process.execPath, [script, ...args], {
      env: {}, encoding: 'utf8', timeout: 5000, maxBuffer: 65536,
    });
    assert.equal(child.error, undefined);
    assert.equal(child.signal, null);
    assert.equal(child.status, 1);
    assert.match(child.stderr, args.length ? /No arguments are accepted/ : /Missing required environment/);
    assert.equal(child.stdout, '');
  }
});

test('unknown arguments and each missing required pointer fail before any runner starts', () => {
  for (const args of [['--unknown'], ['--controls'], ['--red-watch'], ['--help']]) {
    const result = fixture({ args });
    assert.equal(result.exitCode, 1);
    assert.equal(result.calls.length, 0);
    assert.match(result.stderr, /No arguments are accepted/);
    assert.doesNotMatch(result.stdout, /PASS/);
  }
  for (const name of ['DSH_PROBE_NODE', 'DSH_PROBE_RUNTIME', 'DSH_PROBE_REMOTE']) {
    for (const value of [undefined, '', '   ']) {
      const result = fixture({ env: { ...pointers, [name]: value } });
      assert.equal(result.exitCode, 1);
      assert.equal(result.calls.length, 0);
      assert.match(result.stderr, new RegExp(`Missing required environment: ${name}`));
      assert.doesNotMatch(result.stdout, /PASS/);
    }
  }
});
