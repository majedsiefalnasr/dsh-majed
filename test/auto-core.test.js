import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCandidate, createRegistry, createRequest, filterEligible, selectAuto,
  createBudget, createSession, AUTO_ROUTE_ID, DEFAULT_MAX_ATTEMPTS, EFFORTS,
  AutoInputError,
} from '../modules/auto/index.js';

function candidate(overrides = {}) {
  return createCandidate({
    provider: 'prov-a', account: 'acc-a', model: 'model-a',
    priority: 10, defaultEffort: 'medium',
    smartPermittedEfforts: ['low', 'medium', 'high'],
    capabilities: { images: true, tools: true, maxContext: 128000, maxOutput: 4096, efforts: new Set(EFFORTS) },
    enabled: true,
    ...overrides,
  });
}

test('candidateId is provider/account/model', () => {
  const c = candidate();
  assert.equal(c.id, 'prov-a/acc-a/model-a');
});

test('createCandidate validates required identity', () => {
  assert.throws(() => createCandidate({ account: 'x', model: 'y' }), AutoInputError);
  assert.throws(() => createCandidate({ provider: 'x', model: 'y' }), AutoInputError);
  assert.throws(() => createCandidate({ provider: 'x', account: 'y' }), AutoInputError);
});

test('createCandidate validates priority and effort', () => {
  assert.throws(() => createCandidate({ provider: 'p', account: 'a', model: 'm', priority: 'high' }), AutoInputError);
  assert.throws(() => createCandidate({ provider: 'p', account: 'a', model: 'm', smartPermittedEfforts: ['turbo'] }), AutoInputError);
  assert.throws(() => createCandidate({ provider: 'p', account: 'a', model: 'm', defaultEffort: 'turbo' }), AutoInputError);
  const c = createCandidate({ provider: 'p', account: 'a', model: 'm', enabled: true });
  assert.equal(c.enabled, true);
  assert.equal(c.defaultEffort, undefined);
});

test('registry add/list/snapshot and enabled filter', () => {
  const reg = createRegistry();
  assert.equal(reg.size(), 0);
  reg.add(candidate());
  reg.add({ ...candidate(), provider: 'prov-b', account: 'acc-b', model: 'model-b', priority: 5, enabled: false });
  assert.equal(reg.size(), 2);
  assert.equal(reg.list().length, 2);
  assert.equal(reg.enabled().length, 1);
  assert.equal(reg.has('prov-a/acc-a/model-a'), true);
  assert.equal(reg.get('prov-a/acc-a/model-a').priority, 10);
  const snap = reg.snapshot();
  assert.equal(snap[0].smartPermittedEfforts instanceof Set, true);
});

test('registry setEnabled/setPriority/setSmartPermittedEfforts/setCooldown', () => {
  const reg = createRegistry();
  reg.add(candidate());
  const id = 'prov-a/acc-a/model-a';
  reg.setEnabled(id, false);
  assert.equal(reg.enabled().length, 0);
  reg.setEnabled(id, true);
  reg.setPriority(id, 100);
  assert.equal(reg.get(id).priority, 100);
  reg.setSmartPermittedEfforts(id, ['low']);
  assert.equal(reg.get(id).smartPermittedEfforts.has('high'), false);
  reg.setCooldown(id, Date.now() + 10000);
  assert.equal(reg.get(id).cooldownUntil > Date.now(), true);
  assert.throws(() => reg.setEnabled('missing', true), AutoInputError);
  reg.remove(id);
  assert.equal(reg.size(), 0);
  assert.throws(() => reg.remove(id), AutoInputError);
});

test('filterEligible excludes disabled and cooled-down candidates', () => {
  const reg = createRegistry();
  reg.add(candidate());
  reg.add({ ...candidate(), provider: 'p2', account: 'a2', model: 'm2', enabled: false });
  reg.add({ ...candidate(), provider: 'p3', account: 'a3', model: 'm3', cooldownUntil: Date.now() + 10000 });
  const eligible = filterEligible(reg.enabled(), {});
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].id, 'prov-a/acc-a/model-a');
});

test('filterEligible enforces images/tools/explicitEffort/context/output', () => {
  const reg = createRegistry();
  reg.add(candidate({ capabilities: { images: false, tools: true, efforts: new Set(EFFORTS) } }));
  reg.add({ ...candidate(), provider: 'p2', account: 'a2', model: 'm2', capabilities: { images: true, tools: false, efforts: new Set(['low', 'high']) }, defaultEffort: 'high', smartPermittedEfforts: ['high'] });
  reg.add({ ...candidate(), provider: 'p3', account: 'a3', model: 'm3', capabilities: { images: true, tools: true, efforts: new Set(['low']) }, defaultEffort: 'low' });

  // images required: p2 only (p1 no images, p3 has images but p3 defaultEffort low; no explicit effort so p3 eligible)
  let e = filterEligible(reg.enabled(), { images: true });
  assert.equal(e.length, 2);
  assert.equal(e.map(c => c.id).sort().join(','), ['p3/a3/m3', 'p2/a2/m2'].sort().join(','));

  // tools required: p1 and p3 (p2 no tools)
  e = filterEligible(reg.enabled(), { tools: true });
  assert.equal(e.length, 2);

  // explicit effort medium: p1 supports medium, p3 only low (default low, smartPermitted has low only) -> p1
  e = filterEligible(reg.enabled(), { explicitEffort: 'medium' });
  assert.equal(e.length, 1);
  assert.equal(e[0].id, 'prov-a/acc-a/model-a');

  // explicit effort low: p3 defaultEffort low -> p3; p1 smartPermitted includes low but defaultEffort medium != low, allowed via smartPermitted
  e = filterEligible(reg.enabled(), { explicitEffort: 'low' });
  assert.equal(e.length, 2);

  // context limit above p1's maxContext excludes all
  e = filterEligible(reg.enabled(), { maxContext: 999999 });
  assert.equal(e.length, 0);
});

