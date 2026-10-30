import { ProxySettings } from './settings/ProxySettings.js';
import { ProviderAccountManager } from './settings/ProviderAccountManager.js';
/** Scoped presentation port of V1ki v0.9.12 b802311; see PROVENANCE.md. */
const styles: Record<string, any> = {
  section: {
    display: 'flex', flexDirection: 'column', gap: 12, maxInlineSize: 560,
    color: 'var(--dsw-alias-label-primary)',
  },
  card: {
    border: '0.5px solid var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l4))',
    borderRadius: 'var(--dsw-radius-xl, 20px)', background: 'var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))',
    padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6,
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8 },
  dot: { inlineSize: 8, blockSize: 8, borderRadius: '50%', flexShrink: 0 },
  name: { font: 'var(--dsw-font-s-14)', fontWeight: 500, color: 'var(--dsw-alias-label-primary)' },
  statusLine: { margin: 0, font: 'var(--dsw-font-s-12)', color: 'var(--dsw-alias-label-tertiary)' },
  clientVersion: { font: 'var(--dsw-font-s-12)', color: 'var(--dsw-alias-label-tertiary)', fontVariantNumeric: 'tabular-nums' },
  errorLine: { margin: 0, font: 'var(--dsw-font-s-12)', color: 'var(--dsw-alias-state-error-primary)' },
  actions: { display: 'flex', gap: 8, marginBlockStart: 4, alignItems: 'center', flexWrap: 'wrap' },
  usage: {
    display: 'flex', flexDirection: 'column', gap: 6, marginBlockStart: 4,
    borderBlockStart: '0.5px solid var(--dsw-alias-border-l2)', paddingBlockStart: 8,
  },
  usageHeader: { display: 'flex', alignItems: 'center', gap: 8 },
  usageTitle: { font: 'var(--dsw-font-s-12)', fontWeight: 500, color: 'var(--dsw-alias-label-secondary)' },
  usagePlan: { font: 'var(--dsw-font-s-12)', color: 'var(--dsw-alias-label-tertiary)' },
  usageRefresh: { minHeight: 22, blockSize: 22, padding: '0 8px', marginInlineStart: 'auto' },
  usageRow: { display: 'flex', flexDirection: 'column', gap: 3 },
  usageMeta: {
    display: 'flex', justifyContent: 'space-between', gap: 8,
    font: 'var(--dsw-font-s-12)', color: 'var(--dsw-alias-label-tertiary)',
  },
  accountRow: {
    display: 'flex', flexDirection: 'column', gap: 6,
    border: '0.5px solid var(--dsw-alias-border-l2)', borderRadius: 'var(--dsw-radius-lg, 16px)',
    padding: '8px 10px', marginBlockStart: 4,
  },
  accountHeader: { display: 'flex', alignItems: 'center', gap: 8 },
  accountName: { font: 'var(--dsw-font-s-13)', color: 'var(--dsw-alias-label-primary)', userSelect: 'all' },
  starButton: {
    border: 'none', padding: 0, inlineSize: 28,
    font: 'var(--dsw-font-s-14)', cursor: 'pointer',
    color: 'var(--dsw-alias-state-warn-label)',
  },
  usageTrack: {
    blockSize: 6, borderRadius: 3, overflow: 'hidden',
    background: 'var(--dsw-alias-bg-layer-1)', border: '0.5px solid var(--dsw-alias-border-l2)',
  },
  usageFill: { blockSize: '100%', borderRadius: 3 },
  manual: { font: 'var(--dsw-font-s-13)' },
  manualRow: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBlockStart: 8 },
  manualInput: { flex: '1 1 200px', minInlineSize: 0 },
  modal: {
    inlineSize: 460, maxInlineSize: '100%', maxHeight: '90vh', overflowY: 'auto',
    boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12,
    padding: '16px 18px', borderRadius: 'var(--dsw-radius-panel, 28px)',
    background: 'var(--dsw-alias-bg-layer-2)', border: 0, boxShadow: 'var(--dsw-elevation-prominent)',
  },
  modalTitle: { font: 'var(--dsw-font-s-16)', fontWeight: 500, color: 'var(--dsw-alias-label-primary)' },
};
const controlCss = `:is(.majed-subscriptions-settings, .majed-reset-dialog) input:not([type="checkbox"]),
:is(.majed-subscriptions-settings, .majed-reset-dialog) select {
  box-sizing: border-box;
  min-width: 0;
  height: 34px;
  padding: 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l4, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font: var(--dsw-font-s-13);
  font-weight: 400;
  line-height: 1.5;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) input::placeholder {
  color: var(--dsw-alias-label-tertiary);
  opacity: 1;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) input:not([type="checkbox"]):focus-visible,
:is(.majed-subscriptions-settings, .majed-reset-dialog) select:focus-visible {
  outline: none;
  border-color: var(--dsw-alias-state-business-primary, var(--dsw-alias-brand-primary));
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) input:not([type="checkbox"]):disabled,
:is(.majed-subscriptions-settings, .majed-reset-dialog) select:disabled {
  color: var(--dsw-alias-label-tertiary);
  cursor: default;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) input[aria-invalid="true"] {
  border-color: var(--dsw-alias-state-error-primary);
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) option {
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) label:has(> input[type="checkbox"]) {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font: var(--dsw-font-s-14);
  line-height: 20px;
  cursor: pointer;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) input[type="checkbox"] {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin: 2px 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: inherit;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) label:has(> input[type="checkbox"]:disabled) {
  cursor: default;
  opacity: 0.5;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 28px;
  padding: 0 10px;
  border: 0.5px solid var(--dsw-alias-border-l3, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font: var(--dsw-font-s-12);
  line-height: 18px;
  cursor: pointer;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-3));
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button:active:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-active, var(--dsw-alias-bg-layer-3));
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button:disabled {
  opacity: 0.4;
  cursor: default;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button.majed-subscription-quiet {
  border-color: transparent;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) :is(footer, .majed-subscription-dialog-actions) button {
  min-height: 34px;
  padding: 0 14px;
  border-radius: var(--dsw-radius-md, 8px);
  font: var(--dsw-font-s-13);
  line-height: 1.5;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button.majed-subscription-primary {
  border-color: transparent;
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-label-primary));
  color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-layer-1));
  font-weight: 500;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button.majed-subscription-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-label-secondary));
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button:focus-visible,
:is(.majed-subscriptions-settings, .majed-reset-dialog) input[type="checkbox"]:focus-visible,
:is(.majed-subscriptions-settings, .majed-reset-dialog) summary:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) summary {
  border-radius: var(--dsw-radius-sm, 6px);
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) summary:hover {
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}

.majed-reset-credits > summary::-webkit-details-marker { display:none; }
.majed-reset-credits[open] > summary > svg { transform:rotate(90deg); }
[dir="rtl"] .majed-reset-credits > summary > svg { transform:scaleX(-1); }
[dir="rtl"] .majed-reset-credits[open] > summary > svg { transform:rotate(90deg); }
.majed-reset-dialog::backdrop { background:var(--dsw-alias-bg-mask-1); backdrop-filter:var(--dsw-mask-blur, none); }
.majed-subscriptions-settings { font:var(--dsw-font-s-13); }
.majed-subscriptions-settings a { color:var(--dsw-alias-state-business-primary); text-underline-offset: .15em; }
`;

