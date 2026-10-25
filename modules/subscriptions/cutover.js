// Subscription cutover and rollback preparation.
//
// Preparation only: no Cutover, no account-state access, no live operations and
// no operational state changes. This module imports no refresh-capable auth
// module, so a supposedly read-only preview cannot trigger credential refresh or
// forced reauthentication. All state is synthetic and process-lifetime only.

export const SUBSCRIPTIONS_CUTOVER_PREPARATION = 'dshMajedSubscriptionsCutover';

export const GAP_LEGACY_ROUTER_AUTH_MIGRATION = 'legacy-router-auth-migration';
export const GAP_PROTECTED_BACKUP_DESTINATION = 'protected-backup-destination';

export const BACKUP_NEVER_DESTINATIONS = Object.freeze([
  'repository',
  'browser',
  'evidence-bundle',
  'plaintext-logs',
]);

const COLLISION_KINDS = Object.freeze(['providers', 'tools', 'rpc', 'history']);

const STATE_PATHS = Object.freeze([
  {
    kind: 'auth',
    location: '$DSH_HOME/plugins/subscriptions/auth.json',
    backupDestination: 'Owner-approved external destination only',
    permission: 'Owner-authenticated read via subscriptions route; credentials redacted, never echoed',
    schema: 'provider { default, accounts, aliases? }; session token/expiry and provider identity/scopes',
    compatibility: 'single-writer store schema preserved; public identities and history retained, credentials never rewritten in preview',
    secrets: 'explicit unchanged/replace/remove; masked in snapshots, errors and logs',
    sensitiveReads: ['account identity and advertised models (non-secret)'],
    sensitiveWrites: ['credential replace or remove (sensitive)'],
  },
  {
    kind: 'legacyRouterAuth',
    location: '$DSH_HOME/plugins/router/auth.json',
    backupDestination: 'Owner-approved external destination only',
    permission: 'Owner-authenticated read; migration must not execute during a read-only preview',
    schema: 'single-account wrapping; Codex workspace-to-user/email reconciliation and alias chains',
    compatibility: 'migration diagnostics preserved; no write and reauthentication is not forced during preview',
    secrets: 'migration may touch credentials; never echoed, skipped on malformed entries',
    sensitiveReads: ['legacy account identity and workspace references (non-secret summary)'],
    sensitiveWrites: ['legacy migration write (sensitive; blocked in preview)'],
  },
  {
    kind: 'providerSettings',
    location: '$DSH_HOME/plugins/subscriptions/provider-settings.json',
    backupDestination: 'Owner-approved external destination only',
    permission: 'Owner-authenticated read via subscriptions route; preferences are not credentials',
    schema: '{ providers, toolHistory }; model display names, alias/poolEnabled/independentEntry/poolModels, visibleModels',
    compatibility: 'aliases and pool allowlists preserve wire identities; per-account allowlists retained',
    secrets: 'no secret values in provider settings',
    sensitiveReads: ['provider preferences, aliases and pool participation (non-secret)'],
    sensitiveWrites: ['preference replace/remove (non-secret)'],
  },
  {
    kind: 'modelDefaults',
    location: '$DSH_HOME/plugins/subscriptions/model-defaults.json',
    backupDestination: 'Owner-approved external destination only',
    permission: 'Owner-authenticated read via subscriptions route',
    schema: 'provider -> model -> effort; lazy snapshot, malformed-entry diagnostics',
    compatibility: 'per-model effort defaults merge with supported effort IDs; explicit manual choices preserved',
    secrets: 'no secret values in model defaults',
    sensitiveReads: ['per-model effort defaults (non-secret)'],
    sensitiveWrites: ['set or clear model effort default (non-secret)'],
  },
  {
    kind: 'catalog',
    location: '$DSH_HOME/plugins/subscriptions/models.json',
    backupDestination: 'Owner-approved external destination only',
    permission: 'Owner-authenticated read via subscriptions route',
    schema: 'provider snapshot { at, models } plus accounts[provider][account]; effort/default/context/output/priority/thinking/fast/Copilot/modalities',
    compatibility: 'static/discovered/manual catalogs preserved; stale or invalid entries are not treated as account failure',
    secrets: 'no secret values in catalog entries',
    sensitiveReads: ['catalog entries and per-account capabilities (non-secret)'],
    sensitiveWrites: ['catalog invalidation or refresh (non-secret metadata, not credential refresh)'],
  },
  {
    kind: 'proxy',
    location: '$DSH_HOME/plugins/subscriptions/proxy.json',
    backupDestination: 'Owner-approved external destination only',
    permission: 'Owner-authenticated read; proxy credentials masked, never returned in a configured view',
    schema: 'enabled/URL/user/password/bypass; 0600 persistence, lazy load, malformed config disables proxy',
    compatibility: 'proxy draft kept separate from applied config; bypass matches preserved',
    secrets: 'password never returned; explicit unchanged/replace/remove for credentials',
    sensitiveReads: ['proxy enabled/URL/bypass state (non-secret); credentials masked'],
    sensitiveWrites: ['proxy password/user replace or remove (sensitive)'],
  },
  {
    kind: 'images',
    location: '$DSH_HOME/plugins/subscriptions/images',
    backupDestination: 'Owner-approved external destination only',
    permission: 'Owner-authenticated read; generated image files are not account secrets',
    schema: 'sniffed type; unique saved filenames; durable attachment references only',
    compatibility: 'no generated image is silently dropped or converted to text-to-image on restore',
    secrets: 'no account credentials in generated images',
    sensitiveReads: ['generated image metadata (non-secret)'],
    sensitiveWrites: ['generated image save (non-secret)'],
  },
  {
    kind: 'videos',
    location: '$DSH_HOME/plugins/subscriptions/videos',
    backupDestination: 'Owner-approved external destination only',
    permission: 'Owner-authenticated read; generated video files are not account secrets',
    schema: 'timestamp/random MP4 naming; result fileName metadata and expiring provider URL',
    compatibility: 'submission and polling recovery never duplicate side effects on restore',
    secrets: 'no account credentials in generated videos',
    sensitiveReads: ['generated video metadata (non-secret)'],
    sensitiveWrites: ['generated video save (non-secret)'],
  },
]);

