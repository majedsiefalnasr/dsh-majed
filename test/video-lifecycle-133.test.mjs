import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { readFile } from 'node:fs/promises';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
async function fixture() {
  const source = await readFile(new URL('../src/VideoGenerateToolview.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {}, created = [], revoked = [];
  const jsx = await import('react/jsx-runtime');
  vm.runInNewContext(compiled, { exports, require: name => name === 'react' ? React : name === 'react/jsx-runtime' ? jsx : {}, atob, Blob, Uint8Array, Error,
    URL: { createObjectURL(blob) { created.push(blob); return `blob:fixture-${created.length}`; }, revokeObjectURL(url) { revoked.push(url); } } });
  return { View: exports.VideoGenerateToolview, created, revoked };
}
const block = name => ({ kind: 'result', call: { argsRaw: '{"prompt":"fixture"}' }, content: [{ type: 'text', text: `Saved video to /fixture/${name}` }], isError: false });
const bytes = { mediaType: 'video/mp4', dataBase64: 'AAAAAGZ0eXA=' };
const t = key => key;
test('nested video result loads, playback failure is visible and unmount revokes its object URL', async () => {
  const f = await fixture(); let renderer;
  try {
    await act(async () => { renderer = create(React.createElement(f.View, { block: block('video-a.mp4'), t, loadVideo: async name => { assert.equal(name, 'video-a.mp4'); return bytes; } })); });
    const player = renderer.root.findByType('video');
    assert.equal(player.props.controls, true);
    assert.equal(player.props.src, 'blob:fixture-1');
    await act(async () => player.props.onError());
    assert.match(JSON.stringify(renderer.toJSON()), /videoLoadFailed/);
  } finally { if (renderer) await act(async () => renderer.unmount()); }
  assert.deepEqual(f.revoked, ['blob:fixture-1']);
});
test('video replacement revokes prior URL and late completion after unmount creates no URL', async () => {
  const f = await fixture(); let renderer, finish;
  const loadVideo = name => name === 'video-late.mp4' ? new Promise(resolve => { finish = resolve; }) : Promise.resolve(bytes);
  await act(async () => { renderer = create(React.createElement(f.View, { block: block('video-a.mp4'), t, loadVideo })); });
  await act(async () => renderer.update(React.createElement(f.View, { block: block('video-late.mp4'), t, loadVideo })));
  assert.deepEqual(f.revoked, ['blob:fixture-1']);
  assert.match(JSON.stringify(renderer.toJSON()), /videoLoading/);
  await act(async () => renderer.unmount());
  await act(async () => finish(bytes));
  assert.equal(f.created.length, 1);
});
