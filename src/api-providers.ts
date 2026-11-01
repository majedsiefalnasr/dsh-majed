// Native public-remotes contract adaptation; see PROVENANCE.md (#136).
// Only ephemeral render snapshots/drafts live here. DSH remains the sole durable store.
export function createApiProviders(React: any, remote: any, t: (key: string) => string) {
  const h = React.createElement;
  const at = (value: any, path: string[]) => path.reduce((v, key) => v?.[key], value);
  const refOf = (entry: any, profile: any) => profile?.apiKeyEnv ?? `${entry.provider.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_API_KEY`;
  const copy = (value: any) => JSON.parse(JSON.stringify(value));
  const control = { font: 'inherit', color: 'inherit', background: 'var(--dsw-alias-settings-card-fill)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 'var(--dsw-radius-md)', padding: '8px 12px', minHeight: '36px', minWidth: 0, boxSizing: 'border-box' as const };
  return function ApiProviders() {
    const [snapshot, setSnapshot] = React.useState(null as any);
    const [draft, setDraft] = React.useState(null as any);
    const [addOpen, setAddOpen] = React.useState(false);
    const [addMode, setAddMode] = React.useState('catalog');
    const [message, setMessage] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const generation = React.useRef(0);
    const mounted = React.useRef(true);
    const addButton = React.useRef(null as HTMLButtonElement | null);
    const restoreAddFocus = React.useRef(false);
    const visitedDrafts = React.useRef({} as Record<string, any>);
    React.useEffect(() => {
      if (!addOpen && restoreAddFocus.current) {
        restoreAddFocus.current = false;
        addButton.current?.focus();
      }
    }, [addOpen]);
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
      setDraft({ entry, revision: ns.revision, user: copy(at(ns.user, entry.settingsPath) ?? {}), profile: copy(profile), key: '', keyAction: 'keep', models: copy(profile.models ?? []), isNew: at(ns.value, entry.settingsPath) === undefined, custom: false });
    }
    function custom() {
      const ns = snapshot.namespaces.find((n: any) => n.ns === 'llm-pi-ai');
      setMessage('');
      setDraft({ entry: { provider: '', settingsNs: 'llm-pi-ai', settingsPath: [], declared: true }, revision: ns.revision, user: {}, profile: { api: 'openai-completions', baseURL: '', displayName: '' }, key: '', keyAction: 'keep', models: [], isNew: true, custom: true });
    }
    function switchMode(mode: string) {
      if (busy || mode === addMode) return;
      if (draft) visitedDrafts.current[addMode] = { ...draft, key: '', keyAction: 'keep' };
      setAddMode(mode);
      setMessage('');
      if (visitedDrafts.current[mode]) setDraft(visitedDrafts.current[mode]);
      else { setDraft(null); if (mode === 'custom') custom(); else if (addable[0]) edit(addable[0]); }
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
      const models = draft.models;
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
      if (mounted.current) { restoreAddFocus.current = addOpen; visitedDrafts.current = {}; setDraft(null); setAddOpen(false); setMessage('apiSaved'); }
      await load();
    }
    async function discover() {
      const request: any = { provider: draft.entry.provider, baseURL: draft.profile.baseURL, api: draft.profile.api };
      if (draft.keyAction === 'set' && draft.key.trim()) request.apiKey = draft.key.trim();
      const found = valueOf(await remote.llm.discoverModels(draft.entry.settingsNs, request));
      const models = found.map(({ inputModalities, ...model }: any) => ({ ...model, ...(inputModalities === undefined ? {} : { input: inputModalities }) }));
      if (mounted.current) change('models', models);
    }
    async function remove(entry: any) {
      const ns = nsOf(entry);
      if (!removable(entry, ns)) throw new Error('apiInvalid');
      // Delete the user profile only. Credentials may be shared: never remove them implicitly.
      valueOf(await remote.settings.mutate(ns.ns, [{ op: 'unset', path: entry.settingsPath }], ns.revision));
      setMessage('apiSaved'); await load();
    }
    // Narrow adaptation of MIT native ModelsSection structure/styles; see PROVENANCE.md.
    const button = (key: string, onClick: () => void, disabled = false) => h('button', { type: 'button', style: control, onClick, disabled: busy || disabled, ...(key === 'apiAdd' ? { ref: addButton } : {}) }, t(key));
    const field = (key: string, value: string, onChange: (v: string) => void, type = 'text') => h('label', { className: 'majed-api-field' }, t(key), h('input', { 'aria-label': t(key), type, value, autoComplete: 'off', style: control, disabled: busy, onChange: (e: any) => onChange(e.target.value), dir: type === 'password' ? undefined : 'auto' }));
    const configured = (entry: any) => { const ns = nsOf(entry); return ns !== undefined && (entry.settingsPath.length === 0 || at(ns.value, entry.settingsPath) !== undefined); };
    const addable = snapshot?.rows.filter((entry: any) => nsOf(entry) && !configured(entry)) ?? [];
    const select = (key: string, value: string, onChange: (v: string) => void, options: any[]) => h('label', { className: 'majed-api-field' }, t(key), h('select', { 'aria-label': t(key), value, style: control, disabled: busy, onChange: (e: any) => onChange(e.target.value) }, ...options));
    const close = () => { restoreAddFocus.current = addOpen; visitedDrafts.current = {}; setDraft(null); setAddOpen(false); };
    const editor = () => h('div', { role: 'group', 'aria-label': t('apiEditor'), className: 'majed-api-editor' },
      draft.custom ? field('apiRoute', draft.entry.provider, v => change('entry', { ...draft.entry, provider: v })) : h('bdi', { className: 'majed-api-muted' }, draft.entry.provider),
      field('apiName', draft.profile.displayName ?? '', v => profileChange('displayName', v)),
      field('apiURL', draft.profile.baseURL ?? '', v => profileChange('baseURL', v)),
      draft.custom ? select('apiProtocol', draft.profile.api, v => profileChange('api', v), ['openai-completions', 'openai-responses', 'anthropic-messages'].map(v => h('option', { key: v, value: v }, v))) : null,
      select('apiKeyAction', draft.keyAction, v => change('keyAction', v), ['keep', 'set', 'unset'].map(v => h('option', { key: v, value: v }, t(`apiKey_${v}`)))),
      draft.keyAction === 'set' ? field('apiKey', draft.key, v => change('key', v), 'password') : null,
      h('p', { className: 'majed-api-muted' }, t('apiKeyLimit')),
      h('div', { className: 'majed-api-head' }, h('strong', null, t('apiModels')), button('apiFetch', () => { void run(discover); })),
      ...draft.models.map((model: any, index: number) => h('div', { key: index, className: 'majed-api-model', 'data-majed-api-model': index },
        field('apiModelID', model.id, v => change('models', draft.models.map((m: any, i: number) => i === index ? { ...m, id: v } : m))),
        field('apiModelName', model.name ?? '', v => change('models', draft.models.map((m: any, i: number) => i === index ? { ...m, name: v } : m))),
        button('apiModelRemove', () => change('models', draft.models.filter((_: any, i: number) => i !== index))))),
      button('apiModelAdd', () => change('models', [...draft.models, { id: '', name: '' }])),
      h('p', { className: 'majed-api-muted' }, t('apiModelsHint')),
      h('div', { className: 'majed-api-actions' }, button('apiSave', () => { void run(save); }), button('apiCancel', close)));
    return h('div', { 'data-majed-api-providers': true, 'aria-busy': busy, className: 'majed-api-section' },
      h('style', null, `
        .majed-api-section{max-width:720px;display:flex;flex-direction:column;gap:12px;text-align:start;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
        .majed-api-section *{box-sizing:border-box}.majed-api-section p{margin:0}
        .majed-api-rows{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
        .majed-api-row{border:1px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));background:var(--dsw-alias-settings-card-fill);border-radius:var(--dsw-radius-xl,12px);padding:12px 14px;min-width:0}
        .majed-api-head,.majed-api-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .majed-api-identity{display:flex;align-items:center;gap:8px;flex:1 1 180px;min-width:0;overflow-wrap:anywhere}
        .majed-api-actions{margin-inline-start:auto}.majed-api-muted{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
        .majed-api-editor{display:flex;flex-direction:column;gap:16px;padding:16px 0 4px;margin-top:12px;border-top:1px solid var(--dsw-alias-border-l2)}
        .majed-api-field{display:flex;flex-direction:column;gap:6px;min-width:0;font-weight:500}.majed-api-field input,.majed-api-field select{width:100%;font-weight:400}
        .majed-api-model{display:grid;grid-template-columns:repeat(2,minmax(0,1fr)) auto;gap:8px;align-items:end}
        .majed-api-add{margin-top:12px}.majed-api-tabs{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.majed-api-tabs [aria-selected=true]{font-weight:600;background:var(--dsw-alias-interactive-secondary-hover,var(--dsw-alias-settings-card-fill))}
        .majed-api-section button{cursor:pointer}.majed-api-section button:hover:not(:disabled){background:var(--dsw-alias-interactive-secondary-hover,var(--dsw-alias-settings-card-fill))}
        .majed-api-section :is(button,input,select):focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#367cff);outline-offset:2px}.majed-api-section :disabled{opacity:.5;cursor:not-allowed}
        @media(max-width:520px){.majed-api-model{grid-template-columns:minmax(0,1fr)}.majed-api-model button{justify-self:start}.majed-api-row{padding:12px}.majed-api-actions{margin-inline-start:0}}
      `),
      message ? h('p', { role: message === 'apiSaved' ? 'status' : 'alert' }, t(message)) : null,
      h('div', { className: 'majed-api-actions' }, button('apiRefresh', () => { void load(); })),
      !snapshot ? h('p', null, t('apiLoading')) : h(React.Fragment, null,
        h('ul', { className: 'majed-api-rows' }, ...snapshot.rows.filter(configured).map((entry: any) => {
          const ns = nsOf(entry), profile = at(ns.value, entry.settingsPath);
          const refs = profile?.apiKeyEnv ? [profile.apiKeyEnv] : [refOf(entry, profile), ...(entry.nativeAuth?.env ?? [])];
          const metadata = refs.map((ref: string) => snapshot.credentials[ref]);
          const credentialStatus = entry.provider === 'deepseek-account' ? 'account-unknown'
            : metadata.some((value: any) => value?.configured === true) ? 'configured'
            : metadata.every((value: any) => value?.configured === false) ? 'missing' : 'unknown';
          const statusLabel = credentialStatus === 'configured' ? 'apiKeySet' : credentialStatus === 'missing' ? 'apiKeyMissing' : credentialStatus === 'account-unknown' ? 'apiAccountUnknown' : 'apiKeyUnknown';
          return h('li', { key: entry.provider, 'data-majed-api-provider': entry.provider, className: 'majed-api-row' },
            h('div', { className: 'majed-api-head' }, h('span', { className: 'majed-api-identity' }, h('strong', null, profile?.displayName ?? entry.displayName), h('span', { className: 'majed-api-muted', 'data-majed-credential-status': credentialStatus }, h('span', { 'aria-hidden': true, style: { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', marginInlineEnd: 6, background: 'currentColor' } }), t(statusLabel))),
              h('span', { className: 'majed-api-actions' }, entry.provider === 'deepseek-account' ? null : button('apiEdit', () => { setAddOpen(false); edit(entry); }, !snapshot.writable), removable(entry, ns) ? button('apiDelete', () => { void run(() => remove(entry)); }, !snapshot.writable) : null)),
            !addOpen && draft?.entry.provider === entry.provider ? editor() : null);
        })),
        h('div', { className: 'majed-api-add' }, !addOpen ? button('apiAdd', () => { setAddOpen(true); setAddMode('catalog'); setDraft(null); if (addable[0]) edit(addable[0]); }, !snapshot.writable) : null,
          addOpen ? h(React.Fragment, null,
            h('div', { role: 'tablist', 'aria-label': t('apiAdd'), className: 'majed-api-tabs' },
              ...['catalog', 'custom'].map(mode => h('button', { type: 'button', role: 'tab', 'aria-selected': addMode === mode, style: control, disabled: busy || (mode === 'custom' && !snapshot.namespaces.some((n: any) => n.ns === 'llm-pi-ai')), onClick: () => switchMode(mode) }, t(mode === 'catalog' ? 'apiCatalog' : 'apiCustom')))),
            addMode === 'catalog' ? select('apiCatalog', draft?.entry.provider ?? '', v => { const entry = addable.find((e: any) => e.provider === v); if (entry) edit(entry); }, [h('option', { key: '', value: '', disabled: true }, t('apiChoose')), ...addable.map((e: any) => h('option', { key: e.provider, value: e.provider }, e.displayName))]) : null,
            draft ? editor() : button('apiCancel', close)) : null)));
  };
}
