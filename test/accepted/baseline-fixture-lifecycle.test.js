import test from 'node:test';
import assert from 'node:assert/strict';
import { createBaselineHarness } from './helpers/baseline-client-harness.js';

const source = `window.__ModuleLoader__.load({ factory(require) {
  const React = require('react');
  function First({ value, cleanup }) {
    const [saved] = React.useState(value);
    React.useEffect(() => cleanup, []);
    return React.createElement('input', { value: saved });
  }
  function Second({ value }) {
    const [saved] = React.useState(value);
    return React.createElement('input', { value: saved });
  }
  function Root({ show = true, second = false, identity = 'a', value = 'initial', cleanup = () => {} }) {
    return React.createElement('div', null, show && React.createElement(second ? Second : First, { key: identity, value, cleanup }));
  }
  return { apply(ctx) { ctx.slots.register({ id: 'fixture-lifecycle' }, Root); } };
} });`;

test('boundary fixture preserves mounted cells but resets removed, replaced and rekeyed components', t => {
  const harness = createBaselineHarness(source);
  t.after(() => harness.dispose());
  harness.apply();
  let cleanups = 0;
  const cleanup = () => { cleanups++; };
  const view = harness.render('fixture-lifecycle', { value: 'saved', cleanup });
  const value = () => view.one(n => n.type === 'input').props.value;
  view.render({ value: 'ignored', cleanup });
  assert.equal(value(), 'saved');
  view.render({ show: false });
  assert.equal(cleanups, 1);
  view.render({ value: 'remounted', cleanup });
  assert.equal(value(), 'remounted');
  view.render({ second: true, value: 'replacement' });
  assert.equal(value(), 'replacement');
  assert.equal(cleanups, 2);
  view.render({ value: 'first again', cleanup });
  view.render({ identity: 'b', value: 'rekeyed', cleanup });
  assert.equal(value(), 'rekeyed');
  assert.equal(cleanups, 3);
  view.unmount();
  assert.equal(cleanups, 4);
  view.unmount();
  assert.equal(cleanups, 4);
});
