// Actual provider controllers' presentation boundary; no network, stores or installed state.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { create, act } from 'react-test-renderer';
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
for (const provider of ['codex', 'claude', 'grok', 'antigravity', 'copilot']) {
  test(`${provider}: explicit same-identity success completes once without auth usage`, async () => {
    const exports = {};
    const timers = new Set();
    vm.runInNewContext(
      ts.transpileModule(
        readFileSync(
          new URL(`../src/${provider}-card.ts`, import.meta.url),
          'utf8',
        ),
        {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
          },
        },
      ).outputText,
      {
        exports,
        require: (id) =>
          id.includes('codex-card')
            ? { styles: {}, controlCss: '' }
            : id.includes('usage-window')
              ? { visibleUsageWindows: (x) => x }
              : { ProviderAccountManager: () => null },
        window: { open() {} },
        setInterval: (fn) => {
          timers.add(fn);
          return fn;
        },
        clearInterval: (fn) => timers.delete(fn),
        Map,
        Set,
        Date,
      },
    );
    let lateStatus;
    const Card = exports[
      `create${provider === 'antigravity' ? 'Antigravity' : provider[0].toUpperCase() + provider.slice(1)}Card`
    ](
      React,
      {},
      {
        call: async (_channel, method) => {
          if (method.endsWith('.status')) {
            if (lateStatus === true)
              return new Promise((resolve) => {
                lateStatus = resolve;
              });
            return {
              ok: true,
              value: { providers: { [provider]: structuredClone(status) } },
            };
          }
          if (method.endsWith('.usage')) {
            usage++;
            return { ok: true, value: {} };
          }
          if (method.endsWith('.login')) {
            status.busy = true;
            return {
              ok: true,
              value: {
                authorizeUrl: 'https://fixture.invalid',
                userCode: 'DUMMY',
              },
            };
          }
          return { ok: true, value: {} };
        },
      },
      (key) => key,
    );
    let status = {
        accounts: [{ key: 'same', account: 'Same identity' }],
        busy: false,
        authRevision: 0,
      },
      usage = 0,
      completed = 0,
      renderer;
    try {
      await act(async () => {
        renderer = create(
          React.createElement(Card, {
            presentation: 'auth',
            onComplete: () => completed++,
          }),
        );
      });
      const login = renderer.root
        .findAllByType('button')
        .find((n) =>
          ['addAccount', 'addAccountOAuth'].includes(n.children.join('')),
        );
      await act(async () => login.props.onClick());
      assert.equal(completed, 0);
      status.busy = false;
      status.authRevision++;
      await act(async () => {
        for (const tick of [...timers]) tick();
      });
      assert.equal(
        completed,
        1,
        'same roster completes from explicit successful operation',
      );
      assert.equal(usage, 0, 'auth presentation never loads usage');
      await act(async () => {
        for (const tick of [...timers]) tick();
      });
      assert.equal(completed, 1);
      const restart = renderer.root
        .findAllByType('button')
        .find((n) =>
          ['addAccount', 'addAccountOAuth'].includes(n.children.join('')),
        );
      await act(async () => restart.props.onClick());
      lateStatus = true;
      await act(async () => {
        for (const tick of [...timers]) tick();
      });
      await act(async () => renderer.unmount());
      renderer = null;
      status.authRevision++;
      await act(async () =>
        lateStatus({ ok: true, value: { providers: { [provider]: status } } }),
      );
      assert.equal(
        completed,
        1,
        'late success after unmount cannot complete another flow',
      );
    } finally {
      if (renderer) await act(async () => renderer.unmount());
    }
  });
}
