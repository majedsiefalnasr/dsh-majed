window.__ModuleLoader__.load({
  id: 'dsh-majed/internal/managers',
  factory: require => {
    const React = require('react');
    const h = React.createElement;
    const safeCodes = new Set(['MANAGER_VALIDATION_FAILED', 'MANAGER_PERSISTENCE_FAILED', 'MANAGER_UNAVAILABLE', 'MANAGER_ACTIVATION_FAILED', 'MANAGER_OPERATION_FAILED', 'MANAGER_JSON_REQUIRED']);
    const safeReasons = new Set(['OWNED_UNAVAILABLE', 'OWNED_CHANGED', 'ENTRY_UNAVAILABLE', 'ENTRY_RELOADED', 'PLUGIN_INACTIVE', 'OVERRIDDEN', 'YAML_ERROR', 'FILE_IO', 'RELOAD_OR_UNKNOWN', 'OWNED_CHANGED_NO_FIBER', 'OWNED_CHANGED_CTX_FIBER', 'OWNED_CHANGED_ENTRY_NOT_FIBER_ENTRY', 'OWNED_CHANGED_ENTRY_FIBER_REPLACED', 'OWNED_CHANGED_FIBER_CTX', 'OWNED_CHANGED_FIBER_STATE', 'OWNED_CHANGED_NOT_INCLUDE_ROOT', 'OWNED_CHANGED_OK', 'OWNED_CHANGED_EDITOR', 'OWNED_CHANGED_ENTRIES']);
    const refusal = result => 'Change refused. Check the fields and owned root configuration. Existing credentials are retained.' + (safeCodes.has(result?.code) ? ` [${result.code}${safeReasons.has(result?.reason) ? ':' + result.reason : ''}]` : '');
    function ManagersPanel({ service, kind, initialTab }) {
      const page = kind || initialTab || 'mcp';
      const isHooks = page === 'hooks';
      const title = isHooks ? 'Hooks' : 'MCPs';
      const [state, setState] = React.useState(null);
      const [error, setError] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [draft, setDraft] = React.useState(null);
      const [confirmDelete, setConfirmDelete] = React.useState('');
      async function change(action, input) {
        if (busy || !state?.writable) return;
        setBusy(true);
        try {
          const result = await service[action](input);
          if (!result.ok) { setError(refusal(result)); return; }
          setState(result.state); setDraft(null); setConfirmDelete(''); setError('');
        } catch { setError('Change refused. Check the fields and owned root configuration. Existing credentials are retained.'); }
        finally { setBusy(false); }
      }
      function editServer(server) {
        setDraft({ originalName: server?.serverName, serverName: server?.serverName || '', transport: server?.transport || 'stdio', command: server?.command || '', args: JSON.stringify(server?.args || []), cwd: server?.cwd || '', url: server?.url || '' });
      }
      const field = (label, name, type = 'text', maxLength = 4096) => h('label', null, label, h('input', { name, 'aria-label': label, type, maxLength, value: draft[name], disabled: busy || !state?.writable, onChange: event => setDraft({ ...draft, [name]: event.target.value }) }));
      function saveServer(event) {
        event.preventDefault();
        try {
          const server = { serverName: draft.serverName, transport: draft.transport };
          if (draft.transport === 'stdio') { server.command = draft.command; server.args = JSON.parse(draft.args); if (draft.cwd) server.cwd = draft.cwd; }
          else server.url = draft.url;
          return change('upsertServer', { ...(draft.originalName ? { originalName: draft.originalName } : {}), server });
        } catch { setError('Arguments must be a JSON array of strings.'); }
      }
      const refresh = React.useCallback(async () => {
        if (!service) { setError('Manager remote service unavailable. Configuration is read-only.'); return; }
        setBusy(true);
        try { setState(await service.snapshot()); setError(''); }
        catch { setError('Could not load manager metadata.'); }
        finally { setBusy(false); }
      }, [service]);
      React.useEffect(() => { void refresh(); }, [refresh]);
      async function toggle(kind, serverName, enabled) {
        setBusy(true);
        try {
          const result = await service.setEnabled({ kind, ...(serverName ? { serverName } : {}), enabled });
          if (!result.ok) { setError(refusal(result)); return; }
          setState(result.state); setError('');
        } catch { setError('Change refused. The active owned root configuration must be available.'); }
        finally { setBusy(false); }
      }
      async function probe(serverName) {
        setBusy(true);
        try {
          const result = await change('probeServer', { serverName });
          if (!result.ok) { setError(refusal(result)); return; }
          setState(result.state); setError('');
        } catch { setError('Change refused. The active owned root configuration must be available.'); }
        finally { setBusy(false); }
      }
      function statusLabel(server) {
        const labels = { configured: 'saved', 'activation-failed': 'error' };
        return labels[server.status] ?? server.status;
      }
      const button = (label, onClick, disabled = false) => h('button', { type: 'button', onClick, disabled: busy || disabled }, label);
      return h('section', { className: 'dsm-managers', 'aria-label': `${title} manager`, style: { font: 'inherit', color: 'var(--dsw-alias-label-primary)', padding: '16px', background: 'var(--dsw-alias-bg-layer-1)', borderRadius: 'var(--dsw-radius-lg)', border: '1px solid var(--dsw-alias-border-l2)' } },
        h('h2', null, title),
        h('p', null, 'Disabled by default. Mounted means plugin activation completed, not that a server is connected. Changes require a verified owned root configuration.'),
        button('Refresh', refresh),
        error && h('p', { role: 'alert' }, error),
        !state ? h('p', { role: 'status' }, 'No manager metadata available.') : !isHooks ? h('div', null,
          button('Add server', () => editServer(), !state.writable),
          draft && h('form', { onSubmit: saveServer, 'aria-label': 'Server configuration' },
            field('Server name', 'serverName', 'text', 32),
            h('label', null, 'Transport', h('select', { 'aria-label': 'Transport', value: draft.transport, disabled: busy || !state.writable, onChange: event => setDraft({ ...draft, transport: event.target.value }) }, h('option', { value: 'stdio' }, 'stdio'), h('option', { value: 'streamable-http' }, 'streamable-http'))),
            draft.transport === 'stdio' ? h('div', null, field('Command', 'command', 'text', 1024), field('Arguments (JSON array)', 'args', 'text', 65536), field('Working directory (optional)', 'cwd')) : field('URL', 'url'),
            h('p', null, 'Existing environment and headers are retained. Transport changes with stored credentials are refused.'),
            h('button', { type: 'submit', disabled: busy || !state.writable }, 'Save server'), button('Cancel', () => setDraft(null))),
          !state.servers.length && h('p', null, 'No servers configured.'),
          state.servers.map(server => h('div', { key: server.serverName },
            h('strong', null, server.serverName), ` · ${server.transport} · ${statusLabel(server)} · ${server.enabled ? 'enabled' : 'disabled'} `,
            h('span', null, `Stored environment: ${server.envCount || 0}; headers: ${server.headerCount || 0}. `),
            button('Edit ' + server.serverName, () => editServer(server), !state.writable),
            button('Delete ' + server.serverName, () => setConfirmDelete(server.serverName), !state.writable),
            confirmDelete === server.serverName && h('div', { role: 'alert' }, 'Delete this server and its stored credentials?', button('Confirm delete', () => change('removeServer', { serverName: server.serverName }), !state.writable), button('Cancel delete', () => setConfirmDelete(''))),
            button(server.enabled ? 'Disable' : 'Enable', () => toggle('server', server.serverName, !server.enabled), !state.writable),
            button('Test connection', () => probe(server.serverName), !state.writable || server.status === 'probing')))) : h('div', null,
          h('p', null, `Policy: ${state.hooks.status} · ${state.hooks.enabled ? 'enabled' : 'disabled'}`),
          button(state.hooks.enabled ? 'Disable hooks' : 'Enable hooks', () => toggle('hooks', undefined, !state.hooks.enabled), !state.writable),
          button('Edit hook policies', () => setDraft({ deny: state.hooks.deny.join('\n'), audit: state.hooks.audit, auditLimit: String(state.hooks.auditLimit || 100) }), !state.writable),
          draft && h('form', { 'aria-label': 'Hook policies', onSubmit: event => { event.preventDefault(); return change('updateHooks', { enabled: state.hooks.enabled, deny: draft.deny.split('\n').map(line => line.trim()).filter(Boolean), audit: draft.audit === true, auditLimit: Number(draft.auditLimit) }); } },
            h('label', null, 'Deny wildcard rules (one per line)', h('textarea', { 'aria-label': 'Deny wildcard rules', maxLength: 8256, value: draft.deny, disabled: busy || !state.writable, onChange: event => setDraft({ ...draft, deny: event.target.value }) })),
            h('label', null, 'Audit enabled', h('input', { type: 'checkbox', 'aria-label': 'Audit enabled', checked: draft.audit === true, disabled: busy || !state.writable, onChange: event => setDraft({ ...draft, audit: event.target.checked }) })),
            field('Audit event limit (1–200)', 'auditLimit', 'number', 3),
            h('button', { type: 'submit', disabled: busy || !state.writable }, 'Save policies'), button('Cancel', () => setDraft(null))),
          h('p', null, 'Deny patterns: ' + (state.hooks.deny.join(', ') || 'none')),
          h('p', null, `Audit: ${state.hooks.audit ? 'enabled' : 'disabled'}; retained events: ${state.hooks.events.length}; limit: ${state.hooks.auditLimit || 100}`),
          h('p', null, 'Audit is observe-only; only timestamp, validated tool name, and event kind are retained.'),
          h('ul', null, state.hooks.events.map((event, index) => h('li', { key: index }, `${new Date(event.time).toLocaleTimeString()} · ${event.tool} · ${event.event}`)))),
        h('p', null, 'Manage server launch fields and hook policies here. Launch command, arguments and URL are owner-visible; do not put credentials there. Environment and header values are never requested or displayed and are preserved on edits.'));
    }
    const localService = {
      async snapshot() {
        const response = await fetch('/api/dsh-majed/managers', { cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) throw new Error('Unavailable.');
        return response.json();
      },
      async request(action, input) {
        const response = await fetch('/api/dsh-majed/managers', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-dsh-majed-manager': '1' }, body: JSON.stringify({ action, input }) });
        const result = await response.json();
        if (!response.ok) {
          // Never propagate server messages or arbitrary dependency codes.
          if (result?.ok === false && safeCodes.has(result.code)) return { ok: false, code: result.code, reason: result.reason };
          throw new Error('Refused.');
        }
        return result;
      },
      setEnabled(input) { return this.request('setEnabled', input); },
      upsertServer(input) { return this.request('upsertServer', input); },
      removeServer(input) { return this.request('removeServer', input); },
      updateHooks(input) { return this.request('updateHooks', input); },
      probeServer(input) { return this.request('probeServer', input); },
    };
    function apply(ctx, options = {}) {
      const service = options.service || localService;
      // Match the bundled Skills Manager's native sidebar section contract.
      for (const [kind, label, order] of [['mcp', 'MCPs', 30], ['hooks', 'Hooks', 35]]) {
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section', id: `majed-${kind}`, order, label: () => label,
        }, () => h(ManagersPanel, { service, kind })));
      }
    }
    return { apply, ManagersPanel };
  }
});