const CUTOVER_STEPS = Object.freeze([
  { step: 'backup', order: 1, action: 'Take a verified backup of all subscription state paths.' },
  { step: 'drainQuiesce', order: 2, action: 'Drain in-flight streams and quiesce the standalone account-store writer so no concurrent refresh runs during preview.' },
  { step: 'disableStandaloneOwnership', order: 3, action: 'Disable standalone ownership of routes, tools, RPC endpoints and history; no duplicate provider registration.' },
  { step: 'activateReplacement', order: 4, action: 'Activate the replacement after collision and exact store/schema compatibility checks.' },
  { step: 'verify', order: 5, action: 'Verify the replacement serves all accepted Parity rows; fresh approval points required.' },
]);

const ROLLBACK_STEPS = Object.freeze([
  { step: 'disableReplacement', order: 1, action: 'Disable the replacement before restoring standalone ownership.' },
  { step: 'restoreOwnership', order: 2, action: 'Reverse ownership back to the standalone account store before restoring state.' },
  { step: 'restoreState', order: 3, action: 'Restore subscription state from the verified backup to standalone-owned locations.' },
  { step: 'verify', order: 4, action: 'Verify the standalone store serves its previous capabilities; no replacement residue.' },
]);

const PROHIBITED_OPERATIONS = Object.freeze([
  'automatic account deletion',
  'automatic plugin deletion',
  'copy secrets into project/UI/evidence',
  'forced reauthentication',
  'migration or reauthentication without Owner',
]);

function initialDispositions() {
  return new Map([
    [
      GAP_LEGACY_ROUTER_AUTH_MIGRATION,
      {
        status: 'pending',
        reason: 'Legacy router auth migration must not execute during a read-only preview; requires explicit Owner approval before any migration or reauthentication.',
      },
    ],
    [
      GAP_PROTECTED_BACKUP_DESTINATION,
      {
        status: 'pending',
        reason: 'Protected backup destination must be an Owner-approved external destination; never the repository, browser, evidence bundle or plaintext logs.',
      },
    ],
  ]);
}

