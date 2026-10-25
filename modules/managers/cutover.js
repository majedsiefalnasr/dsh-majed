export const CUTOVER_PREPARATION = 'dshMajedManagersCutover';

export const GAP_PROFILE_ONLY_HOOKS = 'profile-only-hook-definitions';
export const GAP_MCP_IMPORT_EXPORT_INGEST = 'mcp-import-export-ingest';

export const BACKUP_NEVER_DESTINATIONS = Object.freeze([
  'repository',
  'browser',
  'evidence-bundle',
  'plaintext-logs',
]);

const COLLISION_KINDS = Object.freeze(['tools', 'routes', 'slots', 'state']);

const STATE_PATHS = Object.freeze([
  {
    kind: 'mcpServers',
    location: 'private Majed store under DSH_HOME; atomic write, request-time read',
    backupDestination: 'Owner-approved external destination only',
    permission: 'Owner-authenticated read via managers route; secrets masked, never echoed',
    schema: 'validateServers; serverName scope transport command args env cwd url headers reconnect timeout instructionLimit',
    compatibility: 'scope and schema checked against Reference store before replacement activation; per-tool restrictions deferred (D04)',
    secrets: 'explicit unchanged/replace/remove; masked in snapshots, errors and logs',
  },
  {
    kind: 'hooks',
    location: 'config-editor owned persistence (profile root Include entry)',
    backupDestination: 'Owner-approved external destination only',
    permission: 'Owner-authenticated via owned persistence save; root-entry ownership revalidated',
    schema: 'validateHooks; enabled deny audit auditLimit',
    compatibility: 'profile-only hook definitions are not managed by dsh-majed; explicit disposition required (gap)',
    secrets: 'no secret values in hook definitions',
  },
  {
    kind: 'commandHooks',
    location: 'config-editor owned persistence (profile root Include entry)',
    backupDestination: 'Owner-approved external destination only',
    permission: 'Owner-authenticated via owned persistence save; user/project scopes',
    schema: 'validateCommandHookConfig; user/project scopes, hook ids unique',
    compatibility: 'fresh Command hook Approval required after any definition change; imported Approvals never carried',
    secrets: 'env names shown, values masked; no secret echo',
  },
  {
    kind: 'rules',
    location: 'config-editor owned persistence (profile root Include entry)',
    backupDestination: 'Owner-approved external destination only',
    permission: 'Owner-authenticated via owned persistence save; global/project/agent scopes',
    schema: 'validateRules; id pattern enabled scope',
    compatibility: 'rules never allow, only deny; compose with native guards',
    secrets: 'no secret values in rules',
  },
  {
    kind: 'skills',
    location: 'vendor core disk state under user/project roots',
    backupDestination: 'Owner-approved external destination only; vendor state not touched by dsh-majed',
    permission: 'read-only preview; no create/trash/restore without separate approval',
    schema: 'vendor core behavior oracle; name/body/scope validation',
    compatibility: 'read-only/external sources preserved; not rewritten to toggle',
    secrets: 'no secret values in skills',
  },
]);

const CUTORDER_STEPS = Object.freeze([
  { step: 'backup', order: 1, action: 'Take a verified backup of all Manager state paths.' },
  { step: 'disableReference', order: 2, action: 'Disable the Reference plugin runtime (no route/tool/slot/state ownership).' },
  { step: 'activateReplacement', order: 3, action: 'Activate the dsh-majed replacement after collision and compatibility checks.' },
  { step: 'verify', order: 4, action: 'Verify replacement serves all accepted parity rows; fresh Command hook Approvals required.' },
]);

const ROLLBACK_STEPS = Object.freeze([
  { step: 'disableReplacement', order: 1, action: 'Disable the dsh-majed replacement before any Reference restoration.' },
  { step: 'restoreReference', order: 2, action: 'Restore Reference ownership and state from the verified backup.' },
  { step: 'verify', order: 3, action: 'Verify Reference serves its previous capabilities; no replacement residue.' },
]);

const PROHIBITED_OPERATIONS = Object.freeze([
  'automatic plugin deletion',
  'imported Approval',
  'generated handoff edits',
]);

function initialDispositions() {
  return new Map([
    [
      GAP_PROFILE_ONLY_HOOKS,
      {
        status: 'pending',
        reason: 'Profile-only hook definitions are not managed by dsh-majed; requires explicit import/manual-conversion/deferral decision before Reference removal.',
      },
    ],
    [
      GAP_MCP_IMPORT_EXPORT_INGEST,
      {
        status: 'pending',
        reason: 'MCP import/export and legacy ingest/handoff deferred to D05; gap must be resolved or explicitly accepted before affected parity/removal claims. D05 is not a circular prerequisite of this preparation ticket.',
      },
    ],
  ]);
}

export function createCutoverPreparation(options = {}) {
  const dispositions = initialDispositions();
  return {
    enumerateStatePaths() {
      return STATE_PATHS.map(path => Object.assign({}, path));
    },
    backupPlan() {
      return [
        { step: 'backup', order: 1, action: 'Snapshot all Manager state paths to an Owner-approved external destination.' },
        { step: 'verifyBackup', order: 2, action: 'Verify backup integrity and restorability before any cutover step.' },
      ];
    },
    restorePlan() {
      return [
        { step: 'restore', order: 1, action: 'Restore state from the verified backup to the Reference-owned locations.' },
        { step: 'verifyRestore', order: 2, action: 'Verify restored state matches the backup and Reference ownership is reinstated.' },
      ];
    },
    cutoverOrder() {
      return CUTORDER_STEPS.map(step => Object.assign({}, step));
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
      if (!dispositions.has(gapId)) throw Object.assign(new Error(`Unknown gap: ${gapId}`), { code: 'CUTOVER_UNKNOWN_GAP' });
      if (typeof acceptedBy !== 'string' || !acceptedBy) throw Object.assign(new Error('acceptedBy is required.'), { code: 'CUTOVER_MISSING_OWNER' });
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