export function createCodexCard(React: any, primitives: any, rpc: any, t: (key: string) => string) {
  const h = React.createElement;
  const Button = primitives.Button ?? 'button';
  const Input = primitives.Input ?? 'input';
  return function CodexCard() {
    const [manager, setManager] = React.useState(false);
    const [status, setStatus] = React.useState(null);
    const [error, setError] = React.useState('');
    const [pending, setPending] = React.useState(false);
    const [login, setLogin] = React.useState(null);
    const [input, setInput] = React.useState('');
    const [usage, setUsage] = React.useState({});
    const [confirmation, setConfirmation] = React.useState(null);
    const [acknowledged, setAcknowledged] = React.useState(false);
    const alive = React.useRef(true);
    const usageRequests = React.useRef(new Map());
    const accountKeys = React.useRef(new Set());
    const call = async (endpoint: string, payload: object = {}) => {
      const response = await rpc.call('/api', `majed-subscriptions.${endpoint}`, { provider: 'codex', ...payload });
      if (!response?.ok) throw new Error(response?.error?.message ?? t('unreachable'));
      return response.value;
    };
    const refreshStatus = async () => {
      const value = await call('status');
      if (alive.current) setStatus({ ...value.providers.codex, registrationError: value.registrationError });
    };
    const action = async (run: () => Promise<void>) => {
      setPending(true); setError('');
      try { await run(); } catch (error) { if (alive.current) setError(error instanceof Error ? error.message : String(error)); }
      finally { if (alive.current) setPending(false); }
    };
    React.useEffect(() => {
      alive.current = true;
      void refreshStatus().catch((error: Error) => { if (alive.current) setError(error.message); });
      return () => { alive.current = false; };
    }, []);
    React.useEffect(() => {
      if (!status?.busy) return;
      const timer = setInterval(() => { void refreshStatus().catch((error: Error) => { if (alive.current) setError(error.message); }); }, 2000);
      return () => clearInterval(timer);
    }, [status?.busy]);
    const refreshUsage = (account: string, force = false) => {
      if (usageRequests.current.has(account)) return usageRequests.current.get(account);
      const request = (async () => {
        try {
          const snapshot = await call('usage', { account, force });
          if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous: object) => ({ ...previous, [account]: snapshot }));
        } catch (error) {
          if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous: object) => ({ ...previous, [account]: { error: error instanceof Error ? error.message : String(error) } }));
        } finally { if (usageRequests.current.get(account) === request) usageRequests.current.delete(account); }
      })();
      usageRequests.current.set(account, request);
      return request;
    };
    const accountsSignature = JSON.stringify((status?.accounts ?? []).map((account: any) => account.key));
    React.useEffect(() => {
      const keys = new Set<string>((status?.accounts ?? []).map((account: any) => account.key));
      const added = [...keys].filter(key => !accountKeys.current.has(key));
      accountKeys.current = keys;
      for (const key of usageRequests.current.keys()) if (!keys.has(key)) usageRequests.current.delete(key);
      setUsage((previous: object) => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
      for (const key of added) void refreshUsage(key);
    }, [accountsSignature]);
    const button = (label: string, onClick: () => void, disabled = false, props: any = {}) => h(Button, { type: 'button', disabled: pending || disabled, onClick, ...props }, label);
    const date = (time: number) => new Date(time).toLocaleString();
    const part = (name: string, style: any, ...children: any[]) => h('div', { style, 'data-majed-codex-part': name }, ...children);
    const startLogin = () => {
      void action(async () => {
        const result = await call('login');
        if (!alive.current) return;
        window.open(result.authorizeUrl, '_blank', 'noopener');
        setLogin(result); await refreshStatus();
      });
    };
    const busy = status?.busy;
    return h('div', { style: { ...styles.section, textAlign: 'start' }, className: 'majed-subscriptions-settings', 'data-majed-codex-card': true },
      h('style', null, controlCss),
      h(ProxySettings, { rpc, t }),
      manager ? h(ProviderAccountManager, { provider: 'codex', name: status?.displayName || 'Codex (ChatGPT)', rpc, t, onClose: () => { setManager(false); void refreshStatus(); } }) : null,
      part('card', styles.card,
        part('header', styles.cardHeader,
          h('span', { 'aria-hidden': true, style: { ...styles.dot, background: busy ? 'var(--dsw-alias-state-warn-label)' : status?.accounts?.length ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-label-dimmed)' } }),
          h('span', { style: styles.name }, status?.displayName || 'Codex (ChatGPT)'),
          button(t('accountsManage'), () => setManager(true), false, { style: { marginInlineStart: 'auto' } }),
          status?.clientVersion ? h('span', { style: styles.clientVersion, title: t('clientVersionHint') }, 'CLI ', h('bdi', { dir: 'ltr' }, status.clientVersion.version), ' · ', t(`source_${status.clientVersion.source}`)) : null),
        h('p', { style: styles.statusLine, role: 'status' }, status?.registrationError ? t('providerUnavailable') : busy ? t('loginProgress') : status?.accounts?.length ? `${status.accounts.length} ${t('connected')}` : status ? t('notLoggedIn') : t('checking')),
        status?.detail ? h('p', { style: styles.statusLine }, status.detail) : null,
        error ? h('p', { style: styles.errorLine, role: 'alert' }, error) : null,
        ...(status?.accounts ?? []).map((account: any) => {
          const snapshot = usage[account.key];
          const credits = [...(snapshot?.resetCredits ?? [])].sort((a: any, b: any) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity));
          const next = credits.find((credit: any) => credit.id && (credit.expiresAt === undefined || credit.expiresAt > Date.now()));
          const weekly = snapshot?.windows?.find((window: any) => window.kind === 'weekly' && !window.scope);
          const resetBlocked = !weekly || !Number.isFinite(weekly.usedPercent) || !weekly.resetsAt || weekly.resetsAt <= Date.now() || snapshot?.resetCreditsError ? 'resetRefresh' : weekly.usedPercent < 80 ? 'resetGuard' : !next ? 'resetRefresh' : null;
          return h('div', { key: account.key, style: styles.accountRow, 'data-majed-codex-part': 'account' },
            part('account-header', styles.accountHeader,
              button(account.isDefault ? '★' : '☆', () => { if (!account.isDefault) void action(async () => { await call('setDefault', { account: account.key }); await refreshStatus(); }); }, false, { style: styles.starButton, title: t(account.isDefault ? 'defaultAccount' : 'makeDefault'), 'aria-label': t(account.isDefault ? 'defaultAccount' : 'makeDefault') }),
              h('bdi', { dir: 'ltr', style: styles.accountName }, account.alias || account.account || account.key),
              account.plan ? h('bdi', { style: styles.usagePlan }, account.plan) : null,
              account.expiresAt ? h('span', { style: styles.statusLine }, t('expires'), ' ', h('bdi', null, date(account.expiresAt))) : null,
              button(t('logout'), () => { setAcknowledged(false); setConfirmation({ kind: 'logout', account: account.key, label: account.account }); }, false, { style: { marginInlineStart: 'auto' } })),
            snapshot?.supported === false ? h('p', { style: styles.statusLine }, t('usageUnavailable')) : part('usage', styles.usage,
              part('usage-header', styles.usageHeader,
                h('span', { style: styles.usageTitle }, t('usageTitle')),
                snapshot?.plan ? h('span', { style: styles.usagePlan }, t('plan'), ': ', h('bdi', null, snapshot.plan)) : null,
                button(t('refreshUsage'), () => { void action(() => refreshUsage(account.key, true)); }, false, { style: styles.usageRefresh })),
              !snapshot ? h('p', { style: styles.statusLine }, t('usageNotLoaded')) : snapshot.error ? h('p', { style: styles.errorLine, role: 'alert' }, snapshot.error) : !snapshot.windows?.length ? h('p', { style: styles.statusLine }, t('usageUnavailable')) : null,
              ...(snapshot?.windows ?? []).map((window: any, index: number) => {
                const percent = Math.max(0, Math.min(100, window.usedPercent));
                const color = percent >= 95 ? 'var(--dsw-alias-state-error-primary)' : percent >= 80 ? 'var(--dsw-alias-state-warn-label)' : 'var(--dsw-alias-state-success-primary)';
                return h('div', { key: index, style: styles.usageRow },
                  part('usage-meta', styles.usageMeta, h('span', null, t(`window_${window.kind}`), window.scope ? ` · ${window.scope}` : ''),
                    h('span', null, h('bdi', null, `${Math.round(percent)}%`), window.resetsAt ? h('span', null, ' · ', t('resets'), ' ', h('bdi', null, date(window.resetsAt))) : null)),
                  h('div', { role: 'progressbar', 'aria-label': t(`window_${window.kind}`), 'aria-valuenow': percent, 'aria-valuemin': 0, 'aria-valuemax': 100, style: styles.usageTrack },
                    h('div', { style: { ...styles.usageFill, background: color, inlineSize: `${percent}%` } })));
              }),
              snapshot?.resetCreditsError ? h('p', { style: styles.errorLine, role: 'alert' }, t('creditsUnavailable'), ' ', snapshot.resetCreditsError) : null,
              snapshot?.resetCredits ? h('details', { className: 'majed-reset-credits', style: styles.usageRow },
                h('summary', { style: { ...styles.usageMeta, cursor: 'pointer', listStyle: 'none', justifyContent: 'flex-start', gap: 6 } },
                  h('svg', { 'aria-hidden': true, width: 12, height: 12, viewBox: '0 0 16 16' }, h('path', { d: 'm6 3 5 5-5 5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' })),
                  h('span', null, t('resetCredits')), h('span', { style: { marginInlineStart: 'auto' } }, credits.filter((c: any) => c.id && (c.expiresAt === undefined || c.expiresAt > Date.now())).length, ' ', t('available'))),
                h('div', { style: { paddingInlineStart: 18, marginBlockStart: 6 } }, ...credits.map((credit: any, index: number) => h('div', { key: credit.id ?? index, style: { ...styles.usageMeta, minBlockSize: 28, gap: 12 } },
                  h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 } }, t('fullReset'),
                    credit === next ? button(t('useReset'), () => { if (!resetBlocked) void action(async () => {
                      const prepared = await call('prepareReset', { account: account.key });
                      setAcknowledged(false); setConfirmation({ kind: 'reset', account: account.key, label: account.account ?? account.key, ...prepared });
                    }); }, false, { 'aria-disabled': !!resetBlocked, title: t(resetBlocked ?? 'resetReady'), style: { blockSize: 22, minBlockSize: 22, padding: '0 7px', opacity: resetBlocked ? 0.35 : 1, cursor: resetBlocked ? 'not-allowed' : 'pointer' } }) : null),
                  h('span', { style: { textAlign: 'end' } }, credit.expiresAt === undefined ? t('creditExpiryUnknown') : h('span', null, t('expires'), ' ', h('bdi', null, date(credit.expiresAt)), credit.expiresAt <= Date.now() ? ` · ${t('creditExpired')}` : null)))))) : null));
        }),
        part('actions', styles.actions,
          busy ? button(t('cancelLogin'), () => { void action(async () => { await call('cancel'); setLogin(null); await refreshStatus(); }); })
            : button(t(status?.accounts?.length ? 'addAccount' : 'login'), startLogin, !!status?.registrationError)),
        !busy && status?.accounts?.length ? h('p', { style: styles.statusLine }, t('addAccountHint')) : null,
        busy ? h('div', null,
          (status.pendingAuth ?? login)?.authorizeUrl ? h('a', { href: (status.pendingAuth ?? login).authorizeUrl, target: '_blank', rel: 'noopener noreferrer', style: styles.manual }, t('openAuthorization')) : null,
          h('details', { style: styles.manual }, h('summary', null, t('manualSummary')),
            part('manual-row', styles.manualRow,
              h(Input, { style: styles.manualInput, value: input, placeholder: t('pasteCallback'), 'aria-label': t('pasteCallback'), dir: 'ltr', onChange: (event: any) => setInput(event.target.value) }),
              button(t('submitCallback'), () => { void action(async () => { await call('manual', { input }); setInput(''); await refreshStatus(); }); }, !input.trim())))) : null),
      confirmation ? h('dialog', { ref: (node: HTMLDialogElement | null) => { if (node && !node.open) node.showModal(); }, className: 'majed-reset-dialog', role: 'dialog', 'aria-modal': true, 'aria-label': t(confirmation.kind === 'logout' ? 'confirmLogout' : 'confirmReset'), onCancel: () => setConfirmation(null), onClose: () => setConfirmation(null), style: { ...styles.modal, margin: 'auto', color: 'var(--dsw-alias-label-primary)' } },
        h('h3', { style: { ...styles.modalTitle, margin: 0 } }, t(confirmation.kind === 'logout' ? 'confirmLogout' : 'confirmReset')),
        h('p', { style: { ...styles.statusLine, overflowWrap: 'anywhere' } }, h('bdi', { dir: 'ltr' }, confirmation.label ?? confirmation.account)),
        confirmation.kind === 'reset' ? part('reset-context', styles.usageMeta, h('span', null, t('window_weekly')), h('strong', null, `${Math.round(confirmation.weeklyUsedPercent)}%`)) : null,
        confirmation.kind === 'reset' ? h('p', { style: styles.statusLine }, confirmation.creditExpiresAt === undefined ? t('creditExpiryUnknown') : h('span', null, t('expires'), ' ', h('bdi', null, date(confirmation.creditExpiresAt)))) : null,
        confirmation.kind === 'reset' ? h('p', { style: styles.statusLine }, t('resetWarning')) : null,
        confirmation.kind === 'reset' ? h('label', { style: { display: 'flex', gap: 8, alignItems: 'flex-start', font: 'var(--dsw-font-s-12)' } },
          h('input', { type: 'checkbox', checked: acknowledged, onChange: (event: any) => setAcknowledged(event.target.checked) }), t('resetAcknowledge')) : null,
        h('div', { className: 'majed-subscription-dialog-actions', style: { ...styles.actions, justifyContent: 'flex-end', marginBlockStart: 8 } },
          button(t('cancel'), () => setConfirmation(null), false, { autoFocus: true }),
          button(t(confirmation.kind === 'reset' ? 'confirm' : 'logout'), () => { void action(async () => {
            if (confirmation.kind === 'logout') await call('logout', { account: confirmation.account });
            else await call('consumeReset', { account: confirmation.account, ticket: confirmation.ticket });
            setConfirmation(null); await refreshStatus();
            if (confirmation.kind === 'reset') await refreshUsage(confirmation.account, true);
          }); }, confirmation.kind === 'reset' && (!acknowledged || Date.now() >= confirmation.expiresAt), { className: confirmation.kind === 'reset' ? 'majed-subscription-primary' : undefined }))) : null);
  };
}
