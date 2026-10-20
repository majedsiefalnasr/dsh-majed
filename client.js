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
 *  2. Settings > General > "App UI font size"   (stepper, right after the chat font size)
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
    const DEFAULTS = { bidi: true, uiFontScale: 100 };
    const SCALE_MIN = 80, SCALE_MAX = 150, SCALE_STEP = 5;
    const listeners = new Set();
    let state = (() => {
      try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; }
      catch (_) { return { ...DEFAULTS }; }
    })();
    const clampScale = (v) => Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(Number(v) / SCALE_STEP) * SCALE_STEP || 100));
    state.uiFontScale = clampScale(state.uiFontScale);
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
      'scale.title': 'App UI font size',
      'scale.description': 'Scales the app interface (sidebar, headers, composer, panels). The chat font size above is unchanged.',
      'scale.reset': 'Reset',
      'scale.unit': '%',
      'scale.increase': 'Increase app UI font size',
      'scale.decrease': 'Decrease app UI font size',
    };
    const zh = {
      'bidi.title': '双向文本（RTL）',
      'bidi.description': '按段落识别阿拉伯语、波斯语、希伯来语并从右到左排版（对话、思考、工具、GenUI 组件）。',
      'scale.title': '应用界面字号',
      'scale.description': '缩放应用界面（侧边栏、标题栏、输入框、面板），不影响上方的对话字号。',
      'scale.reset': '重置',
      'scale.unit': '%',
      'scale.increase': '增大应用界面字号',
      'scale.decrease': '减小应用界面字号',
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
.majed-reset{border:none;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;cursor:pointer;padding:4px 6px;border-radius:var(--dsw-radius-xs)}
.majed-reset:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.majed-reset:disabled{opacity:.4;cursor:default}
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
      const scale = useSetting('uiFontScale');
      const Up = primitives.IconChevronUpOutlineRegular, Down = primitives.IconChevronDownOutlineRegular;
      const set = (v) => store.set({ uiFontScale: clampScale(v) });
      return h('div', { className: 'majed-row' },
        h('div', { className: 'majed-text' },
          h('div', { className: 'majed-title' }, t('scale.title')),
          h('div', { className: 'majed-desc' }, t('scale.description'))),
        h('div', { className: 'majed-control' },
          h('button', { type: 'button', className: 'majed-reset', disabled: scale === 100, onClick: () => set(100) }, t('scale.reset')),
          h('div', { className: 'majed-stepper' },
            h('span', { className: 'majed-value' }, scale),
            h('span', { className: 'majed-arrows' },
              h('button', { type: 'button', className: 'majed-arrow', 'aria-label': t('scale.increase'), disabled: scale >= SCALE_MAX, onClick: () => set(scale + SCALE_STEP) }, Up ? h(Up, { size: 9 }) : '▲'),
              h('button', { type: 'button', className: 'majed-arrow', 'aria-label': t('scale.decrease'), disabled: scale <= SCALE_MIN, onClick: () => set(scale - SCALE_STEP) }, Down ? h(Down, { size: 9 }) : '▼'))),
          h('span', { className: 'majed-unit' }, t('scale.unit'))));
    }

    // ───────────────────────── app-UI font scale ─────────────────────────
    // Chromium `zoom` on the app chrome only; the conversation transcript keeps
    // following DSH's own chat font size. Class names are CSS-module hashes, so we
    // match their stable suffix.
    const UI_SCALE_TARGETS = [
      '[class$="_sidebarCol"]', '[class*="_sidebarCol "]',
      '[class$="_rightbarCol"]', '[class*="_rightbarCol "]',
      '[data-conversation-tabs]', '[data-conversation-header-leading]', '[data-conversation-header-corner]',
      '[data-composer-card]', '[data-composer-dock]', '[data-queue-dock]',
    ];
    const uiScaleCss = (pct) => pct === 100 ? '' : `${UI_SCALE_TARGETS.join(',\n')} { zoom: ${pct / 100}; }`;

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
      inject: ['slots', 'locale'],
      apply(ctx) {
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
          name: 'settings.general.item', id: 'majed-bidi', order: 13, locale: NS,
        }, BidiRow));

        // Apply settings live.
        ctx.effect(() => {
          let stopBidi = null;
          const scaleStyle = document.createElement('style');
          scaleStyle.setAttribute('data-majed-ui-scale', '');
          document.head.appendChild(scaleStyle);
          const apply = (s) => {
            if (s.bidi && !stopBidi) stopBidi = startBidi();
            else if (!s.bidi && stopBidi) { stopBidi(); stopBidi = null; }
            scaleStyle.textContent = uiScaleCss(s.uiFontScale);
          };
          apply(store.get());
          const unsub = store.subscribe(apply);
          return () => { unsub(); if (stopBidi) stopBidi(); scaleStyle.remove(); };
        }, 'dsh-majed: apply settings');
      },
    };
  },
});
