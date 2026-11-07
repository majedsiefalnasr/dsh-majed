import { visibleUsageWindows } from './usage-badge/usage-window-filter.js';
import { ProviderAccountManager } from './settings/ProviderAccountManager.js';
import {
  controlCss,
  providerDisclosure,
  providerIdentity,
  providerStatus,
  styles,
} from './codex-card.js';
/**
 * Antigravity Settings card (ticket #135). Scoped presentation port of the Antigravity part of V1ki v0.9.12 b802311
 * SubscriptionsSection; see PROVENANCE.md. It only ever receives sanitized status from the owned RPC: account
 * labels, plan and expiry, never a token or credential-store path.
 */
export function createAntigravityCard(
  React: any,
  primitives: any,
  rpc: any,
  t: (key: string) => string,
) {
  const h = React.createElement;
  const Button = primitives.Button ?? 'button';
  const Input = primitives.Input ?? 'input';
  const DEFAULT_NAME = 'Google Antigravity';
  return function AntigravityCard({
    presentation,
    onComplete,
    onFlowState,
    onAccountsChange,
    revision,
    initialExpanded = false,
  }: any = {}) {
    const [expanded, setExpanded] = React.useState(initialExpanded);
    const initialAuthRevision = React.useRef(null as number | null);
    const [manager, setManager] = React.useState(false);
    const [status, setStatus] = React.useState(null);
    const [error, setError] = React.useState('');
    const [pending, setPending] = React.useState(false);
    const [login, setLogin] = React.useState(null);
    const [input, setInput] = React.useState('');
    const [usage, setUsage] = React.useState({});
    const [confirmation, setConfirmation] = React.useState(null);
    const alive = React.useRef(true);
    const usageRequests = React.useRef(new Map());
    const accountKeys = React.useRef(new Set());
    const call = async (endpoint: string, payload: object = {}) => {
      const response = await rpc.call(
        '/api',
        `waycraft-subscriptions.${endpoint}`,
        { provider: 'antigravity', ...payload },
      );
      if (!response?.ok)
        throw new Error(response?.error?.message ?? t('unreachable'));
      return response.value;
    };
    const refreshStatus = async () => {
      const value = await call('status');
      // `status` is the one endpoint that always answers for Codex; Antigravity details ride along under providers.antigravity.
      if (alive.current)
        setStatus({
          ...(value.providers.antigravity ?? { accounts: [] }),
          registrationError: value.antigravityRegistrationError,
        });
    };
    const action = async (run: () => Promise<void>) => {
      setPending(true);
      setError('');
      try {
        await run();
      } catch (failure) {
        if (alive.current)
          setError(
            failure instanceof Error ? failure.message : String(failure),
          );
      } finally {
        if (alive.current) setPending(false);
      }
    };
    React.useEffect(() => {
      alive.current = true;
      void refreshStatus().catch((failure: Error) => {
        if (alive.current) setError(failure.message);
      });
      return () => {
        alive.current = false;
      };
    }, []);
    React.useEffect(() => {
      // A failed re-read after an external change would leave stale data; show it like the first load does.
      if (revision !== undefined)
        void refreshStatus().catch((failure: unknown) => {
          if (alive.current)
            setError(
              failure instanceof Error ? failure.message : String(failure),
            );
        });
    }, [revision]);
    React.useEffect(() => {
      if (!status?.busy) return;
      const timer = setInterval(() => {
        void refreshStatus().catch((failure: Error) => {
          if (alive.current) setError(failure.message);
        });
      }, 2000);
      return () => clearInterval(timer);
    }, [status?.busy]);
    const refreshUsage = (account: string, force = false) => {
      if (status?.setupRequired) return Promise.resolve();
      if (usageRequests.current.has(account))
        return usageRequests.current.get(account);
      let request!: Promise<void>;
      request = (async () => {
        try {
          const snapshot = await call('usage', { account, force });
          if (
            alive.current &&
            accountKeys.current.has(account) &&
            usageRequests.current.get(account) === request
          )
            setUsage((previous: object) => ({
              ...previous,
              [account]: snapshot,
            }));
        } catch (failure) {
          if (
            alive.current &&
            accountKeys.current.has(account) &&
            usageRequests.current.get(account) === request
          )
            setUsage((previous: object) => ({
              ...previous,
              [account]: {
                error:
                  failure instanceof Error ? failure.message : String(failure),
              },
            }));
        } finally {
          if (usageRequests.current.get(account) === request)
            usageRequests.current.delete(account);
        }
      })();
      usageRequests.current.set(account, request);
      return request;
    };
    const reportedAccounts = React.useRef(null as string | null);
    const accountsSignature = JSON.stringify(
      (status?.accounts ?? []).map((account: any) => account.key),
    );
    React.useEffect(() => {
      if (presentation === 'group' && status) {
        if (
          reportedAccounts.current !== null &&
          reportedAccounts.current !== accountsSignature
        )
          onAccountsChange?.();
        reportedAccounts.current = accountsSignature;
      }
      const keys = new Set<string>(
        (status?.accounts ?? []).map((account: any) => account.key),
      );
      const added = [...keys].filter((key) => !accountKeys.current.has(key));
      accountKeys.current = keys;
      for (const key of usageRequests.current.keys())
        if (!keys.has(key)) usageRequests.current.delete(key);
      setUsage((previous: object) =>
        Object.fromEntries(
          Object.entries(previous).filter(([key]) => keys.has(key)),
        ),
      );
      if (presentation !== 'auth')
        for (const key of added) void refreshUsage(key);
    }, [accountsSignature]);
    const button = (
      label: string,
      onClick: () => void,
      disabled = false,
      props: any = {},
    ) =>
      h(
        Button,
        { type: 'button', disabled: pending || disabled, onClick, ...props },
        label,
      );
    const date = (time: number) => new Date(time).toLocaleString();
    const part = (name: string, style: any, ...children: any[]) =>
      h('div', { style, 'data-waycraft-antigravity-part': name }, ...children);
    const startLogin = () => {
      void action(async () => {
        const result = await call('login');
        if (!alive.current) return;
        if (result.authorizeUrl)
          window.open(result.authorizeUrl, '_blank', 'noopener');
        setLogin(result.authorizeUrl ? result : null);
        await refreshStatus();
      });
    };
    React.useEffect(() => {
      if (!status) return;
      const current = status.authRevision ?? 0;
      if (initialAuthRevision.current === null)
        initialAuthRevision.current = current;
      else if (
        presentation === 'auth' &&
        current > initialAuthRevision.current
      ) {
        initialAuthRevision.current = current;
        onComplete?.();
      }
    }, [status]);
    const busy = status?.busy;
    React.useEffect(() => {
      if (presentation !== 'auth') return;
      onFlowState?.({
        busy: pending || !!busy,
        cancel: async () => {
          if (pending) return false;
          if (busy) {
            await call('cancel');
            setLogin(null);
            await refreshStatus();
          }
          return true;
        },
      });
    }, [pending, busy]);
    const name = status?.displayName || DEFAULT_NAME;
    const hasAccounts = !!status?.accounts?.length;
    return h(
      'div',
      {
        style: {
          ...styles.section,
          ...(presentation
            ? { maxWidth: 'none', maxInlineSize: 'none', width: '100%' }
            : {}),
          textAlign: 'start',
        },
        className: 'waycraft-subscriptions-settings',
        'data-waycraft-antigravity-card': true,
      },
      h('style', null, controlCss),
      manager
        ? h(ProviderAccountManager, {
            provider: 'antigravity',
            name,
            rpc,
            t,
            onClose: () => {
              setManager(false);
              void refreshStatus();
            },
          })
        : null,
      part(
        'card',
        styles.card,
        presentation !== 'auth' &&
          part(
            'header',
            styles.cardHeader,
            providerStatus(
              h,
              t,
              error || status?.registrationError || status?.setupRequired
                ? 'error'
                : busy
                  ? 'warning'
                  : !status
                    ? 'checking'
                    : status?.accounts?.length
                      ? 'ready'
                      : 'warning',
              error || status?.registrationError || status?.setupRequired
                ? 'providerAttention'
                : busy
                  ? 'loginProgress'
                  : !status
                    ? 'checking'
                    : status?.accounts?.length
                      ? 'providerConfigured'
                      : 'notLoggedIn',
            ),
            presentation === 'group'
              ? providerIdentity(
                  h,
                  t,
                  name,
                  status?.accounts ?? [],
                  usage,
                  status?.clientVersion,
                )
              : h('span', { style: styles.name }, name),
            presentation === 'auth'
              ? null
              : button(t('accountsManage'), () => setManager(true), false, {
                  style: { marginInlineStart: 'auto' },
                }),
            presentation === 'group'
              ? providerDisclosure(h, t, name, expanded, () =>
                  setExpanded(!expanded),
                )
              : status?.clientVersion
                ? h(
                    'span',
                    {
                      style: styles.clientVersion,
                      title: t('clientVersionHint'),
                    },
                    'CLI ',
                    h('bdi', { dir: 'ltr' }, status.clientVersion.version),
                    ' · ',
                    t(`source_${status.clientVersion.source}`),
                  )
                : null,
          ),
        (presentation === 'auth' ||
          (presentation === 'group' && status?.accounts?.length)) &&
          !busy &&
          !status?.registrationError &&
          !status?.setupRequired
          ? null
          : h(
              'p',
              { style: styles.statusLine, role: 'status' },
              status?.setupRequired
                ? t('antigravitySetupRequired')
                : status?.registrationError
                  ? t('antigravityProviderUnavailable')
                  : busy
                    ? t('loginProgress')
                    : hasAccounts
                      ? `${status.accounts.length} ${t('connected')}`
                      : status
                        ? t('notLoggedIn')
                        : t('checking'),
            ),
        status?.detail && !status?.setupRequired
          ? h('p', { style: styles.statusLine }, status.detail)
          : null,
        error
          ? h('p', { style: styles.errorLine, role: 'alert' }, error)
          : null,
        ...(presentation === 'auth' || (presentation === 'group' && !expanded)
          ? []
          : (status?.accounts ?? [])
        ).map((account: any) => {
          const snapshot = usage[account.key];
          const windows = visibleUsageWindows(
            'antigravity',
            snapshot?.windows,
            status?.visibleModels,
          );
          return h(
            'div',
            {
              key: account.key,
              style: styles.accountRow,
              'data-waycraft-antigravity-part': 'account',
            },
            part(
              'account-header',
              styles.accountHeader,
              button(
                account.isDefault ? '★' : '☆',
                () => {
                  if (!account.isDefault)
                    void action(async () => {
                      await call('setDefault', { account: account.key });
                      await refreshStatus();
                    });
                },
                false,
                {
                  style: styles.starButton,
                  title: t(
                    account.isDefault ? 'defaultAccount' : 'makeDefault',
                  ),
                  'aria-label': t(
                    account.isDefault ? 'defaultAccount' : 'makeDefault',
                  ),
                },
              ),
              h(
                'bdi',
                { dir: 'ltr', style: styles.accountName },
                account.alias || account.account || account.key,
              ),
              account.plan
                ? h('bdi', { style: styles.usagePlan }, account.plan)
                : null,
              account.expiresAt
                ? h(
                    'span',
                    { style: styles.statusLine },
                    t('expires'),
                    ' ',
                    h('bdi', null, date(account.expiresAt)),
                  )
                : null,
              button(
                t('logout'),
                () =>
                  setConfirmation({
                    account: account.key,
                    label: account.account,
                  }),
                false,
                { style: { marginInlineStart: 'auto' } },
              ),
            ),
            snapshot?.supported === false
              ? h('p', { style: styles.statusLine }, t('usageUnavailable'))
              : part(
                  'usage',
                  styles.usage,
                  part(
                    'usage-header',
                    styles.usageHeader,
                    h('span', { style: styles.usageTitle }, t('usageTitle')),
                    button(
                      t('refreshUsage'),
                      () => {
                        void action(() => refreshUsage(account.key, true));
                      },
                      !!status?.setupRequired,
                      { style: styles.usageRefresh },
                    ),
                  ),
                  !snapshot
                    ? h('p', { style: styles.statusLine }, t('usageNotLoaded'))
                    : snapshot.error
                      ? h(
                          'p',
                          { style: styles.errorLine, role: 'alert' },
                          snapshot.error,
                        )
                      : !windows.length
                        ? h(
                            'p',
                            { style: styles.statusLine },
                            t(
                              snapshot.windows?.length
                                ? 'usageNoVisibleModels'
                                : 'usageEmpty',
                            ),
                          )
                        : null,
                  ...windows.map((window: any, index: number) => {
                    const percent = Math.max(
                      0,
                      Math.min(100, window.usedPercent),
                    );
                    const color =
                      percent >= 95
                        ? 'var(--dsw-alias-state-error-primary)'
                        : percent >= 80
                          ? 'var(--dsw-alias-state-warn-label)'
                          : 'var(--dsw-alias-state-success-primary)';
                    return h(
                      'div',
                      { key: index, style: styles.usageRow },
                      part(
                        'usage-meta',
                        styles.usageMeta,
                        h(
                          'span',
                          null,
                          t(`window_${window.kind}`),
                          window.scope ? ` · ${window.scope}` : '',
                        ),
                        h(
                          'span',
                          null,
                          h('bdi', null, `${Math.round(percent)}%`),
                          window.resetsAt
                            ? h(
                                'span',
                                null,
                                ' · ',
                                t('resets'),
                                ' ',
                                h('bdi', null, date(window.resetsAt)),
                              )
                            : null,
                        ),
                      ),
                      h(
                        'div',
                        {
                          role: 'progressbar',
                          'aria-label': t(`window_${window.kind}`),
                          'aria-valuenow': percent,
                          'aria-valuemin': 0,
                          'aria-valuemax': 100,
                          style: styles.usageTrack,
                        },
                        h('div', {
                          style: {
                            ...styles.usageFill,
                            background: color,
                            inlineSize: `${percent}%`,
                          },
                        }),
                      ),
                    );
                  }),
                ),
          );
        }),
        presentation !== 'group' &&
          part(
            'actions',
            styles.actions,
            busy
              ? button(t('cancelLogin'), () => {
                  void action(async () => {
                    await call('cancel');
                    setLogin(null);
                    await refreshStatus();
                  });
                })
              : button(
                  t(hasAccounts ? 'addAccountOAuth' : 'login'),
                  () => startLogin(),
                  !!status?.registrationError || !!status?.setupRequired,
                ),
          ),
        busy
          ? h(
              'div',
              null,
              (status.pendingAuth ?? login)?.authorizeUrl
                ? h(
                    'a',
                    {
                      href: (status.pendingAuth ?? login).authorizeUrl,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      style: styles.manual,
                    },
                    t('openAuthorization'),
                  )
                : null,
              h(
                'details',
                { style: styles.manual },
                h('summary', null, t('manualSummary')),
                part(
                  'manual-row',
                  styles.manualRow,
                  h(Input, {
                    style: styles.manualInput,
                    value: input,
                    placeholder: t('pasteCallback'),
                    'aria-label': t('pasteCallback'),
                    dir: 'ltr',
                    onChange: (event: any) => setInput(event.target.value),
                  }),
                  button(
                    t('submitCallback'),
                    () => {
                      void action(async () => {
                        await call('manual', { input });
                        setInput('');
                        await refreshStatus();
                      });
                    },
                    !input.trim(),
                  ),
                ),
              ),
            )
          : null,
      ),
      confirmation
        ? h(
            'dialog',
            {
              ref: (node: HTMLDialogElement | null) => {
                if (node && !node.open) node.showModal();
              },
              className: 'waycraft-reset-dialog',
              role: 'dialog',
              'aria-modal': true,
              'aria-label': t('confirmLogout'),
              onCancel: () => setConfirmation(null),
              onClose: () => setConfirmation(null),
              style: {
                ...styles.modal,
                margin: 'auto',
                color: 'var(--dsw-alias-label-primary)',
              },
            },
            h(
              'h3',
              { style: { ...styles.modalTitle, margin: 0 } },
              t('confirmLogout'),
            ),
            h(
              'p',
              { style: { ...styles.statusLine, overflowWrap: 'anywhere' } },
              h(
                'bdi',
                { dir: 'ltr' },
                confirmation.label ?? confirmation.account,
              ),
            ),
            h(
              'div',
              {
                className: 'waycraft-subscription-dialog-actions',
                style: {
                  ...styles.actions,
                  justifyContent: 'flex-end',
                  marginBlockStart: 8,
                },
              },
              button(t('cancel'), () => setConfirmation(null), false, {
                autoFocus: true,
              }),
              button(t('logout'), () => {
                void action(async () => {
                  await call('logout', { account: confirmation.account });
                  setConfirmation(null);
                  await refreshStatus();
                });
              }),
            ),
          )
        : null,
    );
  };
}
