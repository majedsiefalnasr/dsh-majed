// Native public-remotes contract adaptation; see PROVENANCE.md (#136).
// Only ephemeral render snapshots/drafts live here. DSH remains the sole durable store.
export function createApiProviders(
  React: any,
  remote: any,
  t: (key: string) => string,
  primitives = require('@deepseek-ai/dsh-client-ui-primitives'),
) {
  const h = React.createElement;
  const at = (value: any, path: string[]) =>
    path.reduce((v, key) => v?.[key], value);
  const refOf = (entry: any, profile: any) =>
    profile?.apiKeyEnv ??
    `${entry.provider.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_API_KEY`;
  const copy = (value: any) => JSON.parse(JSON.stringify(value));
  const subscriptionIDs = new Set([
    'codex',
    'claude',
    'grok',
    'antigravity',
    'copilot',
    'opencode-zen',
  ]);
  const control = {
    font: 'inherit',
    color: 'inherit',
    background:
      'var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))',
    border: '0.5px solid var(--dsw-alias-border-l2)',
    borderRadius: 'var(--dsw-radius-md, 12px)',
    padding: '6px 12px',
    minHeight: '36px',
    minWidth: 0,
    boxSizing: 'border-box' as const,
  };
  return function ApiProviders({
    subscriptions,
    showAPI = true,
    showSubscriptionAdd = true,
  }: any = {}) {
    const [subscription, setSubscription] = React.useState('');
    const [authFlow, setAuthFlow] = React.useState(null as any);
    const [snapshot, setSnapshot] = React.useState(null as any);
    const [draft, setDraft] = React.useState(null as any);
    const [addOpen, setAddOpen] = React.useState(false);
    const [addMode, setAddMode] = React.useState('catalog');
    const [message, setMessage] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const generation = React.useRef(0);
    const mounted = React.useRef(true);
    const addButton = React.useRef(null as HTMLButtonElement | null);
    const subscriptionAddButton = React.useRef(
      null as HTMLButtonElement | null,
    );
    const addOrigin = React.useRef('api');
    const restoreAddFocus = React.useRef(false);
    const visitedDrafts = React.useRef({} as Record<string, any>);
    React.useEffect(() => {
      if (!addOpen && restoreAddFocus.current) {
        restoreAddFocus.current = false;
        (addOrigin.current === 'subscription'
          ? subscriptionAddButton
          : addButton
        ).current?.focus();
      }
    }, [addOpen]);
    // Never forward remote error text: transports/providers may echo a submitted key.
    const valueOf = (result: any) => {
      if (!result.ok)
        throw new Error(
          result.error?.code === 'settings/conflict'
            ? 'apiConflict'
            : 'apiFailed',
        );
      return result.value;
    };
    async function load() {
      const sequence = ++generation.current;
      if (!remote) return;
      try {
        const [settings, directory, registered] = await Promise.all([
          remote.settings.describe(),
          remote.llm.listConfigurableProviders(),
          remote.llm.listProviders(),
        ]);
        const described = valueOf(settings);
        const entries = valueOf(directory);
        const providers = valueOf(registered);
        const configuredIDs = Object.keys(
          described.namespaces.find((n: any) => n.ns === 'llm-pi-ai')?.value
            ?.providers ?? {},
        );
        const occupiedIDs = new Set([
          ...entries.map((entry: any) => entry.provider),
          ...providers.map((provider: any) => provider.id),
          ...configuredIDs,
        ]);
        const rows = entries.filter(
          (entry: any) => !subscriptionIDs.has(entry.provider),
        );
        for (const provider of providers)
          if (
            !subscriptionIDs.has(provider.id) &&
            !rows.some((e: any) => e.provider === provider.id)
          )
            rows.push({
              provider: provider.id,
              displayName: provider.name,
              settingsNs: '',
              settingsPath: [],
            });
        rows.sort((a: any, b: any) => rank(a.provider) - rank(b.provider));
        const refs = [
          ...new Set(
            rows.flatMap((e: any) => {
              if (e.provider === 'deepseek-account') return [];
              const ns = described.namespaces.find(
                (n: any) => n.ns === e.settingsNs,
              );
              const profile = at(ns?.value, e.settingsPath);
              return profile?.apiKeyEnv
                ? [profile.apiKeyEnv]
                : [refOf(e, profile), ...(e.nativeAuth?.env ?? [])];
            }),
          ),
        ];
        const credentials: any = {};
        for (let i = 0; i < refs.length; i += 64)
          Object.assign(
            credentials,
            valueOf(await remote.credentials.describe(refs.slice(i, i + 64))),
          );
        if (mounted.current && sequence === generation.current)
          setSnapshot({ ...described, rows, credentials, occupiedIDs });
      } catch {
        if (mounted.current && sequence === generation.current)
          setMessage('apiFailed');
      }
    }
    function rank(id: string) {
      return id === 'deepseek-account' ? 0 : id === 'deepseek-official' ? 1 : 2;
    }
    React.useEffect(() => {
      mounted.current = true;
      void load();
      const refresh = () => {
        void load();
      };
      const disposers = !remote
        ? []
        : [
            'settings/document-updated',
            'credentials/reference-updated',
            'credentials/record-updated',
            'llm/adapters-updated',
          ].map((event) => remote.$on(event, refresh));
      return () => {
        mounted.current = false;
        generation.current++;
        disposers.forEach((off) => off());
      };
    }, []);
    const nsOf = (e: any) =>
      snapshot.namespaces.find((n: any) => n.ns === e.settingsNs);
    const removable = (e: any, ns: any) =>
      e.declared === true &&
      e.settingsPath.length > 0 &&
      at(ns?.user, e.settingsPath) !== undefined &&
      at(ns?.base, e.settingsPath) === undefined;
    function edit(entry: any) {
      const ns = nsOf(entry);
      if (!ns) return;
      const profile = at(ns.value, entry.settingsPath) ?? {};
      setMessage('');
      setDraft({
        entry,
        revision: ns.revision,
        user: copy(at(ns.user, entry.settingsPath) ?? {}),
        profile: copy(profile),
        key: '',
        keyAction: 'keep',
        models: copy(profile.models ?? []),
        isNew: at(ns.value, entry.settingsPath) === undefined,
        custom: false,
      });
    }
    function custom() {
      const ns = snapshot.namespaces.find((n: any) => n.ns === 'llm-pi-ai');
      setMessage('');
      setDraft({
        entry: {
          provider: '',
          settingsNs: 'llm-pi-ai',
          settingsPath: [],
          declared: true,
        },
        revision: ns.revision,
        user: {},
        profile: { api: 'openai-completions', baseURL: '', displayName: '' },
        key: '',
        keyAction: 'keep',
        models: [],
        isNew: true,
        custom: true,
      });
    }
    function switchMode(mode: string) {
      if (busy || authFlow?.busy || mode === addMode) return;
      if (draft)
        visitedDrafts.current[addMode] = {
          ...draft,
          key: '',
          keyAction: 'keep',
        };
      setAuthFlow(null);
      setAddMode(mode);
      setMessage('');
      if (visitedDrafts.current[mode]) setDraft(visitedDrafts.current[mode]);
      else {
        setDraft(null);
        if (mode === 'custom') custom();
        else if (mode === 'catalog' && addable[0]) edit(addable[0]);
      }
    }
    const change = (field: string, value: any) =>
      setDraft((d: any) => ({ ...d, [field]: value }));
    const profileChange = (field: string, value: string) =>
      setDraft((d: any) => ({
        ...d,
        profile: { ...d.profile, [field]: value },
      }));
    async function run(action: () => Promise<void>) {
      if (busy) return;
      setBusy(true);
      setMessage('');
      try {
        await action();
      } catch (error) {
        if (mounted.current)
          setMessage(
            error instanceof Error &&
              ['apiConflict', 'apiInvalid', 'apiPartial'].includes(
                error.message,
              )
              ? error.message
              : 'apiFailed',
          );
      } finally {
        if (mounted.current) setBusy(false);
      }
    }
    function parsedModels() {
      const models = draft.models;
      if (
        !Array.isArray(models) ||
        models.some(
          (m: any) =>
            !m ||
            typeof m.id !== 'string' ||
            !m.id.trim() ||
            (m.name !== undefined && typeof m.name !== 'string') ||
            ['contextWindow', 'maxTokens'].some(
              (k) =>
                m[k] !== undefined && (!Number.isInteger(m[k]) || m[k] < 1),
            ) ||
            (m.input !== undefined &&
              (!Array.isArray(m.input) ||
                m.input.some((v: any) => !['text', 'image'].includes(v)))) ||
            (m.reasoningEfforts !== undefined &&
              m.reasoningEfforts !== false &&
              (typeof m.reasoningEfforts !== 'object' ||
                m.reasoningEfforts === null ||
                Array.isArray(m.reasoningEfforts))),
        )
      )
        throw new Error('apiInvalid');
      if (new Set(models.map((m: any) => m.id)).size !== models.length)
        throw new Error('apiInvalid');
      return models;
    }
    async function save() {
      let entry = draft.entry;
      if (draft.custom) {
        if (
          !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(entry.provider) ||
          subscriptionIDs.has(entry.provider) ||
          snapshot.occupiedIDs.has(entry.provider)
        )
          throw new Error('apiInvalid');
        entry = { ...entry, settingsPath: ['providers', entry.provider] };
      }
      if (draft.profile.baseURL) {
        try {
          const url = new URL(draft.profile.baseURL);
          if (
            !['http:', 'https:'].includes(url.protocol) ||
            url.username ||
            url.password
          )
            throw new Error();
        } catch {
          throw new Error('apiInvalid');
        }
      }
      const models = parsedModels();
      if (draft.custom && (!draft.profile.baseURL || models.length === 0))
        throw new Error('apiInvalid');
      const next = { ...draft.user };
      for (const field of ['displayName', 'baseURL']) {
        if (draft.profile[field]?.trim())
          next[field] = draft.profile[field].trim();
        else delete next[field];
      }
      next.models = models;
      if (draft.custom) next.api = draft.profile.api;
      const ref = refOf(entry, draft.profile);
      if (
        draft.keyAction !== 'keep' &&
        snapshot.credentials[ref]?.writable === false
      )
        throw new Error('apiFailed');
      if (draft.keyAction === 'set') {
        if (!draft.key.trim() || /[\r\n]/.test(draft.key))
          throw new Error('apiInvalid');
        next.apiKeyEnv = ref;
      }
      const ops: any[] = [];
      for (const field of ['displayName', 'baseURL'])
        if (field in draft.user && !(field in next))
          ops.push({ op: 'unset', path: [...entry.settingsPath, field] });
      for (const field of Object.keys(next))
        if (JSON.stringify(next[field]) !== JSON.stringify(draft.user[field]))
          ops.push({
            op: 'set',
            path: [...entry.settingsPath, field],
            value: next[field],
          });
      if (draft.isNew && ops.length === 0)
        ops.push({ op: 'set', path: entry.settingsPath, value: {} });
      let committed = false;
      if (ops.length) {
        const view = valueOf(
          await remote.settings.mutate(entry.settingsNs, ops, draft.revision),
        );
        committed = true;
        // Preserve the outstanding credential intent, but do not replay the settings write on retry.
        if (mounted.current)
          setDraft((d: any) => ({
            ...d,
            entry,
            revision: view.revision,
            user: copy(next),
            isNew: false,
            custom: false,
          }));
      }
      if (draft.keyAction !== 'keep') {
        try {
          const result =
            draft.keyAction === 'set'
              ? await remote.credentials.set(ref, draft.key.trim())
              : await remote.credentials.unset(ref);
          if (!result.ok) throw new Error('apiFailed');
        } catch {
          throw new Error(committed ? 'apiPartial' : 'apiFailed');
        }
      }
      if (mounted.current) {
        restoreAddFocus.current = addOpen;
        visitedDrafts.current = {};
        setDraft(null);
        setAddOpen(false);
        setMessage('apiSaved');
      }
      await load();
    }
    async function discover() {
      const request: any = {
        provider: draft.entry.provider,
        baseURL: draft.profile.baseURL,
        api: draft.profile.api,
      };
      if (draft.keyAction === 'set' && draft.key.trim())
        request.apiKey = draft.key.trim();
      const found = valueOf(
        await remote.llm.discoverModels(draft.entry.settingsNs, request),
      );
      const models = found.map(({ inputModalities, ...model }: any) => ({
        ...model,
        ...(inputModalities === undefined ? {} : { input: inputModalities }),
      }));
      if (mounted.current) change('models', models);
    }
    async function remove(entry: any) {
      const ns = nsOf(entry);
      if (!removable(entry, ns)) throw new Error('apiInvalid');
      // Delete the user profile only. Credentials may be shared: never remove them implicitly.
      valueOf(
        await remote.settings.mutate(
          ns.ns,
          [{ op: 'unset', path: entry.settingsPath }],
          ns.revision,
        ),
      );
      setMessage('apiSaved');
      await load();
    }
    // Narrow adaptation of MIT native ModelsSection structure/styles; see PROVENANCE.md.
    const button = (
      key: string,
      onClick: () => void,
      disabled = false,
      cancellation = false,
    ) =>
      h(
        'button',
        {
          type: 'button',
          className: key === 'apiAdd' ? 'majed-api-add-trigger' : undefined,
          style: {
            ...control,
            ...(key === 'apiAdd'
              ? {
                  inlineSize: '100%',
                  minHeight: 44,
                  borderStyle: 'dashed',
                  background: 'transparent',
                }
              : {}),
          },
          onClick,
          disabled: busy || (!cancellation && !!authFlow?.busy) || disabled,
          ...(key === 'apiAdd' ? { ref: addButton } : {}),
        },
        t(key),
      );
    const field = (
      key: string,
      value: string,
      onChange: (v: string) => void,
      type = 'text',
    ) =>
      h(
        'label',
        { className: 'majed-api-field' },
        t(key),
        h('input', {
          'aria-label': t(key),
          type,
          value,
          autoComplete: 'off',
          style: control,
          disabled: busy,
          onChange: (e: any) => onChange(e.target.value),
          dir: ['apiRoute', 'apiURL', 'apiModelID', 'apiKey'].includes(key)
            ? 'ltr'
            : 'auto',
        }),
      );
    const configured = (entry: any) => {
      const ns = nsOf(entry);
      return (
        ns !== undefined &&
        (entry.settingsPath.length === 0 ||
          at(ns.value, entry.settingsPath) !== undefined)
      );
    };
    const addable =
      snapshot?.rows.filter(
        (entry: any) => nsOf(entry) && !configured(entry),
      ) ?? [];
    const select = (
      key: string,
      value: string,
      onChange: (v: string) => void,
      options: any[],
    ) =>
      h(
        'label',
        { className: 'majed-api-field' },
        t(key),
        h(
          'select',
          {
            'aria-label': t(key),
            value,
            style: control,
            disabled: busy || (key === 'apiSubscription' && !!authFlow?.busy),
            onChange: (e: any) => onChange(e.target.value),
          },
          ...options,
        ),
      );
    React.useEffect(() => {
      if (!subscriptions?.request || authFlow?.busy) return;
      addOrigin.current = 'subscription';
      if (subscriptions.request.returnFocus)
        subscriptionAddButton.current = subscriptions.request.returnFocus;
      setSubscription(subscriptions.request.provider);
      setAddMode('subscription');
      setDraft(null);
      setAddOpen(true);
    }, [subscriptions?.request]);
    const close = () => {
      setAuthFlow(null);
      restoreAddFocus.current = addOpen;
      visitedDrafts.current = {};
      setDraft(null);
      setAddOpen(false);
    };
    const editor = () =>
      h(
        'div',
        {
          role: 'group',
          'aria-label': t('apiEditor'),
          className: 'majed-api-editor',
        },
        draft.custom
          ? field('apiRoute', draft.entry.provider, (v) =>
              change('entry', { ...draft.entry, provider: v }),
            )
          : h('bdi', { className: 'majed-api-muted' }, draft.entry.provider),
        field('apiName', draft.profile.displayName ?? '', (v) =>
          profileChange('displayName', v),
        ),
        field('apiURL', draft.profile.baseURL ?? '', (v) =>
          profileChange('baseURL', v),
        ),
        draft.custom
          ? select(
              'apiProtocol',
              draft.profile.api,
              (v) => profileChange('api', v),
              [
                'openai-completions',
                'openai-responses',
                'anthropic-messages',
              ].map((v) => h('option', { key: v, value: v }, v)),
            )
          : null,
        select(
          'apiKeyAction',
          draft.keyAction,
          (v) => change('keyAction', v),
          ['keep', 'set', 'unset'].map((v) =>
            h('option', { key: v, value: v }, t(`apiKey_${v}`)),
          ),
        ),
        draft.keyAction === 'set'
          ? field('apiKey', draft.key, (v) => change('key', v), 'password')
          : null,
        h('p', { className: 'majed-api-muted' }, t('apiKeyLimit')),
        h(
          'div',
          { className: 'majed-api-head' },
          h('strong', null, t('apiModels')),
          button('apiFetch', () => {
            void run(discover);
          }),
        ),
        ...draft.models.map((model: any, index: number) =>
          h(
            'div',
            {
              key: index,
              className: 'majed-api-model',
              'data-majed-api-model': index,
            },
            field('apiModelID', model.id, (v) =>
              change(
                'models',
                draft.models.map((m: any, i: number) =>
                  i === index ? { ...m, id: v } : m,
                ),
              ),
            ),
            field('apiModelName', model.name ?? '', (v) =>
              change(
                'models',
                draft.models.map((m: any, i: number) =>
                  i === index ? { ...m, name: v } : m,
                ),
              ),
            ),
            button('apiModelRemove', () =>
              change(
                'models',
                draft.models.filter((_: any, i: number) => i !== index),
              ),
            ),
          ),
        ),
        button('apiModelAdd', () =>
          change('models', [...draft.models, { id: '', name: '' }]),
        ),
        h('p', { className: 'majed-api-muted' }, t('apiModelsHint')),
        h(
          'div',
          { className: 'majed-api-actions' },
          button('apiSave', () => {
            void run(save);
          }),
          button('apiCancel', close, false, true),
        ),
      );
    const openAdd = (group: string) => {
      addOrigin.current = group;
      setAddOpen(true);
      setDraft(null);
      setMessage('');
      setAddMode(group === 'subscription' ? 'subscription' : 'catalog');
      if (group === 'api' && addable[0]) edit(addable[0]);
    };
    const addPanel = () =>
      h(
        'div',
        {
          className: `majed-api-add${addMode !== 'subscription' ? ' majed-api-add-open' : ' majed-subscription-add-open'}`,
        },
        addOpen
          ? h(
              React.Fragment,
              null,
              addOrigin.current === 'subscription'
                ? null
                : h(primitives.SegmentedControl, {
                    id: 'majed-provider-add-mode',
                    value: addMode,
                    label: t('apiAdd'),
                    className: 'majed-api-tabs',
                    disabled: busy || !!authFlow?.busy,
                    onChange: switchMode,
                    options: ['catalog', 'custom'].map((mode) => ({
                      value: mode,
                      label: t(
                        mode === 'catalog'
                          ? 'apiCatalog'
                          : mode === 'custom'
                            ? 'apiCustom'
                            : 'apiSubscription',
                      ),
                      disabled:
                        mode !== 'subscription' &&
                        (!snapshot?.writable ||
                          (mode === 'custom' &&
                            !snapshot.namespaces.some(
                              (n: any) => n.ns === 'llm-pi-ai',
                            ))),
                    })),
                  }),
              h(
                'div',
                {
                  role:
                    addOrigin.current === 'subscription' ? 'group' : 'tabpanel',
                  id: `majed-provider-add-mode-${addMode}-panel`,
                  'aria-label':
                    addOrigin.current === 'subscription'
                      ? t('subscriptionAdd')
                      : undefined,
                  'aria-labelledby':
                    addOrigin.current === 'subscription'
                      ? undefined
                      : `majed-provider-add-mode-${addMode}`,
                },
                addMode === 'catalog'
                  ? select(
                      'apiCatalog',
                      draft?.entry.provider ?? '',
                      (v) => {
                        const entry = addable.find(
                          (e: any) => e.provider === v,
                        );
                        if (entry) edit(entry);
                      },
                      [
                        h(
                          'option',
                          { key: '', value: '', disabled: true },
                          t('apiChoose'),
                        ),
                        ...addable.map((e: any) =>
                          h(
                            'option',
                            { key: e.provider, value: e.provider },
                            e.displayName,
                          ),
                        ),
                      ],
                    )
                  : null,
                addMode === 'subscription'
                  ? h(
                      React.Fragment,
                      null,
                      select(
                        'apiSubscription',
                        subscription || subscriptions.providers[0]?.id || '',
                        (v) => {
                          if (!authFlow?.busy) {
                            setAuthFlow(null);
                            setSubscription(v);
                          }
                        },
                        subscriptions.providers.map((p: any) =>
                          h('option', { key: p.id, value: p.id }, p.name),
                        ),
                      ),
                      subscriptions.renderAuth(
                        subscription || subscriptions.providers[0]?.id,
                        close,
                        setAuthFlow,
                      ),
                      h(
                        'div',
                        { className: 'majed-subscription-add-actions' },
                        button(
                          'cancel',
                          () =>
                            run(async () => {
                              if (
                                !authFlow?.cancel ||
                                (await authFlow.cancel())
                              )
                                close();
                            }),
                          false,
                          true,
                        ),
                      ),
                    )
                  : draft
                    ? editor()
                    : button('apiCancel', close, false, true),
              ),
            )
          : null,
      );
    return h(
      'div',
      {
        'data-majed-api-providers': true,
        'aria-busy': busy,
        className: 'majed-api-section',
      },
      h(
        'style',
        null,
        `
        .majed-provider-group{display:flex;flex-direction:column;gap:12px;min-inline-size:0}.majed-provider-group+.majed-provider-group{margin-block-start:12px}.majed-provider-title{margin:0;font-size:16px;line-height:24px;font-weight:500}
        .majed-api-section{max-inline-size:720px;min-inline-size:0;display:flex;flex-direction:column;gap:12px;text-align:start;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
        .majed-api-section *{box-sizing:border-box}.majed-api-section p{margin:0}
        .majed-api-rows{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}.majed-api-rows>li{min-inline-size:0}
        .majed-api-row{border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));border-radius:var(--dsw-radius-xl,20px);padding:14px 16px;min-inline-size:0}
        .majed-api-head,.majed-api-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .majed-api-identity{display:flex;flex-direction:column;align-items:flex-start;gap:4px;flex:1 1 180px;min-inline-size:0;overflow-wrap:anywhere}.majed-api-identity strong{font-weight:500}
        .majed-api-actions{margin-inline-start:auto}.majed-api-muted{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
        .majed-api-editor{display:flex;flex-direction:column;gap:14px;padding-block:14px 4px;margin-block-start:12px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
        .majed-api-field{display:flex;flex-direction:column;gap:6px;min-inline-size:0;font-size:12px;line-height:18px;font-weight:500}.majed-api-field input,.majed-api-field select{inline-size:100%;font-size:14px;line-height:22px;font-weight:400}
        .majed-api-model{display:grid;grid-template-columns:repeat(2,minmax(0,1fr)) auto;gap:8px;align-items:end}
        .majed-api-add{margin-block-start:4px;min-inline-size:0}.majed-api-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-block-end:14px}.majed-api-tabs [aria-selected=true]{font-weight:500;background:var(--dsw-alias-interactive-secondary-hover,var(--dsw-alias-bg-layer-1))}
        .majed-api-section .majed-subscription-add-trigger{display:flex;align-items:center;justify-content:center;gap:6px;inline-size:100%;min-block-size:44px;padding:0 14px;border:1px dashed var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-lg,16px);background:transparent;color:inherit;font:inherit}
        .majed-api-section .majed-subscription-add-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-1))}
        .majed-subscription-add-open{padding:14px 16px;border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-alias-bg-module-platform,var(--dsw-alias-bg-layer-1))}
        .majed-subscription-add-actions{display:flex;justify-content:flex-end;gap:8px}
        .majed-subscription-add-actions>button{flex:0 0 auto;inline-size:auto}
        .majed-api-section .majed-subscriptions-settings :is([data-majed-codex-part=header],[data-majed-claude-part=header],[data-majed-grok-part=header],[data-majed-antigravity-part=header],[data-majed-copilot-part=header])>button:not(.majed-provider-disclosure){height:28px;block-size:28px;min-height:28px;padding:0 10px;border-radius:var(--dsw-radius-sm,8px);font-size:12px;line-height:18px}
        .majed-subscription-add-open [data-majed-codex-part=card],.majed-subscription-add-open [data-majed-claude-part=card],.majed-subscription-add-open [data-majed-grok-part=card],.majed-subscription-add-open [data-majed-antigravity-part=card],.majed-subscription-add-open [data-majed-copilot-part=card]{border:0!important;background:transparent!important;padding:0!important}
        .majed-api-add-open{padding:14px 16px;border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
        .majed-api-add>:is([role=tabpanel],[role=group]){display:flex;flex-direction:column;gap:14px;min-inline-size:0}.majed-api-add>:is([role=tabpanel],[role=group])>.majed-api-editor{margin-block-start:0}
        .majed-api-section button{cursor:pointer;max-inline-size:100%;white-space:normal;overflow-wrap:anywhere}.majed-api-section button:hover:not(:disabled){background:var(--dsw-alias-interactive-secondary-hover,var(--dsw-alias-bg-layer-1))}
        .majed-api-section :is(button,input,select):focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.majed-api-section :disabled{opacity:.5;cursor:not-allowed}
        @media(max-width:520px){.majed-api-model{grid-template-columns:minmax(0,1fr)}.majed-api-model button{justify-self:start}.majed-api-actions{margin-inline-start:0}}
      `,
      ),
      message
        ? h(
            'p',
            { role: message === 'apiSaved' ? 'status' : 'alert' },
            t(message),
          )
        : null,
      subscriptions
        ? h(
            'section',
            {
              'data-majed-provider-group': 'subscription',
              className: 'majed-provider-group',
              'aria-label': t('subscriptionProviders'),
            },
            h(
              'h3',
              { className: 'majed-provider-title' },
              t('subscriptionProviders'),
            ),
            h('ul', { className: 'majed-api-rows' }, ...subscriptions.rows),
            addOpen && addOrigin.current === 'subscription'
              ? addPanel()
              : !showSubscriptionAdd
                ? null
                : h(
                    'button',
                    {
                      type: 'button',
                      className: 'majed-subscription-add-trigger',
                      ref: subscriptionAddButton,
                      disabled: busy || addOpen,
                      onClick: () => openAdd('subscription'),
                    },
                    h(
                      'svg',
                      {
                        width: 16,
                        height: 16,
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: 1.5,
                        'aria-hidden': true,
                      },
                      h('path', { d: 'M12 4v16M4 12h16' }),
                    ),
                    t('addAccount'),
                  ),
          )
        : null,
      showAPI &&
        h(
          'section',
          {
            'data-majed-provider-group': 'api',
            className: 'majed-provider-group',
            'aria-label': t('apiProviders'),
          },
          h(
            'div',
            { className: 'majed-api-head' },
            h('h3', { className: 'majed-provider-title' }, t('apiProviders')),
            h(
              'div',
              { className: 'majed-api-actions' },
              button('apiRefresh', () => {
                void load();
              }),
            ),
          ),
          h(
            React.Fragment,
            null,
            !snapshot
              ? h(
                  'p',
                  null,
                  t(
                    remote
                      ? message
                        ? 'apiFailed'
                        : 'apiLoading'
                      : 'apiUnavailable',
                  ),
                )
              : null,
            h(
              'ul',
              { className: 'majed-api-rows' },
              ...(snapshot?.rows ?? []).filter(configured).map((entry: any) => {
                const ns = nsOf(entry),
                  profile = at(ns.value, entry.settingsPath);
                const refs = profile?.apiKeyEnv
                  ? [profile.apiKeyEnv]
                  : [refOf(entry, profile), ...(entry.nativeAuth?.env ?? [])];
                const metadata = refs.map(
                  (ref: string) => snapshot.credentials[ref],
                );
                const credentialStatus =
                  entry.provider === 'deepseek-account'
                    ? 'account-unknown'
                    : metadata.some((value: any) => value?.configured === true)
                      ? 'configured'
                      : metadata.every(
                            (value: any) => value?.configured === false,
                          )
                        ? 'missing'
                        : 'unknown';
                const statusLabel =
                  credentialStatus === 'configured'
                    ? 'apiKeySet'
                    : credentialStatus === 'missing'
                      ? 'apiKeyMissing'
                      : credentialStatus === 'account-unknown'
                        ? 'apiAccountUnknown'
                        : 'apiKeyUnknown';
                return h(
                  'li',
                  {
                    key: entry.provider,
                    'data-majed-api-provider': entry.provider,
                    className: 'majed-api-row',
                  },
                  h(
                    'div',
                    { className: 'majed-api-head' },
                    h(
                      'span',
                      { className: 'majed-api-identity' },
                      h(
                        'strong',
                        null,
                        profile?.displayName ?? entry.displayName,
                      ),
                      h(
                        'span',
                        {
                          className: 'majed-api-muted',
                          'data-majed-credential-status': credentialStatus,
                        },
                        h('span', {
                          'aria-hidden': true,
                          style: {
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            marginInlineEnd: 6,
                            background: 'currentColor',
                          },
                        }),
                        t(statusLabel),
                      ),
                    ),
                    h(
                      'span',
                      { className: 'majed-api-actions' },
                      entry.provider === 'deepseek-account'
                        ? null
                        : button(
                            'apiEdit',
                            () => {
                              setAddOpen(false);
                              edit(entry);
                            },
                            addOpen || !snapshot.writable,
                          ),
                      removable(entry, ns)
                        ? button(
                            'apiDelete',
                            () => {
                              void run(() => remove(entry));
                            },
                            addOpen || !snapshot.writable,
                          )
                        : null,
                    ),
                  ),
                  !addOpen && draft?.entry.provider === entry.provider
                    ? editor()
                    : null,
                );
              }),
            ),
            addOpen && addOrigin.current === 'api'
              ? addPanel()
              : button(
                  'apiAdd',
                  () => openAdd('api'),
                  addOpen || !snapshot?.writable,
                ),
          ),
        ),
    );
  };
}
