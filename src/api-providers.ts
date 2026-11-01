// Native public-remotes contract adaptation; see PROVENANCE.md (#136).
// Only ephemeral render snapshots/drafts live here. DSH remains the sole durable store.
export function createApiProviders(React: any, remote: any, t: (key: string) => string) {
  const h = React.createElement;
  const at = (value: any, path: string[]) => path.reduce((v, key) => v?.[key], value);
  const refOf = (entry: any, profile: any) => profile?.apiKeyEnv ?? `${entry.provider.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_API_KEY`;
  const copy = (value: any) => JSON.parse(JSON.stringify(value));
  const control = { font: 'inherit', color: 'inherit', background: 'var(--dsw-alias-settings-card-fill)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 'var(--dsw-radius-md)', padding: 'var(--dsw-spacing-2)' };
  return function ApiProviders() {
    const [snapshot, setSnapshot] = React.useState(null as any);
    const [draft, setDraft] = React.useState(null as any);
    const [message, setMessage] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const generation = React.useRef(0);
    const mounted = React.useRef(true);
    // Never forward remote error text: transports/providers may echo a submitted key.
    const valueOf = (result: any) => {
      if (!result.ok) throw new Error(result.error?.code === 'settings/conflict' ? 'apiConflict' : 'apiFailed');
      return result.value;
    };
    async function load() {
      const sequence = ++generation.current;
      try {
        const [settings, directory, registered] = await Promise.all([remote.settings.describe(), remote.llm.listConfigurableProviders(), remote.llm.listProviders()]);
        const described = valueOf(settings);
        const entries = valueOf(directory);
        const rows = [...entries];
        for (const provider of valueOf(registered)) if (!rows.some((e: any) => e.provider === provider.id)) rows.push({ provider: provider.id, displayName: provider.name, settingsNs: '', settingsPath: [] });
        rows.sort((a: any, b: any) => rank(a.provider) - rank(b.provider));
        const refs = [...new Set(rows.flatMap((e: any) => {
          if (e.provider === 'deepseek-account') return [];
          const ns = described.namespaces.find((n: any) => n.ns === e.settingsNs);
          const profile = at(ns?.value, e.settingsPath);
          return profile?.apiKeyEnv ? [profile.apiKeyEnv] : [refOf(e, profile), ...(e.nativeAuth?.env ?? [])];
        }))];
        const credentials: any = {};
        for (let i = 0; i < refs.length; i += 64) Object.assign(credentials, valueOf(await remote.credentials.describe(refs.slice(i, i + 64))));
        if (mounted.current && sequence === generation.current) setSnapshot({ ...described, rows, credentials });
      } catch { if (mounted.current && sequence === generation.current) setMessage('apiFailed'); }
    }
    function rank(id: string) { return id === 'deepseek-account' ? 0 : id === 'deepseek-official' ? 1 : 2; }
    React.useEffect(() => {
      mounted.current = true;
      void load();
      const refresh = () => { void load(); };
      const disposers = ['settings/document-updated', 'credentials/reference-updated', 'credentials/record-updated', 'llm/adapters-updated'].map(event => remote.$on(event, refresh));
      return () => { mounted.current = false; generation.current++; disposers.forEach(off => off()); };
    }, []);
    const nsOf = (e: any) => snapshot.namespaces.find((n: any) => n.ns === e.settingsNs);
    const removable = (e: any, ns: any) => e.declared === true && e.settingsPath.length > 0 && at(ns?.user, e.settingsPath) !== undefined && at(ns?.base, e.settingsPath) === undefined;
    function edit(entry: any) {
      const ns = nsOf(entry);
      if (!ns) return;
      const profile = at(ns.value, entry.settingsPath) ?? {};
      setMessage('');
      setDraft({ entry, revision: ns.revision, user: copy(at(ns.user, entry.settingsPath) ?? {}), profile: copy(profile), key: '', keyAction: 'keep', models: JSON.stringify(profile.models ?? [], null, 2), isNew: at(ns.value, entry.settingsPath) === undefined, custom: false });
    }
    function custom() {
      const ns = snapshot.namespaces.find((n: any) => n.ns === 'llm-pi-ai');
      setMessage('');
      setDraft({ entry: { provider: '', settingsNs: 'llm-pi-ai', settingsPath: [], declared: true }, revision: ns.revision, user: {}, profile: { api: 'openai-completions', baseURL: '', displayName: '' }, key: '', keyAction: 'keep', models: '[]', isNew: true, custom: true });
    }
    const change = (field: string, value: any) => setDraft((d: any) => ({ ...d, [field]: value }));
    const profileChange = (field: string, value: string) => setDraft((d: any) => ({ ...d, profile: { ...d.profile, [field]: value } }));
    async function run(action: () => Promise<void>) {
      if (busy) return;
      setBusy(true); setMessage('');
      try { await action(); } catch (error) { if (mounted.current) setMessage(error instanceof Error && ['apiConflict', 'apiInvalid', 'apiPartial'].includes(error.message) ? error.message : 'apiFailed'); }
      finally { if (mounted.current) setBusy(false); }
    }
    function parsedModels() {
      let models;
      try { models = JSON.parse(draft.models); } catch { throw new Error('apiInvalid'); }
      if (!Array.isArray(models) || models.some((m: any) => !m || typeof m.id !== 'string' || !m.id.trim() || (m.name !== undefined && typeof m.name !== 'string') || ['contextWindow', 'maxTokens'].some(k => m[k] !== undefined && (!Number.isInteger(m[k]) || m[k] < 1)) || (m.input !== undefined && (!Array.isArray(m.input) || m.input.some((v: any) => !['text', 'image'].includes(v)))) || (m.reasoningEfforts !== undefined && m.reasoningEfforts !== false && (typeof m.reasoningEfforts !== 'object' || m.reasoningEfforts === null || Array.isArray(m.reasoningEfforts))))) throw new Error('apiInvalid');
      if (new Set(models.map((m: any) => m.id)).size !== models.length) throw new Error('apiInvalid');
      return models;
    }
    async function save() {
      let entry = draft.entry;
      if (draft.custom) {
        if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(entry.provider) || snapshot.rows.some((e: any) => e.provider === entry.provider)) throw new Error('apiInvalid');
        entry = { ...entry, settingsPath: ['providers', entry.provider] };
      }
      if (draft.profile.baseURL) {
        try { const url = new URL(draft.profile.baseURL); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(); } catch { throw new Error('apiInvalid'); }
      }
      const models = parsedModels();
      if (draft.custom && (!draft.profile.baseURL || models.length === 0)) throw new Error('apiInvalid');
      const next = { ...draft.user };
      for (const field of ['displayName', 'baseURL']) {
        if (draft.profile[field]?.trim()) next[field] = draft.profile[field].trim();
        else delete next[field];
      }
      next.models = models;
      if (draft.custom) next.api = draft.profile.api;
      const ref = refOf(entry, draft.profile);
      if (draft.keyAction !== 'keep' && snapshot.credentials[ref]?.writable === false) throw new Error('apiFailed');
      if (draft.keyAction === 'set') {
        if (!draft.key.trim() || /[\r\n]/.test(draft.key)) throw new Error('apiInvalid');
        next.apiKeyEnv = ref;
      }
      const ops: any[] = [];
      for (const field of ['displayName', 'baseURL']) if (field in draft.user && !(field in next)) ops.push({ op: 'unset', path: [...entry.settingsPath, field] });
      for (const field of Object.keys(next)) if (JSON.stringify(next[field]) !== JSON.stringify(draft.user[field])) ops.push({ op: 'set', path: [...entry.settingsPath, field], value: next[field] });
      if (draft.isNew && ops.length === 0) ops.push({ op: 'set', path: entry.settingsPath, value: {} });
      let committed = false;
      if (ops.length) {
        const view = valueOf(await remote.settings.mutate(entry.settingsNs, ops, draft.revision));
        committed = true;
        // Preserve the outstanding credential intent, but do not replay the settings write on retry.
        if (mounted.current) setDraft((d: any) => ({ ...d, entry, revision: view.revision, user: copy(next), isNew: false, custom: false }));
      }
      if (draft.keyAction !== 'keep') {
        try {
          const result = draft.keyAction === 'set' ? await remote.credentials.set(ref, draft.key.trim()) : await remote.credentials.unset(ref);
          if (!result.ok) throw new Error('apiFailed');
        } catch { throw new Error(committed ? 'apiPartial' : 'apiFailed'); }
      }
      if (mounted.current) { setDraft(null); setMessage('apiSaved'); }
      await load();
    }
    async function discover() {
      const request: any = { provider: draft.entry.provider, baseURL: draft.profile.baseURL, api: draft.profile.api };
      if (draft.keyAction === 'set' && draft.key.trim()) request.apiKey = draft.key.trim();
      const found = valueOf(await remote.llm.discoverModels(draft.entry.settingsNs, request));
      const models = found.map(({ inputModalities, ...model }: any) => ({ ...model, ...(inputModalities === undefined ? {} : { input: inputModalities }) }));
      if (mounted.current) change('models', JSON.stringify(models, null, 2));
    }
    async function remove(entry: any) {
      const ns = nsOf(entry);
      if (!removable(entry, ns)) throw new Error('apiInvalid');
      // Delete the user profile only. Credentials may be shared: never remove them implicitly.
      valueOf(await remote.settings.mutate(ns.ns, [{ op: 'unset', path: entry.settingsPath }], ns.revision));
      setMessage('apiSaved'); await load();
    }
    const button = (key: string, onClick: () => void, disabled = false) => h('button', { type: 'button', style: control, onClick, disabled: busy || disabled }, t(key));
    const field = (key: string, value: string, onChange: (v: string) => void, type = 'text') => h('label', { style: { display: 'grid', gap: 'var(--dsw-spacing-1)' } }, t(key), h('input', { 'aria-label': t(key), type, value, autoComplete: 'off', style: control, disabled: busy, onChange: (e: any) => onChange(e.target.value), dir: type === 'password' ? undefined : 'auto' }));
    return h('div', { 'data-majed-api-providers': true, style: { display: 'grid', gap: 'var(--dsw-spacing-3)', textAlign: 'start' } },
      message ? h('p', { role: message === 'apiSaved' ? 'status' : 'alert' }, t(message)) : null,
      button('apiRefresh', () => { void load(); }),
      !snapshot ? h('p', null, t('apiLoading')) : h(React.Fragment, null,
        ...snapshot.rows.map((entry: any) => {
          const ns = nsOf(entry), profile = at(ns?.value, entry.settingsPath);
          const ref = refOf(entry, profile);
          const configured = snapshot.credentials[ref]?.configured || (entry.nativeAuth?.env ?? []).some((r: string) => snapshot.credentials[r]?.configured);
          return h('article', { key: entry.provider, 'data-majed-api-provider': entry.provider, style: { border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 'var(--dsw-radius-xl)', padding: 'var(--dsw-spacing-3)' } },
            h('strong', null, profile?.displayName ?? entry.displayName), h('bdi', null, ` (${entry.provider}) `),
            h('span', null, t(configured ? 'apiKeySet' : 'apiKeyMissing')),
            button(profile === undefined ? 'apiAdd' : 'apiEdit', () => edit(entry), !snapshot.writable || !ns),
            removable(entry, ns) ? button('apiDelete', () => { void run(() => remove(entry)); }, !snapshot.writable) : null);
        }),
        button('apiCustom', custom, !snapshot.writable || !snapshot.namespaces.some((n: any) => n.ns === 'llm-pi-ai'))),
      draft ? h('div', { role: 'group', 'aria-label': t('apiEditor'), style: { display: 'grid', gap: 'var(--dsw-spacing-3)' } },
        draft.custom ? field('apiRoute', draft.entry.provider, v => change('entry', { ...draft.entry, provider: v })) : h('bdi', null, draft.entry.provider),
        field('apiName', draft.profile.displayName ?? '', v => profileChange('displayName', v)),
        field('apiURL', draft.profile.baseURL ?? '', v => profileChange('baseURL', v)),
        draft.custom ? h('label', null, t('apiProtocol'), h('select', { 'aria-label': t('apiProtocol'), value: draft.profile.api, disabled: busy, style: control, onChange: (e: any) => profileChange('api', e.target.value) }, ...['openai-completions', 'openai-responses', 'anthropic-messages'].map(v => h('option', { key: v, value: v }, v)))) : null,
        h('label', null, t('apiKeyAction'), h('select', { 'aria-label': t('apiKeyAction'), value: draft.keyAction, disabled: busy, style: control, onChange: (e: any) => change('keyAction', e.target.value) }, ...['keep', 'set', 'unset'].map(v => h('option', { key: v, value: v }, t(`apiKey_${v}`))))),
        draft.keyAction === 'set' ? field('apiKey', draft.key, v => change('key', v), 'password') : null,
        h('p', null, t('apiKeyLimit')),
        button('apiFetch', () => { void run(discover); }),
        h('label', null, t('apiModels'), h('textarea', { 'aria-label': t('apiModels'), value: draft.models, rows: 12, dir: 'ltr', disabled: busy, style: { ...control, width: '100%', boxSizing: 'border-box' }, onChange: (e: any) => change('models', e.target.value) })),
        h('p', null, t('apiModelsHint')),
        button('apiSave', () => { void run(save); }), button('apiCancel', () => setDraft(null))) : null);
  };
}
