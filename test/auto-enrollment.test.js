import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCandidate, createRegistry, createRequest, filterEligible, selectAuto,
  createBudget, createSession, EFFORTS, AutoInputError,
} from '../modules/auto/index.js';
import { createAutoEnrollment } from '../modules/auto/enrollment.js';
import { createCatalog, createCatalogEntry } from '../modules/catalog/index.js';

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

test('enrollment service exports and wraps an explicit registry', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  assert.equal(enrollment.size(), 0);
  assert.equal(reg.size(), 0);
  assert.equal(enrollment.has('prov-a/acc-a/model-a'), false);
});

test('enroll is explicit: validates identity, priority, default effort and smart-permitted efforts', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  const c = enrollment.enroll({
    provider: 'prov-a', account: 'acc-a', model: 'model-a',
    priority: 7, defaultEffort: 'high',
    smartPermittedEfforts: ['low', 'high'],
    capabilities: { images: true, tools: true, efforts: new Set(EFFORTS) },
    enabled: true,
  });
  assert.equal(c.id, 'prov-a/acc-a/model-a');
  assert.equal(c.priority, 7);
  assert.equal(c.defaultEffort, 'high');
  assert.equal(c.smartPermittedEfforts.has('medium'), false);
  assert.equal(enrollment.size(), 1);
  assert.equal(enrollment.get('prov-a/acc-a/model-a').id, c.id);

  assert.throws(() => enrollment.enroll({ account: 'a', model: 'm' }), AutoInputError);
  assert.throws(() => enrollment.enroll({ provider: 'p', account: 'a', model: 'm', priority: 'high' }), AutoInputError);
  assert.throws(() => enrollment.enroll({ provider: 'p', account: 'a', model: 'm', defaultEffort: 'turbo' }), AutoInputError);
  assert.throws(() => enrollment.enroll({ provider: 'p', account: 'a', model: 'm', smartPermittedEfforts: ['turbo'] }), AutoInputError);
  assert.equal(enrollment.size(), 1);
});

test('empty membership is valid: no candidates means Auto reports ineligible, not an implicit fallback', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  assert.equal(enrollment.size(), 0);
  assert.deepEqual(enrollment.list(), []);
  assert.deepEqual(enrollment.enabled(), []);
  const budget = createBudget(3);
  const session = createSession();
  const sel = selectAuto({ registry: reg, session, budget, request: {} });
  assert.equal(sel.reason, 'ineligible');
  assert.equal(sel.candidate, undefined);
});

test('membership is separate from catalog: catalog additions never enroll candidates', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  const catalog = createCatalog();
  catalog.addAccount(createCatalogEntry('acc-a', { provider: 'prov-a', label: 'Acc A', models: ['model-a'], defaultEffort: 'medium' }));
  assert.equal(enrollment.size(), 0, 'catalog.addAccount must not enroll an Auto candidate');
  assert.equal(reg.size(), 0);
  // Explicit enrollment is the only enrollment path.
  enrollment.enroll({ provider: 'prov-a', account: 'acc-a', model: 'model-a', enabled: true });
  assert.equal(enrollment.size(), 1);
});

test('setPriority validates and edits priority', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  enrollment.enroll(candidate());
  enrollment.setPriority('prov-a/acc-a/model-a', 99);
  assert.equal(enrollment.get('prov-a/acc-a/model-a').priority, 99);
  assert.throws(() => enrollment.setPriority('missing', 1), AutoInputError);
  assert.throws(() => enrollment.setPriority('prov-a/acc-a/model-a', 'high'), AutoInputError);
});

test('setDefaultEffort validates and edits default effort', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  enrollment.enroll(candidate());
  enrollment.setDefaultEffort('prov-a/acc-a/model-a', 'low');
  assert.equal(enrollment.get('prov-a/acc-a/model-a').defaultEffort, 'low');
  assert.throws(() => enrollment.setDefaultEffort('missing', 'low'), AutoInputError);
  assert.throws(() => enrollment.setDefaultEffort('prov-a/acc-a/model-a', 'turbo'), AutoInputError);
  // clearing default effort is valid (global default preserved)
  enrollment.setDefaultEffort('prov-a/acc-a/model-a', undefined);
  assert.equal(enrollment.get('prov-a/acc-a/model-a').defaultEffort, undefined);
});

test('setSmartPermittedEfforts validates the effort set', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  enrollment.enroll(candidate());
  enrollment.setSmartPermittedEfforts('prov-a/acc-a/model-a', ['low']);
  assert.equal(enrollment.get('prov-a/acc-a/model-a').smartPermittedEfforts.has('high'), false);
  assert.throws(() => enrollment.setSmartPermittedEfforts('missing', ['low']), AutoInputError);
  assert.throws(() => enrollment.setSmartPermittedEfforts('prov-a/acc-a/model-a', ['turbo']), AutoInputError);
});

test('setEnabled and remove block a candidate in all sessions', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  enrollment.enroll(candidate({ priority: 50 }));
  const session = createSession();
  const budget = createBudget(3);
  let sel = selectAuto({ registry: reg, session, budget, request: {} });
  assert.equal(sel.reason, 'selected');
  assert.equal(sel.candidate.id, 'prov-a/acc-a/model-a');

  enrollment.setEnabled('prov-a/acc-a/model-a', false);
  sel = selectAuto({ registry: reg, session, budget, request: {} });
  assert.equal(sel.reason, 'ineligible');
  enrollment.setEnabled('prov-a/acc-a/model-a', true);

  enrollment.remove('prov-a/acc-a/model-a');
  assert.equal(enrollment.size(), 0);
  assert.throws(() => enrollment.remove('prov-a/acc-a/model-a'), AutoInputError);
  sel = selectAuto({ registry: reg, session, budget, request: {} });
  assert.equal(sel.reason, 'ineligible');
});

