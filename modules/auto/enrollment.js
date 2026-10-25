// Auto candidate enrollment management layer.
//
// Explicitly enrolls provider/account/model candidates with priority, default
// effort and Smart-permitted efforts. Membership is separate from login, catalog
// import, direct pooling, search/media scheduling and child-routing opt-in:
// nothing here is enrolled automatically by login or catalog changes, and this
// module never touches the catalog or subscription pools. Empty membership is
// valid and explained: with no candidates Auto has no route and selectAuto
// reports 'ineligible' rather than falling back to an implicit model.
//
// All edits validate locally (and the same validators are exported for
// server-side use). A monotonic version stamp lets callers detect concurrent
// / stale settings revisions.
//
import {
  createCandidate, AutoInputError, fail, requiredString,
} from './index.js';

function candidateIdOf(input) {
  return `${requiredString(input.provider, 'provider')}/${requiredString(input.account, 'account')}/${requiredString(input.model, 'model')}`;
}

/** Validate an enrollment input without mutating anything. Throws AutoInputError. */
export function validateEnrollmentInput(input = {}) {
  createCandidate(input);
  return candidateIdOf(input);
}

/** Build an enrollment service over an explicit Auto registry. */
export function createAutoEnrollment(registry) {
  if (!registry || typeof registry.add !== 'function' || typeof registry.get !== 'function' || typeof registry.remove !== 'function') fail();
  let version = 0;
  function bump() { version += 1; return version; }

  return {
    /** Monotonic settings version: increases on every mutation, stable on reads. */
    version() { return version; },

    /** Snapshot of enrollment state at a version. Read does not bump. */
    snapshot() {
      return {
        version,
        candidates: registry.snapshot(),
        enabled: registry.enabled().map(c => c.id),
      };
    },

    /** Explicitly enroll a validated candidate. The only enrollment path. */
    enroll(input) {
      const candidate = createCandidate(input);
      registry.add(candidate);
      bump();
      return candidate;
    },

    setPriority(id, priority) {
      const next = registry.setPriority(id, priority);
      bump();
      return next;
    },

    setDefaultEffort(id, effort) {
      const next = registry.setDefaultEffort(id, effort);
      bump();
      return next;
    },

    setSmartPermittedEfforts(id, efforts) {
      const next = registry.setSmartPermittedEfforts(id, efforts);
      bump();
      return next;
    },

    setEnabled(id, enabled) {
      const next = registry.setEnabled(id, enabled);
      bump();
      return next;
    },

    setCooldown(id, cooldownUntil) {
      const next = registry.setCooldown(id, cooldownUntil);
      bump();
      return next;
    },

    remove(id) {
      registry.remove(String(id));
      bump();
    },

    list() { return registry.list(); },
    enabled() { return registry.enabled(); },
    get(id) { return registry.get(String(id)); },
    has(id) { return registry.has(String(id)); },
    size() { return registry.size(); },

    /** Explicit apply-and-reselect: mark the session reselected and point it at
     * a route. The session re-selects against the live registry on the next
     * dispatch instead of sticking to its current route. */
    applyAndReselect(session, routeId, effort) {
      requiredString(routeId, 'routeId');
      if (!session || typeof session.setReselected !== 'function' || typeof session.setRoute !== 'function') fail();
      session.setReselected(true);
      session.setRoute(String(routeId), effort === undefined ? undefined : effort);
      bump();
      return { routeId: String(routeId), effort, reselected: true };
    },
  };
}

export { createAutoEnrollment as default };