// An operation is sensitive when it mentions credentials/password/migration and
// is not explicitly described as non-secret or masked.
function isSensitive(operation) {
  return /credential|password|access.?token|migration/i.test(operation) && !/non.?secret/i.test(operation);
}

export function createSubscriptionsCutoverPreparation(options = {}) {
  const dispositions = initialDispositions();
  const sensitiveReads = [];
  const sensitiveWrites = [];
  for (const path of STATE_PATHS) {
    for (const read of path.sensitiveReads) sensitiveReads.push({ kind: path.kind, operation: read, sensitive: isSensitive(read) });
    for (const write of path.sensitiveWrites) sensitiveWrites.push({ kind: path.kind, operation: write, sensitive: isSensitive(write) });
  }
  return {
    enumerateStatePaths() {
      return STATE_PATHS.map(path => {
        const copy = Object.assign({}, path);
        copy.sensitiveReads = [...path.sensitiveReads];
        copy.sensitiveWrites = [...path.sensitiveWrites];
        return Object.freeze(copy);
      });
    },
    sensitiveReads() {
      return Object.freeze([...sensitiveReads].map(item => Object.assign({}, item)));
    },
    sensitiveWrites() {
      return Object.freeze([...sensitiveWrites].map(item => Object.assign({}, item)));
    },
    backupPlan() {
      return [
        { step: 'backup', order: 1, action: 'Snapshot all subscription state paths to an Owner-approved external destination.' },
        { step: 'verifyBackup', order: 2, action: 'Verify backup integrity and restorability before any cutover step.' },
      ];
    },
    restorePlan() {
      return [
        { step: 'restore', order: 1, action: 'Restore state from the verified backup to standalone-owned subscription locations.' },
        { step: 'verifyRestore', order: 2, action: 'Verify restored state matches the backup and standalone ownership is reinstated.' },
      ];
    },
    cutoverOrder() {
      return CUTOVER_STEPS.map(step => Object.assign({}, step));
    },
    rollbackOrder() {
      return ROLLBACK_STEPS.map(step => Object.assign({}, step));
    },
    collisionCheck(current = {}, proposed = {}) {
      const collisions = {};
      let blocked = false;
      for (const kind of COLLISION_KINDS) {
        const currentSet = new Set(Array.isArray(current[kind]) ? current[kind] : []);
        const proposedList = Array.isArray(proposed[kind]) ? proposed[kind] : [];
        const hits = proposedList.filter(item => currentSet.has(item));
        collisions[kind] = hits;
        if (hits.length > 0) blocked = true;
      }
      return Object.freeze({ collisions, blocked });
    },
    previewGaps() {
      return [...dispositions.entries()].map(([gapId, disposition]) => ({
        gapId,
        status: disposition.status,
        reason: disposition.reason,
        ...(disposition.acceptedBy !== undefined ? { acceptedBy: disposition.acceptedBy } : {}),
      }));
    },
    acceptDeferral(gapId, acceptedBy) {
      if (!dispositions.has(gapId)) throw Object.assign(new Error(`Unknown gap: ${gapId}`), { code: 'SUBSCRIPTIONS_UNKNOWN_GAP' });
      if (typeof acceptedBy !== 'string' || !acceptedBy) throw Object.assign(new Error('acceptedBy is required.'), { code: 'SUBSCRIPTIONS_MISSING_OWNER' });
      const disposition = {
        status: 'accepted-deferral',
        reason: dispositions.get(gapId).reason,
        acceptedBy,
      };
      dispositions.set(gapId, disposition);
      return { gapId, ...disposition };
    },
    dispositions() {
      return [...dispositions.entries()].map(([gapId, disposition]) => ({
        gapId,
        status: disposition.status,
        reason: disposition.reason,
        ...(disposition.acceptedBy !== undefined ? { acceptedBy: disposition.acceptedBy } : {}),
      }));
    },
    isCutoverBlocked() {
      return [...dispositions.values()].some(disposition => disposition.status === 'pending');
    },
    prohibitedOperations() {
      return [...PROHIBITED_OPERATIONS];
    },
  };
}