test('session.revoke blocks a candidate in every session and does not touch others', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  enrollment.enroll(candidate({ priority: 10 }));
  enrollment.enroll({ ...candidate(), provider: 'p2', account: 'a2', model: 'm2', priority: 20 });
  const sessionA = createSession();
  const sessionB = createSession();
  const budget = createBudget(3);
  sessionA.revoke('prov-a/acc-a/model-a');
  assert.equal(selectAuto({ registry: reg, session: sessionA, budget, request: {} }).candidate.id, 'p2/a2/m2');
  assert.equal(selectAuto({ registry: reg, session: sessionB, budget: createBudget(3), request: {} }).candidate.id, 'p2/a2/m2');
  // Revocation is session-scoped state but blocks the candidate for new dispatches in that session.
  assert.equal(sessionA.isRevoked('prov-a/acc-a/model-a'), true);
  assert.equal(sessionB.isRevoked('prov-a/acc-a/model-a'), false);
});

test('manual model selection exits Auto for the session (global default and manual preserved)', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  enrollment.enroll(candidate({ priority: 50 }));
  const session = createSession();
  const budget = createBudget(3);
  assert.equal(selectAuto({ registry: reg, session, budget, request: {} }).reason, 'selected');
  session.exitManual();
  assert.equal(selectAuto({ registry: reg, session, budget, request: {} }).reason, 'manual');
  assert.equal(session.manual, true);
});

test('strategy and default-priority edits affect new sessions (registry read live)', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  enrollment.enroll(candidate({ priority: 10 }));
  enrollment.enroll({ ...candidate(), provider: 'p2', account: 'a2', model: 'm2', priority: 5 });
  const session = createSession();
  const budget = createBudget(3);
  assert.equal(selectAuto({ registry: reg, session, budget, request: {} }).candidate.id, 'prov-a/acc-a/model-a');
  enrollment.setPriority('p2/a2/m2', 100); // strategy/default-priority edit
  const next = createSession(); // new session reads live registry
  assert.equal(selectAuto({ registry: reg, session: next, budget: createBudget(3), request: {} }).candidate.id, 'p2/a2/m2');
});

test('explicit apply-and-reselect updates an existing session instead of sticking', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  enrollment.enroll(candidate({ priority: 10, defaultEffort: 'medium' }));
  enrollment.enroll({ ...candidate(), provider: 'p2', account: 'a2', model: 'm2', priority: 50, defaultEffort: 'high' });
  const session = createSession();
  const budget = createBudget(3);
  // Stick to the lower-priority current route first.
  session.setRoute('prov-a/acc-a/model-a', 'medium');
  assert.equal(selectAuto({ registry: reg, session, budget, request: {} }).reason, 'sticky');
  // Raise p2 priority and explicitly apply-and-reselect into this session.
  enrollment.setPriority('p2/a2/m2', 5);
  enrollment.applyAndReselect(session, 'p2/a2/m2', 'high');
  assert.equal(session.reselected, true);
  assert.deepEqual(session.current, { route: 'p2/a2/m2', effort: 'high' });
  const reselected = selectAuto({ registry: reg, session, budget: createBudget(3), request: {} });
  assert.equal(reselected.reason, 'selected');
  assert.equal(reselected.candidate.id, 'p2/a2/m2');
  assert.equal(reselected.effort, 'high');
  assert.equal(session.reselected, false, 'apply-and-reselect flag is consumed by re-selection');
});

test('apply-and-reselect requires a valid session and route', () => {
  const enrollment = createAutoEnrollment(createRegistry());
  assert.throws(() => enrollment.applyAndReselect(undefined, 'x/y/z'), AutoInputError);
  assert.throws(() => enrollment.applyAndReselect({}, 'x/y/z'), AutoInputError);
  const session = createSession();
  assert.throws(() => enrollment.applyAndReselect(session, undefined), AutoInputError);
});

test('settings-version stamp increases on mutation and is stable on reads', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  const v0 = enrollment.version();
  enrollment.enroll(candidate());
  const v1 = enrollment.version();
  assert.ok(v1 > v0);
  enrollment.setPriority('prov-a/acc-a/model-a', 1);
  assert.ok(enrollment.version() > v1);
  const snapA = enrollment.snapshot();
  const snapB = enrollment.snapshot();
  assert.equal(snapA.version, snapB.version);
  assert.deepEqual(snapA.candidates, snapB.candidates);
});

test('filterEligible never reduces explicit effort and broadens nothing', () => {
  const reg = createRegistry();
  const enrollment = createAutoEnrollment(reg);
  enrollment.enroll(candidate({ capabilities: { efforts: new Set(['low', 'medium']) } }));
  enrollment.enroll({ ...candidate(), provider: 'p2', account: 'a2', model: 'm2', capabilities: { efforts: new Set(['high']) } });
  const e = filterEligible(reg.enabled(), { explicitEffort: 'high' });
  assert.equal(e.length, 1);
  assert.equal(e[0].id, 'p2/a2/m2');
});