test('filterEligible never reduces explicit effort: candidate lacking the exact effort is excluded', () => {
  const reg = createRegistry();
  reg.add(candidate({ capabilities: { efforts: new Set(['low', 'medium']) } }));
  reg.add({ ...candidate(), provider: 'p2', account: 'a2', model: 'm2', capabilities: { efforts: new Set(['high']) } });
  const e = filterEligible(reg.enabled(), { explicitEffort: 'high' });
  assert.equal(e.length, 1);
  assert.equal(e[0].id, 'p2/a2/m2');
});

test('selectAuto picks highest priority among eligible', () => {
  const reg = createRegistry();
  reg.add(candidate({ priority: 10 }));
  reg.add({ ...candidate(), provider: 'p2', account: 'a2', model: 'm2', priority: 50 });
  reg.add({ ...candidate(), provider: 'p3', account: 'a3', model: 'm3', priority: 30, enabled: false });
  const budget = createBudget(3);
  const session = createSession();
  const sel = selectAuto({ registry: reg, session, budget, request: {} });
  assert.equal(sel.reason, 'selected');
  assert.equal(sel.candidate.id, 'p2/a2/m2');
  assert.equal(sel.effort, 'medium');
  assert.equal(budget.remaining(), 3);
});

test('selectAuto session stickiness retains healthy route despite higher priority', () => {
  const reg = createRegistry();
  reg.add(candidate({ priority: 10 }));
  reg.add({ ...candidate(), provider: 'p2', account: 'a2', model: 'm2', priority: 50 });
  const budget = createBudget(3);
  const session = createSession();
  session.setRoute('prov-a/acc-a/model-a', 'medium');
  const sel = selectAuto({ registry: reg, session, budget, request: {} });
  assert.equal(sel.reason, 'sticky');
  assert.equal(sel.candidate.id, 'prov-a/acc-a/model-a');
});

test('selectAuto manual selection exits Auto', () => {
  const reg = createRegistry();
  reg.add(candidate({ priority: 50 }));
  const budget = createBudget(3);
  const session = createSession();
  session.exitManual();
  const sel = selectAuto({ registry: reg, session, budget, request: {} });
  assert.equal(sel.reason, 'manual');
  assert.equal(sel.candidate, undefined);
});

test('selectAuto ineligible when no candidate qualifies', () => {
  const reg = createRegistry();
  reg.add(candidate({ capabilities: { images: false } }));
  const budget = createBudget(3);
  const session = createSession();
  const sel = selectAuto({ registry: reg, session, budget, request: { images: true } });
  assert.equal(sel.reason, 'ineligible');
  assert.equal(sel.candidate, undefined);
});

test('selectAuto respects explicit effort', () => {
  const reg = createRegistry();
  reg.add(candidate({ defaultEffort: 'medium', capabilities: { efforts: new Set(EFFORTS) } }));
  const budget = createBudget(3);
  const session = createSession();
  const sel = selectAuto({ registry: reg, session, budget, request: { explicitEffort: 'high' } });
  assert.equal(sel.reason, 'selected');
  assert.equal(sel.effort, 'high');
});

test('budget enforces distinct attempts, no repeat, max limit', () => {
  const b = createBudget(2);
  assert.equal(b.maxAttempts, 2);
  assert.equal(b.remaining(), 2);
  assert.equal(b.record('a'), true);
  assert.equal(b.record('a'), false); // repeat blocked
  assert.equal(b.record('b'), true);
  assert.equal(b.remaining(), 0);
  assert.equal(b.exhausted(), true);
  assert.equal(b.record('c'), false);
  b.reset();
  assert.equal(b.remaining(), 2);
  assert.equal(b.record('c'), true);
});

test('default max attempts is three', () => {
  assert.equal(createBudget().maxAttempts, DEFAULT_MAX_ATTEMPTS);
  assert.equal(DEFAULT_MAX_ATTEMPTS, 3);
});

test('selectAuto exhausted budget stops clearly', () => {
  const reg = createRegistry();
  reg.add(candidate({ priority: 10 }));
  reg.add({ ...candidate(), provider: 'p2', account: 'a2', model: 'm2', priority: 20 });
  const budget = createBudget(1);
  const session = createSession();
  budget.record('other'); // consume budget
  const sel = selectAuto({ registry: reg, session, budget, request: {} });
  assert.equal(sel.reason, 'exhausted');
  assert.equal(sel.candidate, undefined);
});
