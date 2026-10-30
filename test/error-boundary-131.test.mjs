// Ticket #131 hardening: a render failure is contained by the owned boundary instead of relying on the host.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import React from 'react';
import Renderer, { act } from 'react-test-renderer';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/usage-badge/error-boundary.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Object, String });
const { guarded } = exports;

test('a throwing component renders nothing, is reported once with its label, and siblings survive', () => {
  const reports = [];
  const originalError = console.error; console.error = () => {};
  try {
    const Broken = () => { throw new Error('primitive vanished'); };
    const Fine = ({ text }) => React.createElement('span', null, text);
    const GuardedBroken = guarded(React, Broken, 'usage badge', (message, error) => reports.push([message, String(error.message)]));
    let renderer;
    act(() => { renderer = Renderer.create(React.createElement('div', null, React.createElement(GuardedBroken, {}), React.createElement(Fine, { text: 'sibling' }))); });
    assert.equal(renderer.root.findAllByType(Fine).length, 1, 'sibling still rendered');
    assert.equal(renderer.root.findAllByProps({ children: 'sibling' }).length > 0, true);
    assert.deepEqual(reports, [['dsh-majed: usage badge failed to render', 'primitive vanished']]);
    act(() => renderer.unmount());
  } finally { console.error = originalError; }
});

test('a healthy component is rendered unchanged with its props', () => {
  const Healthy = ({ label }) => React.createElement('b', null, label);
  const Guarded = guarded(React, Healthy, 'Speed control');
  let renderer;
  act(() => { renderer = Renderer.create(React.createElement(Guarded, { label: 'ok' })); });
  assert.equal(renderer.root.findByType('b').props.children, 'ok');
  act(() => renderer.unmount());
});
