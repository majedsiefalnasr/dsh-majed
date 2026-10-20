/*
 * dsh-majed — Majed's DeepSeek Harness toolkit (client half).
 *
 * Nothing in DSH itself is modified: every feature below is added by this plugin
 * through public client extension points (slots + injected <style>/observers)
 * and is fully removed again when the plugin is disabled.
 *
 * Features
 *  1. Settings > General > "Bidirectional text"  (toggle)
 *       - per-paragraph direction for Arabic / Persian / Hebrew in chat,
 *         reasoning, tool cells, question boxes, user bubbles
 *         (replaces dsh-persian-rtl; CSS/logic adapted from it, MIT)
 *       - mirroring of @changfenhuang/dsh-genui components
 *  2. Settings > General > "App UI font size"   (px stepper, right after the chat font size)
 *  3. Settings > General > "App font"           (dropdown: DSH default / System font)
 *  4. Settings > General > "System notifications" (+ on completion / when action needed)
 *     Native desktop notifications driven by DSH's session status; click opens the session.
 */
window.__ModuleLoader__.load({
  id: 'dsh-majed',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    let primitives = {};
    try { primitives = require('@deepseek-ai/dsh-client-ui-primitives') || {}; } catch (_) {}

    // ───────────────────────── own settings store (localStorage) ─────────────
    const STORE_KEY = 'dsh-majed:settings:v1';
    // App UI font size is a px number like the chat font size (DSH chrome is designed at 14px).
    const UI_BASE_PX = 14, UI_MIN_PX = 11, UI_MAX_PX = 20;
    const DEFAULTS = { bidi: true, uiFontSize: UI_BASE_PX, fontSource: 'dsh', notifyMode: 'background', notifyDone: true, notifyAction: true };
    const NOTIFY_MODES = ['off', 'background', 'always'];
    const FONT_SOURCES = ['dsh', 'system'];
    const listeners = new Set();
    let state = (() => {
      try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; }
      catch (_) { return { ...DEFAULTS }; }
    })();
    const clampPx = (v) => Math.min(UI_MAX_PX, Math.max(UI_MIN_PX, Math.round(Number(v)) || UI_BASE_PX));
    state.uiFontSize = clampPx(state.uiFontSize);
    if (!FONT_SOURCES.includes(state.fontSource)) state.fontSource = 'dsh';
    if (!NOTIFY_MODES.includes(state.notifyMode)) state.notifyMode = 'background';
    const store = {
      get: () => state,
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      set(patch) {
        state = { ...state, ...patch };
        try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
        listeners.forEach((fn) => fn(state));
      },
    };
    const useSetting = (key) => React.useSyncExternalStore(store.subscribe, () => store.get()[key]);

    // ───────────────────────── dictionaries ─────────────────────────
    const NS = 'majed';
    const en = {
      'bidi.title': 'Bidirectional text',
      'bidi.description': 'Detects Arabic, Persian and Hebrew per paragraph and lays it out right-to-left (chat, reasoning, tools, GenUI components).',
      'size.title': 'App UI font size',
      'size.description': 'Font size of the app interface (sidebar, headers, composer, panels). The chat font size above is unchanged.',
      'size.increase': 'Increase app UI font size',
      'size.decrease': 'Decrease app UI font size',
      'size.unit': 'px',
      'font.title': 'App font',
      'font.description': 'Choose the typeface used by the app interface and chat text.',
      'font.dsh': 'DSH default',
      'font.system': 'System font',
      'notify.title': 'System notifications',
      'notify.description': 'Send a desktop notification when a session finishes or needs your attention.',
      'notify.off': 'Off',
      'notify.background': 'Only when app is in background',
      'notify.always': 'Always',
      'notify.test': 'Send test',
      'notify.testBody': 'Notifications are working.',
      'notify.done.title': 'Notify on completion',
      'notify.done.description': 'When a session finishes its work.',
      'notify.action.title': 'Notify when action is needed',
      'notify.action.description': 'When a session waits for an approval, a question, or a plan review.',
      'notify.msg.done': 'Finished — ready for review',
      'notify.msg.approval': 'Approval needed: {tool}',
      'notify.msg.approvalPlain': 'Approval needed',
      'notify.msg.question': 'Waiting for your answer',
      'notify.msg.plan': 'Plan ready for your review',
      'notify.session': 'Session',
    };
    const zh = {
      'bidi.title': '双向文本（RTL）',
      'bidi.description': '按段落识别阿拉伯语、波斯语、希伯来语并从右到左排版（对话、思考、工具、GenUI 组件）。',
      'size.title': '应用界面字号',
      'size.description': '应用界面（侧边栏、标题栏、输入框、面板）的字号，不影响上方的对话字号。',
      'size.increase': '增大应用界面字号',
      'size.decrease': '减小应用界面字号',
      'size.unit': 'px',
      'font.title': '应用字体',
      'font.description': '选择应用界面与对话文字使用的字体。',
      'font.dsh': 'DSH 默认',
      'font.system': '系统字体',
      'notify.title': '系统通知',
      'notify.description': '会话完成或需要你处理时发送桌面通知。',
      'notify.off': '关闭',
      'notify.background': '仅应用在后台时',
      'notify.always': '始终',
      'notify.test': '发送测试',
      'notify.testBody': '通知正常工作。',
      'notify.done.title': '完成时通知',
      'notify.done.description': '会话完成工作时。',
      'notify.action.title': '需要操作时通知',
      'notify.action.description': '会话等待审批、提问或计划审阅时。',
      'notify.msg.done': '已完成，等待查看',
      'notify.msg.approval': '需要审批：{tool}',
      'notify.msg.approvalPlain': '需要审批',
      'notify.msg.question': '等待你的回答',
      'notify.msg.plan': '计划待审阅',
      'notify.session': '会话',
    };

    // ───────────────────────── settings rows ─────────────────────────
    const ROW_CSS = `
.majed-row{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.majed-text{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
.majed-title{color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
.majed-desc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.majed-control{display:inline-flex;align-items:center;gap:8px}
.majed-stepper{display:inline-flex;align-items:center;justify-content:center;min-width:72px;height:36px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);position:relative}
.majed-value{min-width:30px;text-align:center;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
.majed-arrows{position:absolute;right:6px;display:flex;flex-direction:column;gap:2px;opacity:0}
.majed-stepper:hover .majed-arrows,.majed-stepper:focus-within .majed-arrows{opacity:1}
.majed-arrow{width:17px;height:12px;display:inline-flex;align-items:center;justify-content:center;border:none;padding:0;border-radius:var(--dsw-radius-xs);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 75%,transparent);color:var(--dsw-alias-label-primary);cursor:pointer;font-size:8px;line-height:1}
.majed-arrow:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1)}
.majed-arrow:disabled{color:var(--dsw-alias-label-caption);cursor:default}
.majed-unit{color:var(--dsw-alias-label-secondary);font-size:14px}
.majed-selector{display:inline-flex;align-items:center;gap:12px;height:36px;padding:0 14px;border:none;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;cursor:pointer}
.majed-selector:hover{background:var(--dsw-alias-interactive-bg-hover)}
.majed-chevron{flex:none}
.majed-test{height:36px;padding:0 12px;border:none;border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;cursor:pointer}
.majed-test:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.majed-test:disabled{opacity:.4;cursor:default}
`;

    function BidiRow({ t }) {
      const on = useSetting('bidi');
      const Switch = primitives.Switch;
      return h('div', { className: 'majed-row' },
        h('div', { className: 'majed-text' },
          h('div', { className: 'majed-title' }, t('bidi.title')),
          h('div', { className: 'majed-desc' }, t('bidi.description'))),
        Switch
          ? h(Switch, { checked: on, label: t('bidi.title'), onChange: (next) => store.set({ bidi: !!next }) })
          : h('input', { type: 'checkbox', checked: on, 'aria-label': t('bidi.title'), onChange: (e) => store.set({ bidi: e.target.checked }) }));
    }

    function UiFontSizeRow({ t }) {
      const size = useSetting('uiFontSize');
      const Up = primitives.IconChevronUpOutlineRegular, Down = primitives.IconChevronDownOutlineRegular;
      const set = (v) => store.set({ uiFontSize: clampPx(v) });
      return h('div', { className: 'majed-row' },
        h('div', { className: 'majed-text' },
          h('div', { className: 'majed-title' }, t('size.title')),
          h('div', { className: 'majed-desc' }, t('size.description'))),
        h('div', { className: 'majed-control' },
          h('div', { className: 'majed-stepper' },
            h('span', { className: 'majed-value' }, size),
            h('span', { className: 'majed-arrows' },
              h('button', { type: 'button', className: 'majed-arrow', 'aria-label': t('size.increase'), disabled: size >= UI_MAX_PX, onClick: () => set(size + 1) }, Up ? h(Up, { size: 9 }) : '▲'),
              h('button', { type: 'button', className: 'majed-arrow', 'aria-label': t('size.decrease'), disabled: size <= UI_MIN_PX, onClick: () => set(size - 1) }, Down ? h(Down, { size: 9 }) : '▼'))),
          h('span', { className: 'majed-unit' }, t('size.unit'))));
    }

    /** Same look as the built-in "Open chat links in" row: title/description + dropdown button. */
    function FontSourceRow({ t }) {
      const value = useSetting('fontSource');
      const [open, setOpen] = React.useState(false);
      const ref = React.useRef(null);
      const Menu = primitives.Menu, Chevron = primitives.IconChevronDownOutlineRegular;
      const close = () => setOpen(false);
      const selector = h('button', {
        ref, type: 'button', className: 'majed-selector', 'aria-haspopup': 'menu', 'aria-expanded': open,
        onClick: () => setOpen((v) => !v),
      }, t('font.' + value), Chevron ? h(Chevron, { className: 'majed-chevron' }) : '▾');
      return h('div', { className: 'majed-row' },
        h('div', { className: 'majed-text' },
          h('div', { className: 'majed-title' }, t('font.title')),
          h('div', { className: 'majed-desc' }, t('font.description'))),
        Menu
          ? h(Menu, {
              open, onClose: close, selectedId: value, align: 'end', portal: true, anchor: selector,
              items: FONT_SOURCES.map((id) => ({ id, label: t('font.' + id) })),
              onSelect: (id) => { ref.current && ref.current.focus({ preventScroll: true }); close(); store.set({ fontSource: id }); },
            })
          : h('select', { value, onChange: (e) => store.set({ fontSource: e.target.value }) },
              FONT_SOURCES.map((id) => h('option', { key: id, value: id }, t('font.' + id)))));
    }

    // ───────────────────────── generic rows (same look as built-in ones) ─────────────────────────
    function SelectRow({ title, description, value, options, onSelect, extra }) {
      const [open, setOpen] = React.useState(false);
      const ref = React.useRef(null);
      const Menu = primitives.Menu, Chevron = primitives.IconChevronDownOutlineRegular;
      const close = () => setOpen(false);
      const current = options.find((o) => o.id === value);
      const selector = h('button', {
        ref, type: 'button', className: 'majed-selector', 'aria-haspopup': 'menu', 'aria-expanded': open,
        onClick: () => setOpen((v) => !v),
      }, current ? current.label : value, Chevron ? h(Chevron, { className: 'majed-chevron' }) : '▾');
      return h('div', { className: 'majed-row' },
        h('div', { className: 'majed-text' },
          h('div', { className: 'majed-title' }, title),
          h('div', { className: 'majed-desc' }, description)),
        h('div', { className: 'majed-control' }, extra || null,
          Menu
            ? h(Menu, {
                open, onClose: close, selectedId: value, align: 'end', portal: true, anchor: selector, items: options,
                onSelect: (id) => { ref.current && ref.current.focus({ preventScroll: true }); close(); onSelect(id); },
              })
            : h('select', { value, onChange: (e) => onSelect(e.target.value) },
                options.map((o) => h('option', { key: o.id, value: o.id }, o.label)))));
    }
    function ToggleRow({ title, description, checked, onChange }) {
      const Switch = primitives.Switch;
      return h('div', { className: 'majed-row' },
        h('div', { className: 'majed-text' },
          h('div', { className: 'majed-title' }, title),
          h('div', { className: 'majed-desc' }, description)),
        Switch
          ? h(Switch, { checked, label: title, onChange: (n) => onChange(!!n) })
          : h('input', { type: 'checkbox', checked, 'aria-label': title, onChange: (e) => onChange(e.target.checked) }));
    }

    // ───────────────────────── system notifications ─────────────────────────
    let appCtx = null;
    const fmt = (str, vars) => String(str).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ''));

    async function ensurePermission() {
      if (typeof Notification === 'undefined') return false;
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'denied') return false;
      try { return (await Notification.requestPermission()) === 'granted'; } catch (_) { return false; }
    }
    function shouldNotify() {
      const mode = store.get().notifyMode;
      if (mode === 'off') return false;
      if (mode === 'always') return true;
      return document.hidden || !document.hasFocus();
    }
    const live = new Set();
    async function notify({ title, body, sessionId, tag }) {
      if (!(await ensurePermission())) return;
      try {
        const n = new Notification(title, { body, tag, renotify: true, silent: false });
        live.add(n);
        n.onclose = () => live.delete(n);
        n.onclick = () => {
          try { window.focus(); } catch (_) {}
          try { if (sessionId && appCtx && appCtx.uiWorkspace) appCtx.uiWorkspace.openSession(sessionId); } catch (_) {}
          n.close();
        };
      } catch (_) { /* notifications unavailable in this shell */ }
    }

    function describePending(p, t) {
      if (!p) return null;
      if (p.kind === 'plan-review') return { key: p.key, text: t('notify.msg.plan'), type: 'action' };
      if (p.questions) return { key: p.key, text: t('notify.msg.question'), type: 'action' };
      return { key: p.key || p.callId, type: 'action',
        text: p.toolName ? fmt(t('notify.msg.approval'), { tool: p.toolName }) : t('notify.msg.approvalPlain') };
    }

    /** Invisible root component: watches session status through the standard `useSessionStatus` hook. */
    function NotificationWatcher({ useSessionStatus, useSessions, t }) {
      const status = useSessionStatus((m) => m);
      const list = useSessions((l) => l);
      const prev = React.useRef(null);        // Map(sessionId -> { running, pendingKey })
      const t0 = React.useRef(new Map());     // sessionId -> run start
      React.useEffect(() => {
        const next = new Map();
        const titleOf = (id) => {
          const row = list && list.byId && list.byId[id];
          return (row && (row.title || row.name)) || t('notify.session');
        };
        for (const [id, st] of status) {
          const pending = describePending(st.pendingInteraction, t);
          next.set(id, { running: st.running === true, pendingKey: pending ? String(pending.key) : null });
          const before = prev.current && prev.current.get(id);
          if (!prev.current) continue;                                   // first snapshot = baseline
          const cfg = store.get();
          if (st.running === true && !(before && before.running)) t0.current.set(id, Date.now());
          if (pending && cfg.notifyAction && (!before || before.pendingKey !== String(pending.key)) && shouldNotify()) {
            notify({ title: titleOf(id), body: pending.text, sessionId: id, tag: `${id}:action` });
          } else if (before && before.running && st.running === false && !pending && cfg.notifyDone && shouldNotify()) {
            notify({ title: titleOf(id), body: t('notify.msg.done'), sessionId: id, tag: `${id}:done` });
          }
        }
        prev.current = next;
      }, [status, list, t]);
      return null;
    }

    function NotifyModeRow({ t }) {
      const mode = useSetting('notifyMode');
      const options = NOTIFY_MODES.map((id) => ({ id, label: t('notify.' + id) }));
      const test = h('button', {
        type: 'button', className: 'majed-test', disabled: mode === 'off',
        onClick: () => notify({ title: 'DeepSeek Harness', body: t('notify.testBody'), tag: 'majed:test' }),
      }, t('notify.test'));
      return h(SelectRow, {
        title: t('notify.title'), description: t('notify.description'), value: mode, options, extra: test,
        onSelect: (id) => { store.set({ notifyMode: id }); if (id !== 'off') ensurePermission(); },
      });
    }
    function NotifyDoneRow({ t }) {
      const on = useSetting('notifyDone');
      return h(ToggleRow, { title: t('notify.done.title'), description: t('notify.done.description'), checked: on, onChange: (v) => store.set({ notifyDone: v }) });
    }
    function NotifyActionRow({ t }) {
      const on = useSetting('notifyAction');
      return h(ToggleRow, { title: t('notify.action.title'), description: t('notify.action.description'), checked: on, onChange: (v) => store.set({ notifyAction: v }) });
    }

    // ───────────────────────── app-UI font size + font source ─────────────────────────
    // Only TEXT grows: we read DSH's own stylesheets (<style data-plugin-css>) and, for every
    // rule that sets a px font-size / line-height, emit an override
    //   calc(<original px> * var(--majed-ui-k))      (k = chosen size / 14)
    // so spacing, icons and borders are untouched. Chat transcript sheets are skipped because
    // the built-in "chat font size" already drives them.
    const SKIP_SHEETS = /(AssistantMarkdown|MessageItem|ChatView|ToolDetails|ToolRow|bash-sample|FileDiff|TextPreview|TrajectoryTable|stat-dialog)\.module\.css$/;
    const PX = /^(-?\d*\.?\d+)px$/;
    // Sizes tied to DSH's chat-size variables (e.g. the shared Menu item) scale as well: calc((expr) * k).
    const CONTENT_VAR = /^(?:var|calc)\(.*--dsh-content-font-size.*\)$/;
    const scaled = (v) => {
      const t = String(v).trim().replace(/\s*!important$/, '');
      const m = PX.exec(t);
      if (m) return `calc(${m[1]}px * var(--majed-ui-k))`;
      return CONTENT_VAR.test(t) ? `calc((${t}) * var(--majed-ui-k))` : null;
    };
    // `font: [style] [weight] <size>[/<line-height>] <family>` — pull out a px size / px line-height.
    const FONT_SHORTHAND = /^(.*?)(?:^|\s)(-?\d*\.?\d+px)(?:\s*\/\s*(-?\d*\.?\d+px|[\d.]+|normal))?\s+(\S.*)$/;

    function declFor(style) {
      let fs = scaled(style.getPropertyValue('font-size'));
      let lh = scaled(style.getPropertyValue('line-height'));
      const sh = style.getPropertyValue('font');
      if (sh && !fs) {                       // shorthand carries size (+ optional line-height)
        const m = FONT_SHORTHAND.exec(sh.trim());
        if (m) { fs = scaled(m[2]); if (m[3] && PX.test(m[3])) lh = lh || scaled(m[3]); }
      }
      return (fs ? `font-size:${fs}!important;` : '') + (lh ? `line-height:${lh}!important;` : '');
    }
    function overridesFromRules(rules, wrap, out) {
      for (const rule of rules) {
        if (rule.type === 1 /* STYLE */) {
          const decl = declFor(rule.style);
          if (decl) out.push(wrap(`${rule.selectorText}{${decl}}`));
        } else if (rule.type === 4 /* MEDIA */) {
          const cond = rule.conditionText || rule.media.mediaText;
          overridesFromRules(rule.cssRules, (t) => wrap(`@media ${cond}{${t}}`), out);
        } else if (rule.type === 12 /* SUPPORTS */) {
          overridesFromRules(rule.cssRules, (t) => wrap(`@supports ${rule.conditionText}{${t}}`), out);
        }
      }
    }
    // Chat-transcript sheets are skipped (the built-in chat font size drives them).
    // Plugin sheets are <style data-plugin-css>; the app shell and shared primitives (Menu, popovers,
    // account menu...) live in <link rel=stylesheet> bundles, so those are scanned too.
    function isOwnStyle(el) { return el.hasAttribute('data-majed-appearance') || el.hasAttribute('data-majed-ui-font') || el.hasAttribute('data-majed-bidi') || el.hasAttribute('data-majed-settings'); }
    function sheetEligible(el) {
      if (!el.sheet || isOwnStyle(el)) return false;
      if (el.tagName === 'STYLE' && el.hasAttribute('data-plugin-css')) return !SKIP_SHEETS.test(el.dataset.pluginCss || '');
      if (el.tagName === 'LINK') return true;
      return false;
    }
    function buildFontSizeOverrides() {
      const out = [];
      document.querySelectorAll('style[data-plugin-css], link[rel~="stylesheet"]').forEach((el) => {
        if (!sheetEligible(el)) return;
        try { overridesFromRules(el.sheet.cssRules, (t) => t, out); } catch (_) { /* cross-origin sheet */ }
      });
      return out.join('\n');
    }

    const SYSTEM_FONT_STACK = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    // Variables that carry the UI typeface. DSH defines --dsw-font-family on <body> itself, and skins
    // such as dsh-claude-style redefine it (and their own --dsh-claude-font-*) with higher specificity,
    // so a stylesheet rule can lose. Inline `!important` on <body> beats every stylesheet rule, and
    // because the markdown/typography tokens are also defined on <body>, they pick the value up too.
    const FONT_VARS = [
      '--dsw-font-family', '--dsw-font-family-brand', '--dsh-font-family-text-default',
      '--dsh-claude-font-serif', '--dsh-claude-font-prose', '--dsh-claude-font-brand',
    ];
    function applyFontFamily(s) {
      const style = document.body && document.body.style;
      if (!style) return;
      for (const name of FONT_VARS) {
        if (s.fontSource === 'system') {
          if (style.getPropertyValue(name) !== SYSTEM_FONT_STACK || style.getPropertyPriority(name) !== 'important') {
            style.setProperty(name, SYSTEM_FONT_STACK, 'important');
          }
        } else if (style.getPropertyPriority(name) === 'important' && style.getPropertyValue(name) === SYSTEM_FONT_STACK) {
          style.removeProperty(name);
        }
      }
    }

    // ───────────────────────── RTL: persian-rtl chat CSS + genui mirroring ───
    const CHAT_CSS = `
/* dsh-persian-rtl: automatic per-paragraph direction for Persian text.
   unicode-bidi: plaintext makes EACH paragraph follow its own first strong
   character: Persian paragraphs go RTL, English ones stay LTR.
   Covered surfaces:
   - assistant answers, incl. while streaming (assistant-step)
   - thinking/reasoning cells (turn-process members + inline reasoning)
   - tool-call / tool-result cells (any data-tool row incl. ask_user_question)
   - question boxes + plan-review cards (composer takeover cards)
   - user + steering message bubbles (incl. submit echoes)
   Plus logical-geometry fixes (lists, blockquotes, task checkboxes) so RTL
   paragraphs also get correctly-sided bullets, quote bars and gaps. */
/* A. Prose blocks: per-paragraph direction, logical alignment. */
[data-chat-flow-kind="assistant-step"] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-chat-flow-kind="tool-call"] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-chat-flow-kind="tool-result"] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-chat-flow-kind="reasoning"] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-turn-process-member] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-turn-process-inline] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-tool] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-question-key] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary, span),
[data-plan-review-key] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary, span),
[data-question-key],
[data-plan-review-key] {
  unicode-bidi: plaintext;
  text-align: start;
}
/* Option buttons ship text-align:left (physical): Persian labels would stick
   to the left. Scoped to the radiogroup/group options so footer/action
   buttons keep their own alignment. */
[data-question-key] :is([role="radiogroup"], [role="group"]) button {
  text-align: start;
}
/* B. User + steering bubbles: plain-text content lives directly in nested
   divs (no <p>), so the direction must be set on the divs themselves.
   Includes composer submit echoes, which reuse the same bubble outside
   the chat flow. Flex layout is untouched (text-align only aligns inline
   content; row/stack alignment stays with align-items). */
[data-chat-flow-kind="user"] :is(div),
[data-chat-flow-kind="steering"] :is(div),
[data-submission-echo],
[data-submission-echo] :is(div),
[data-pending-steering],
[data-pending-steering] :is(div) {
  unicode-bidi: plaintext;
  text-align: start;
}
/* C. Latin runs (code, keys) keep LTR order inside Persian text; links are
   isolated so surrounding punctuation does not jump, while Persian link
   text still follows its paragraph. */
[data-chat-flow-kind="assistant-step"] :is(pre, code, kbd, samp),
[data-chat-flow-kind="tool-call"] :is(pre, code, kbd, samp),
[data-chat-flow-kind="tool-result"] :is(pre, code, kbd, samp),
[data-chat-flow-kind="reasoning"] :is(pre, code, kbd, samp),
[data-turn-process-member] :is(pre, code, kbd, samp),
[data-turn-process-inline] :is(pre, code, kbd, samp),
[data-tool] :is(pre, code, kbd, samp),
[data-question-key] :is(pre, code, kbd, samp),
[data-plan-review-key] :is(pre, code, kbd, samp) {
  direction: ltr;
  unicode-bidi: isolate;
}
[data-chat-flow-kind="assistant-step"] :is(a),
[data-chat-flow-kind="tool-call"] :is(a),
[data-chat-flow-kind="tool-result"] :is(a),
[data-chat-flow-kind="reasoning"] :is(a),
[data-turn-process-member] :is(a),
[data-turn-process-inline] :is(a),
[data-tool] :is(a),
[data-question-key] :is(a),
[data-plan-review-key] :is(a) {
  unicode-bidi: isolate;
}
[data-chat-flow-kind="assistant-step"] :is(pre),
[data-chat-flow-kind="tool-call"] :is(pre),
[data-chat-flow-kind="tool-result"] :is(pre),
[data-turn-process-member] :is(pre),
[data-turn-process-inline] :is(pre),
[data-tool] :is(pre),
[data-question-key] :is(pre),
[data-plan-review-key] :is(pre) {
  text-align: left;
}
/* D. Logical geometry: shipped sheets use physical left padding/border for
   lists, blockquotes and task checkboxes, which puts RTL bullets, quote
   bars and gaps on the wrong side. Swap to inline-start equivalents. */
[data-chat-flow-kind="assistant-step"] :is(ul, ol),
[data-chat-flow-kind="tool-call"] :is(ul, ol),
[data-chat-flow-kind="tool-result"] :is(ul, ol),
[data-turn-process-member] :is(ul, ol),
[data-turn-process-inline] :is(ul, ol),
[data-tool] :is(ul, ol),
[data-question-key] :is(ul, ol),
[data-plan-review-key] :is(ul, ol) {
  padding-left: 0;
  padding-inline-start: 18px;
}
[data-chat-flow-kind="assistant-step"] :is(ul, ol) :is(ol),
[data-chat-flow-kind="tool-call"] :is(ul, ol) :is(ol),
[data-chat-flow-kind="tool-result"] :is(ul, ol) :is(ol),
[data-turn-process-member] :is(ul, ol) :is(ol),
[data-turn-process-inline] :is(ul, ol) :is(ol),
[data-tool] :is(ul, ol) :is(ol),
[data-question-key] :is(ul, ol) :is(ol),
[data-plan-review-key] :is(ul, ol) :is(ol) {
  padding-inline-start: 0;
}
[data-chat-flow-kind="assistant-step"] :is(blockquote),
[data-chat-flow-kind="tool-call"] :is(blockquote),
[data-chat-flow-kind="tool-result"] :is(blockquote),
[data-turn-process-member] :is(blockquote),
[data-turn-process-inline] :is(blockquote),
[data-tool] :is(blockquote),
[data-question-key] :is(blockquote),
[data-plan-review-key] :is(blockquote) {
  border-left: 0 !important;
  padding-left: 0 !important;
  border-inline-start: 2px solid var(--dsw-alias-label-caption);
  padding-inline-start: 14px;
}
[data-chat-flow-kind="assistant-step"] :is(input[type="checkbox"]),
[data-tool] :is(input[type="checkbox"]),
[data-question-key] :is(input[type="checkbox"]),
[data-plan-review-key] :is(input[type="checkbox"]) {
  margin: 0 !important;
  margin-inline-end: 8px !important;
}
/* E. Detected RTL: elements marked with data-dsh-rtl / dir="rtl".
   Overrides unicode-bidi: plaintext so that paragraphs starting with Latin
   words (e.g. "React یک کتابخانه است") are strictly resolved as RTL base
   direction instead of being treated as LTR by first-strong-character rules. */
[data-dsh-rtl],
:is(p, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary, div)[data-dsh-rtl],
:is(p, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary, div)[dir="rtl"] {
  direction: rtl !important;
  unicode-bidi: isolate !important;
  text-align: start !important;
}
`;

    // GenUI ships CSS-module classes (hash_name). We match by the stable name part.
    const c = (...names) =>
      ':is(' + names.map((n) => `[class$="_${n}"],[class*="_${n} "]`).join(',') + ')';
    const R = '[data-genui-rtl]';

    const GENUI_CSS = `
/* dsh-genui-rtl: mirrors @changfenhuang/dsh-genui components when a block is RTL.
   A block gets [data-genui-rtl] + dir="rtl" from the client script when its text is mostly RTL. */

/* 1. Physical text-align -> logical */
${R} :is(${[
      'thNum', 'tdNum', 'hbarLabel', 'hbarValue', 'cellBarText', 'sliderValue',
    ].map((n) => c(n)).join(',')}) { text-align: end; }
${R} :is(${[
      'thSort', 'detailToggle', 'accHead', 'quizOpt', 'quizOptCorrect', 'quizOptWrong',
      'quizOptReveal', 'ftNameBtn',
    ].map((n) => c(n)).join(',')}) { text-align: start; }
${R} ${c('thNum')} ${c('thSort')} { text-align: end; }
${R} table th, ${R} table td { text-align: start; }
${R} table th${c('thNum')}, ${R} table td${c('tdNum')} { text-align: end; }

/* 2. Lists: dot + padding */
${R} ${c('li')} { padding: 9px 16px 9px var(--dsl-g-gap-xs); }
${R} ${c('li')}::before { left: auto; right: 2px; }

/* 3. Steps connector */
${R} ${c('step')}:not(:last-child)::before { left: auto; right: 11px; }

/* 4. Stat cards: divider border */
${R} ${c('grid')} > ${c('stat')}, ${R} ${c('row')} > ${c('stat')} {
  border-left-color: var(--dsl-g-border-surface);
  border-right-color: var(--dsl-g-border);
}

/* 5. margin-left:auto -> push to the end side */
${R} :is(${['heroSpark', 'tlTime', 'panelChevron'].map((n) => c(n)).join(',')}) {
  margin-left: 0; margin-right: auto;
}
${R} :is(${['btnSent'].map((n) => c(n)).join(',')}) { margin-left: 0; margin-right: var(--dsl-g-gap-sm); }
${R} ${c('detailToggle')} { margin-right: 0; margin-left: 4px; }
${R} ${c('groupToggle')} { margin-right: 0; margin-left: 7px; }
${R} ${c('panelClose')} { margin-right: 0; margin-left: 8px; }
${R} ${c('panelTpl')} { margin-right: 0; margin-left: 4px; }
${R} ${c('detailCell')} { padding-left: 0; padding-right: var(--dsl-g-gap-sm); }
${R} ${c('detailBody')} { box-shadow: inset -2px 0 0 color-mix(in srgb, var(--dsl-g-accent) 45%, transparent); }

/* 6. Grouped table children guide rail */
${R} tbody tr${c('groupChild')} td:first-child { padding-left: var(--dsl-g-gap-md); padding-right: calc(var(--dsl-g-gap-md) + 22px); }
${R} tbody tr${c('groupChild')} td:first-child::before { left: auto; right: calc(var(--dsl-g-gap-md) + 8px); }

/* 7. Switch knob */
${R} ${c('switchKnob')} { left: auto; right: 3px; transition: right var(--dsl-g-dur-fast); }
${R} ${c('switchOn')} ${c('switchKnob')} { left: auto; right: 19px; }

/* 8. Chevrons point toward the reading direction */
${R} :is(${['accChevron', 'detailChevron', 'groupChevron', 'ftChevron'].map((n) => c(n)).join(',')}):not([data-open="true"]) {
  transform: scaleX(-1);
}

/* 9. Progress target marker + file tree (inline left -> mirrored via vars set by script) */
${R} ${c('targetMark')} { left: auto !important; right: var(--dsh-rtl-start, 0); margin-left: 0; margin-right: -1px; }
${R} ${c('ftRow')} { padding-left: 4px !important; padding-right: var(--dsh-rtl-start, 4px) !important; }
${R} ${c('ftGuide')} { left: auto !important; right: var(--dsh-rtl-start, 0); }

/* 10. Panel + fixed toasts */
[data-genui-achievement-toasts] { right: auto; left: 16px; }

/* 11. Content that must stay geometrically LTR: charts, diagrams, 3D, math, code. */
${R} :is([data-genui-chart], [data-genui-line], [data-genui-donut], [data-genui-echart],
  [data-genui-mermaid], [data-genui-scene3d], [data-genui-scene], [data-genui-plot],
  [data-genui-svg], [data-genui-svg-fence], [data-genui-diagram], svg, canvas) {
  direction: ltr;
}
${R} :is([data-genui-chart], [data-genui-line], [data-genui-donut], [data-genui-echart],
  [data-genui-plot], [data-genui-diagram]) :is(span, div, text, p) { unicode-bidi: plaintext; }
${R} :is(pre, code, kbd, samp, ${c('copyChip')}) { direction: ltr; unicode-bidi: isolate; text-align: left; }
${R} :is(input[type="text"], input[type="number"], input[type="email"], input[type="url"], textarea) {
  unicode-bidi: plaintext; text-align: start;
}
`;


    const PROSE_SELECTOR = 'p, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary, [data-question-key] span, [data-plan-review-key] span';
    const USER_BUBBLE_CONTAINERS = '[data-chat-flow-kind="user"], [data-chat-flow-kind="steering"], [data-submission-echo], [data-pending-steering]';

    function updateElementDirection(el) {
      if (!el || el.nodeType !== 1) return;
      if (el.tagName === 'PRE' || el.tagName === 'CODE' || el.tagName === 'KBD' || el.tagName === 'SAMP') return;
      if (el.closest('pre, code, kbd, samp')) return;

      const isRtl = checkRtl(el.textContent);
      const hadRtl = el.hasAttribute('data-dsh-rtl');

      if (isRtl && !hadRtl) {
        el.setAttribute('data-dsh-rtl', '');
        el.setAttribute('dir', 'rtl');
      } else if (!isRtl && hadRtl) {
        el.removeAttribute('data-dsh-rtl');
        el.removeAttribute('dir');
      }
    }

    function findTargets(node, set) {
      if (!node || node.nodeType !== 1) return;
      if (node.tagName === 'PRE' || node.tagName === 'CODE' || node.tagName === 'KBD' || node.tagName === 'SAMP') return;
      if (node.closest('pre, code, kbd, samp')) return;

      if (node.matches(PROSE_SELECTOR)) {
        set.add(node);
      } else {
        const ancestor = node.closest(PROSE_SELECTOR);
        if (ancestor && !ancestor.closest('pre, code, kbd, samp')) {
          set.add(ancestor);
        }
      }

      const children = node.querySelectorAll(PROSE_SELECTOR);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!child.closest('pre, code, kbd, samp')) {
          set.add(child);
        }
      }

      const bubble = node.closest(USER_BUBBLE_CONTAINERS);
      if (bubble) {
        const divs = bubble.querySelectorAll('div');
        for (let i = 0; i < divs.length; i++) {
          const d = divs[i];
          if (!d.querySelector('div, p, ul, ol') && d.textContent.trim()) {
            set.add(d);
          }
        }
      } else {
        const nestedBubbles = node.querySelectorAll(USER_BUBBLE_CONTAINERS);
        for (let i = 0; i < nestedBubbles.length; i++) {
          const divs = nestedBubbles[i].querySelectorAll('div');
          for (let j = 0; j < divs.length; j++) {
            const d = divs[j];
            if (!d.querySelector('div, p, ul, ol') && d.textContent.trim()) {
              set.add(d);
            }
          }
        }
      }
    }


    // genui detector
    const ROOT_SEL = '[data-genui], [data-genui-plot], [data-genui-panel], [data-genui-tool]';

    function genuiTextOf(root) {
      // Ignore code blocks so a Persian answer with long code is still RTL.
      let t = '';
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          const p = n.parentElement;
          return p && p.closest('pre, code, script, style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        },
      });
      while (w.nextNode()) t += w.currentNode.nodeValue + ' ';
      return t;
    }

    function parseStart(el) {
      // Original inline physical offset (left / padding-left / left %) that we mirror to the end side.
      const s = el.style;
      const v = s.left || s.paddingLeft;
      return v || '';
    }

    function genuiSyncVars(root, on) {
      const sel = `${c('targetMark')}, ${c('ftRow')}, ${c('ftGuide')}`;
      root.querySelectorAll(sel).forEach((el) => {
        if (!on) { el.style.removeProperty('--dsh-rtl-start'); return; }
        // Cache the original value: after our CSS runs, React still keeps the inline original.
        const v = parseStart(el);
        if (v) el.style.setProperty('--dsh-rtl-start', v);
      });
    }

    function updateGenui(root) {
      if (!root.isConnected) return;
      const on = isRtlText(genuiTextOf(root));
      const has = root.hasAttribute('data-genui-rtl');
      if (on && !has) {
        root.setAttribute('data-genui-rtl', '');
        root.setAttribute('dir', 'rtl');
        root.setAttribute('data-genui-rtl-dir', '1');
      } else if (!on && has) {
        root.removeAttribute('data-genui-rtl');
        if (root.hasAttribute('data-genui-rtl-dir')) {
          root.removeAttribute('dir');
          root.removeAttribute('data-genui-rtl-dir');
        }
      }
      genuiSyncVars(root, on);
    }


    const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
    const LTR_RE = /[a-zA-Z\u00C0-\u024F]/g;
    function isRtlText(text) {
      if (!text) return false;
      const rtl = text.match(RTL_RE);
      if (!rtl) return false;
      const ltr = text.match(LTR_RE);
      return rtl.length / (rtl.length + (ltr ? ltr.length : 0)) >= 0.2;
    }

    const checkRtl = isRtlText;

    /** Start the bidi engine; returns a stop() that removes every trace. */
    function startBidi() {
      const style = document.createElement('style');
      style.setAttribute('data-majed-bidi', '');
      style.textContent = CHAT_CSS + GENUI_CSS;
      document.head.appendChild(style);

      const chatQueue = new Set();
      const genuiQueue = new Set();
      let raf = null;
      const flush = () => {
        raf = null;
        for (const el of chatQueue) if (el.isConnected) updateElementDirection(el);
        chatQueue.clear();
        for (const el of genuiQueue) updateGenui(el);
        genuiQueue.clear();
      };
      const schedule = () => { if (raf === null) raf = requestAnimationFrame(flush); };
      const GENUI_ROOTS = '[data-genui], [data-genui-plot], [data-genui-panel], [data-genui-tool]';
      const collectGenui = (node) => {
        const el = node.nodeType === 1 ? node : node.parentElement;
        if (!el) return;
        const up = el.closest(GENUI_ROOTS);
        if (up) genuiQueue.add(up);
        if (node.nodeType === 1) node.querySelectorAll(GENUI_ROOTS).forEach((r) => genuiQueue.add(r));
      };
      const observer = new MutationObserver((records) => {
        for (const r of records) {
          if (r.type === 'characterData') {
            const parent = r.target.parentElement;
            if (parent) { findTargets(parent, chatQueue); collectGenui(parent); }
          } else if (r.type === 'childList') {
            r.addedNodes.forEach((n) => {
              if (n.nodeType === 1) { findTargets(n, chatQueue); collectGenui(n); }
              else if (n.nodeType === 3 && n.parentElement) { findTargets(n.parentElement, chatQueue); collectGenui(n.parentElement); }
            });
            if (r.target.nodeType === 1) collectGenui(r.target);
          }
        }
        if (chatQueue.size || genuiQueue.size) schedule();
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      findTargets(document.body, chatQueue);
      document.querySelectorAll(GENUI_ROOTS).forEach((r) => genuiQueue.add(r));
      flush();

      return () => {
        observer.disconnect();
        if (raf !== null) cancelAnimationFrame(raf);
        chatQueue.clear(); genuiQueue.clear();
        document.querySelectorAll('[data-dsh-rtl]').forEach((el) => { el.removeAttribute('data-dsh-rtl'); el.removeAttribute('dir'); });
        document.querySelectorAll('[data-genui-rtl]').forEach((el) => {
          el.removeAttribute('data-genui-rtl');
          if (el.hasAttribute('data-genui-rtl-dir')) { el.removeAttribute('dir'); el.removeAttribute('data-genui-rtl-dir'); }
        });
        document.querySelectorAll('[style*="--dsh-rtl-start"]').forEach((el) => el.style.removeProperty('--dsh-rtl-start'));
        style.remove();
      };
    }

    // ───────────────────────── plugin entry ─────────────────────────
    return {
      inject: ['slots', 'locale', 'uiWorkspace'],
      apply(ctx) {
        appCtx = ctx;
        ctx.effect(() => () => { appCtx = null; live.forEach((n) => { try { n.close(); } catch (_) {} }); live.clear(); }, 'dsh-majed: notification cleanup');
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-majed: dictionaries');

        ctx.effect(() => {
          const style = document.createElement('style');
          style.setAttribute('data-majed-settings', '');
          style.textContent = ROW_CSS;
          document.head.appendChild(style);
          return () => style.remove();
        }, 'dsh-majed: settings row styles');

        // Settings > General rows (same slot the built-in rows use).
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
          name: 'settings.general.item', id: 'majed-ui-font-size', order: 11.5, locale: NS,
        }, UiFontSizeRow));
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
          name: 'settings.general.item', id: 'majed-font-source', order: 11.6, locale: NS,
        }, FontSourceRow));
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
          name: 'settings.general.item', id: 'majed-bidi', order: 13, locale: NS,
        }, BidiRow));

        ctx.slots.inject('settings.general.item', () => ctx.slots.register({ name: 'settings.general.item', id: 'majed-notify-mode', order: 13.1, locale: NS }, NotifyModeRow));
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({ name: 'settings.general.item', id: 'majed-notify-done', order: 13.2, locale: NS }, NotifyDoneRow));
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({ name: 'settings.general.item', id: 'majed-notify-action', order: 13.3, locale: NS }, NotifyActionRow));
        // Invisible watcher on the frame-wide overlay layer: reads session status via the standard hook.
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'majed-notifications', locale: NS }, NotificationWatcher));

        // Apply settings live.
        ctx.effect(() => {
          let stopBidi = null;
          const varStyle = document.createElement('style');   // k + font family
          varStyle.setAttribute('data-majed-appearance', '');
          const sizeStyle = document.createElement('style');  // generated overrides
          sizeStyle.setAttribute('data-majed-ui-font', '');
          document.head.append(varStyle, sizeStyle);

          let lastOverrides = null;
          const regenerate = () => {
            const s = store.get();
            const css = s.uiFontSize === UI_BASE_PX ? '' : buildFontSizeOverrides();
            if (css !== lastOverrides) { sizeStyle.textContent = css; lastOverrides = css; }
          };
          const apply = (s) => {
            if (s.bidi && !stopBidi) stopBidi = startBidi();
            else if (!s.bidi && stopBidi) { stopBidi(); stopBidi = null; }
            varStyle.textContent = `:root{--majed-ui-k:${(s.uiFontSize / UI_BASE_PX).toFixed(4)};}\n`;
            applyFontFamily(s);
            regenerate();
          };

          // DSH loads component stylesheets lazily: re-scan whenever a new one appears.
          let timer = null;
          const rescan = () => { clearTimeout(timer); timer = setTimeout(regenerate, 120); };
          const headObserver = new MutationObserver((records) => {
            for (const r of records) for (const n of r.addedNodes) {
              if (n.nodeType === 1 && ((n.tagName === 'STYLE' && n.hasAttribute('data-plugin-css')) || (n.tagName === 'LINK' && /stylesheet/.test(n.rel)))) { rescan(); if (n.tagName === 'LINK') n.addEventListener('load', rescan, { once: true }); return; }
            }
          });
          headObserver.observe(document.head, { childList: true });
          const bodyObserver = new MutationObserver(() => applyFontFamily(store.get()));
          bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['style', 'data-dsh-claude-typeface', 'data-dsh-skin'] });

          apply(store.get());
          const unsub = store.subscribe(apply);
          return () => {
            unsub(); headObserver.disconnect(); bodyObserver.disconnect(); clearTimeout(timer);
            applyFontFamily({ ...store.get(), fontSource: 'dsh' });
            if (stopBidi) stopBidi();
            varStyle.remove(); sizeStyle.remove();
          };
        }, 'dsh-majed: apply settings');
      },
    };
  },
});
