/** Codex account controls adapted from the reference SubscriptionsSection, scoped to #129. */
export function createCodexCard(React: any, primitives: any, rpc: any, t: (key: string) => string) {
  const h = React.createElement;
  const Button = primitives.Button ?? 'button';
  const Input = primitives.Input ?? 'input';
  const style = { textAlign: 'start', paddingBlock: 'var(--dsw-spacing-4)', borderBlockEnd: '1px solid var(--dsw-alias-border-l2)' };
  return function CodexCard() {
    const [status, setStatus] = React.useState(null);
    const [error, setError] = React.useState('');
    const [pending, setPending] = React.useState(false);
    const [login, setLogin] = React.useState(null);
    const [input, setInput] = React.useState('');
    const [usage, setUsage] = React.useState({});
    const [confirmation, setConfirmation] = React.useState(null);
    const [acknowledged, setAcknowledged] = React.useState(false);
    const alive = React.useRef(true);
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
    const refreshUsage = async (account: string) => {
      try {
        const snapshot = await call('usage', { account, force: true });
        if (alive.current) setUsage((previous: object) => ({ ...previous, [account]: snapshot }));
      } catch (error) {
        if (alive.current) setUsage((previous: object) => ({ ...previous, [account]: { error: error instanceof Error ? error.message : String(error) } }));
      }
    };
    const button = (label: string, onClick: () => void, disabled = false) => h(Button, { type: 'button', disabled: pending || disabled, onClick }, label);
    const date = (time: number) => new Date(time).toLocaleString();
    return h('article', { style, 'data-majed-codex-card': true },
      h('h4', null, 'Codex (ChatGPT)'),
      h('p', { role: 'status' }, status?.busy ? t('loginProgress') : status?.accounts?.length ? `${t('connected')}: ${status.accounts.length}` : t('notLoggedIn')),
      status?.clientVersion ? h('p', null, t('clientVersion'), ': ', h('bdi', { dir: 'ltr' }, status.clientVersion.version), ' · ', t(`source_${status.clientVersion.source}`)) : null,
      status?.registrationError ? h('p', { role: 'alert' }, t('coexistence'), ' ', status.registrationError) : null,
      error || status?.detail ? h('p', { role: 'alert' }, error || status.detail) : null,
      button(t('addAccount'), () => {
        // Reserve a tab synchronously before awaiting RPC so popup blocking does not lose the flow.
        const tab = window.open('about:blank', '_blank');
        if (tab) tab.opener = null;
        void action(async () => {
          try {
            const result = await call('login');
            if (tab) tab.location.href = result.authorizeUrl;
            if (alive.current) { setLogin(result); await refreshStatus(); }
          } catch (error) { tab?.close(); throw error; }
        });
      }, status?.busy || !!status?.registrationError),
      login && status?.busy ? h('div', null,
        h('a', { href: login.authorizeUrl, target: '_blank', rel: 'noopener noreferrer' }, t('openAuthorization')),
        h(Input, { value: input, 'aria-label': t('pasteCallback'), dir: 'ltr', onChange: (event: any) => setInput(event.target.value) }),
        button(t('submitCallback'), () => { void action(async () => { await call('manual', { input }); setInput(''); await refreshStatus(); }); }, !input.trim()),
        button(t('cancelLogin'), () => { void action(async () => { await call('cancel'); setLogin(null); await refreshStatus(); }); })) : null,
      ...(status?.accounts ?? []).map((account: any) => {
        const snapshot = usage[account.key];
        return h('section', { key: account.key, style },
          h('p', null, h('bdi', { dir: 'ltr' }, account.account ?? account.key), ' · ', h('bdi', null, account.plan ?? t('unknownPlan')),
            account.expiresAt ? h('span', null, ' · ', t('expires'), ': ', h('bdi', null, date(account.expiresAt))) : null),
          button(account.isDefault ? `★ ${t('defaultAccount')}` : `☆ ${t('makeDefault')}`, () => { void action(async () => { await call('setDefault', { account: account.key }); await refreshStatus(); }); }, account.isDefault),
          button(t('logout'), () => { setAcknowledged(false); setConfirmation({ kind: 'logout', account: account.key, label: account.account }); }),
          button(t('refreshUsage'), () => { void action(() => refreshUsage(account.key)); }),
          !snapshot ? h('p', null, t('usageNotLoaded')) : snapshot.error ? h('p', { role: 'alert' }, snapshot.error)
            : !snapshot.supported || !snapshot.windows?.length ? h('p', null, t('usageUnavailable')) : null,
          ...(snapshot?.windows ?? []).map((window: any, index: number) => {
            const percent = Math.max(0, Math.min(100, window.usedPercent));
            const color = percent >= 95 ? 'var(--dsw-alias-state-error-primary)' : percent >= 80 ? 'var(--dsw-alias-state-warn-label)' : 'var(--dsw-alias-state-success-primary)';
            return h('div', { key: index }, h('span', null, t(`window_${window.kind}`), ' ', h('bdi', null, `${Math.round(percent)}%`)),
              h('div', { role: 'progressbar', 'aria-label': t(`window_${window.kind}`), 'aria-valuenow': percent, 'aria-valuemin': 0, 'aria-valuemax': 100,
                style: { background: 'var(--dsw-alias-background-secondary)', blockSize: 'var(--dsw-spacing-2)' } },
                h('div', { style: { background: color, inlineSize: `${percent}%`, blockSize: '100%' } })),
              window.resetsAt ? h('p', null, t('resets'), ': ', h('bdi', null, date(window.resetsAt))) : null);
          }),
          snapshot?.resetCredits ? h('p', null, t('resetCredits'), ': ', snapshot.resetCredits.length) : null,
          snapshot?.resetCreditsError ? h('p', { role: 'alert' }, t('creditsUnavailable'), ' ', snapshot.resetCreditsError) : null,
          snapshot?.resetCredits?.length ? button(t('useReset'), () => { void action(async () => {
            const prepared = await call('prepareReset', { account: account.key });
            setAcknowledged(false); setConfirmation({ kind: 'reset', account: account.key, ...prepared });
          }); }) : null);
      }),
      confirmation ? h('div', { role: 'dialog', 'aria-modal': true, 'aria-label': confirmation.kind === 'logout' ? t('confirmLogout') : t('confirmReset') },
        h('p', null, confirmation.kind === 'logout' ? t('confirmLogout') : t('confirmReset')),
        confirmation.kind === 'reset' ? h('label', null,
          h('input', { type: 'checkbox', checked: acknowledged, onChange: (event: any) => setAcknowledged(event.target.checked) }), t('resetAcknowledge')) : null,
        button(t('cancel'), () => setConfirmation(null)),
        button(t('confirm'), () => { void action(async () => {
          if (confirmation.kind === 'logout') await call('logout', { account: confirmation.account });
          else await call('consumeReset', { account: confirmation.account, ticket: confirmation.ticket });
          setConfirmation(null); await refreshStatus();
          if (confirmation.kind === 'reset') await refreshUsage(confirmation.account);
        }); }, confirmation.kind === 'reset' && (!acknowledged || Date.now() >= confirmation.expiresAt))) : null);
  };
}
