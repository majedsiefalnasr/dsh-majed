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
 *  7. Composer bar > "Approvals" dropdown: Ask me / Auto (safe) / Auto (aggressive), per session.
 *  6. Settings > General > "Copy on select" (toggle, off by default)
 *  5. Account menu grouping: sidebar footer buttons (Remote access, ...) move into the account menu.
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
    const DEFAULTS = { bidi: true, uiFontSize: UI_BASE_PX, fontSource: 'dsh', notifyMode: 'background', notifyDone: true, notifyAction: true, accountMenu: true, autoCopy: false, autoApprove: {} };
    const NOTIFY_MODES = ['off', 'background', 'always'];
    // Bundled UI fonts (OFL-1.1, served by this plugin's host half from fonts/*.woff2).
    const FONT_ROUTE = '/plugins/dsh-majed/fonts/';
    const BUNDLED_FONTS = {"inter": {"label": "Inter", "family": "Inter Majed"}, "roboto": {"label": "Roboto", "family": "Roboto Majed"}, "open-sans": {"label": "Open Sans", "family": "Open Sans Majed"}, "noto-sans": {"label": "Noto Sans", "family": "Noto Sans Majed"}, "ibm-plex-sans": {"label": "IBM Plex Sans", "family": "IBM Plex Sans Majed"}};
    const FONT_FACES = [{"f": "Inter Majed", "u": "inter-latin-wght-normal.woff2", "w": "100 900", "r": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD", "k": "inter"}, {"f": "Inter Majed", "u": "inter-latin-ext-wght-normal.woff2", "w": "100 900", "r": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF", "k": "inter"}, {"f": "Roboto Majed", "u": "roboto-latin-wght-normal.woff2", "w": "100 900", "r": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD", "k": "roboto"}, {"f": "Roboto Majed", "u": "roboto-latin-ext-wght-normal.woff2", "w": "100 900", "r": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF", "k": "roboto"}, {"f": "Open Sans Majed", "u": "open-sans-latin-wght-normal.woff2", "w": "100 900", "r": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD", "k": "open-sans"}, {"f": "Open Sans Majed", "u": "open-sans-latin-ext-wght-normal.woff2", "w": "100 900", "r": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF", "k": "open-sans"}, {"f": "Open Sans Majed", "u": "open-sans-hebrew-wght-normal.woff2", "w": "100 900", "r": "U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F", "k": "open-sans"}, {"f": "Noto Sans Majed", "u": "noto-sans-latin-wght-normal.woff2", "w": "100 900", "r": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD", "k": "noto-sans"}, {"f": "Noto Sans Majed", "u": "noto-sans-latin-ext-wght-normal.woff2", "w": "100 900", "r": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF", "k": "noto-sans"}, {"f": "Noto Sans Majed", "u": "noto-sans-arabic-arabic-wght-normal.woff2", "w": "100 900", "r": "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EE03,U+1EE05-1EE1F,U+1EE21-1EE22,U+1EE24,U+1EE27,U+1EE29-1EE32,U+1EE34-1EE37,U+1EE39,U+1EE3B,U+1EE42,U+1EE47,U+1EE49,U+1EE4B,U+1EE4D-1EE4F,U+1EE51-1EE52,U+1EE54,U+1EE57,U+1EE59,U+1EE5B,U+1EE5D,U+1EE5F,U+1EE61-1EE62,U+1EE64,U+1EE67-1EE6A,U+1EE6C-1EE72,U+1EE74-1EE77,U+1EE79-1EE7C,U+1EE7E,U+1EE80-1EE89,U+1EE8B-1EE9B,U+1EEA1-1EEA3,U+1EEA5-1EEA9,U+1EEAB-1EEBB,U+1EEF0-1EEF1", "k": "noto-sans-arabic"}, {"f": "IBM Plex Sans Majed", "u": "ibm-plex-sans-latin-400-normal.woff2", "w": "400", "r": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD", "k": "ibm-plex-sans"}, {"f": "IBM Plex Sans Majed", "u": "ibm-plex-sans-latin-ext-400-normal.woff2", "w": "400", "r": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF", "k": "ibm-plex-sans"}, {"f": "IBM Plex Sans Majed", "u": "ibm-plex-sans-latin-500-normal.woff2", "w": "500", "r": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD", "k": "ibm-plex-sans"}, {"f": "IBM Plex Sans Majed", "u": "ibm-plex-sans-latin-ext-500-normal.woff2", "w": "500", "r": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF", "k": "ibm-plex-sans"}, {"f": "IBM Plex Sans Majed", "u": "ibm-plex-sans-latin-600-normal.woff2", "w": "600", "r": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD", "k": "ibm-plex-sans"}, {"f": "IBM Plex Sans Majed", "u": "ibm-plex-sans-latin-ext-600-normal.woff2", "w": "600", "r": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF", "k": "ibm-plex-sans"}, {"f": "IBM Plex Sans Majed", "u": "ibm-plex-sans-latin-700-normal.woff2", "w": "700", "r": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD", "k": "ibm-plex-sans"}, {"f": "IBM Plex Sans Majed", "u": "ibm-plex-sans-latin-ext-700-normal.woff2", "w": "700", "r": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF", "k": "ibm-plex-sans"}, {"f": "IBM Plex Sans Majed", "u": "ibm-plex-sans-arabic-arabic-400-normal.woff2", "w": "400", "r": "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EE03,U+1EE05-1EE1F,U+1EE21-1EE22,U+1EE24,U+1EE27,U+1EE29-1EE32,U+1EE34-1EE37,U+1EE39,U+1EE3B,U+1EE42,U+1EE47,U+1EE49,U+1EE4B,U+1EE4D-1EE4F,U+1EE51-1EE52,U+1EE54,U+1EE57,U+1EE59,U+1EE5B,U+1EE5D,U+1EE5F,U+1EE61-1EE62,U+1EE64,U+1EE67-1EE6A,U+1EE6C-1EE72,U+1EE74-1EE77,U+1EE79-1EE7C,U+1EE7E,U+1EE80-1EE89,U+1EE8B-1EE9B,U+1EEA1-1EEA3,U+1EEA5-1EEA9,U+1EEAB-1EEBB,U+1EEF0-1EEF1", "k": "ibm-plex-sans-arabic"}, {"f": "IBM Plex Sans Majed", "u": "ibm-plex-sans-arabic-arabic-500-normal.woff2", "w": "500", "r": "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EE03,U+1EE05-1EE1F,U+1EE21-1EE22,U+1EE24,U+1EE27,U+1EE29-1EE32,U+1EE34-1EE37,U+1EE39,U+1EE3B,U+1EE42,U+1EE47,U+1EE49,U+1EE4B,U+1EE4D-1EE4F,U+1EE51-1EE52,U+1EE54,U+1EE57,U+1EE59,U+1EE5B,U+1EE5D,U+1EE5F,U+1EE61-1EE62,U+1EE64,U+1EE67-1EE6A,U+1EE6C-1EE72,U+1EE74-1EE77,U+1EE79-1EE7C,U+1EE7E,U+1EE80-1EE89,U+1EE8B-1EE9B,U+1EEA1-1EEA3,U+1EEA5-1EEA9,U+1EEAB-1EEBB,U+1EEF0-1EEF1", "k": "ibm-plex-sans-arabic"}, {"f": "IBM Plex Sans Majed", "u": "ibm-plex-sans-arabic-arabic-600-normal.woff2", "w": "600", "r": "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EE03,U+1EE05-1EE1F,U+1EE21-1EE22,U+1EE24,U+1EE27,U+1EE29-1EE32,U+1EE34-1EE37,U+1EE39,U+1EE3B,U+1EE42,U+1EE47,U+1EE49,U+1EE4B,U+1EE4D-1EE4F,U+1EE51-1EE52,U+1EE54,U+1EE57,U+1EE59,U+1EE5B,U+1EE5D,U+1EE5F,U+1EE61-1EE62,U+1EE64,U+1EE67-1EE6A,U+1EE6C-1EE72,U+1EE74-1EE77,U+1EE79-1EE7C,U+1EE7E,U+1EE80-1EE89,U+1EE8B-1EE9B,U+1EEA1-1EEA3,U+1EEA5-1EEA9,U+1EEAB-1EEBB,U+1EEF0-1EEF1", "k": "ibm-plex-sans-arabic"}, {"f": "IBM Plex Sans Majed", "u": "ibm-plex-sans-arabic-arabic-700-normal.woff2", "w": "700", "r": "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EE03,U+1EE05-1EE1F,U+1EE21-1EE22,U+1EE24,U+1EE27,U+1EE29-1EE32,U+1EE34-1EE37,U+1EE39,U+1EE3B,U+1EE42,U+1EE47,U+1EE49,U+1EE4B,U+1EE4D-1EE4F,U+1EE51-1EE52,U+1EE54,U+1EE57,U+1EE59,U+1EE5B,U+1EE5D,U+1EE5F,U+1EE61-1EE62,U+1EE64,U+1EE67-1EE6A,U+1EE6C-1EE72,U+1EE74-1EE77,U+1EE79-1EE7C,U+1EE7E,U+1EE80-1EE89,U+1EE8B-1EE9B,U+1EEA1-1EEA3,U+1EEA5-1EEA9,U+1EEAB-1EEBB,U+1EEF0-1EEF1", "k": "ibm-plex-sans-arabic"}];
    const FONT_SOURCES = ['dsh', 'system', ...Object.keys(BUNDLED_FONTS)];
    const listeners = new Set();
    let state = (() => {
      try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; }
      catch (_) { return { ...DEFAULTS }; }
    })();
    const clampPx = (v) => Math.min(UI_MAX_PX, Math.max(UI_MIN_PX, Math.round(Number(v)) || UI_BASE_PX));
    state.uiFontSize = clampPx(state.uiFontSize);
    if (!FONT_SOURCES.includes(state.fontSource)) state.fontSource = 'dsh';
    if (!NOTIFY_MODES.includes(state.notifyMode)) state.notifyMode = 'background';
    // Per-session auto-approve modes. 'aggressive' lives in memory only: it resets to 'ask' on restart.
    const AP_MODES = ['ask', 'safe', 'aggressive'];
    state.autoApprove = Object.fromEntries(Object.entries(state.autoApprove && typeof state.autoApprove === 'object' ? state.autoApprove : {}).filter(([, v]) => v === 'safe'));
    const store = {
      get: () => state,
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      set(patch) {
        const changed = (key) => Object.hasOwn(patch, key) && (key === 'notifyTitle' ? (patch[key] === true) !== (state[key] === true) : patch[key] !== state[key]);
        if (changed('notifyMode') || changed('notifyTitle')) {
          notificationGeneration++;
          notificationFallback?.remove(); notificationFallback = null;
          live.forEach((control, n) => { try { n.close(); } catch (_) {} }); live.clear();
        } else {
          for (const control of ['notifyDone', 'notifyAction']) {
            if (!changed(control)) continue;
            notificationControlGeneration[control]++;
            if (notificationFallback?.dataset.control === control) { notificationFallback.remove(); notificationFallback = null; }
            live.forEach((owner, n) => { if (owner === control) { try { n.close(); } catch (_) {} live.delete(n); } });
          }
        }
        state = { ...state, ...patch };
        try { localStorage.setItem(STORE_KEY, JSON.stringify({ ...state, autoApprove: Object.fromEntries(Object.entries(state.autoApprove || {}).filter(([, v]) => v === 'safe')) })); } catch (_) {}
        listeners.forEach((fn) => fn(state));
      },
    };
    const useSetting = (key) => React.useSyncExternalStore(store.subscribe, () => store.get()[key]);

    // ───────────────────────── dictionaries ─────────────────────────
    const NS = 'majed';
    const en = {
      'bidi.title': 'Bidirectional text',
      'bidi.reset': 'Reset bidirectional text',
      'bidi.description': 'Detects Arabic, Persian and Hebrew per paragraph and lays it out right-to-left (chat, reasoning, tools, GenUI components).',
      'size.title': 'App UI font size',
      'size.description': 'Font size of the app interface (sidebar, headers, composer, panels). The chat font size above is unchanged.',
      'size.increase': 'Increase app UI font size',
      'size.decrease': 'Decrease app UI font size',
      'size.unit': 'px',
      'reset.label': 'Reset',
      'size.reset': 'Reset app UI font size',
      'font.title': 'App font',
      'font.reset': 'Reset app font',
      'font.description': 'Choose the typeface used by the app interface and chat text.',
      'font.dsh': 'DSH default',
      'font.system': 'System font',
      'font.inter': 'Inter',
      'font.roboto': 'Roboto',
      'font.open-sans': 'Open Sans',
      'font.noto-sans': 'Noto Sans',
      'font.ibm-plex-sans': 'IBM Plex Sans',
      'notify.title': 'System notifications',
      'notify.description': 'Send a desktop notification when a session finishes or needs your attention.',
      'notify.off': 'Off',
      'notify.background': 'Only when app is in background',
      'notify.always': 'Always (silent while app is focused)',
      'notify.test': 'Send test',
      'notify.testBody': 'Notifications are working.',
      'notify.status.granted': 'Allowed on this device.',
      'notify.status.default': 'Not allowed yet — tap “Send test” to allow notifications.',
      'notify.status.denied': 'Blocked — allow notifications for this site in the browser settings.',
      'notify.status.insecure': 'Unavailable: this page is not served over HTTPS. In-app alerts still appear.',
      'notify.status.unsupported': 'Unsupported here. In-app alerts remain available while this interface is connected.',
      'notify.fallback': 'In-app alert only; system notification was unavailable.',
      'notify.open': 'Open session',
      'notify.dismiss': 'Dismiss alert',
      'notify.modeReset': 'Reset system notifications',
      'notify.doneReset': 'Reset completion notifications',
      'notify.actionReset': 'Reset action notifications',
      'notify.titleOptIn': 'Include session title',
      'notify.titleDescription': 'Show the session title in system alerts on this browser profile. Off keeps alerts private.',
      'notify.titleReset': 'Reset notification title',
      'notify.done.title': 'Notify on completion',
      'notify.done.description': 'When a session finishes its work.',
      'notify.action.title': 'Notify when action is needed',
      'notify.action.description': 'When a session waits for an approval, a question, or a plan review.',
      'notify.msg.done': 'Finished — ready for review',
      'notify.msg.approvalPlain': 'Approval needed',
      'notify.msg.question': 'Waiting for your answer',
      'notify.msg.plan': 'Plan ready for your review',
      'notify.session': 'Session',
      'account.title': 'Group sidebar actions in account menu',
      'account.description': 'Moves extra sidebar buttons (such as Remote access) into the account menu instead of showing them beside it.',
      'copy.title': 'Copy on select',
      'copy.description': 'Automatically copy any text you select in the app to the clipboard. Text inside input fields is not copied.',
      'copy.toast': 'Copied to clipboard',
      'copy.error': 'Could not copy the selection',
      'copy.unsupported': 'Copying is not available here',
      'ap.label': 'Approvals',
      'ap.ask': 'Ask me',
      'ap.safe': 'Auto (safe)',
      'ap.aggressive': 'Auto (aggressive)',
      'ap.aria': 'Automatic approval for this session',
      'ap.confirm': 'Aggressive mode approves almost every request automatically in this session — including full-access escalations, network access and unknown tools. Destructive commands (rm -rf, sudo, force-push, secrets…) still ask you. It resets when the app restarts. Enable it?',
      'ap.toast': 'Auto-approved: {tool}',
      'ap.paused': 'Auto-approval paused after repeated requests that need your decision.',
    };
    const zh = {
      'bidi.title': '双向文本（RTL）',
      'bidi.reset': '重置双向文本',
      'bidi.description': '按段落识别阿拉伯语、波斯语、希伯来语并从右到左排版（对话、思考、工具、GenUI 组件）。',
      'size.title': '应用界面字号',
      'size.description': '应用界面（侧边栏、标题栏、输入框、面板）的字号，不影响上方的对话字号。',
      'size.increase': '增大应用界面字号',
      'size.decrease': '减小应用界面字号',
      'size.unit': 'px',
      'reset.label': '重置',
      'size.reset': '重置应用界面字号',
      'font.title': '应用字体',
      'font.reset': '重置应用字体',
      'font.description': '选择应用界面与对话文字使用的字体。',
      'font.dsh': 'DSH 默认',
      'font.system': '系统字体',
      'font.inter': 'Inter',
      'font.roboto': 'Roboto',
      'font.open-sans': 'Open Sans',
      'font.noto-sans': 'Noto Sans',
      'font.ibm-plex-sans': 'IBM Plex Sans',
      'notify.title': '系统通知',
      'notify.description': '会话完成或需要你处理时发送桌面通知。',
      'notify.off': '关闭',
      'notify.background': '仅应用在后台时',
      'notify.always': '始终（应用在前台时静音）',
      'notify.test': '发送测试',
      'notify.testBody': '通知正常工作。',
      'notify.status.granted': '已在此设备上允许。',
      'notify.status.default': '尚未允许：点击“发送测试”以允许通知。',
      'notify.status.denied': '已被阻止：请在浏览器设置中允许此网站发送通知。',
      'notify.status.insecure': '不可用：当前页面不是 HTTPS。应用内提醒仍会显示。',
      'notify.status.unsupported': '此处不支持系统通知。此界面保持连接时仍可使用应用内提醒。',
      'notify.fallback': 'In-app alert only; system notification was unavailable.',
      'notify.open': 'Open session',
      'notify.dismiss': 'Dismiss alert',
      'notify.modeReset': 'Reset system notifications',
      'notify.doneReset': 'Reset completion notifications',
      'notify.actionReset': 'Reset action notifications',
      'notify.titleOptIn': 'Include session title',
      'notify.titleDescription': 'Show the session title in system alerts on this browser profile. Off keeps alerts private.',
      'notify.titleReset': 'Reset notification title',
      'notify.done.title': '完成时通知',
      'notify.done.description': '会话完成工作时。',
      'notify.action.title': '需要操作时通知',
      'notify.action.description': '会话等待审批、提问或计划审阅时。',
      'notify.msg.done': '已完成，等待查看',
      'notify.msg.approvalPlain': '需要审批',
      'notify.msg.question': '等待你的回答',
      'notify.msg.plan': '计划待审阅',
      'notify.session': '会话',
      'account.title': '将侧边栏操作收进账户菜单',
      'account.description': '把额外的侧边栏按钮（如远程访问）移入账户菜单，而不是显示在旁边。',
      'copy.title': '选中即复制',
      'copy.description': '在应用中选中的文字会自动复制到剪贴板。输入框内的文字不会被复制。',
      'copy.toast': '已复制到剪贴板',
      'copy.error': 'Could not copy the selection',
      'copy.unsupported': 'Copying is not available here',
      'ap.label': '审批',
      'ap.ask': '手动确认',
      'ap.safe': '自动（安全）',
      'ap.aggressive': '自动（激进）',
      'ap.aria': '本会话的自动审批',
      'ap.confirm': '激进模式会在本会话中自动批准所有请求，包括完全访问提权、网络访问和未知工具；应用重启后会重置。确定开启吗？',
      'ap.toast': '已自动批准：{tool}',
      'ap.paused': '多次出现需要你决定的请求，已暂停自动审批。',
    };

    // Inert readiness controls use the native Settings slot and RPC carrier.
    const managementEn = {
      'management.skills': 'Skills Manager', 'management.mcp': 'MCP Manager', 'management.hooks': 'Hooks Manager',
      'management.subscriptions': 'Subscriptions', 'management.routing': 'Auto routing',
      'management.direction': 'ltr', 'management.enable': 'Enable readiness checks',
      'management.description': 'Readiness checks only. No Manager operations, commands, accounts or routing are activated. Enablement is shared by this host and resets on host restart.',
      'management.disabled': 'Readiness checks are disabled.', 'management.ready': 'Service ready for readiness checks only. Feature operations are not implemented here.',
      'management.loading': 'Checking service…', 'management.retry': 'Refresh status',
      'management.error': 'Status unavailable. Check the connection and refresh. If it persists, verify the installed host/client versions.',
      'management.auth': 'Owner access required. Reopen the authenticated DSH page or pair this remote device again, then refresh.',
      'management.unsupported': 'This host does not provide the Settings transport. Use a supported DSH version.',
      'skills.disabled': 'Skills are disabled.', 'skills.enabled': 'Skills are enabled.',
      'skills.enable': 'Enable Skills; the standalone Skills Manager is disabled',
      'skills.disable': 'Disable Skills management', 'skills.user': 'User Skills', 'skills.project': 'Project',
      'skills.name': 'Name', 'skills.description': 'Description', 'skills.body': 'Instructions',
      'skills.create': 'Create Skill', 'skills.inspect': 'View', 'skills.trash': 'Move to trash',
      'skills.restore': 'Restore', 'skills.toggle': 'Enabled', 'skills.root': 'Source',
      'skills.delete': 'Permanently delete', 'skills.confirmDelete': 'I confirm permanent deletion',
    };
    const managementAr = {
      'management.skills': 'مدير المهارات', 'management.mcp': 'مدير MCP', 'management.hooks': 'مدير الخطافات',
      'management.subscriptions': 'الاشتراكات', 'management.routing': 'التوجيه التلقائي',
      'management.direction': 'rtl', 'management.enable': 'تفعيل فحوصات الجاهزية',
      'management.description': 'فحوصات جاهزية فقط. لا يتم تفعيل عمليات الإدارة أو الأوامر أو الحسابات أو التوجيه. التفعيل مشترك على هذا المضيف ويُعاد ضبطه عند إعادة تشغيله.',
      'management.disabled': 'فحوصات الجاهزية معطلة.', 'management.ready': 'الخدمة جاهزة لفحوصات الجاهزية فقط. عمليات الميزات غير متاحة هنا.',
      'management.loading': 'جارٍ فحص الخدمة…', 'management.retry': 'تحديث الحالة',
      'management.error': 'الحالة غير متاحة. تحقق من الاتصال ثم حدّث الحالة. إن استمرت المشكلة، تحقق من توافق إصدارَي المضيف والواجهة.',
      'management.auth': 'يلزم وصول المالك. أعد فتح صفحة DSH الموثقة أو أعد إقران الجهاز البعيد ثم حدّث الحالة.',
      'management.unsupported': 'لا يوفر هذا المضيف وسيلة نقل الإعدادات. استخدم إصدار DSH مدعومًا.',
      'skills.disabled': 'إدارة المهارات معطلة.', 'skills.enabled': 'إدارة المهارات مفعلة.',
      'skills.enable': 'تفعيل المهارات؛ مدير المهارات المستقل معطل',
      'skills.disable': 'تعطيل إدارة المهارات', 'skills.user': 'مهارات المستخدم', 'skills.project': 'المشروع',
      'skills.name': 'الاسم', 'skills.description': 'الوصف', 'skills.body': 'التعليمات',
      'skills.create': 'إنشاء مهارة', 'skills.inspect': 'عرض', 'skills.trash': 'نقل إلى سلة المحذوفات',
      'skills.restore': 'استعادة', 'skills.toggle': 'مفعلة', 'skills.root': 'المصدر',
      'skills.delete': 'حذف نهائي', 'skills.confirmDelete': 'أؤكد الحذف النهائي',
    };
    Object.assign(managementEn, {
      'codex.title': 'Codex account', 'codex.enable': 'Enable account management', 'codex.disable': 'Disable account management',
      'codex.begin': 'Connect Codex', 'codex.complete': 'Complete login', 'codex.callback': 'Paste the full callback URL', 'codex.cancel': 'Cancel login',
      'codex.open': 'Open Codex sign-in', 'codex.status': 'Refresh account status', 'codex.refresh': 'Refresh credentials', 'codex.remove': 'Remove account', 'codex.default': 'Use by default',
      'codex.description': 'Enable account management to connect and retain Codex credentials privately on this host. Enable Codex models separately to use direct chat. Login never enrolls Auto candidates.',
      'codex.pending': 'Waiting for sign-in. Open the link on the host, or paste the full callback URL here from a remote device.',
      'codex.disconnected': 'No Codex account connected.', 'codex.connected': 'Account connected.', 'codex.disabled': 'Account management is disabled.',
      'codex.failed': 'Login failed or expired. Try connecting again.', 'codex.cancelled': 'Login cancelled.', 'codex.reauthentication_required': 'Sign in again to reconnect this account.',
      'codex.error': 'Account operation failed. Refresh status or reconnect. No credential details are displayed.', 'codex.working': 'Working…',
      'codex.modelsEnable': 'Enable Codex models', 'codex.modelsDisable': 'Disable Codex models', 'codex.catalog': 'Refresh model catalog',
      'codex.model': 'Model', 'codex.modelName': 'Display name', 'codex.hidden': 'Hide from picker', 'codex.effort': 'Default reasoning effort', 'codex.providerDefault': 'Provider default',
      'codex.context': 'Context budget (tokens)', 'codex.speed': 'Speed', 'codex.standard': 'Standard', 'codex.fast': 'Fast', 'codex.saveModel': 'Save model settings',
      'codex.independent': 'Show an independent account entry', 'codex.alias': 'Account alias', 'codex.saveAccount': 'Save account settings',
      'codex.manualId': 'Manual model ID', 'codex.addManual': 'Add manual model', 'codex.providerCatalog': 'Use provider catalog',
      'codex.manualNote': 'Manual catalogs use only the models you add. Omitted capabilities remain unknown.',
      'codex.runtimeUnavailable': 'Codex models require the host loader and account-bound preparation support. Update to a supported host and try again.',
      'codex.fastCommand': 'Choose Standard/Fast for this Codex session', 'codex.fastUnavailable': 'Enable Codex models and select a model that supports Fast first.',
      'codex.catalogFallback': 'Catalog refresh failed. Saved or built-in model metadata is shown where available; refresh the catalog or reconnect the account.',
    });
    Object.assign(managementAr, {
      'codex.title': 'حساب Codex', 'codex.enable': 'تفعيل إدارة الحساب', 'codex.disable': 'تعطيل إدارة الحساب',
      'codex.begin': 'ربط Codex', 'codex.complete': 'إكمال تسجيل الدخول', 'codex.callback': 'ألصق رابط العودة الكامل', 'codex.cancel': 'إلغاء تسجيل الدخول',
      'codex.open': 'فتح تسجيل دخول Codex', 'codex.status': 'تحديث حالة الحساب', 'codex.refresh': 'تحديث بيانات الاعتماد', 'codex.remove': 'إزالة الحساب', 'codex.default': 'استخدامه افتراضيًا',
      'codex.description': 'فعّل إدارة الحساب لربط بيانات اعتماد Codex وحفظها بخصوصية على هذا المضيف. فعّل نماذج Codex بشكل منفصل للمحادثة المباشرة. لا يُدرج تسجيل الدخول الحساب في التوجيه التلقائي.',
      'codex.pending': 'بانتظار تسجيل الدخول. افتح الرابط على المضيف أو ألصق رابط العودة الكامل هنا من جهاز بعيد.',
      'codex.disconnected': 'لا يوجد حساب Codex متصل.', 'codex.connected': 'الحساب متصل.', 'codex.disabled': 'إدارة الحساب معطلة.',
      'codex.failed': 'فشل تسجيل الدخول أو انتهت مهلته. حاول الربط مجددًا.', 'codex.cancelled': 'تم إلغاء تسجيل الدخول.', 'codex.reauthentication_required': 'سجّل الدخول مجددًا لإعادة ربط هذا الحساب.',
      'codex.error': 'فشلت عملية الحساب. حدّث الحالة أو أعد الربط. لا تُعرض تفاصيل بيانات الاعتماد.', 'codex.working': 'جارٍ التنفيذ…',
      'codex.modelsEnable': 'تفعيل نماذج Codex', 'codex.modelsDisable': 'تعطيل نماذج Codex', 'codex.catalog': 'تحديث قائمة النماذج',
      'codex.model': 'النموذج', 'codex.modelName': 'اسم العرض', 'codex.hidden': 'إخفاء من محدد النماذج', 'codex.effort': 'جهد الاستدلال الافتراضي', 'codex.providerDefault': 'افتراضي المزود',
      'codex.context': 'ميزانية السياق (رموز)', 'codex.speed': 'السرعة', 'codex.standard': 'قياسية', 'codex.fast': 'سريعة', 'codex.saveModel': 'حفظ إعدادات النموذج',
      'codex.independent': 'إظهار إدخال مستقل للحساب', 'codex.alias': 'اسم الحساب المستعار', 'codex.saveAccount': 'حفظ إعدادات الحساب',
      'codex.manualId': 'معرّف النموذج اليدوي', 'codex.addManual': 'إضافة نموذج يدوي', 'codex.providerCatalog': 'استخدام قائمة المزود',
      'codex.manualNote': 'تستخدم القائمة اليدوية النماذج التي تضيفها فقط. تظل القدرات غير المحددة مجهولة.',
      'codex.runtimeUnavailable': 'تتطلب نماذج Codex محمّل المضيف ودعم التحضير المرتبط بالحساب. حدّث إلى مضيف مدعوم وحاول مجددًا.',
      'codex.fastCommand': 'اختيار السرعة القياسية أو السريعة لجلسة Codex الحالية', 'codex.fastUnavailable': 'فعّل نماذج Codex واختر نموذجًا يدعم السرعة السريعة أولًا.',
      'codex.catalogFallback': 'فشل تحديث قائمة النماذج. تُعرض البيانات المحفوظة أو المضمنة حيث تتوفر؛ حدّث القائمة أو أعد ربط الحساب.',
    });
    Object.assign(en, managementEn);
    const codexRuntimeObservers = new Set();
    let codexRuntimeKnown = false;
    function observeCodexRuntime(enabled) {
      codexRuntimeKnown = !!enabled;
      for (const observer of codexRuntimeObservers) observer(codexRuntimeKnown);
    }
    async function loadCodexSpeed(ctx, sessionId, signal) {
      const result = await ctx.connection.rpc.call('/api', 'majed/subscriptions/codex', { action: 'speed', sessionId }, signal);
      signal?.throwIfAborted();
      observeCodexRuntime(result.ok && result.value?.runtimeEnabled);
      if (!result.ok) return { visible: false, tier: 'standard' };
      const directories = ctx.get?.('modelDirectories');
      if (!directories) return { visible: false, tier: result.value.tier };
      const { current } = await directories.directoryFor(sessionId).load();
      return { visible: !!current && current.provider === 'codex' && result.value.fastModels.includes(current.model), tier: result.value.tier };
    }
    function CodexSpeedSelect({ ctx, sessionId, locked, t }) {
      const [state, setState] = React.useState(null), [busy, setBusy] = React.useState(false);
      React.useEffect(() => {
        if (!sessionId || !ctx.connection?.rpc?.call) return;
        let disposed = false, timer;
        const controller = new AbortController();
        const reload = async () => {
          try { const value = await loadCodexSpeed(ctx, sessionId, controller.signal); if (!disposed) setState(value); }
          catch { /* Preserve the last successful status across transient connection failure. */ }
          finally { if (!disposed) timer = setTimeout(reload, 3000); }
        };
        reload(); return () => { disposed = true; clearTimeout(timer); controller.abort(); };
      }, [ctx, sessionId]);
      if (!state?.visible) return null;
      return h('label', null, t('codex.speed'), h('select', { 'data-codex-speed': true, value: state.tier, disabled: busy || locked, onChange: async event => {
        const tier = event.target.value; if (busy) return; setBusy(true);
        try { const result = await ctx.connection.rpc.call('/api', 'majed/subscriptions/codex', { action: 'setSpeed', sessionId, tier }); if (result.ok) setState({ visible: true, tier: result.value.tier }); }
        catch { /* Keep the previous tier after a refused or disconnected update. */ }
        finally { setBusy(false); }
      } }, h('option', { value: 'standard' }, t('codex.standard')), h('option', { value: 'fast' }, t('codex.fast'))));
    }

    function CodexModelSettings({ runtime, call, busy, t }) {
      const models = [...new Map((runtime.catalogs || []).flatMap(c => c.models).map(model => [model.id, model])).values()];
      const [selected, setSelected] = React.useState(models[0]?.id || '');
      const [name, setName] = React.useState(''), [hidden, setHidden] = React.useState(false), [effort, setEffort] = React.useState('');
      const [context, setContext] = React.useState('');
      const [manualId, setManualId] = React.useState(''), [manualName, setManualName] = React.useState('');
      const model = models.find(model => model.id === selected);
      const pref = runtime.preferences?.models?.[selected];
      React.useEffect(() => {
        setName(pref?.name || ''); setHidden(!!pref?.hidden); setEffort(pref?.defaultEffort || '');
        setContext(pref?.contextWindow || '');
      }, [selected, JSON.stringify(pref)]);
      const field = (label, element) => h('label', null, t('codex.' + label), element);
      return h('div', null,
        (runtime.catalogs || []).some(catalog => catalog.failed) && h('p', { role: 'status' }, t('codex.catalogFallback')),
        models.length > 0 && h('form', { className: 'majed-codex-form', 'data-codex-model-settings': true, onSubmit: event => {
          event.preventDefault(); call('configure', { settings: { model: selected, name, hidden, defaultEffort: effort || null, contextWindow: context ? Number(context) : null } });
        } },
        field('model', h('select', { value: selected, onChange: event => setSelected(event.target.value) }, ...models.map(model => h('option', { key: model.id, value: model.id }, model.name || model.id)))),
        field('modelName', h('input', { value: name, maxLength: 128, onChange: event => setName(event.target.value) })),
        field('hidden', h('input', { type: 'checkbox', checked: hidden, onChange: event => setHidden(event.target.checked) })),
        field('effort', h('select', { value: effort, onChange: event => setEffort(event.target.value) }, h('option', { value: '' }, t('codex.providerDefault')),
          ...(model?.reasoning?.efforts || []).map(e => h('option', { key: e.id, value: e.id }, e.name)))),
        field('context', h('input', { type: 'number', min: 1, max: model?.maxContextWindow || model?.contextWindow, value: context, placeholder: model?.contextWindow ? String(model.contextWindow) : '', onChange: event => setContext(event.target.value) })),
        h('button', { type: 'submit', className: 'majed-management-refresh', disabled: busy }, t('codex.saveModel'))),
        h('form', { className: 'majed-codex-form', onSubmit: event => {
          event.preventDefault(); if (!manualId) return;
          const current = runtime.preferences?.manualModels || [];
          call('configure', { settings: { manualModels: [...current.filter(m => m.id !== manualId), { id: manualId, name: manualName || manualId }] } });
        } }, h('p', null, t('codex.manualNote')),
        field('manualId', h('input', { value: manualId, maxLength: 512, onChange: event => setManualId(event.target.value) })),
        field('modelName', h('input', { value: manualName, maxLength: 128, onChange: event => setManualName(event.target.value) })),
        h('button', { type: 'submit', className: 'majed-management-refresh', disabled: busy || !manualId }, t('codex.addManual')),
        h('button', { type: 'button', className: 'majed-management-refresh', disabled: busy, onClick: () => call('configure', { settings: { manualModels: null } }) }, t('codex.providerCatalog'))));
    }
    function CodexAccountSettings({ account, preferences, call, busy, t }) {
      const [alias, setAlias] = React.useState(preferences?.alias || ''), [independent, setIndependent] = React.useState(!!preferences?.independentEntry);
      return h('form', { className: 'majed-codex-form', onSubmit: event => { event.preventDefault(); call('configure', { settings: { account: account.id, alias, independentEntry: independent } }); } },
        h('label', null, t('codex.alias'), h('input', { value: alias, maxLength: 128, onChange: event => setAlias(event.target.value) })),
        h('label', null, h('input', { type: 'checkbox', checked: independent, onChange: event => setIndependent(event.target.checked) }), t('codex.independent')),
        h('button', { type: 'submit', className: 'majed-management-refresh', disabled: busy }, t('codex.saveAccount')));
    }

    function SkillsSection({ ctx, t }) {
      const [status, setStatus] = React.useState(null), [snapshot, setSnapshot] = React.useState(null);
      const [trash, setTrash] = React.useState([]), [detail, setDetail] = React.useState(null);
      const [error, setError] = React.useState(null), [busy, setBusy] = React.useState(false);
      const [project, setProject] = React.useState(''), [root, setRoot] = React.useState('dsh');
      const [name, setName] = React.useState(''), [description, setDescription] = React.useState(''), [body, setBody] = React.useState('');
      const [deleteId, setDeleteId] = React.useState('');
      const active = React.useRef(null);
      const run = async (action = 'status', input = {}, scopeOverride) => {
        if (active.current) return;
        const controller = new AbortController(); active.current = controller;
        const timer = setTimeout(() => controller.abort(), 6000);
        setBusy(true); setError(null);
        try {
          const selected = scopeOverride === undefined ? status?.projects?.find(item => item.workspaceId === project) : scopeOverride;
          const selectors = selected ? { sessionId: selected.sessionId, workspaceId: selected.workspaceId } : {};
          const call = async (action, input = {}) => {
            const result = await ctx.connection.rpc.call('/api', 'majed/skills', { action, input, ...selectors }, controller.signal);
            if (!result.ok) throw new Error('operation');
            return result.value;
          };
          if (action !== 'status') {
            const result = await call(action, input);
            if (action === 'detail') setDetail(result);
          }
          const next = await call('status');
          const rows = next.enabled ? await call('list') : null;
          const removed = next.enabled ? await call('listTrash') : [];
          if (controller.signal.aborted || active.current !== controller) return;
          setStatus(next); setSnapshot(rows); setTrash(removed);
        } catch (failure) {
          if (active.current === controller) setError(/HTTP (401|403)/.test(failure.message) ? 'auth' : 'error');
        } finally {
          clearTimeout(timer);
          if (active.current === controller) { active.current = null; setBusy(false); }
        }
      };
      React.useEffect(() => { run(); return () => { active.current?.abort(); active.current = null; }; }, [ctx]);
      const button = (label, onClick, attrs = {}) => h('button', { type: 'button', className: 'majed-management-refresh', 'aria-disabled': busy, onClick, ...attrs }, t(label));
      return h('section', { className: 'majed-management majed-skills', dir: t('management.direction'), 'aria-label': t('management.skills'), 'aria-busy': busy },
        h('h2', { className: 'majed-management__title' }, t('management.skills')),
        h('p', { role: error ? 'alert' : 'status' }, t(error ? 'management.' + error : 'skills.' + (status?.enabled ? 'enabled' : 'disabled'))),
        button('management.retry', () => run(), { 'data-skills-refresh': '' }),
        status && button(status.enabled ? 'skills.disable' : 'skills.enable', () => run('enable', { enabled: !status.enabled, confirm: true }), { 'data-skills-enable': '' }),
        status?.enabled && h(React.Fragment, null,
          h('label', null, t('skills.project'), h('select', { value: project, disabled: busy, 'data-skills-project': '', onChange: event => {
            const value = event.target.value; setProject(value); setRoot('dsh'); setDetail(null);
            run('status', {}, status.projects.find(item => item.workspaceId === value) ?? null);
          } }, h('option', { value: '' }, t('skills.user')), ...(status.projects ?? []).map(item => h('option', { key: item.workspaceId, value: item.workspaceId }, item.title)))),
          ...(snapshot?.roots ?? []).map(source => h('div', { key: source.key }, h('h3', null, source.label),
            ...source.skills.map(skill => h('div', { key: skill.name, className: 'majed-management-controls' },
              h('span', { dir: 'auto' }, skill.declaredName || skill.name),
              button('skills.inspect', () => run('detail', { root: source.key, name: skill.name })),
              source.toggleable && h('label', null, h('input', { type: 'checkbox', checked: skill.managerEnabled, disabled: busy,
                'data-skills-toggle': skill.name, onChange: event => run('setEnabled', { root: source.key, name: skill.name, enabled: event.target.checked }) }), t('skills.toggle')),
              source.mutable && button('skills.trash', () => run('trash', { root: source.key, name: skill.name }), { 'data-skills-trash': skill.name }))))),
          detail && h('pre', { dir: 'auto' }, detail.body),
          h('form', { onSubmit: event => { event.preventDefault(); run('create', { root, name, description, body }); } },
            h('label', null, t('skills.root'), h('select', { value: root, disabled: busy, onChange: event => setRoot(event.target.value) },
              ...(snapshot?.roots ?? []).filter(source => source.mutable).map(source => h('option', { key: source.key, value: source.key }, source.label)))),
            ...[['name', name, setName], ['description', description, setDescription], ['body', body, setBody]].map(([key, value, set]) => h('label', { key }, t('skills.' + key),
              h(key === 'body' ? 'textarea' : 'input', { value, required: true, disabled: busy, 'data-skills-field': key, onChange: event => set(event.target.value) }))),
            h('button', { type: 'submit', disabled: busy, className: 'majed-management-refresh', 'data-skills-create': '' }, t('skills.create'))),
          ...trash.map(item => h('div', { key: item.id, className: 'majed-management-controls' }, h('span', null, item.name),
            button('skills.restore', () => run('restore', { id: item.id }), { 'data-skills-restore': item.id }),
            h('label', null, h('input', { type: 'checkbox', checked: deleteId === item.id, disabled: busy, onChange: event => setDeleteId(event.target.checked ? item.id : '') }), t('skills.confirmDelete')),
            deleteId === item.id && button('skills.delete', () => run('delete', { id: item.id, confirm: true }))))));
    }

    Object.assign(en, {
      'judgment.title': 'Judgment service', 'judgment.description': 'Configure a separate judgment service. Saving and testing do not enable Smart routing.',
      'judgment.protocol': 'Protocol', 'judgment.address': 'Service address', 'judgment.model': 'Requested model', 'judgment.credential': 'Credential',
      'judgment.keep': 'Keep existing credential', 'judgment.replace': 'Replace credential', 'judgment.remove': 'Remove credential',
      'judgment.save': 'Save judgment settings', 'judgment.test': 'Test connection',
      'judgment.consent': 'Send the fixed connection-test question to this service. This request may incur a charge. No conversation data is sent.',
      'judgment.configured': 'Credential configured. Smart remains disabled.', 'judgment.missing': 'Credential unavailable. Manual and deterministic routes remain usable.',
      'judgment.error': 'Judgment service unavailable or configuration invalid.', 'judgment.saved': 'Judgment settings saved. Smart remains disabled.',
      'judgment.tested': 'Connection test completed', 'judgment.requested': 'Requested model', 'judgment.actual': 'Actual model',
      'judgment.inputTokens': 'Input tokens', 'judgment.outputTokens': 'Output tokens', 'judgment.cost': 'Reported cost',
    });
    Object.assign(managementAr, {
      'judgment.title': 'خدمة التقييم', 'judgment.description': 'إعداد خدمة تقييم مستقلة. الحفظ والاختبار لا يفعّلان التوجيه الذكي.',
      'judgment.protocol': 'البروتوكول', 'judgment.address': 'عنوان الخدمة', 'judgment.model': 'النموذج المطلوب', 'judgment.credential': 'بيانات الاعتماد',
      'judgment.keep': 'الاحتفاظ ببيانات الاعتماد الحالية', 'judgment.replace': 'استبدال بيانات الاعتماد', 'judgment.remove': 'إزالة بيانات الاعتماد',
      'judgment.save': 'حفظ إعدادات التقييم', 'judgment.test': 'اختبار الاتصال',
      'judgment.consent': 'إرسال سؤال اختبار ثابت إلى هذه الخدمة. قد تترتب رسوم على الطلب. لن تُرسل بيانات المحادثة.',
      'judgment.configured': 'تم إعداد بيانات الاعتماد. التوجيه الذكي معطّل.', 'judgment.missing': 'بيانات الاعتماد غير متاحة. تظل المسارات اليدوية والحتمية قابلة للاستخدام.',
      'judgment.error': 'خدمة التقييم غير متاحة أو الإعدادات غير صالحة.', 'judgment.saved': 'تم حفظ إعدادات التقييم. التوجيه الذكي معطّل.',
      'judgment.tested': 'اكتمل اختبار الاتصال', 'judgment.requested': 'النموذج المطلوب', 'judgment.actual': 'النموذج الفعلي',
      'judgment.inputTokens': 'رموز الإدخال', 'judgment.outputTokens': 'رموز الإخراج', 'judgment.cost': 'التكلفة المبلغ عنها',
    });

    function JudgmentSection({ ctx, t }) {
      const [value, setValue] = React.useState(null), [error, setError] = React.useState(false), [busy, setBusy] = React.useState(false);
      const [protocol, setProtocol] = React.useState('systemone'), [address, setAddress] = React.useState(''), [model, setModel] = React.useState('');
      const [credential, setCredential] = React.useState(''), [edit, setEdit] = React.useState('keep'), [consent, setConsent] = React.useState(false);
      const [result, setResult] = React.useState(null), [saved, setSaved] = React.useState(false), active = React.useRef(null);
      const call = async payload => {
        if (active.current) return;
        const controller = new AbortController(); active.current = controller; setBusy(true); setError(false);
        const timer = setTimeout(() => controller.abort(), 6000);
        try {
          if (typeof ctx.connection?.rpc?.call !== 'function') throw new Error('unsupported');
          const response = await ctx.connection.rpc.call('/api', 'majed/judgment/manage', payload, controller.signal);
          if (controller.signal.aborted || active.current !== controller) return;
          if (!response.ok) throw new Error('unavailable');
          if (payload.action === 'validate') setResult(response.value);
          else { setValue(response.value); if (response.value.protocol) setProtocol(response.value.protocol); }
          if (payload.action === 'configure') { setCredential(''); setEdit('keep'); setSaved(true); setResult(null); }
        } catch (failure) { if (active.current === controller) setError(failure.message === 'unsupported' ? 'unsupported' : 'unavailable'); }
        finally { clearTimeout(timer); if (active.current === controller) { active.current = null; setBusy(false); } }
      };
      React.useEffect(() => { call({ action: 'status' }); return () => { active.current?.abort(); active.current = null; }; }, [ctx]);
      const field = (key, input) => h('label', null, h('span', null, t('judgment.' + key)), input);
      return h('section', { className: 'majed-management', dir: t('management.direction'), 'data-majed-judgment': true },
        h('h2', { className: 'majed-management__title' }, t('judgment.title')), h('p', null, t('judgment.description')),
        h('div', { className: 'majed-management-controls' },
          field('protocol', h('select', { value: protocol, disabled: busy, 'data-judgment-field': 'protocol', onChange: e => setProtocol(e.target.value) }, h('option', { value: 'systemone' }, 'System One'), h('option', { value: 'decisions' }, 'Decisions'))),
          field('address', h('input', { type: 'url', value: address, disabled: busy, dir: 'ltr', placeholder: protocol === 'systemone' ? 'https://api.typesafe.ai' : 'https://openrouter.ai/api/alpha/decisions', 'data-judgment-field': 'address', onChange: e => setAddress(e.target.value) })),
          field('model', h('input', { value: model, disabled: busy, dir: 'ltr', 'data-judgment-field': 'model', onChange: e => setModel(e.target.value) })),
          field('credential', h('select', { value: edit, disabled: busy, 'data-judgment-field': 'credential-action', onChange: e => { setEdit(e.target.value); setCredential(''); } }, ...['keep', 'replace', 'remove'].map(action => h('option', { key: action, value: action }, t('judgment.' + action))))),
          field('credential', h('input', { type: 'password', autoComplete: 'new-password', value: credential, disabled: busy || edit !== 'replace', 'data-judgment-field': 'credential', onChange: e => setCredential(e.target.value) })),
          h('button', { type: 'button', className: 'majed-management-refresh', disabled: busy, 'data-judgment-action': 'save', onClick: () => call({ action: 'configure', config: { protocol, ...(address ? { address } : {}), ...(model ? { model } : {}), credential: { action: edit, ...(edit === 'replace' ? { value: credential } : {}) } } }) }, t('judgment.save'))),
        h('p', { role: error ? 'alert' : 'status', 'aria-busy': busy }, t(error === 'unsupported' ? 'management.unsupported' : error ? 'judgment.error' : saved ? 'judgment.saved' : value?.credentialConfigured ? 'judgment.configured' : 'judgment.missing')),
        h('label', null, h('input', { type: 'checkbox', checked: consent, disabled: busy, 'data-judgment-field': 'consent', onChange: e => setConsent(e.target.checked) }), t('judgment.consent')),
        h('button', { type: 'button', className: 'majed-management-refresh', disabled: busy || !consent || !value?.credentialConfigured, 'data-judgment-action': 'validate', onClick: () => { if (!consent) return; setConsent(false); return call({ action: 'validate', consent: true }); } }, t('judgment.test')),
        result ? h('p', { role: 'status', 'data-judgment-result': true }, t('judgment.tested') + '. ' + t('judgment.requested') + ': ' + result.requestedModel + '; ' + t('judgment.actual') + ': ' + result.actualModel,
          ...['input_tokens', 'output_tokens', 'cost'].filter(key => typeof result.usage?.[key] === 'number').map(key => h('span', { key, style: { display: 'block' } }, t('judgment.' + ({ input_tokens: 'inputTokens', output_tokens: 'outputTokens', cost: 'cost' })[key]) + ': ' + result.usage[key]))) : null);
    }

    function CodexAccountsSection({ ctx, t }) {
      const [value, setValue] = React.useState({ enabled: false, state: 'disabled', accounts: [] });
      const [callback, setCallback] = React.useState('');
      const [failure, setFailure] = React.useState(false), [busy, setBusy] = React.useState(false);
      const active = React.useRef(null), mounted = React.useRef(true);
      const call = async (action, payload = {}) => {
        if (active.current) return;
        const controller = new AbortController(); active.current = controller;
        setBusy(true); setFailure(false);
        const current = () => mounted.current && active.current === controller;
        const failClosed = () => setValue(previous => ({ ...previous, state: 'error', runtime: null,
          accounts: previous.accounts.map(account => ({ ...account, state: 'error' })) }));
        let expire;
        const deadline = new Promise((_, reject) => { expire = () => { controller.abort(); reject(new Error('account_timeout')); }; });
        const timer = setTimeout(expire, 35_000);
        // Settle owned work even when the transport ignores cancellation.
        let expireCancellation;
        const cancellation = new Promise((_, reject) => { expireCancellation = () => reject(new Error('account_cancelled')); });
        const cancel = () => { clearTimeout(timer); expireCancellation(); };
        controller.signal.addEventListener('abort', cancel, { once: true });
        try {
          const result = await Promise.race([ctx.connection.rpc.call('/api', 'majed/subscriptions/codex', { action, ...payload }, controller.signal), deadline, cancellation]);
          if (!result.ok) throw Object.assign(new Error('account_operation_failed'), { code: result.error?.code });
          if (current() && !controller.signal.aborted) {
            observeCodexRuntime(result.value.runtimeEnabled);
            setValue(previous => ({ ...result.value, accounts: result.value.accounts || previous.accounts || [] }));
            if (action === 'complete' || action === 'cancel') setCallback('');
          }
        } catch (error) {
          if (current()) {
            setFailure(error.code === 'runtime_unavailable' ? 'runtimeUnavailable' : 'error');
            if (action === 'refresh') {
              // A rejected grant can still commit reauthentication-required state.
              // Hide stale actionable metadata while querying the public snapshot;
              // never retry the credential grant or replace its sanitized error.
              failClosed();
              if (!controller.signal.aborted) try {
                const snapshot = await Promise.race([ctx.connection.rpc.call('/api', 'majed/subscriptions/codex', { action: 'status', mode: 'passive' }, controller.signal), deadline, cancellation]);
                if (snapshot.ok && current() && !controller.signal.aborted) {
                  observeCodexRuntime(snapshot.value.runtimeEnabled);
                  setValue({ ...snapshot.value, runtime: null });
                }
              } catch { /* Retain the original sanitized error and fail-closed metadata. */ }
            }
          }
        }
        finally { clearTimeout(timer); controller.signal.removeEventListener('abort', cancel); if (active.current === controller) { active.current = null; if (mounted.current) setBusy(false); } }
      };
      React.useEffect(() => { mounted.current = true; call('status'); return () => { mounted.current = false; active.current?.abort(); active.current = null; }; }, [ctx]);
      const button = (action, label, payload, disabled = false) => h('button', { type: 'button', className: 'majed-management-refresh', 'data-codex-action': action, disabled: busy || disabled, onClick: () => call(action, payload) }, t('codex.' + label));
      const pending = value.state === 'pending';
      const status = ['failed', 'cancelled'].includes(value.loginState) ? value.loginState : value.state;
      // Only an HTTPS authorize URL from the fixed provider can become a link.
      const authorizeUrl = typeof value.authorizeUrl === 'string' && value.authorizeUrl.startsWith('https://auth.openai.com/oauth/authorize?') ? value.authorizeUrl : null;
      return h('div', { 'data-majed-codex': true, dir: t('management.direction') },
        h('h3', null, t('codex.title')), h('p', null, t('codex.description')),
        h('div', { className: 'majed-management-controls' }, button('enable', value.enabled ? 'disable' : 'enable', { enabled: !value.enabled }), button('status', 'status')),
        value.enabled && h('div', { className: 'majed-management-controls' }, button('runtime', value.runtimeEnabled ? 'modelsDisable' : 'modelsEnable', { enabled: !value.runtimeEnabled }, !value.runtimeAvailable),
          value.runtimeEnabled && button('catalog', 'catalog')),
        value.runtimeEnabled && value.runtime && h(CodexModelSettings, { runtime: value.runtime, call, busy, t }),
        value.enabled && h('div', { className: 'majed-management-controls' }, button('begin', 'begin', {}, pending),
          pending && button('cancel', 'cancel')),
        pending && h('div', null, authorizeUrl && h('a', { href: authorizeUrl, target: '_blank', rel: 'noreferrer noopener' }, t('codex.open')),
          h('label', null, t('codex.callback'), h('input', { type: 'text', 'data-codex-callback': true, value: callback, autoComplete: 'off', spellCheck: false, onChange: event => setCallback(event.target.value) })),
          button('complete', 'complete', { callback }, !callback)),
        h('p', { role: failure ? 'alert' : 'status', 'aria-live': 'polite' }, t('codex.' + (failure || (busy ? 'working' : status)))),
        ...(value.accounts || []).map(account => h('div', { key: account.id }, h('p', null, account.label),
          h('p', null, t('codex.' + account.state)), h('div', { className: 'majed-management-controls' },
            button('refresh', 'refresh', { account: account.id }, account.state === 'error'), button('default', 'default', { account: account.id }, account.default || account.state !== 'connected'), button('remove', 'remove', { account: account.id })),
          value.runtimeEnabled && value.runtime && account.state === 'connected' && h(CodexAccountSettings, { account, preferences: value.runtime?.preferences?.accounts?.[account.id], call, busy, t }))));
    }

    const approvalLabels = {
      en: { title: 'Command hook Approval', refresh: 'Refresh saved commands', disabled: 'Command Approval is disabled in the host configuration.',
        disclosure: 'Commands run on the DSH host as its OS user, outside a sandbox. Original local/remote origin is unknown. Execution is unavailable.',
        id: 'Hook name', command: 'Full command or script path', events: 'Events (comma separated)', cwd: 'Working directory (within selected scope)', watched: 'Watched files (one per line)', source: 'Command source', inline: 'Inline command', file: 'Script file',
        save: 'Save command', review: 'Review command', revoke: 'Revoke Approval', remove: 'Remove command', approve: 'Approve exact command', cancel: 'Cancel review', phrase: 'Type RUN AS DSH USER',
        error: 'The request was refused. Refresh and review the saved command again.', approved: 'Approved', unapproved: 'Needs review', scope: 'Scope', user: 'User', edit: 'Edit command', fingerprint: 'Reviewed fingerprint', expiry: 'Review expires',
      },
      ar: { title: 'الموافقة على أوامر الخطافات', refresh: 'تحديث الأوامر المحفوظة', disabled: 'الموافقة على الأوامر معطلة في إعدادات المضيف.',
        disclosure: 'تعمل الأوامر على مضيف DSH بصلاحيات مستخدم نظام التشغيل وخارج بيئة معزولة. مصدر الطلب المحلي أو البعيد غير معروف. التنفيذ غير متاح.',
        id: 'اسم الخطاف', command: 'الأمر الكامل أو مسار النص البرمجي', events: 'الأحداث (مفصولة بفاصلة)', cwd: 'مجلد العمل (ضمن النطاق المحدد)', watched: 'الملفات المراقبة (ملف لكل سطر)', source: 'مصدر الأمر', inline: 'أمر مباشر', file: 'ملف نص برمجي',
        save: 'حفظ الأمر', review: 'مراجعة الأمر', revoke: 'إلغاء الموافقة', remove: 'إزالة الأمر', approve: 'الموافقة على الأمر المطابق', cancel: 'إلغاء المراجعة', phrase: 'اكتب RUN AS DSH USER',
        error: 'رُفض الطلب. حدّث البيانات وراجع الأمر المحفوظ مجددًا.', approved: 'تمت الموافقة', unapproved: 'يحتاج إلى مراجعة', scope: 'النطاق', user: 'المستخدم', edit: 'تعديل الأمر', fingerprint: 'بصمة المحتوى المراجع', expiry: 'تنتهي المراجعة',
      },
    };
    function CommandApprovalSection({ ctx, t }) {
      const labels = approvalLabels[t('management.direction') === 'rtl' ? 'ar' : 'en'];
      const [state, setState] = React.useState(null), [error, setError] = React.useState(false), [review, setReview] = React.useState(null);
      const [phrase, setPhrase] = React.useState(''), [draft, setDraft] = React.useState({ id: '', command: '', source: 'inline', events: 'SessionStart', cwd: '', watched: '' });
      const [scopeKey, setScopeKey] = React.useState('user');
      const [busy, setBusy] = React.useState(false); const active = React.useRef(null);
      async function call(action, input = {}, selectedKey = scopeKey) {
        if (active.current) return;
        const controller = new AbortController(); active.current = controller; setBusy(true); setError(false);
        const timer = setTimeout(() => controller.abort(), 6000);
        controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
        try {
          const context = state?.contexts?.find(value => JSON.stringify([value.sessionId, value.workspaceId]) === selectedKey);
          if (selectedKey !== 'user' && !context) throw new Error('scope');
          const selector = selectedKey === 'user' ? { scope: 'user' } : { scope: 'project', sessionId: context.sessionId, workspaceId: context.workspaceId };
          const result = await ctx.connection.rpc.call('/api', 'majed/hooks/approval', { action, ...selector, ...input }, controller.signal);
          if (controller.signal.aborted || active.current !== controller) return;
          if (!result?.ok || !result.value) throw new Error('refused');
          if (action === 'review') { setReview(result.value); setPhrase(''); }
          else { setState(result.value); setReview(null); setPhrase(''); }
        } catch { if (active.current === controller) { setError(true); setReview(null); setPhrase(''); } }
        finally { clearTimeout(timer); if (active.current === controller) { active.current = null; setBusy(false); } }
      }
      React.useEffect(() => { call('list'); return () => { active.current?.abort(); active.current = null; }; }, [ctx]);
      const button = (label, action, disabled = false) => h('button', { type: 'button', className: 'majed-management-refresh', disabled: busy || disabled, onClick: action }, label);
      const field = (name, multiline = false) => h('label', { key: name }, labels[name], h(multiline ? 'textarea' : 'input', {
        name, 'aria-label': labels[name], value: draft[name], maxLength: name === 'id' ? 128 : name === 'events' ? 256 : name === 'watched' ? 8192 : 4096, disabled: busy,
        onChange: event => { setDraft({ ...draft, [name]: event.target.value }); setReview(null); },
      }));
      return h('section', { 'aria-label': labels.title, className: 'majed-command-approval', 'data-majed-approval': '' },
        h('h3', null, labels.title), h('p', null, labels.disclosure), button(labels.refresh, () => call('list')),
        error && h('p', { role: 'alert' }, labels.error),
        state?.enabled === false && h('p', { role: 'status' }, labels.disabled),
        state?.enabled === true && h('div', null,
          h('label', null, labels.scope, h('select', { name: 'scope', 'aria-label': labels.scope, value: scopeKey, disabled: busy, onChange: event => { const key = event.target.value; setScopeKey(key); setReview(null); setPhrase(''); call('list', {}, key); } },
            h('option', { value: 'user' }, labels.user), (state.contexts || []).map(value => h('option', { key: value.workspaceId, value: JSON.stringify([value.sessionId, value.workspaceId]) }, value.label)))),
          h('form', { 'data-approval-form': 'definition', onSubmit: event => { event.preventDefault(); const hook = { ...draft.base, id: draft.id, command: draft.command, events: draft.events.split(',').map(value => value.trim()), source: draft.source, enabled: false, watchedFiles: draft.watched.split('\n').map(value => value.trim()).filter(Boolean) }; if (draft.cwd) hook.cwd = draft.cwd; else delete hook.cwd; call('save', { hook }); } },
            field('id'), h('label', null, labels.source, h('select', { name: 'source', value: draft.source, disabled: busy, onChange: event => setDraft({ ...draft, source: event.target.value }) }, h('option', { value: 'inline' }, labels.inline), h('option', { value: 'file' }, labels.file))), field('command', true), field('events'), field('cwd'), field('watched', true),
            h('button', { type: 'submit', className: 'majed-management-refresh', disabled: busy }, labels.save)),
          (state.hooks || []).map(({ hook, approval }) => h('div', { key: hook.id }, h('strong', null, hook.id), h('pre', null, hook.command),
            h('p', null, approval?.valid ? labels.approved : labels.unapproved),
            button(labels.edit, () => { setDraft({ base: hook, id: hook.id, command: hook.command, source: hook.source, events: hook.events.join(','), cwd: hook.cwd || '', watched: (hook.watchedFiles || []).join('\n') }); setReview(null); setPhrase(''); }),
            button(labels.review, () => call('review', { id: hook.id })), button(labels.revoke, () => call('revoke', { id: hook.id })), button(labels.remove, () => call('remove', { id: hook.id }))))),
        review && h('form', { 'data-approval-form': 'confirmation', onSubmit: event => { event.preventDefault(); call('approve', { id: review.review.id, nonce: review.nonce, phrase }); } },
          h('pre', { dir: 'ltr' }, JSON.stringify(review.review, null, 2)), h('p', null, labels.expiry + ': ' + new Date(review.expiresAt).toLocaleTimeString()),
          h('label', null, labels.phrase, h('input', { name: 'confirmation', value: phrase, dir: 'ltr', autoComplete: 'off', maxLength: 64, disabled: busy, onChange: event => setPhrase(event.target.value) })),
          h('button', { type: 'submit', className: 'majed-management-refresh', disabled: busy || phrase !== 'RUN AS DSH USER' }, labels.approve),
          button(labels.cancel, () => { setReview(null); setPhrase(''); })));
    }

    function ManagedMcpSection({ ctx, t }) {
      const arabic = t('management.direction') === 'rtl';
      const enLabels = { title: 'Managed MCP servers', disabled: 'MCP management is disabled in the host configuration.', refresh: 'Refresh servers', add: 'Add server', save: 'Save configuration', cancel: 'Cancel edit', edit: 'Edit', remove: 'Remove', connect: 'Connect', disconnect: 'Disconnect', reconnect: 'Reconnect', probe: 'Test connection', scope: 'Scope', global: 'User/global', name: 'Server name', transport: 'Transport', command: 'Command', args: 'Arguments (one per line)', cwd: 'Working directory', url: 'Server URL', credentialName: 'Credential name', addCredential: 'Add credential', keep: 'Keep stored value', replace: 'Replace value', erase: 'Remove value', secret: 'Credential value', error: 'The operation was refused. Refresh the saved configuration and check ownership, scope and connection settings. Stored credentials are retained.', disclosure: 'Connect and Test start the configured stdio process on the DSH host as its OS user. Saving an active definition restarts that connection. Active means native registration is running; it does not guarantee that the remote server is currently reachable.', saved: 'Saved', 'awaiting-agent': 'Saved; waiting for a matching native session runtime', active: 'Active native registration', failed: 'Connection failed', probing: 'Connecting or testing', 'cleanup-failed': 'Cleanup failed; replacement refused', 'probe-passed': 'Connection test passed; runtime inactive', 'probe-failed': 'Connection test failed', passed: 'passed', unknown: 'Not tested', probeResult: 'Last connection test' };
      const labels = arabic ? { ...enLabels, title: 'خوادم MCP المُدارة', disabled: 'إدارة MCP معطلة في إعدادات المضيف.', refresh: 'تحديث الخوادم', add: 'إضافة خادم', save: 'حفظ الإعدادات', cancel: 'إلغاء التعديل', edit: 'تعديل', remove: 'إزالة', connect: 'اتصال', disconnect: 'قطع الاتصال', reconnect: 'إعادة الاتصال', probe: 'اختبار الاتصال', scope: 'النطاق', global: 'المستخدم/عام', name: 'اسم الخادم', transport: 'النقل', command: 'الأمر', args: 'المعاملات (معامل لكل سطر)', cwd: 'مجلد العمل', url: 'عنوان الخادم', credentialName: 'اسم بيانات الاعتماد', addCredential: 'إضافة بيانات اعتماد', keep: 'الإبقاء على القيمة المحفوظة', replace: 'استبدال القيمة', erase: 'إزالة القيمة', secret: 'قيمة بيانات الاعتماد', error: 'رُفضت العملية. حدّث الإعدادات المحفوظة وتحقق من الملكية والنطاق وإعدادات الاتصال. يتم الاحتفاظ ببيانات الاعتماد المحفوظة.', disclosure: 'يبدأ الاتصال والاختبار عملية stdio المُعدة على مضيف DSH بصلاحيات مستخدم نظام التشغيل. يؤدي حفظ تعريف نشط إلى إعادة تشغيل اتصاله. تعني الحالة النشطة أن التسجيل الأصلي يعمل، ولا تضمن إمكانية الوصول الحالية إلى الخادم البعيد.', saved: 'محفوظ', 'awaiting-agent': 'محفوظ؛ بانتظار تشغيل جلسة أصلية مطابقة', active: 'التسجيل الأصلي نشط', failed: 'فشل الاتصال', probing: 'جارٍ الاتصال أو الاختبار', 'cleanup-failed': 'فشل التنظيف؛ رُفض الاستبدال', 'probe-passed': 'نجح اختبار الاتصال؛ التشغيل غير نشط', 'probe-failed': 'فشل اختبار الاتصال', passed: 'ناجح', unknown: 'لم يُختبر', probeResult: 'آخر اختبار اتصال' } : enLabels;
      const [state, setState] = React.useState(null), [draft, setDraft] = React.useState(null), [scopeKey, setScopeKey] = React.useState('global');
      const [error, setError] = React.useState(false), [busy, setBusy] = React.useState(false), [connecting, setConnecting] = React.useState(false); const active = React.useRef(null);
      async function call(action, extra = {}, key = scopeKey) {
        if (active.current) return;
        setConnecting(['probe', 'reconnect'].includes(action) || (action === 'setEnabled' && extra.enabled === true) || (action === 'save' && extra.server?.enabled === true));
        const controller = new AbortController(); active.current = controller; setBusy(true); setError(false);
        const timer = setTimeout(() => controller.abort(), 15000); controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
        try {
          const context = state?.contexts?.find(value => JSON.stringify([value.sessionId, value.workspaceId]) === key);
          if (key !== 'global' && !context) throw new Error('scope');
          const selector = key === 'global' ? { scope: 'global' } : { scope: 'project', sessionId: context.sessionId, workspaceId: context.workspaceId };
          const result = await ctx.connection.rpc.call('/api', 'majed/mcp', { action, ...selector, ...extra }, controller.signal);
          if (controller.signal.aborted || active.current !== controller) return;
          if (!result?.ok || !result.value) throw new Error('refused');
          setState(result.value); if (action === 'save' || action === 'remove') setDraft(null);
        } catch { if (active.current === controller) setError(true); }
        finally { clearTimeout(timer); if (active.current === controller) { active.current = null; setBusy(false); } }
      }
      React.useEffect(() => { call('list'); return () => { active.current?.abort(); active.current = null; }; }, [ctx]);
      function edit(server) {
        const secrets = server?.transport === 'streamable-http' ? server.headers : server?.env;
        setDraft({ originalName: server?.serverName, base: server, serverName: server?.serverName || '', transport: server?.transport || 'stdio', command: server?.command || '', args: (server?.args || []).join('\n'), cwd: server?.cwd || '', url: server?.url || '', credentialName: '', credentials: Object.keys(secrets || {}).map(name => ({ name, action: 'keep', value: '' })) });
      }
      const button = (text, action, disabled = false) => h('button', { type: 'button', className: 'majed-management-refresh', disabled: busy || disabled, onClick: action }, text);
      const field = (label, name, area = false) => h('label', null, label, h(area ? 'textarea' : 'input', { name, value: draft[name], maxLength: name === 'serverName' ? 32 : 8192, disabled: busy, onChange: event => setDraft({ ...draft, [name]: event.target.value }) }));
      function save(event) {
        event.preventDefault();
        const secrets = {};
        for (const value of draft.credentials) secrets[value.name] = value.action === 'erase' ? null : value.action === 'keep' ? '***' : value.value;
        const server = { serverName: draft.serverName, transport: draft.transport, enabled: draft.base?.enabled ?? false,
          ...(draft.base?.timeout === undefined ? {} : { timeout: draft.base.timeout }), ...(draft.base?.reconnect ? { reconnect: draft.base.reconnect } : {}), ...(draft.base?.instructionLimit === undefined ? {} : { instructionLimit: draft.base.instructionLimit }) };
        if (draft.transport === 'stdio') Object.assign(server, { command: draft.command, args: draft.args ? draft.args.split('\n') : [], env: secrets, ...(draft.cwd ? { cwd: draft.cwd } : {}) });
        else Object.assign(server, { url: draft.url, headers: secrets });
        call('save', { ...(draft.originalName ? { originalName: draft.originalName } : {}), server });
      }
      return h('section', { 'data-majed-mcp': '', className: 'majed-managed-mcp', 'aria-label': labels.title },
        h('h3', null, labels.title), h('p', null, labels.disclosure), button(labels.refresh, () => call('list')),
        busy && connecting && h('p', { role: 'status', 'aria-live': 'polite' }, labels.probing),
        error && h('p', { role: 'alert' }, labels.error), state?.enabled === false && h('p', { role: 'status' }, labels.disabled),
        state?.enabled === true && h('div', null,
          h('label', null, labels.scope, h('select', { name: 'scope', value: scopeKey, disabled: busy, onChange: event => { const key = event.target.value; setScopeKey(key); setDraft(null); call('list', {}, key); } }, h('option', { value: 'global' }, labels.global), (state.contexts || []).map(value => h('option', { key: value.workspaceId, value: JSON.stringify([value.sessionId, value.workspaceId]) }, value.label)))),
          button(labels.add, () => edit()),
          draft && h('form', { 'data-mcp-form': 'definition', onSubmit: save },
            field(labels.name, 'serverName'), h('label', null, labels.transport, h('select', { name: 'transport', value: draft.transport, disabled: busy, onChange: event => setDraft({ ...draft, transport: event.target.value }) }, h('option', { value: 'stdio' }, 'stdio'), h('option', { value: 'streamable-http' }, 'streamable HTTP'))),
            draft.transport === 'stdio' ? h('div', null, field(labels.command, 'command'), field(labels.args, 'args', true), field(labels.cwd, 'cwd')) : field(labels.url, 'url'),
            draft.credentials.map((credential, index) => h('div', { key: credential.name }, h('strong', null, credential.name),
              h('select', { 'aria-label': credential.name, value: credential.action, disabled: busy, onChange: event => setDraft({ ...draft, credentials: draft.credentials.map((value, position) => position === index ? { ...value, action: event.target.value } : value) }) }, ['keep', 'replace', 'erase'].map(value => h('option', { key: value, value }, labels[value]))),
              credential.action === 'replace' && h('input', { type: 'password', autoComplete: 'new-password', 'aria-label': labels.secret, value: credential.value, disabled: busy, maxLength: 4096, onChange: event => setDraft({ ...draft, credentials: draft.credentials.map((value, position) => position === index ? { ...value, value: event.target.value } : value) }) }))),
            field(labels.credentialName, 'credentialName'), button(labels.addCredential, () => { if (!draft.credentialName || draft.credentials.some(value => value.name === draft.credentialName)) return; setDraft({ ...draft, credentialName: '', credentials: [...draft.credentials, { name: draft.credentialName, action: 'replace', value: '' }] }); }),
            h('button', { type: 'submit', className: 'majed-management-refresh', disabled: busy }, labels.save), button(labels.cancel, () => setDraft(null))),
          (state.servers || []).map(server => h('div', { key: server.serverName, 'data-mcp-server': server.serverName }, h('strong', null, server.serverName), h('p', { role: 'status' }, labels[server.status] || labels.saved), h('p', null, labels.probeResult + ': ' + (labels[server.probe] || labels.unknown)),
            button(labels.edit, () => edit(server)), button(server.enabled ? labels.disconnect : labels.connect, () => call('setEnabled', { serverName: server.serverName, enabled: !server.enabled })), button(labels.reconnect, () => call('reconnect', { serverName: server.serverName }), !server.enabled), button(labels.probe, () => call('probe', { serverName: server.serverName })), button(labels.remove, () => call('remove', { serverName: server.serverName }))))));
    }

    function ManagementSection({ ctx, module, t }) {
      const [value, setValue] = React.useState(null);
      const [error, setError] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const active = React.useRef(null);
      const refresh = async (enabled) => {
        // Keep known controls focusable while pending; the synchronous guard also
        // blocks repeated activation before React commits the busy state.
        if (active.current) return;
        const controller = new AbortController(); active.current = controller;
        setBusy(true); setError(null);
        const timer = setTimeout(() => controller.abort(), 6000);
        controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
        try {
          if (!ctx.connection?.rpc?.call) throw new Error('unsupported');
          const result = await ctx.connection.rpc.call('/api', 'majed/settings/status', { module, ...(enabled === undefined ? {} : { enabled }) }, controller.signal);
          if (controller.signal.aborted || active.current !== controller) return;
          if (!result.ok || result.value?.module !== module || typeof result.value.enabled !== 'boolean' || !['ready', 'disabled'].includes(result.value.state)) throw new Error('service');
          setValue(result.value);
        } catch (failure) {
          if (active.current === controller) setError(failure.message === 'unsupported' ? 'unsupported' : /HTTP (401|403)/.test(failure.message) ? 'auth' : 'error');
        } finally { clearTimeout(timer); if (active.current === controller) { active.current = null; setBusy(false); } }
      };
      React.useEffect(() => { refresh(); return () => { active.current?.abort(); active.current = null; }; }, [ctx, module]);
      const Switch = primitives.Switch;
      return h('section', { className: 'majed-management', dir: t('management.direction'), 'aria-label': t('management.' + module), 'data-majed-module': module },
        h('h2', { className: 'majed-management__title', id: 'majed-management-title-' + module }, t('management.' + module)),
        h('p', null, t('management.description')),
        // Native Switch accepts only its declared props, so expose pending
        // unavailability on the containing group as well as our own controls.
        h('div', { className: 'majed-management-controls', role: 'group', 'aria-disabled': busy },
          Switch ? h(Switch, { label: t('management.enable'), checked: value?.enabled ?? false, disabled: !value, onChange: next => refresh(!!next) })
            : h('label', null, h('input', { type: 'checkbox', checked: value?.enabled ?? false, disabled: !value, 'aria-disabled': busy || !value, onChange: event => refresh(event.target.checked) }), t('management.enable')),
          h('button', { type: 'button', className: 'majed-management-refresh', 'aria-disabled': busy, onClick: () => refresh() }, t('management.retry'))),
        h('p', { role: error ? 'alert' : 'status', 'aria-live': 'polite', 'aria-busy': busy }, t('management.' + (error || (busy ? 'loading' : value?.state === 'ready' ? 'ready' : 'disabled')))),
        module === 'subscriptions' && h(CodexAccountsSection, { ctx, t }),
        module === 'hooks' && h(CommandApprovalSection, { ctx, t }),
        module === 'mcp' && h(ManagedMcpSection, { ctx, t }),
        module === 'routing' && h(JudgmentSection, { ctx, t }));
    }

    // ───────────────────────── settings rows ─────────────────────────
    const ROW_CSS = `
.majed-management{min-width:0;max-width:100%;overflow-wrap:anywhere;overflow:auto;max-height:min(100dvh,75vh);color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14);text-align:start}
.majed-management__title{margin:0 0 .5em 0;font:var(--dsw-font-m-18);color:var(--dsw-alias-label-primary)}
.majed-management p{margin-block:1em}
.majed-management-controls{display:flex;flex-wrap:wrap;align-items:center;gap:1em}
.majed-codex-form{display:grid;gap:.75em;margin-block:1em;min-width:0}
.majed-codex-form label{display:flex;flex-wrap:wrap;align-items:center;gap:.5em;min-width:0}
.majed-codex-form input,.majed-codex-form select{max-width:100%;min-width:0;font:inherit;color:inherit;background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2)}
.majed-management-refresh{font:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);padding:.5em 1em;white-space:normal}
.majed-management-refresh:focus-visible{outline:2px solid var(--dsw-alias-label-primary);outline-offset:2px}
.majed-management-refresh[aria-disabled="true"]{opacity:.5}
.majed-skills form,.majed-skills label{display:grid;gap:.5em;margin-block:.5em;min-width:0}
.majed-skills input,.majed-skills textarea,.majed-skills select{box-sizing:border-box;max-width:100%;font:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md)}
.majed-skills pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}
[data-majed-judgment] .majed-management-controls label{display:flex;flex-direction:column;gap:.25em;min-width:0;max-width:100%}
.majed-management [data-judgment-field]{font:inherit;max-width:100%;box-sizing:border-box;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md)}
.majed-command-approval form,.majed-command-approval label{display:flex;flex-direction:column;gap:.5em;min-width:0;margin-block:1em}
.majed-command-approval input,.majed-command-approval textarea,.majed-command-approval select{box-sizing:border-box;max-width:100%;font:inherit;color:inherit;background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);padding:.5em}
.majed-command-approval pre{max-width:100%;white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}
.majed-managed-mcp form,.majed-managed-mcp label{display:flex;flex-direction:column;gap:.5em;min-width:0;margin-block:1em}
.majed-managed-mcp input,.majed-managed-mcp textarea,.majed-managed-mcp select{box-sizing:border-box;max-width:100%;font:inherit;color:inherit;background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);padding:.5em}
@media (max-width:420px){.majed-management-controls{flex-direction:column;align-items:stretch;gap:.5em}.majed-management-refresh{width:100%;justify-content:center}}

.majed-row{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.majed-text{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
.majed-title{color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14)}
.majed-desc{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12)}
.majed-control{display:inline-flex;align-items:center;gap:8px}
.majed-stepper{display:inline-flex;align-items:center;justify-content:center;min-width:72px;height:36px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);position:relative}
.majed-value{min-width:30px;text-align:center;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14)}
.majed-arrows{position:absolute;right:6px;display:flex;flex-direction:column;gap:2px;opacity:0}
.majed-stepper:hover .majed-arrows,.majed-stepper:focus-within .majed-arrows{opacity:1}
.majed-arrow{width:17px;height:12px;display:inline-flex;align-items:center;justify-content:center;border:none;padding:0;border-radius:var(--dsw-radius-xs);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 75%,transparent);color:var(--dsw-alias-label-primary);cursor:pointer;font-size:calc(8px + var(--majed-ui-d,0px));line-height:1}
.majed-arrow:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1)}
.majed-arrow:disabled{color:var(--dsw-alias-label-caption);cursor:default}
.majed-unit{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-s-14)}
.majed-selector{display:inline-flex;align-items:center;gap:12px;height:36px;padding:0 14px;border:none;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14);cursor:pointer}
.majed-selector:hover{background:var(--dsw-alias-interactive-bg-hover)}
.majed-chevron{flex:none}
.majed-test{height:36px;padding:0 12px;border:none;border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);cursor:pointer}
.majed-test:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.majed-test:disabled{opacity:.4;cursor:default}
.majed-status{display:inline-block;margin-top:2px}
.majed-status[data-state=granted]{color:var(--dsw-alias-state-success-primary,#3ecf8e)}
.majed-status[data-state=denied],.majed-status[data-state=unsupported]{color:var(--dsw-alias-state-error-primary,#ff6b6b)}
.majed-ap-trigger{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:200px;height:28px;padding:0 6px 0 8px;border:none;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-strong-13);cursor:pointer}
.majed-ap-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.majed-ap-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.majed-ap-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.majed-ap-dot{flex:none;width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-label-caption)}
.majed-ap-trigger[data-mode=safe] .majed-ap-dot{background:var(--dsw-alias-state-success-primary,#3ecf8e)}
.majed-ap-trigger[data-mode=aggressive] .majed-ap-dot{background:var(--dsw-alias-state-error-primary,#ff6b6b)}
.majed-ap-trigger[data-mode=aggressive]{color:var(--dsw-alias-state-error-primary,#ff6b6b)}
[data-majed-menu-trigger]{width:0!important;height:0!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important;flex:none!important}
`;

    function BidiRow({ t }) {
      const on = useSetting('bidi');
      const Switch = primitives.Switch;
      return h('div', { className: 'majed-row' },
        h('div', { className: 'majed-text' },
          h('div', { className: 'majed-title' }, t('bidi.title')),
          h('div', { className: 'majed-desc' }, t('bidi.description'))),
        h('div', { className: 'majed-control' },
          Switch
            ? h(Switch, { checked: on, label: t('bidi.title'), onChange: (next) => store.set({ bidi: !!next }) })
            : h('input', { type: 'checkbox', checked: on, 'aria-label': t('bidi.title'), onChange: (e) => store.set({ bidi: e.target.checked }) }),
          h('button', { type: 'button', className: 'majed-test', 'aria-label': t('bidi.reset'), onClick: () => store.set({ bidi: DEFAULTS.bidi }) }, t('reset.label'))));
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
          h('span', { className: 'majed-unit' }, t('size.unit')),
          h('button', { type: 'button', className: 'majed-test', 'aria-label': t('size.reset'), onClick: () => set(DEFAULTS.uiFontSize) }, t('reset.label'))));
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
        h('div', { className: 'majed-control' },
          Menu
            ? h(Menu, {
                open, onClose: close, selectedId: value, align: 'end', portal: true, anchor: selector,
                items: FONT_SOURCES.map((id) => ({ id, label: t('font.' + id) })),
                onSelect: (id) => { ref.current && ref.current.focus({ preventScroll: true }); close(); store.set({ fontSource: id }); },
              })
            : h('select', { value, onChange: (e) => store.set({ fontSource: e.target.value }) },
                FONT_SOURCES.map((id) => h('option', { key: id, value: id }, t('font.' + id)))),
          h('button', { type: 'button', className: 'majed-test', 'aria-label': t('font.reset'), onClick: () => { close(); store.set({ fontSource: DEFAULTS.fontSource }); } }, t('reset.label'))));
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
    function ToggleRow({ title, description, checked, onChange, extra }) {
      const Switch = primitives.Switch;
      return h('div', { className: 'majed-row' },
        h('div', { className: 'majed-text' },
          h('div', { className: 'majed-title' }, title),
          h('div', { className: 'majed-desc' }, description)),
        h('div', { className: 'majed-control' },
          Switch
            ? h(Switch, { checked, label: title, onChange: (n) => onChange(!!n) })
            : h('input', { type: 'checkbox', checked, 'aria-label': title, onChange: (e) => onChange(e.target.checked) }),
          extra || null));
    }

    // ───────────────────────── system notifications ─────────────────────────
    let appCtx = null;
    let notificationGeneration = 0;
    const notificationControlGeneration = { notifyDone: 0, notifyAction: 0 };
    const fmt = (str, vars) => String(str).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ''));

    /** Capabilities of THIS browser/webview, used both to pick a delivery path and to explain failures. */
    function notifyCaps() {
      const hasApi = typeof Notification !== 'undefined';
      return {
        api: hasApi,
        secure: window.isSecureContext !== false,
        permission: hasApi ? Notification.permission : 'unsupported',
      };
    }
    // requestPermission() must run inside a user gesture on mobile browsers; callers pass `fromGesture`
    // only from click handlers. Without a gesture we never prompt (it would be silently ignored).
    async function ensurePermission(fromGesture) {
      const caps = notifyCaps();
      if (!caps.api || !caps.secure) return false;
      if (caps.permission === 'granted') return true;
      if (caps.permission === 'denied' || !fromGesture) return false;
      try { return (await Notification.requestPermission()) === 'granted'; } catch (_) { return false; }
    }
    // Persistent notification clicks belong to the service worker, not this window.
    // No supported host click/navigation contract is established here: never borrow
    // a reference plugin's registration or mistake cloned data for a click handler.
    const appFocused = () => !document.hidden && document.hasFocus();
    function shouldNotify() {
      const mode = store.get().notifyMode;
      if (mode === 'off') return false;
      if (mode === 'always') return true;
      return !appFocused();
    }
    const live = new Map();
    async function notify({ title, body, sessionId, tag, control, fromGesture, isCurrent = () => true }) {
      const generation = notificationGeneration, controlGeneration = notificationControlGeneration[control];
      const active = () => appCtx !== null && generation === notificationGeneration && controlGeneration === notificationControlGeneration[control] && isCurrent() && (!!fromGesture || shouldNotify());
      if (!active()) return;
      const permitted = await ensurePermission(!!fromGesture);
      if (!active()) return;
      const options = { body, tag, renotify: true, silent: appFocused(), data: { sessionId } };
      if (permitted && notifyCaps().permission === 'granted') {
        // Constructor delivery supplies a window-owned click handler and needs no
        // companion plugin. Platforms forbidding it use the navigable in-app alert.
        try {
          const n = new Notification(title, options);
          live.set(n, control);
          n.onclose = () => live.delete(n);
          n.onclick = () => {
            try { window.focus(); } catch (_) {}
            try { if (sessionId && appCtx && appCtx.uiWorkspace) appCtx.uiWorkspace.openSession(sessionId); } catch (_) {}
            n.close();
          };
          return;
        } catch (_) { /* e.g. "Illegal constructor" on Android: fall through */ }
      }
      // No competing audio/haptics or DND bypass. This is not OS delivery.
      showNotificationFallback(title, body, sessionId, control);
    }
    let notificationFallback = null;
    function showNotificationFallback(title, body, sessionId, control) {
      if (!document.body) return;
      notificationFallback?.remove();
      const node = document.createElement('div');
      node.className = 'majed-row';
      node.setAttribute('data-majed-notification', '');
      if (control) node.dataset.control = control;
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      const text = document.createElement('span');
      text.textContent = title + ' — ' + body + ' — ' + appCtx.locale.bind(NS)('notify.fallback');
      node.append(text);
      if (sessionId) {
        const open = document.createElement('button');
        open.type = 'button'; open.textContent = appCtx.locale.bind(NS)('notify.open');
        open.onclick = () => { appCtx?.uiWorkspace?.openSession(sessionId); node.remove(); };
        node.append(open);
      }
      const dismiss = document.createElement('button');
      dismiss.type = 'button'; dismiss.textContent = appCtx.locale.bind(NS)('notify.dismiss');
      dismiss.onclick = () => node.remove(); node.append(dismiss);
      document.body.append(node); notificationFallback = node;
    }

    function describePending(p, t) {
      if (!p) return null;
      const kind = p.kind === 'plan-review' ? 'plan' : p.questions ? 'question' : 'approval';
      const key = p.key ?? p.callId;
      if (key == null) return null; // No native identity: do not invent a replay-prone event.
      return { key: JSON.stringify([kind, key]), text: t('notify.msg.' + (kind === 'approval' ? 'approvalPlain' : kind)) };
    }

    // Interface-local only, retained across overlay remounts for this connection.
    // No event/session content is persisted or sent to an external service.
    let notificationPrevious = null;
    const notificationEvents = new Map();

    /** Invisible root component: watches session status through the standard `useSessionStatus` hook. */
    function NotificationWatcher({ useSessionStatus, useSessions, t }) {
      const status = useSessionStatus((m) => m);
      const list = useSessions((l) => l);
      const mounted = React.useRef(false);
      const latest = React.useRef(status);
      latest.current = status;
      React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
      React.useEffect(() => {
        const next = new Map();
        const titleOf = (id) => {
          const row = list && list.byId && list.byId[id];
          return store.get().notifyTitle === true && row && (row.title || row.name) || 'DeepSeek Harness';
        };
        for (const [id, st] of status) {
          const pending = describePending(st.pendingInteraction, t);
          const before = notificationPrevious?.get(id);
          const run = (before?.run || 0) + (st.running === true && !before?.running ? 1 : 0);
          next.set(id, { running: st.running === true, run });
          let seen = notificationEvents.get(id);
          if (!seen) { seen = new Set(); notificationEvents.set(id, seen); }
          const newAction = pending && !seen.has(pending.key);
          // Claim before asynchronous delivery, including suppressed events and
          // baseline snapshots: preference changes/failures never replay an event.
          if (pending) seen.add(pending.key);
          if (!notificationPrevious) continue; // first snapshot = baseline
          const cfg = store.get();
          if (newAction && cfg.notifyAction && shouldNotify()) {
            notify({ title: titleOf(id), body: pending.text, sessionId: id, tag: `${id}:action`, control: 'notifyAction',
              isCurrent: () => mounted.current && describePending(latest.current.get(id)?.pendingInteraction, t)?.key === pending.key });
          } else if (before?.running && st.running === false && !st.pendingInteraction && cfg.notifyDone && shouldNotify()) {
            notify({ title: titleOf(id), body: t('notify.msg.done'), sessionId: id, tag: `${id}:done`, control: 'notifyDone',
              isCurrent: () => mounted.current && notificationPrevious?.get(id)?.run === run && latest.current.get(id)?.running === false && !latest.current.get(id)?.pendingInteraction });
          }
        }
        notificationPrevious = next;
      }, [status, list, t]);
      return null;
    }

    function NotifyModeRow({ t }) {
      const mode = useSetting('notifyMode');
      const [, setTick] = React.useState(0);
      const mounted = React.useRef(false);
      React.useEffect(() => {
        mounted.current = true;
        const refresh = () => setTick((n) => n + 1);
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => { mounted.current = false; window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
      }, []);
      const caps = notifyCaps();
      const statusKey = !caps.secure ? 'notify.status.insecure' : !caps.api ? 'notify.status.unsupported'
        : caps.permission === 'granted' ? 'notify.status.granted'
        : caps.permission === 'denied' ? 'notify.status.denied' : 'notify.status.default';
      const options = NOTIFY_MODES.map((id) => ({ id, label: t('notify.' + id) }));
      const test = h('button', {
        type: 'button', className: 'majed-test',
        onClick: async () => { await notify({ title: 'DeepSeek Harness', body: t('notify.testBody'), tag: 'majed:test', fromGesture: true, isCurrent: () => mounted.current }); if (mounted.current) setTick((n) => n + 1); },
      }, t('notify.test'));
      return h(SelectRow, {
        title: t('notify.title'),
        description: h('span', null, t('notify.description'), h('br'), h('span', { className: 'majed-status', 'data-state': caps.permission }, t(statusKey))),
        value: mode, options, extra: h(React.Fragment, null, test,
          h('button', { type: 'button', className: 'majed-test', 'aria-label': t('notify.modeReset'), onClick: () => store.set({ notifyMode: DEFAULTS.notifyMode }) }, t('reset.label'))),
        onSelect: (id) => { store.set({ notifyMode: id }); if (id !== 'off') ensurePermission(true).then(() => { if (mounted.current) setTick((n) => n + 1); }); },
      });
    }
    function NotifyDoneRow({ t }) {
      const on = useSetting('notifyDone');
      return h(ToggleRow, { title: t('notify.done.title'), description: t('notify.done.description'), checked: on, onChange: (v) => store.set({ notifyDone: v }),
        extra: h('button', { type: 'button', className: 'majed-test', 'aria-label': t('notify.doneReset'), onClick: () => store.set({ notifyDone: DEFAULTS.notifyDone }) }, t('reset.label')) });
    }
    function NotifyTitleRow({ t }) {
      const on = useSetting('notifyTitle') === true;
      return h(ToggleRow, { title: t('notify.titleOptIn'), description: t('notify.titleDescription'), checked: on, onChange: (v) => store.set({ notifyTitle: v }),
        extra: h('button', { type: 'button', className: 'majed-test', 'aria-label': t('notify.titleReset'), onClick: () => store.set({ notifyTitle: false }) }, t('reset.label')) });
    }
    function NotifyActionRow({ t }) {
      const on = useSetting('notifyAction');
      return h(ToggleRow, { title: t('notify.action.title'), description: t('notify.action.description'), checked: on, onChange: (v) => store.set({ notifyAction: v }),
        extra: h('button', { type: 'button', className: 'majed-test', 'aria-label': t('notify.actionReset'), onClick: () => store.set({ notifyAction: DEFAULTS.notifyAction }) }, t('reset.label')) });
    }

    // ───────────────────────── account menu: extra actions live inside it ─────────────────────────
    // DSH builds the account menu (Settings / Feedback / Sign out) from fixed props, and plugins such as
    // Remote access add their button to the `sidebar.footer.action` slot instead. We (1) hide those footer
    // triggers (zero-size, still mounted, so their panels and state keep working) and (2) add an equivalent
    // item to the account menu whenever it opens; selecting it clicks the hidden trigger.
    const ACCOUNT_TRIGGER = 'button[data-signed-out]';
    const FOOTER_SLOT = '[data-slot="sidebar.footer.action"]';
    const accountItems = new Map();   // id -> { id, label, icon?: svg markup, order?, onSelect }

    function footerTriggers() {
      const out = [];
      document.querySelectorAll(FOOTER_SLOT).forEach((slot) => {
        Array.from(slot.children).forEach((child) => {
          const trigger = child.matches('button') ? child : child.querySelector('button');
          if (trigger) out.push(trigger);
        });
      });
      return out;
    }
    function markFooterTriggers(on) {
      for (const t of footerTriggers()) {
        if (on) t.setAttribute('data-majed-menu-trigger', '');
        else t.removeAttribute('data-majed-menu-trigger');
      }
    }
    function footerMenuItems() {
      const out = [];
      for (const trigger of footerTriggers()) {
        const label = (trigger.getAttribute('aria-label') || trigger.getAttribute('title') || trigger.textContent || '').trim();
        if (!label) continue;
        out.push({ id: 'footer:' + label, label, order: 1000 + out.length, svg: trigger.querySelector('svg'), onSelect: () => trigger.click() });
      }
      return out;
    }
    function removeInjectedItems() {
      document.querySelectorAll('[data-majed-item]').forEach((b) => { const w = b.parentElement; if (w) w.remove(); });
    }
    function injectAccountItems(menu, trigger) {
      const buttons = Array.from(menu.querySelectorAll('[role="menuitem"]')).filter((b) => !b.hasAttribute('data-majed-item'));
      if (!buttons.length) return;
      const template = buttons.find((b) => !b.querySelector('[aria-hidden="true"]')) || buttons[0];
      const anchorWrap = buttons[buttons.length - 1].parentElement;   // before Sign out / Sign in
      const have = new Set(Array.from(menu.querySelectorAll('[data-majed-item]')).map((n) => n.getAttribute('data-majed-item')));
      const items = [...footerMenuItems(), ...accountItems.values()].sort((a, b) => (a.order || 0) - (b.order || 0));
      for (const item of items) {
        if (have.has(item.id)) continue;
        const wrap = template.parentElement.cloneNode(true);
        wrap.querySelectorAll('[role="separator"]').forEach((n) => n.remove());
        const btn = wrap.querySelector('[role="menuitem"]');
        btn.setAttribute('data-majed-item', item.id);
        btn.removeAttribute('disabled'); btn.removeAttribute('aria-keyshortcuts');
        const spans = Array.from(btn.children).filter((n) => n.tagName === 'SPAN');
        const iconSpan = spans.length >= 2 ? spans[0] : null;
        const labelSpan = spans.length >= 2 ? spans[1] : spans[0];
        spans.slice(2).forEach((n) => n.remove());
        if (labelSpan) labelSpan.textContent = item.label;
        if (iconSpan) {
          iconSpan.textContent = '';
          if (item.svg) { const c = item.svg.cloneNode(true); c.setAttribute('width', '16'); c.setAttribute('height', '16'); iconSpan.appendChild(c); }
          else if (item.icon) iconSpan.innerHTML = item.icon;
        }
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          try { item.onSelect(); } finally {
            if (trigger.getAttribute('aria-expanded') === 'true') trigger.click();   // close the account menu
          }
        });
        anchorWrap.parentElement.insertBefore(wrap, anchorWrap);
      }
    }
    function syncAccountMenu() {
      const on = store.get().accountMenu;
      markFooterTriggers(on);
      if (!on) { removeInjectedItems(); return; }
      const trigger = document.querySelector(ACCOUNT_TRIGGER);
      if (!trigger || trigger.getAttribute('aria-expanded') !== 'true') return;
      const menus = document.querySelectorAll('[role="menu"]');
      const menu = menus[menus.length - 1];
      if (menu) injectAccountItems(menu, trigger);
    }
    function startAccountMenu() {
      let raf = null;
      const schedule = () => { if (raf === null) raf = requestAnimationFrame(() => { raf = null; syncAccountMenu(); }); };
      const observer = new MutationObserver(schedule);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-expanded'] });
      const unsub = store.subscribe(schedule);
      // Public hook so later features of this plugin (or others) can add items to the same menu.
      const api = {
        register(item) { accountItems.set(item.id, item); schedule(); return () => { accountItems.delete(item.id); removeInjectedItems(); schedule(); }; },
      };
      const hadNamespace = Object.hasOwn(window, '__dshMajed');
      const previousNamespace = window.__dshMajed;
      const namespace = previousNamespace || {};
      const previousMenu = Object.getOwnPropertyDescriptor(namespace, 'accountMenu');
      window.__dshMajed = Object.assign(namespace, { accountMenu: api });
      schedule();
      return () => {
        observer.disconnect(); unsub();
        if (raf !== null) cancelAnimationFrame(raf);
        markFooterTriggers(false); removeInjectedItems(); accountItems.clear();
        if (namespace.accountMenu === api) {
          if (previousMenu) Object.defineProperty(namespace, 'accountMenu', previousMenu);
          else delete namespace.accountMenu;
        }
        if (window.__dshMajed === namespace && !Reflect.ownKeys(namespace).length) {
          if (!hadNamespace) delete window.__dshMajed;
          else window.__dshMajed = previousNamespace;
        }
      };
    }
    function AccountMenuRow({ t }) {
      const on = useSetting('accountMenu');
      return h(ToggleRow, { title: t('account.title'), description: t('account.description'), checked: on, onChange: (v) => store.set({ accountMenu: v }) });
    }

    // ───────────────────────── copy on select ─────────────────────────
    // Copies the current text selection when the user finishes selecting (mouse up / keyboard selection
    // keys), never mid-drag. Selections inside editable fields are ignored so typing is never disturbed.
    function isEditable(el) {
      if (!el) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    }
    // Lightweight toast that matches DSH's own (same tokens, top-centre, ~2s). It lives in <body>, outside
    // React, so it works from plain DOM listeners; one element is reused so rapid copies don't stack.
    const TOAST_CSS = `
.majed-toast{position:fixed;top:40px;left:50%;z-index:2147483000;transform:translate(-50%,-6px);display:flex;align-items:center;gap:10px;width:max-content;max-width:min(640px,calc(100vw - 48px));padding:12px 16px;border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-alias-toast-bg,#2b2b2e);color:var(--dsw-alias-toast-label,#fff);font:var(--dsw-font-s-14);box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.28));pointer-events:none;opacity:0;transition:opacity .16s ease,transform .16s ease}
.majed-toast[data-show]{opacity:1;transform:translate(-50%,0)}
.majed-toast svg{flex:none;width:16px;height:16px;color:var(--dsw-alias-state-success-primary,#3ecf8e)}
.majed-toast[data-tone="error"] svg{color:var(--dsw-alias-state-error-primary,#f06a6a)}
`;
    let toastEl = null, toastTimer = null, toastStyle = null;
    const TOAST_ICON_OK = 'M3 8.5l3.2 3.2L13 4.8', TOAST_ICON_ERROR = 'M4.5 4.5l7 7M11.5 4.5l-7 7';
    function showToast(text, tone) {
      if (!document.body) return;
      if (!toastStyle) { toastStyle = document.createElement('style'); toastStyle.setAttribute('data-majed-toast-style', ''); toastStyle.textContent = TOAST_CSS; document.head.appendChild(toastStyle); }
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'majed-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
        toastEl.innerHTML = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span></span>';
        document.body.appendChild(toastEl);
      }
      toastEl.lastElementChild.textContent = text;
      if (tone === 'error') toastEl.setAttribute('data-tone', 'error'); else toastEl.removeAttribute('data-tone');
      const icon = toastEl.querySelector && toastEl.querySelector('path');
      if (icon) icon.setAttribute('d', tone === 'error' ? TOAST_ICON_ERROR : TOAST_ICON_OK);
      // restart the transition when a toast is already visible
      toastEl.removeAttribute('data-show'); void toastEl.offsetWidth; toastEl.setAttribute('data-show', '');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { if (toastEl) toastEl.removeAttribute('data-show'); }, 2000);
    }
    function disposeToast() {
      clearTimeout(toastTimer);
      if (toastEl) { toastEl.remove(); toastEl = null; }
      if (toastStyle) { toastStyle.remove(); toastStyle = null; }
    }

    function startAutoCopy(onResult) {
      let last = '', stopped = false;
      // Report the outcome only once the clipboard write is confirmed or has genuinely failed.
      const report = (outcome) => { if (!stopped && onResult) onResult(outcome); };
      const fallback = (failure) => {
        let ok = false;
        try { ok = !!document.execCommand('copy'); } catch (_) {}
        report(ok ? 'copied' : failure);
      };
      const copy = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => report('copied'), () => fallback('error'));
        } else fallback('unsupported');
      };
      const run = () => {
        const sel = window.getSelection && window.getSelection();
        if (!sel || sel.isCollapsed) { last = ''; return; }
        const text = sel.toString();
        if (!text || !text.trim() || text === last) return;
        const anchor = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
        if (isEditable(document.activeElement) || isEditable(anchor) || (anchor && anchor.closest && anchor.closest('[contenteditable="true"], .xterm'))) return;
        last = text;
        copy(text);
      };
      let timer = null;
      const later = () => { clearTimeout(timer); timer = setTimeout(run, 30); };
      const onKey = (e) => { if (e.shiftKey || e.key === 'a' || e.key === 'A') later(); };
      document.addEventListener('mouseup', later, true);
      document.addEventListener('dblclick', later, true);
      document.addEventListener('keyup', onKey, true);
      return () => {
        stopped = true;
        clearTimeout(timer);
        document.removeEventListener('mouseup', later, true);
        document.removeEventListener('dblclick', later, true);
        document.removeEventListener('keyup', onKey, true);
      };
    }
    function AutoCopyRow({ t }) {
      const on = useSetting('autoCopy');
      return h(ToggleRow, { title: t('copy.title'), description: t('copy.description'), checked: on, onChange: (v) => store.set({ autoCopy: v }) });
    }

    // ───────────────────────── command classifier (inlined from lib/classify.cjs; tested in test/) ─────────────────────────
    const CLASSIFY = (function () {
    /**
     * Deterministic approval classifier for shell commands (no LLM, no network).
     *
     * Verdicts:
     *   'allow' — every part is positively recognised as non-destructive and contained
     *   'ask'   — unknown / ambiguous: a human decides (the default for anything not recognised)
     *   'deny'  — matches a hard rule (destroys data, rewrites shared history, leaks secrets, escalates the
     *             machine); never auto-approved, even in "aggressive" mode's sibling "safe" mode.
     *
     * Principles (from Claude Code auto mode, Codex `is_safe_command`, anumati, Qwen auto-mode docs):
     *  - judge real effect, not surface text: a chain is safe only if EVERY segment is safe;
     *  - allow-list by shape (program + sub-command + flags), never "anything except X";
     *  - command substitution, eval, process substitution, here-docs and unknown redirects => not provable => ask;
     *  - hard-deny the irreversible / shared-state / secret / persistence classes regardless of intent.
     *
     * The module is plain ES5-ish JS so it can be inlined into the browser client and unit-tested in Node.
     */

    /* ─────────────────────────── tokenizer ─────────────────────────── */

    /** Split a command line into top-level segments + words. Returns null when the line is not statically analysable. */
    function parse(line) {
      const segments = [];       // { words: string[], op: string|null (operator that FOLLOWS), redirects: string[] }
      let words = [], cur = '', has = false, quote = null, i = 0;
      let redirects = [];
      const pushWord = () => { if (has) { words.push(cur); cur = ''; has = false; } };
      const pushSeg = (op) => { pushWord(); if (words.length || redirects.length || op) segments.push({ words, op, redirects }); words = []; redirects = []; };
      const n = line.length;
      while (i < n) {
        const c = line[i];
        if (quote === "'") { if (c === "'") quote = null; else { cur += c; has = true; } i++; continue; }
        if (quote === '"') {
          if (c === '"') { quote = null; i++; continue; }
          if (c === '\\' && i + 1 < n) { cur += line[i + 1]; has = true; i += 2; continue; }
          if (c === '$' && (line[i + 1] === '(' || line[i + 1] === '{')) return null;   // substitution / expansion with code
          if (c === '`') return null;
          cur += c; has = true; i++; continue;
        }
        if (c === "'" || c === '"') { quote = c; has = true; i++; continue; }
        if (c === '\\') { if (i + 1 < n) { cur += line[i + 1]; has = true; i += 2; continue; } return null; }
        if (c === '`') return null;
        if (c === '$' && (line[i + 1] === '(' || line[i + 1] === '{')) return null;
        if ((c === '<' || c === '>') && line[i + 1] === '(') return null;               // process substitution
        if (c === '<' && line[i + 1] === '<') return null;                              // here-doc / here-string
        if (c === '\n' || c === ';') { pushSeg(c === ';' ? ';' : '\n'); i++; continue; }
        if (c === '&') {
          if (line[i + 1] === '&') { pushSeg('&&'); i += 2; continue; }
          if (line[i - 1] === '>' || line[i + 1] === '>') { cur += c; has = true; i++; continue; }  // 2>&1, &>
          pushSeg('&'); i++; continue;
        }
        if (c === '|') {
          if (line[i + 1] === '|') { pushSeg('||'); i += 2; continue; }
          pushSeg('|'); i++; continue;
        }
        if (c === ' ' || c === '\t') { pushWord(); i++; continue; }
        if (c === '>' || c === '<') {
          // redirection: capture target word
          pushWord();
          let op = c; i++;
          if (line[i] === '>') { op += '>'; i++; }
          if (line[i] === '&') { op += '&'; i++; }
          while (line[i] === ' ') i++;
          let target = '';
          while (i < n && !/[\s;&|<>]/.test(line[i])) { target += line[i]; i++; }
          redirects.push(op + target);
          continue;
        }
        cur += c; has = true; i++;
      }
      if (quote) return null;
      pushSeg(null);
      return segments.filter((s) => s.words.length || s.redirects.length);
    }

    /* ─────────────────────────── helpers ─────────────────────────── */

    const SECRET_PATH = /(^|\/)(\.ssh|\.aws|\.gnupg|\.kube|\.docker\/config\.json|\.netrc|\.npmrc|\.pypirc|id_(rsa|ed25519|ecdsa|dsa)|\.env(\.[\w.-]+)?|credentials(\.json)?|secrets?(\.[\w]+)?|[\w.-]*\.(pem|key|p12|pfx|keystore))$/i;
    const SECRET_CONTAINS = /(\.ssh\/|\.aws\/|\.gnupg\/|Library\/Keychains|\/etc\/(shadow|sudoers)|keychain)/i;
    function touchesSecret(w) { return SECRET_PATH.test(w) || SECRET_CONTAINS.test(w); }

    function basename(p) { const m = /([^/]+)$/.exec(p); return m ? m[1] : p; }

    /** Strip leading env assignments (FOO=bar cmd) and harmless wrappers. Returns { env, words } or null if env sets code-affecting vars. */
    const DANGEROUS_ENV = /^(LD_PRELOAD|LD_LIBRARY_PATH|DYLD_[A-Z_]+|PATH|NODE_OPTIONS|PYTHONPATH|PYTHONSTARTUP|BASH_ENV|ENV|PROMPT_COMMAND|GIT_SSH_COMMAND|GIT_EXTERNAL_DIFF|GIT_PAGER|GIT_ASKPASS|SSH_ASKPASS|EDITOR|VISUAL|PAGER|SHELL|HOME)$/;
    function stripPrefix(words) {
      let i = 0;
      while (i < words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i])) {
        if (DANGEROUS_ENV.test(words[i].split('=')[0])) return null;
        i++;
      }
      let w = words.slice(i);
      for (;;) {
        if (w[0] === 'time' || w[0] === 'command' || w[0] === 'builtin' || w[0] === 'nohup') { w = w.slice(1); continue; }
        if (w[0] === 'env') { // env with no assignments/options only
          if (w.length > 1 && !/^-/.test(w[1]) && !/=/.test(w[1])) { w = w.slice(1); continue; }
          return null;
        }
        if (w[0] === 'timeout' && w.length > 2 && /^[\d.]+[smhd]?$/.test(w[1])) { w = w.slice(2); continue; }
        break;
      }
      return w;
    }

    function hasAny(words, set) { return words.some((x) => set.has(x)); }
    const setOf = (...a) => new Set(a);

    /* ─────────────────────────── hard-deny rules ─────────────────────────── */

    /** @returns reason string when the SEGMENT (already prefix-stripped) is a hard-deny, else null */
    function hardDenySegment(w, ctx) {
      const cmd = basename(w[0]);
      const args = w.slice(1);
      const joined = w.join(' ');

      // privilege / system
      if (['sudo', 'su', 'doas', 'pkexec', 'launchctl', 'systemctl', 'service', 'crontab', 'at', 'passwd', 'chown', 'chgrp', 'mount', 'umount', 'diskutil', 'fdisk', 'mkfs', 'dd', 'shutdown', 'reboot', 'halt', 'killall', 'pkill', 'kill', 'csrutil', 'spctl', 'defaults', 'scutil', 'networksetup', 'pmset', 'sysctl', 'visudo', 'useradd', 'userdel', 'dscl', 'security', 'osascript'].includes(cmd)) return `system/privilege command: ${cmd}`;
      if (cmd === 'chmod' && (args.includes('-R') || args.some((a) => /^[0-7]*7[0-7]*7$/.test(a) || a === 'u+s' || a === 'g+s' || a === '+s' || a === 'a+rwx' || a === '777'))) return 'dangerous chmod';
      // destructive filesystem
      if (cmd === 'rm' || cmd === 'rmdir' || cmd === 'unlink' || cmd === 'shred' || cmd === 'srm' || cmd === 'trash') {
        // recursive or force deletes, or anything pointing outside the project / at home, root, or wildcards at top level
        const rec = args.some((a) => /^-[a-zA-Z]*[rRf][a-zA-Z]*$/.test(a) || a === '--recursive' || a === '--force');
        const targets = args.filter((a) => !a.startsWith('-'));
        const outside = targets.some((t) => t === '/' || t === '~' || t.startsWith('~/') || t.startsWith('/') || t === '.' || t === '..' || t.startsWith('../') || /^\*+$/.test(t) || t === './*' || /\$/.test(t));
        if (rec || outside || cmd !== 'rm') return `destructive delete (${cmd})`;
      }
      if (cmd === 'find' && args.some((a) => ['-delete', '-exec', '-execdir', '-ok', '-okdir', '-fprint', '-fprint0', '-fprintf', '-fls'].includes(a))) return 'find with delete/exec';
      if (cmd === 'truncate' || cmd === 'mv' && targetsOutside(args)) return `${cmd} touching paths outside the project`;
      // git: history rewrite, shared state, secrets
      if (cmd === 'git') {
        const sub = gitSub(args);
        if (sub) {
          const rest = sub.rest;
          if (sub.name === 'push') {
            const force = rest.some((a) => a === '-f' || a === '--force' || a.startsWith('--force-with-lease') || a === '--mirror' || a === '--delete' || a === '-d' || /^\+/.test(a) || /^:/.test(a));
            const toProtected = rest.some((a) => /(^|[:/ ])(main|master|develop|trunk|release[\w/.-]*|production|prod)$/i.test(a));
            if (force) return 'git push with force/delete';
            if (toProtected) return 'git push to a protected branch';
            return null; // plain push is "ask", not hard-deny
          }
          if (sub.name === 'reset' && rest.includes('--hard')) return 'git reset --hard (discards work)';
          if (sub.name === 'clean' && rest.some((a) => /^-[a-z]*[fdx][a-z]*$/i.test(a))) return 'git clean (deletes untracked files)';
          if (sub.name === 'checkout' && (rest.includes('--') && rest.includes('.') || rest.includes('-f') || rest.includes('--force'))) return 'git checkout discarding changes';
          if (sub.name === 'restore' && !rest.includes('--staged')) return 'git restore discarding changes';
          if (sub.name === 'stash' && ['drop', 'clear'].includes(rest[0])) return 'git stash drop/clear';
          if (sub.name === 'branch' && rest.some((a) => a === '-D' || a === '--delete' && rest.includes('--force'))) return 'git branch -D';
          if (['filter-branch', 'filter-repo', 'update-ref', 'reflog'].includes(sub.name) && (sub.name !== 'reflog' || ['expire', 'delete'].includes(rest[0]))) return `git ${sub.name} (history rewrite)`;
          if (sub.name === 'gc' && rest.some((a) => a.startsWith('--prune'))) return 'git gc --prune';
          if (sub.name === 'config' && rest.some((a) => /^(--global|--system)$/.test(a))) return 'git config global/system';
          if (rest.some((a) => a === '--no-verify' || a === '--no-gpg-sign' || a === '-n' && sub.name === 'commit')) return 'bypasses git hooks/signing';
        }
      }
      // GitHub CLI: shared-state & destructive
      if (cmd === 'gh') {
        const a = args.filter((x) => !x.startsWith('-'));
        if (a[0] === 'repo' && ['delete', 'archive', 'rename', 'edit', 'transfer'].includes(a[1])) return `gh repo ${a[1]}`;
        if (a[0] === 'secret' || a[0] === 'auth' && ['logout', 'token', 'refresh', 'login'].includes(a[1]) || a[0] === 'ssh-key' || a[0] === 'gpg-key' || a[0] === 'codespace' && a[1] === 'delete') return `gh ${a[0]} ${a[1] || ''}`.trim();
        if (a[0] === 'pr' && ['merge', 'close'].includes(a[1]) || a[0] === 'release' && ['create', 'delete'].includes(a[1]) || a[0] === 'workflow' && ['run', 'enable', 'disable'].includes(a[1]) || a[0] === 'run' && ['cancel', 'delete', 'rerun'].includes(a[1])) return `gh ${a[0]} ${a[1]} (affects shared state)`;
        if (a[0] === 'api') {
          const m = /(?:^|\s)(-X|--method)[ =]?(\w+)/i.exec(joined);
          if (m && m[2].toUpperCase() !== 'GET') return 'gh api non-GET';
          if (args.some((x) => x === '-f' || x === '-F' || x === '--field' || x === '--raw-field' || x === '--input')) return 'gh api with request body (implies POST)';
        }
      }
      // package publication / registry
      if (['npm', 'pnpm', 'yarn', 'bun'].includes(cmd) && args.some((a) => ['publish', 'unpublish', 'deprecate', 'login', 'adduser', 'token', 'owner', 'access', 'dist-tag'].includes(a))) return `${cmd} registry action`;
      if (cmd === 'twine' || cmd === 'cargo' && args[0] === 'publish' || cmd === 'gem' && args[0] === 'push') return 'package publish';
      // infra & containers & cloud
      if (['terraform', 'tofu', 'pulumi'].includes(cmd) && args.some((a) => ['apply', 'destroy', 'import', 'state', 'taint', 'untaint', 'up', 'refresh'].includes(a))) return `${cmd} mutating`;
      if (cmd === 'kubectl' && args.some((a) => ['delete', 'apply', 'replace', 'patch', 'drain', 'cordon', 'scale', 'rollout', 'exec', 'cp', 'edit', 'create', 'run', 'annotate', 'label', 'set'].includes(a))) return 'kubectl mutating';
      if (cmd === 'helm' && args.some((a) => ['install', 'upgrade', 'uninstall', 'rollback', 'delete'].includes(a))) return 'helm mutating';
      if (['aws', 'gcloud', 'az', 'doctl', 'heroku', 'vercel', 'netlify', 'flyctl', 'fly', 'wrangler', 'firebase', 'supabase', 'railway', 'stripe'].includes(cmd) && !args.some((a) => ['--version', '--help', 'help', 'version'].includes(a))) return `cloud CLI (${cmd})`;
      if (cmd === 'docker' || cmd === 'podman') {
        const a = args.filter((x) => !x.startsWith('-'));
        if (['rm', 'rmi', 'system', 'volume', 'network', 'prune', 'kill', 'push', 'login', 'logout', 'exec', 'cp', 'commit', 'run', 'compose', 'stop', 'restart'].includes(a[0]) || args.includes('--privileged') || args.some((x) => x.startsWith('-v') || x === '--volume' || x === '--mount')) return `${cmd} mutating`;
      }
      // databases
      if (['psql', 'mysql', 'mysqldump', 'mongosh', 'mongo', 'redis-cli', 'sqlite3', 'mariadb', 'pg_dump', 'pg_restore', 'dropdb', 'createdb'].includes(cmd) && /DROP|DELETE|TRUNCATE|UPDATE|INSERT|ALTER|GRANT|FLUSH|--eval|-c\s/i.test(joined)) return 'database write';
      // exfiltration / downloads executed / raw network
      if (['nc', 'ncat', 'netcat', 'socat', 'telnet', 'ssh', 'scp', 'sftp', 'rsync', 'ftp', 'tftp', 'sshpass', 'ngrok', 'cloudflared', 'tailscale', 'wg', 'openssl', 'nmap', 'masscan', 'tcpdump', 'dig', 'nslookup', 'whois', 'ping', 'traceroute', 'mitmproxy'].includes(cmd) && !['ping'].includes(cmd)) return `network/remote tool: ${cmd}`;
      if (['curl', 'wget', 'http', 'https', 'httpie', 'aria2c', 'xh'].includes(cmd) && !(cmd === 'wget' && !args.some((a) => /^(--post|--body|--header|--user|--password|--load-cookies|--certificate|--private-key)/.test(a) || a === '-U' && false))) {
        const upload = args.some((a) => ['-d', '--data', '--data-binary', '--data-raw', '--data-urlencode', '-F', '--form', '-T', '--upload-file', '-X', '--request', '--post-data', '--post-file', '--method', '-u', '--user', '-H', '--header', '--cookie', '-b', '--output', '-o', '-O', '--remote-name'].includes(a) || /^-(?:[a-zA-Z]*[dFTXuHbo])$/.test(a) || a.startsWith('--data') || a.startsWith('--form') || a.startsWith('--post'));
        if (upload) return `${cmd} with body/auth/output (possible exfiltration or download)`;
        // plain GET without options is classed in `allow` rules (read-only fetch of a URL), not here
      }
      // secrets read or modified
      if (w.some((x) => touchesSecret(x)) && !['ls', 'stat', 'file', 'test', '[', 'git'].includes(cmd)) return 'touches secrets or credentials';
      if (['security', 'op', 'gpg', 'pass', 'vault', 'doppler', 'sops', 'age', 'keychain', 'ssh-add', 'ssh-keygen', 'ssh-agent'].includes(cmd)) return `credential tool: ${cmd}`;
      // shell indirection that hides what runs
      if (['eval', 'exec', 'source', '.', 'xargs', 'parallel', 'watch', 'script', 'expect', 'screen', 'tmux', 'disown', 'setsid', 'trap', 'alias', 'unalias', 'export', 'unset', 'umask', 'ulimit', 'complete', 'hash'].includes(cmd) && !(cmd === 'export' && false)) return `shell indirection/state change: ${cmd}`;
      const SHELLS = ['sh', 'bash', 'zsh', 'fish', 'dash', 'ksh', 'csh', 'tcsh'];
      if (SHELLS.includes(cmd) && args.some((a) => /^-[a-zA-Z]*c$/.test(a) || a === '--command' || a === '-')) return 'nested shell -c';
      // `... | sh` / `... | python`: code arriving on stdin is executed without being inspected
      if ((SHELLS.includes(cmd) || ['python', 'python3', 'node', 'ruby', 'perl', 'php', 'deno', 'bun'].includes(cmd)) && args.every((a) => a.startsWith('-')) && ctx && ctx.piped) return `pipes data into ${cmd} (executes it)`;
      if (['python', 'python3', 'python2', 'node', 'nodejs', 'deno', 'bun', 'ruby', 'perl', 'php', 'lua', 'osascript', 'pwsh', 'powershell', 'Rscript', 'julia', 'swift', 'go'].includes(cmd) && args.some((a) => /^(-c|-e|-E|-r|--eval|-p|--print|-x)$/.test(a) || a === 'run' && cmd === 'go' || a === '-')) return `inline code via ${cmd}`;
      // launching / mac side effects
      if (['open', 'xdg-open', 'pbcopy', 'pbpaste', 'say', 'afplay', 'screencapture', 'caffeinate', 'ditto', 'hdiutil', 'installer', 'pkgutil', 'brew', 'port', 'apt', 'apt-get', 'yum', 'dnf', 'pacman', 'snap', 'pip', 'pip3', 'pipx', 'conda', 'gem', 'cpan', 'cargo'].includes(cmd) && !(cmd === 'cargo' && ['build', 'check', 'test', 'fmt', 'clippy', 'doc', 'tree', 'metadata', 'bench'].includes(args[0])) && !(cmd === 'brew' && ['list', 'info', 'search', 'outdated', 'deps', 'config', '--version'].includes(args[0])) && !(['pip', 'pip3'].includes(cmd) && ['list', 'show', 'freeze', 'check', '--version', 'index'].includes(args[0]))) return `system/package manager: ${cmd}`;
      // writing outside project via tee / sed -i / dd of=
      if (cmd === 'tee' && args.some((a) => !a.startsWith('-') && (a.startsWith('/') || a.startsWith('~') || a.startsWith('..')))) return 'tee outside project';
      return null;
    }

    function targetsOutside(args) {
      return args.filter((a) => !a.startsWith('-')).some((t) => t.startsWith('/') || t.startsWith('~') || t.startsWith('..') || /\$/.test(t));
    }

    /** Locate the git sub-command skipping global options (-C <dir>, -c k=v, --git-dir=…, --no-pager …). */
    function gitSub(args) {
      let i = 0;
      while (i < args.length) {
        const a = args[i];
        if (a === '-C' || a === '-c' || a === '--git-dir' || a === '--work-tree' || a === '--namespace' || a === '--exec-path') { i += 2; continue; }
        if (a.startsWith('--git-dir=') || a.startsWith('--work-tree=') || a.startsWith('--exec-path=') || a.startsWith('--namespace=')) { i++; continue; }
        if (a.startsWith('-')) { i++; continue; }
        return { name: a, rest: args.slice(i + 1), globals: args.slice(0, i) };
      }
      return null;
    }
    function gitHasUnsafeGlobals(globals) {
      for (let i = 0; i < globals.length; i++) {
        const a = globals[i];
        if (a === '-c') { const v = globals[i + 1] || ''; if (/^(core\.(pager|editor|sshcommand|fsmonitor|hookspath|askpass)|alias\.|credential\.|protocol\.|http\.|url\.|diff\.external|filter\.|include|receive\.|uploadpack\.)/i.test(v)) return true; i++; continue; }
        if (a === '--exec-path' || a.startsWith('--exec-path') || a === '--git-dir' || a.startsWith('--git-dir=') || a === '--work-tree' || a.startsWith('--work-tree=')) return true;
      }
      return false;
    }

    /* ─────────────────────────── allow rules ─────────────────────────── */

    const READ_ONLY = setOf('ls', 'll', 'la', 'dir', 'pwd', 'cat', 'bat', 'head', 'tail', 'less', 'more', 'wc', 'nl', 'tac', 'rev', 'cut', 'sort', 'uniq', 'tr', 'fold', 'fmt', 'column', 'paste', 'comm', 'join', 'diff', 'cmp', 'basename', 'dirname', 'realpath', 'readlink', 'stat', 'file', 'du', 'df', 'tree', 'which', 'whereis', 'type', 'whoami', 'id', 'hostname', 'uname', 'date', 'uptime', 'arch', 'nproc', 'echo', 'printf', 'true', 'false', 'test', '[', 'sleep', 'seq', 'expr', 'md5', 'md5sum', 'shasum', 'sha1sum', 'sha256sum', 'cksum', 'b2sum', 'strings', 'hexdump', 'od', 'xxd', 'jq', 'yq', 'rg', 'ag', 'fd', 'fdfind', 'locate', 'grep', 'egrep', 'fgrep', 'zgrep', 'wc', 'env', 'printenv', 'ps', 'lsof', 'top', 'cd', 'pushd', 'popd', 'dirs', 'man', 'help', 'info', 'tldr', 'cal', 'bc', 'dc', 'tput', 'clear', 'lscpu', 'free', 'vm_stat', 'sw_vers', 'ioreg', 'system_profiler');
    // printenv/env/ps/lsof may print secrets in env; keep but they are read-only to the machine. Output is local only.

    /** programs whose output could be redirected harmfully are handled by redirect rules below. */
    function safeFind(args) { return !args.some((a) => ['-delete', '-exec', '-execdir', '-ok', '-okdir', '-fprint', '-fprint0', '-fprintf', '-fls'].includes(a)); }
    function safeSed(args) { return !args.some((a) => a === '-i' || a.startsWith('-i') || a === '--in-place' || a === '-f' || a === '--file' || a === 'w' || /(^|;|\s)[wWeE]\s/.test(a) || /\/[gI]*[we]\b/.test(a) && /s\//.test(a)); }
    function safeAwk(args) { return !args.some((a) => /system\s*\(|getline\s*<|>\s*"|print\s*>|\|\s*"|-f\b/.test(a)) && !args.includes('-f'); }
    function safeSort(args) { return !args.some((a) => a === '-o' || a.startsWith('--output') || a.startsWith('-o')); }
    function safeTree(args) { return !args.some((a) => a === '-o'); }

    const GIT_READ = setOf('status', 'log', 'diff', 'show', 'blame', 'shortlog', 'describe', 'rev-parse', 'rev-list', 'ls-files', 'ls-tree', 'ls-remote', 'cat-file', 'grep', 'remote', 'config', 'branch', 'tag', 'stash', 'reflog', 'for-each-ref', 'show-ref', 'name-rev', 'merge-base', 'whatchanged', 'count-objects', 'fsck', 'check-ignore', 'check-attr', 'var', 'version', 'help', 'diff-tree', 'diff-index', 'diff-files', 'ls-remote', 'show-branch', 'verify-commit', 'verify-tag', 'worktree', 'submodule', 'fetch', 'add', 'restore', 'commit', 'switch', 'checkout', 'pull', 'merge', 'rebase', 'cherry-pick', 'mv', 'apply', 'format-patch', 'archive', 'bisect', 'revert', 'notes', 'sparse-checkout', 'maintenance', 'gc', 'prune', 'rm', 'init', 'clone', 'push');
    // Which git sub-commands are acceptable without a human, and under which flags:
    function gitAllowed(sub) {
      const s = sub.name, r = sub.rest;
      const noFlags = (allowed) => r.every((a) => !a.startsWith('-') || allowed.test(a));
      switch (s) {
        case 'status': case 'log': case 'diff': case 'show': case 'blame': case 'shortlog': case 'describe': case 'rev-parse': case 'rev-list': case 'ls-files': case 'ls-tree': case 'cat-file': case 'grep': case 'for-each-ref': case 'show-ref': case 'name-rev': case 'merge-base': case 'whatchanged': case 'count-objects': case 'check-ignore': case 'check-attr': case 'var': case 'version': case 'help': case 'diff-tree': case 'diff-index': case 'diff-files': case 'show-branch': case 'verify-commit': case 'verify-tag':
          return !r.some((a) => a === '--output' || a.startsWith('--output=') || a === '--ext-diff' || a === '--textconv' && false || a === '--open-files-in-pager' || a.startsWith('--open-files-in-pager'));
        case 'ls-remote': return r.every((a) => !a.startsWith('-') || /^(--heads|--tags|--refs|-h|-t|--symref|--get-url)$/.test(a));
        case 'fsck': return r.every((a) => !a.startsWith('-') || /^(--no-progress|--connectivity-only|--full|--strict|--unreachable|--lost-found)$/.test(a)) && !r.includes('--lost-found');
        case 'remote': return r.length === 0 || r[0] === '-v' || r[0] === 'show' || r[0] === 'get-url';
        case 'config': return r.some((a) => a === '--get' || a === '--get-all' || a === '--list' || a === '-l' || a === '--get-regexp') && !r.some((a) => ['--global', '--system', '--unset', '--add', '--replace-all', '--edit', '-e', '--file', '-f'].includes(a));
        case 'branch': return r.length === 0 || r.every((a) => ['--list', '-l', '--show-current', '-a', '--all', '-r', '--remotes', '-v', '-vv', '--verbose', '--contains', '--merged', '--no-merged'].includes(a) || a.startsWith('--format=') || a.startsWith('--sort='));
        case 'tag': return r.length === 0 || r.every((a) => ['-l', '--list', '-n'].includes(a) || a.startsWith('--sort=') || a.startsWith('--format=') || a === '--contains' || a === '--merged') || (r[0] === '-l' || r[0] === '--list');
        case 'stash': return r[0] === 'list' || r[0] === 'show';
        case 'reflog': return r.length === 0 || r[0] === 'show' || r[0] === 'list' || (r[0].startsWith('-') ) && !['expire', 'delete'].includes(r[0]);
        case 'worktree': return r[0] === 'list';
        case 'submodule': return r[0] === 'status' || r[0] === 'summary' || r[0] === 'foreach' && false;
        case 'notes': return r[0] === 'list' || r[0] === 'show';
        case 'bisect': return r[0] === 'log' || r[0] === 'visualize' && false;
        // local, reversible, contained repo mutations (no remote effect, nothing is destroyed; git keeps the objects)
        case 'add': return !r.some((a) => a === '-f' || a === '--force' || a === '--ignore-errors') && !r.some((a) => touchesSecret(a));
        case 'commit': return !r.some((a) => a === '--no-verify' || a === '-n' || a === '--no-gpg-sign' || a === '--amend' || a === '--allow-empty-message' || a === '-C' && false) && !r.some((a) => touchesSecret(a));
        case 'fetch': return !r.some((a) => a === '--prune' || a === '-p' || a === '--force' || a === '-f' || a === '--update-head-ok' || a === '--upload-pack' || a.startsWith('--upload-pack='));
        case 'switch': case 'checkout': return !r.some((a) => a === '-f' || a === '--force' || a === '--discard-changes' || a === '--' || a === '--orphan' || a === '-B' && false) && !r.includes('.') ;
        case 'restore': return r.includes('--staged') && !r.includes('--worktree') && !r.includes('-W');
        case 'merge': return r.includes('--no-commit') || r.includes('--ff-only') || r.includes('--abort') || r.includes('--no-ff') && false;
        case 'cherry-pick': case 'revert': return r.includes('--no-commit') || r.includes('-n') || r.includes('--abort') || r.includes('--quit');
        case 'rebase': return r.includes('--abort') || r.includes('--continue') && false || r.includes('--quit');
        case 'format-patch': return !r.some((a) => a === '-o' || a.startsWith('--output-directory') || a === '--stdout' && false) || true;
        case 'archive': return !r.some((a) => a === '-o' || a.startsWith('--output') || a.startsWith('--remote'));
        case 'mv': return !targetsOutside(r);
        case 'rm': return r.includes('--cached') && !r.some((a) => a === '-f' || a === '--force' || a === '-r' || a === '-R' || a === '--') ;
        case 'init': return !r.some((a) => a.startsWith('--template') || a.startsWith('--separate-git-dir')) && !targetsOutside(r);
        case 'clone': return false;   // network + arbitrary hooks/code from elsewhere => ask
        case 'pull': return false;    // merges remote code into the working tree => ask
        case 'push': return false;    // shared state => ask (force/protected are hard-denied earlier)
        case 'apply': return r.includes('--check') || r.includes('--stat') || r.includes('--numstat') || r.includes('--summary');
        case 'gc': case 'prune': case 'maintenance': case 'sparse-checkout': return false;
        default: return false;
      }
    }

    /** Package scripts and toolchains: contained to the project; run project code but that is what the user asked to do. */
    const SAFE_NPM_SCRIPTS = setOf('test', 'lint', 'typecheck', 'type-check', 'build', 'check', 'format', 'fmt', 'format:check', 'lint:fix', 'coverage', 'test:unit', 'test:coverage', 'test:e2e', 'tsc', 'compile', 'validate', 'verify', 'docs', 'dev:check');
    function nodeAllowed(cmd, args) {
      const a = args.filter((x) => !x.startsWith('-'));
      if (['npm', 'pnpm', 'yarn', 'bun'].includes(cmd)) {
        const sub = a[0];
        if (['ls', 'list', 'll', 'why', 'outdated', 'view', 'info', 'show', 'explain', 'audit', 'root', 'bin', 'prefix', 'config', 'pack'].includes(sub)) return sub !== 'config' || args.includes('get') || args.includes('list');
        if (['test', 't', 'tst'].includes(sub)) return true;
        if (sub === 'run' || sub === 'run-script') return SAFE_NPM_SCRIPTS.has(a[1]) || /^(test|lint|build|typecheck|check|format)(:|$)/.test(a[1] || '');
        if (cmd !== 'npm' && SAFE_NPM_SCRIPTS.has(sub)) return true;    // pnpm test, yarn build, bun test …
        if (sub === 'install' || sub === 'i' || sub === 'ci') return false; // downloads + runs install scripts => ask
        return false;
      }
      if (cmd === 'npx' || cmd === 'pnpx') return ['tsc', 'eslint', 'prettier', 'vitest', 'jest', 'biome', 'tsx' && false, 'markdownlint', 'stylelint', 'knip', 'depcheck'].includes(a[0]) && !args.some((x) => ['--fix' , '-w', '--write'].includes(x) && false);
      if (['tsc', 'eslint', 'prettier', 'vitest', 'jest', 'biome', 'playwright', 'cypress', 'mocha', 'ava', 'tap', 'stylelint', 'markdownlint', 'knip'].includes(cmd)) return !args.some((x) => ['--init', 'install', '--install'].includes(x));
      if (['node', 'deno', 'bun'].includes(cmd)) return ['--version', '-v', '--help', '-h'].includes(args[0]);
      if (['python', 'python3'].includes(cmd)) return ['--version', '-V', '--help', '-h'].includes(args[0]) || (args[0] === '-m' && ['pytest', 'unittest', 'mypy', 'ruff', 'black', 'flake8', 'pylint', 'pyright', 'compileall', 'json.tool'].includes(args[1]));
      if (['pytest', 'mypy', 'ruff', 'black', 'flake8', 'pylint', 'pyright', 'isort', 'tox', 'nox', 'coverage'].includes(cmd)) return true;
      if (cmd === 'cargo') return ['build', 'check', 'test', 'fmt', 'clippy', 'doc', 'tree', 'metadata', 'bench', 'version', '--version'].includes(args[0]);
      if (cmd === 'go') return ['build', 'test', 'vet', 'fmt', 'list', 'version', 'env', 'mod'].includes(args[0]) && !(args[0] === 'mod' && !['tidy', 'verify', 'graph', 'why'].includes(args[1]));
      if (['make', 'just', 'task', 'gradle', 'gradlew', 'mvn', 'mvnw', 'ant'].includes(cmd)) return args.some((x) => ['test', 'check', 'lint', 'build', 'compile', 'verify', 'typecheck', 'fmt', 'format'].includes(x)) && !args.some((x) => ['install', 'deploy', 'publish', 'release', 'clean', 'upload', 'push'].includes(x));
      if (cmd === 'composer') return ['validate', 'show', 'outdated', 'test', 'lint', 'check-platform-reqs'].includes(args[0]);
      if (cmd === 'php' && args[0] === 'artisan') return ['test', 'about', 'route:list', 'config:show', 'list', '--version', 'env', 'model:show', 'migrate:status', 'schedule:list'].includes(args[1]);
      if (cmd === 'php' || cmd === 'ruby' || cmd === 'perl') return ['--version', '-v'].includes(args[0]);
      if (cmd === 'artisan' || basename(cmd) === 'artisan') return ['test', 'about', 'route:list', 'config:show', 'list', '--version'].includes(args[0]);
      return false;
    }

    /** HTTP reads: GET with no body/auth/cookies/output to a file, to a public https URL (never localhost/metadata/private). */
    function safeFetch(cmd, args) {
      if (!['curl', 'wget'].includes(cmd)) return false;
      const urls = args.filter((a) => /^https?:\/\//i.test(a));
      if (urls.length !== 1) return false;
      const flags = args.filter((a) => a.startsWith('-'));
      const allowed = cmd === 'curl' ? /^(-s|-S|-L|-I|--head|-f|--fail|--silent|--show-error|--location|--compressed|--max-time|-m|--connect-timeout|--retry|-sS|-sSL|-fsSL|-sL|-fsS|-4|-6|--no-progress-meter)$/ : /^(-q|--quiet|-O-|-qO-|--spider|--no-verbose|-nv|--timeout|-T|--tries|-t)$/;
      if (!flags.every((f) => allowed.test(f) || /^--(max-time|connect-timeout|retry|timeout|tries)=\d+$/.test(f))) return false;
      if (cmd === 'wget' && !args.some((a) => a === '-O-' || a === '-qO-' || a === '--spider')) return false; // wget writes files by default
      const host = (/^https?:\/\/([^/:?#]+)/i.exec(urls[0]) || [])[1] || '';
      if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|\[?::1|.*\.local$|.*\.internal$|metadata\.google\.internal)/i.test(host)) return false;
      if (!/^https:/i.test(urls[0])) return false;
      return true;
    }

    /** sed/awk/etc. need arguments checked; other read-only commands need output-redirect control (handled by caller). */
    function segmentAllowed(w) {
      const cmd = basename(w[0]);
      const args = w.slice(1);
      if (cmd === 'git') {
        const sub = gitSub(args);
        if (!sub || gitHasUnsafeGlobals(sub.globals)) return false;
        return gitAllowed(sub);
      }
      if (cmd === 'find') return safeFind(args);
      if (cmd === 'sed') return safeSed(args);
      if (cmd === 'awk' || cmd === 'gawk' || cmd === 'mawk') return safeAwk(args);
      if (cmd === 'sort') return safeSort(args);
      if (cmd === 'tree') return safeTree(args);
      if (cmd === 'xargs') return false;
      if (cmd === 'gh') {
        const a = args.filter((x) => !x.startsWith('-'));
        const verb = a[1];
        if (a[0] === 'api') { return !args.some((x) => ['-X', '--method', '-f', '-F', '--field', '--raw-field', '--input'].includes(x)) && !/(-X|--method)[ =]?(?!GET)/i.test(args.join(' ')); }
        if (['pr', 'issue', 'run', 'repo', 'release', 'workflow', 'gist', 'label', 'cache', 'project', 'ruleset', 'variable', 'search', 'status', 'browse'].includes(a[0])) return ['view', 'list', 'status', 'diff', 'checks', 'download', 'watch', 'search'].includes(verb) && !(a[0] === 'run' && verb === 'download' && false) || a[0] === 'search' || a[0] === 'status';
        if (a[0] === 'auth' && a[1] === 'status') return true;
        return ['--version', 'version'].includes(a[0]);
      }
      if (READ_ONLY.has(cmd)) {
        if ((cmd === 'env' || cmd === 'printenv') && args.length === 0) return false; // dumps every secret in env into the transcript
        if (cmd === 'cd' || cmd === 'pushd') return !targetsOutside(args.slice(0, 1)) || true;
        if (cmd === 'cat' || cmd === 'head' || cmd === 'tail' || cmd === 'less' || cmd === 'more' || cmd === 'bat' || cmd === 'strings' || cmd === 'xxd' || cmd === 'hexdump' || cmd === 'od') return !args.some(touchesSecret);
        if (cmd === 'grep' || cmd === 'rg' || cmd === 'ag' || cmd === 'egrep' || cmd === 'fgrep') return !args.some(touchesSecret) && !args.some((a) => a === '--pre' || a.startsWith('--pre=') || a === '--exec');
        if (cmd === 'ps' || cmd === 'lsof' || cmd === 'top') return !args.some((a) => a === 'e' || a === 'eww' || /e/.test(a) && /^-?[a-z]*ww/.test(a));
        return true;
      }
      if (nodeAllowed(cmd, args)) return true;
      if (safeFetch(cmd, args)) return true;
      if (cmd === 'mkdir' || cmd === 'touch') return !targetsOutside(args) && !args.some(touchesSecret);          // contained, reversible
      if (cmd === 'cp') return !targetsOutside(args) && !args.some(touchesSecret) && !args.some((a) => a === '-f' && false);
      if (cmd === 'mv') return !targetsOutside(args) && !args.some(touchesSecret);
      if (cmd === 'ln') return false;
      if (cmd === 'tee') return args.every((a) => a.startsWith('-') || (!targetsOutside([a]) && !touchesSecret(a)));
      if (cmd === 'jq' || cmd === 'yq') return !args.some((a) => a === '-i' || a === '--in-place');
      return false;
    }

    /** Where may a redirect write? Only inside the project (relative path, no ..), never a secret path, never a device. */
    function redirectAllowed(r) {
      const m = /^(\d?)(>>?|<|>&|<&)(.*)$/.exec(r) || /^(>>?|<|>&|<&)(.*)$/.exec(r);
      if (!m) return false;
      const op = m.length === 4 ? m[2] : m[1];
      const target = (m.length === 4 ? m[3] : m[2]) || '';
      if (op === '<' || op === '<&') return !touchesSecret(target);
      if (op === '>&') return /^\d$/.test(target) || target === '-';          // 2>&1
      if (target === '/dev/null') return true;
      if (!target || target.startsWith('/') || target.startsWith('~') || target.includes('..') || target.startsWith('/dev/') || /\$/.test(target)) return false;
      return !touchesSecret(target);
    }

    /* ─────────────────────────── public API ─────────────────────────── */

    /**
     * Classify one shell command line.
     * @param {string} line
     * @returns {{ verdict: 'allow'|'ask'|'deny', reason: string }}
     */
    function classifyCommand(line) {
      if (typeof line !== 'string' || !line.trim()) return { verdict: 'ask', reason: 'empty or unreadable command' };
      if (line.length > 4000) return { verdict: 'ask', reason: 'command too long to analyse' };
      const segs = parse(line);
      if (!segs) return { verdict: 'ask', reason: 'uses substitution, here-doc or escaping that cannot be statically checked' };
      if (!segs.length) return { verdict: 'ask', reason: 'no command' };
      let askReason = null;
      for (let si = 0; si < segs.length; si++) {
        const seg = segs[si];
        const piped = si > 0 && segs[si - 1].op === '|';
        if (seg.op === '&') { askReason = askReason || 'background job'; }
        const stripped = stripPrefix(seg.words);
        if (stripped === null) return { verdict: 'ask', reason: 'sets an environment variable that changes how programs load/run' };
        if (!stripped.length) { // pure variable assignment e.g. FOO=bar
          continue;
        }
        const deny = hardDenySegment(stripped, { piped });
        if (deny) return { verdict: 'deny', reason: deny };
        for (const r of seg.redirects) {
          if (/^[\d]*>/.test(r) && !redirectAllowed(r)) {
            const target = r.replace(/^\d?>>?&?/, '');
            if (touchesSecret(target) || target.startsWith('/') || target.startsWith('~') || target.includes('..')) return { verdict: 'deny', reason: `writes outside the project or to a protected path (${target})` };
            askReason = askReason || `unusual redirect (${r})`;
          } else if (r.startsWith('<') && !redirectAllowed(r)) return { verdict: 'deny', reason: 'reads a secret/credential file' };
        }
        if (!segmentAllowed(stripped)) askReason = askReason || `not a known-safe command: ${basename(stripped[0])}`;
      }
      if (askReason) return { verdict: 'ask', reason: askReason };
      return { verdict: 'allow', reason: 'all parts are read-only or contained in the project' };
    }

    /** Escalation reason handling: what the model asks for in `sandbox_permissions`. */
    function classifyEscalation(reason, command) {
      const esc = /escalate sandbox to ([\w-]+)/i.exec(String(reason || ''));
      const requested = esc ? esc[1] : null;
      const net = /network|approval required|\[network:/i.test(String(reason || ''));
      return { requested, network: net };
    }

    return { classifyCommand, classifyEscalation, parse };
    })();

    // ───────────────────────── auto-approve (composer dropdown) ─────────────────────────
    // Approval requests reach the client as `PendingApproval` objects ({ kind:'approval', toolName, callId,
    // reason, answerable, answer(outcome) }) via useSessionStatus().pendingInteraction.
    //
    // Tiers (modelled on Claude Code auto mode, but deterministic — no model call):
    //   1. read-only / inspection tools                       -> allow
    //   2. shell commands: CLASSIFY.classifyCommand(command)   -> allow | ask | deny
    //   3. sandbox escalations: read-only -> workspace-write only; full access / network -> ask
    // 'safe'       approves tier results of 'allow'; everything else waits for the human.
    // 'aggressive' approves everything EXCEPT hard 'deny' results, which still ask the human.
    // After 3 consecutive auto-decisions that had to be handed back to the human, auto-approval pauses for the
    // session (the agent is probably pushing against a boundary) until the user answers one request.
    const SAFE_TOOLS = new Set([
      'read', 'read_image', 'glob', 'grep', 'lsp', 'todo_write', 'skill', 'web_search',
      'session_search', 'session_trace', 'session_event_read', 'session_event_search', 'session_event_trace',
      'list_agents', 'list_subagent_models', 'job_list', 'job_output', 'schedule_list', 'terminal_list', 'terminal_read',
      'get_goal', 'cordis_inspect_list', 'cordis_inspect_query', 'cordis_inspect_self', 'team_task_list', 'team_task_get',
      'wait_agent', 'ask_user_question',
    ]);
    const SECRET_ARG = /(^|[\/"' =])(\.ssh|\.aws|\.gnupg|\.env(\.[\w.-]+)?|id_(rsa|ed25519)|credentials|\.netrc|[\w.-]+\.(pem|key|p12))(["' \/]|$)/i;

    /** Command text of the tool call an approval belongs to (from the chat projection). */
    function commandFromChat(snapshot, callId) {
      if (!snapshot || !snapshot.nodes || callId == null) return undefined;
      for (const node of snapshot.nodes.values()) {
        const root = node.kind === 'tool-call' && node.data ? node.data.root : undefined;
        if (root && String(root.callId) === String(callId) && !('kind' in root) && root.phase === 'start') {
          try { const a = JSON.parse(root.argsRaw); return typeof a.command === 'string' ? a.command : undefined; } catch (_) { return undefined; }
        }
      }
      return undefined;
    }

    /**
     * Decide one approval. `args` is the parsed tool arguments when known.
     * @returns {{verdict:'allow'|'ask'|'deny', reason:string}}
     */
    function decideApproval(p, command) {
      const tool = String(p.toolName || '');
      const reason = String(p.reason || '');
      const esc = CLASSIFY.classifyEscalation(reason);
      // The model's own justification text is NOT trusted as evidence ("reasoning-blind", like Claude Code's
      // classifier): only the sandbox level it asks for and the command itself decide.
      const askedFull = esc.requested === 'danger-full-access';
      const askedNet = esc.network;               // set by the sandbox/permission layer for blocked network targets
      if (SAFE_TOOLS.has(tool)) return { verdict: 'allow', reason: 'read-only tool' };
      if (tool === 'bash' || tool === 'terminal_send' || tool === 'terminal_open') {
        if (!command) return { verdict: 'ask', reason: 'command not visible' };
        const c = CLASSIFY.classifyCommand(command);
        if (c.verdict !== 'allow') return c;     // deny / ask propagate unchanged
        // The command itself is read-only or project-contained. Asking for MORE sandbox than the command needs is
        // fine for reads (e.g. reading a CI log over the GitHub API), but a command that is only "allowed" because
        // it stays inside the project must not be granted network or full access it did not prove it needs.
        if ((askedFull || askedNet) && !isPureRead(command)) return { verdict: 'ask', reason: 'asks for more access than a project-local command needs' };
        return c;
      }
      if (askedNet) return { verdict: 'ask', reason: 'network access' };
      if (askedFull) return { verdict: 'ask', reason: 'requests full filesystem/network access' };
      if (tool === 'write' || tool === 'edit') {
        const path = String(p.reason || '');
        if (SECRET_ARG.test(path)) return { verdict: 'deny', reason: 'writes a secret/credential path' };
        return esc.requested === 'workspace-write' ? { verdict: 'allow', reason: 'edit inside the workspace' } : { verdict: 'ask', reason: 'file write' };
      }
      if (esc.requested === 'workspace-write') return { verdict: 'allow', reason: 'workspace-write escalation' };
      return { verdict: 'ask', reason: 'unknown tool' };
    }
    /** True when every segment is a pure read (no file writes, no installs): safe to run with wider sandbox access. */
    function isPureRead(command) {
      const segs = CLASSIFY.parse(command);
      if (!segs) return false;
      const MUTATING = new Set(['git', 'npm', 'pnpm', 'yarn', 'bun', 'mkdir', 'touch', 'cp', 'mv', 'tee', 'sed', 'npx', 'cargo', 'go', 'make', 'pytest']);
      for (const seg of segs) {
        if (seg.redirects.some((r) => /^\d?>>?[^&]/.test(r) && !/\/dev\/null$/.test(r))) return false;
        const w = seg.words.filter((x) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(x));
        if (!w.length) continue;
        const cmd = w[0].split('/').pop();
        if (cmd === 'git') { const sub = w.slice(1).find((x) => !x.startsWith('-')); if (!['status','log','diff','show','blame','rev-parse','rev-list','merge-base','ls-files','ls-tree','cat-file','branch','tag','remote','config','fetch','grep','describe','shortlog'].includes(sub)) return false; continue; }
        if (cmd === 'gh') { if (!/^gh\s+(api\b(?!.*(-X|--method|-f|-F|--field|--input))|(pr|issue|run|repo|release|workflow|search|status)\s+(view|list|status|diff|checks|download|watch)|auth\s+status)/.test(w.join(' '))) return false; continue; }
        if (cmd === 'curl') { if (w.some((x) => /^-(d|F|X|T|o|O|u|H)$/.test(x) || x.startsWith('--data') || x === '--output')) return false; continue; }
        if (MUTATING.has(cmd)) return false;
      }
      return true;
    }
    const RISKY_TEXT = /danger-full-access|sudo|rm\s+-[a-z]*r|force[- ]push|--force|mkfs|dd\s+if=|DROP\s+TABLE|\.ssh/i;

    function modeFor(sessionId) { return (store.get().autoApprove || {})[sessionId] || 'ask'; }
    function setModeFor(sessionId, mode) {
      const next = { ...(store.get().autoApprove || {}) };
      if (mode === 'ask') delete next[sessionId]; else next[sessionId] = mode;
      store.set({ autoApprove: next });
    }

    /**
     * Invisible per-session component (rendered in a session-scoped slot, so it has `sessionId` and `useChat`):
     * answers THIS session's pending approvals according to the session's mode.
     */
    function AutoApprover({ sessionId, useSessionStatus, useChat, t }) {
      const pending = useSessionStatus((m) => { const st = m.get(sessionId); return st ? st.pendingInteraction : undefined; });
      const chat = useChat((snap) => snap);
      const modes = useSetting('autoApprove');
      const handled = React.useRef(new Set());
      const handedBack = React.useRef(0);
      const [tick, setTick] = React.useState(0);
      React.useEffect(() => {
        const p = pending;
        if (!p || p.kind !== 'approval' || !p.answerable || typeof p.answer !== 'function') return;
        if (handled.current.has(p.key)) return;
        const mode = modes[sessionId] || 'ask';
        if (mode === 'ask') return;
        const command = commandFromChat(chat, p.callId);
        // the tool-call row may land a moment after the approval: give it one short retry before deciding
        if (p.toolName === 'bash' && command === undefined && tick < 3) { const h2 = setTimeout(() => setTick((x) => x + 1), 120); return () => clearTimeout(h2); }
        const d = decideApproval(p, command);
        const approve = mode === 'aggressive' ? d.verdict !== 'deny' : d.verdict === 'allow';
        handled.current.add(p.key);
        setTick(0);
        if (!approve) {
          handedBack.current += 1;
          if (handedBack.current >= 3) { setModeFor(sessionId, 'ask'); handedBack.current = 0; showToast(t('ap.paused')); }
          return;
        }
        handedBack.current = 0;
        Promise.resolve(p.answer('allowed-once')).then(
          () => showToast(fmt(t('ap.toast'), { tool: command ? command.split(/\s+/)[0] : (p.toolName || '') })),
          () => handled.current.delete(p.key));
        if (handled.current.size > 200) handled.current.clear();
      }, [pending, chat, modes, tick, sessionId, t]);
      return null;
    }

    /** Composer-bar dropdown (same look as the permission control next to it). */
    function AutoApproveSelect({ sessionId, locked, t }) {
      const modes = useSetting('autoApprove');
      const mode = modes[sessionId] || 'ask';
      const [open, setOpen] = React.useState(false);
      const ref = React.useRef(null);
      const Menu = primitives.Menu, Chevron = primitives.IconChevronDownOutlineRegular;
      if (!sessionId) return null;
      const items = AP_MODES.map((id) => ({ id, label: t('ap.' + id) }));
      const choose = (id) => {
        setOpen(false);
        if (id === mode) return;
        if (id === 'aggressive' && !window.confirm(t('ap.confirm'))) return;
        setModeFor(sessionId, id);
      };
      const trigger = h('button', {
        ref, type: 'button', disabled: !!locked, className: 'majed-ap-trigger', 'data-mode': mode,
        'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-label': t('ap.aria'), title: t('ap.aria'),
        onClick: () => setOpen((v) => !v),
      },
        h('span', { className: 'majed-ap-dot', 'aria-hidden': 'true' }),
        h('span', { className: 'majed-ap-label' }, t('ap.' + mode)),
        Chevron ? h(Chevron, { size: 12 }) : '▾');
      if (!Menu) return trigger;
      return h(Menu, { open, onClose: () => setOpen(false), items, selectedId: mode, onSelect: choose, side: 'top', align: 'start', portal: true, anchor: trigger });
    }

    // ───────────────────────── app-UI font size + font source ─────────────────────────
    // Only TEXT grows: we read DSH's own stylesheets (<style data-plugin-css>) and, for every
    // rule that sets a px font-size / line-height, emit an override
    //   calc(<original px> + var(--majed-ui-d))      (d = chosen size - 14, in px)
    // so spacing, icons and borders are untouched. Chat transcript sheets are skipped because
    // the built-in "chat font size" already drives them.
    const SKIP_SHEETS = /(AssistantMarkdown|MessageItem|ChatView|ToolDetails|ToolRow|bash-sample|FileDiff|TextPreview|TrajectoryTable|stat-dialog)\.module\.css$/;
    const PX = /^(-?\d*\.?\d+)px$/;
    // Additive, like DSH's own chat font size: size' = size + (chosen - 14)px, so the chrome's 14px body text
    // becomes exactly the chosen number. `--majed-ui-d` carries that difference.
    // Sizes bound to DSH's chat-size variables follow the CHAT font size; they are only re-based onto the
    // UI size in shell sheets (<link> bundles), where they style app chrome such as menus.
    const CONTENT_VAR = /^(?:var|calc|min|max)\(.*--dsh-content-font-size.*\)$/;
    const scaled = (v, shell) => {
      const t = String(v).trim().replace(/\s*!important$/, '');
      const m = PX.exec(t);
      if (m) return `calc(${m[1]}px + var(--majed-ui-d))`;
      if (shell && CONTENT_VAR.test(t)) {
        // evaluate the chat variables at their 14px defaults, then add the UI delta
        const base = t.replace(/var\(--dsh-content-font-size-secondary\s*,\s*([\d.]+px)\)/g, '$1').replace(/var\(--dsh-content-font-size\s*,\s*([\d.]+px)\)/g, '$1');
        return `calc((${base}) + var(--majed-ui-d))`;
      }
      return null;
    };
    // `font: [style] [weight] <size>[/<line-height>] <family>` — pull out a px size / px line-height.
    const FONT_SHORTHAND = /^(.*?)(?:^|\s)(-?\d*\.?\d+px)(?:\s*\/\s*(-?\d*\.?\d+px|[\d.]+|normal))?\s+(\S.*)$/;

    function declFor(style, shell) {
      let fs = scaled(style.getPropertyValue('font-size'), shell);
      let lh = scaled(style.getPropertyValue('line-height'));
      const sh = style.getPropertyValue('font');
      if (sh && !fs) {                       // shorthand carries size (+ optional line-height)
        const m = FONT_SHORTHAND.exec(sh.trim());
        if (m) { fs = scaled(m[2]); if (m[3] && PX.test(m[3])) lh = lh || scaled(m[3]); }
      }
      return (fs ? `font-size:${fs}!important;` : '') + (lh ? `line-height:${lh}!important;` : '');
    }
    function overridesFromRules(rules, wrap, out, shell) {
      for (const rule of rules) {
        if (rule.type === 1 /* STYLE */) {
          const decl = declFor(rule.style, shell);
          if (decl) out.push(wrap(`${rule.selectorText}{${decl}}`));
        } else if (rule.type === 4 /* MEDIA */) {
          const cond = rule.conditionText || rule.media.mediaText;
          overridesFromRules(rule.cssRules, (t) => wrap(`@media ${cond}{${t}}`), out, shell);
        } else if (rule.type === 12 /* SUPPORTS */) {
          overridesFromRules(rule.cssRules, (t) => wrap(`@supports ${rule.conditionText}{${t}}`), out, shell);
        }
      }
    }
    // Chat-transcript sheets are skipped (the built-in chat font size drives them).
    // Plugin sheets are <style data-plugin-css>; the app shell and shared primitives (Menu, popovers,
    // account menu...) live in <link rel=stylesheet> bundles, so those are scanned too.
    // Generated sheets of ours must never be re-scanned (it would compound the scale).
    const OWN_GENERATED = ['data-majed-appearance', 'data-majed-ui-font', 'data-majed-bidi', 'data-majed-settings', 'data-majed-toast-style'];
    function isOwnGenerated(el) { return OWN_GENERATED.some((a) => el.hasAttribute(a)); }
    // Skin/theme/chat-reading sheets that should keep their own sizes.
    const SKIP_TAGS = /\[data-genui|genui-dom-fence/;
    function sheetEligible(el) {
      if (!el.sheet || isOwnGenerated(el)) return false;
      if (el.tagName === 'STYLE' && el.hasAttribute('data-plugin-css')) return !SKIP_SHEETS.test(el.dataset.pluginCss || '');
      // Everything else: plugin-authored <style> blocks (skills-manager, vision toolkit, better-sidebar,
      // permission-rules...), our own settings rows, and <link> bundles. GenUI's block sheet is skipped:
      // generated UI inside answers is chat content and follows the chat font size.
      if (el.tagName === 'STYLE' && /V1MMBW|_block\{|data-genui/.test((el.textContent || '').slice(0, 4000))) return false;
      return el.tagName === 'STYLE' || el.tagName === 'LINK';
    }
    // `font: var(--dsw-font-xs-13)` shorthands carry their size inside DSH's design tokens, which a
    // per-rule override can't see. Re-declare the non-markdown tokens on <body> with the factor applied;
    // every rule that references them (57 in DSH itself) then scales with no per-rule override.
    const TOKEN_RE = /(--dsw-font-(?!markdown|family)[\w-]+)\s*:\s*([^;}]+)/g;
    function collectFontTokens() {
      const found = new Map();
      for (const el of document.querySelectorAll('style, link[rel~="stylesheet"]')) {
        if (!el.sheet || isOwnGenerated(el)) continue;
        let text = '';
        try { for (const r of el.sheet.cssRules) if (r.type === 1 && /(^|,)\s*(:root|body|html)\b/.test(r.selectorText || '')) text += r.cssText + '\n'; } catch (_) { continue; }
        for (const m of text.matchAll(TOKEN_RE)) found.set(m[1], m[2].trim());
      }
      return found;
    }
    function buildTokenOverrides() {
      const lines = [];
      for (const [name, value] of collectFontTokens()) {
        const sized = name.endsWith('-font-size') || name.endsWith('-line-height');
        if (sized) {
          const v = scaled(value);
          if (v) lines.push(`${name}:${v};`);
          continue;
        }
        // composite token `weight size/line family` -> rebuild with scaled size (and line-height when px)
        const m = /^(.*?)(?:^|\s)(-?\d*\.?\d+px)(?:\s*\/\s*(-?\d*\.?\d+px))?\s+(\S.*)$/.exec(value);
        if (m) lines.push(`${name}:${m[1] ? m[1] + ' ' : ''}${scaled(m[2])}${m[3] ? '/' + scaled(m[3]) : ''} ${m[4]};`);
      }
      return lines.length ? `body{${lines.join('')}}` : '';
    }
    function buildFontSizeOverrides() {
      const out = [];
      document.querySelectorAll('style, link[rel~="stylesheet"]').forEach((el) => {
        if (!sheetEligible(el)) return;
        try { overridesFromRules(el.sheet.cssRules, (t) => t, out, el.tagName === 'LINK'); } catch (_) { /* cross-origin sheet */ }
      });
      const tok = buildTokenOverrides();
      return out.join('\n') + (tok ? '\n' + tok : '');
    }

    // The OS UI font, with emoji/symbol fonts so emoji render natively (same stack as the system font in browsers).
    const SYSTEM_FONT_STACK = '-apple-system-body, ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';
    const NATIVE_FALLBACK = SYSTEM_FONT_STACK;
    let fontFaceStyle = null, loadedFont = null;
    /** Inject @font-face rules for one bundled font (all its subsets; the browser downloads only what is used). */
    function ensureFontFaces(key) {
      if (loadedFont === key) return;
      removeFontFaces();
      const family = BUNDLED_FONTS[key] && BUNDLED_FONTS[key].family;
      if (!family) return;
      const rules = FONT_FACES.filter((f) => f.f === family).map((f) =>
        `@font-face{font-family:"${f.f}";font-style:normal;font-display:swap;font-weight:${f.w};` +
        `src:url("${FONT_ROUTE}${f.u}") format("woff2");unicode-range:${f.r}}`);
      fontFaceStyle = document.createElement('style');
      fontFaceStyle.setAttribute('data-majed-fontfaces', '');
      fontFaceStyle.textContent = rules.join('\n');
      document.head.appendChild(fontFaceStyle);
      loadedFont = key;
    }
    function removeFontFaces() {
      if (fontFaceStyle) { fontFaceStyle.remove(); fontFaceStyle = null; }
      loadedFont = null;
    }
    /** Font-family value for the current setting, or null for "DSH default" (leave DSH untouched). */
    function fontStackFor(source) {
      if (source === 'system') return SYSTEM_FONT_STACK;
      if (BUNDLED_FONTS[source]) return `"${BUNDLED_FONTS[source].family}", ${NATIVE_FALLBACK}`;
      return null;
    }
    // Variables that carry the UI typeface. DSH defines --dsw-font-family on <body> itself, and skins
    // such as dsh-claude-style redefine it (and their own --dsh-claude-font-*) with higher specificity,
    // so a stylesheet rule can lose. Inline `!important` on <body> beats every stylesheet rule, and
    // because the markdown/typography tokens are also defined on <body>, they pick the value up too.
    const FONT_VARS = [
      '--dsw-font-family', '--dsw-font-family-brand', '--dsh-font-family-text-default',
      '--dsh-claude-font-serif', '--dsh-claude-font-prose', '--dsh-claude-font-brand',
    ];
    const priorFontValues = new Map();
    const lastFontValues = new Map();
    function applyFontFamily(s) {
      const style = document.body && document.body.style;
      if (!style) return;
      const stack = fontStackFor(s.fontSource);
      if (BUNDLED_FONTS[s.fontSource]) ensureFontFaces(s.fontSource); else removeFontFaces();
      for (const name of FONT_VARS) {
        const value = style.getPropertyValue(name), priority = style.getPropertyPriority(name);
        const owned = lastFontValues.has(name) && value === lastFontValues.get(name) && priority === 'important';
        if (stack !== null) {
          // Only the last actual write is ours; a theme can use any supported stack.
          // Switching our selected family must not replace the remembered native value.
          if (!owned) priorFontValues.set(name, { value, priority });
          if (value !== stack || priority !== 'important') style.setProperty(name, stack, 'important');
          lastFontValues.set(name, style.getPropertyValue(name));
        } else {
          const prior = priorFontValues.get(name);
          if (prior && owned) {
            if (prior.value) style.setProperty(name, prior.value, prior.priority);
            else style.removeProperty(name);
          }
          priorFontValues.delete(name);
          lastFontValues.delete(name);
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
      inject: ['slots', 'locale', 'uiWorkspace', 'connection'],
      apply(ctx) {
        observeCodexRuntime(false);
        ctx.effect(() => () => observeCodexRuntime(false), 'dsh-majed: Codex runtime observation');
        appCtx = ctx;
        ctx.effect(() => () => { notificationGeneration++; notificationPrevious = null; notificationEvents.clear(); notificationFallback?.remove(); notificationFallback = null; appCtx = null; live.forEach((control, n) => { try { n.close(); } catch (_) {} }); live.clear(); }, 'dsh-majed: notification cleanup');
        ctx.effect(() => ctx.locale.register(NS, { zh, en, ar: { ...en, ...managementAr } }), 'dsh-majed: dictionaries');
        ctx.effect(() => {
          // Older hosts may register dictionaries without exposing a language catalog.
          const locale = ctx.locale;
          if (typeof locale.getSnapshot !== 'function' || typeof locale.addLanguage !== 'function') return;
          const locales = locale.getSnapshot()?.locales;
          if (!Array.isArray(locales) || !locales.every(language => typeof language?.id === 'string')) return;
          if (locales.some(language => language.id.toLowerCase() === 'ar')) return;
          if (!locales.some(language => language.id.toLowerCase() === 'en')) return;
          // Return only our registration's exact disposer; never adopt another plugin's entry.
          return locale.addLanguage({ id: 'ar', label: 'العربية', fallback: 'en' });
        }, 'dsh-majed: Arabic language');
        ctx.slots.inject('settings.section', () => {
          const stops = ['skills', 'mcp', 'hooks', 'subscriptions', 'routing'].map((module, index) => ctx.slots.register({
            name: 'settings.section', id: 'majed-' + module, order: 60 + index, locale: NS, label: () => ctx.locale.bind(NS)('management.' + module),
          }, props => h(module === 'skills' ? SkillsSection : ManagementSection, { ...props, ctx, module })));
          return () => stops.reverse().forEach(stop => stop());
        });
        ctx.slots.inject('conversation.input.right', () => ctx.slots.register({ name: 'conversation.input.right', id: 'majed-codex-speed', order: 0, locale: NS }, props => h(CodexSpeedSelect, { ...props, ctx })));
        ctx.inject?.(['commandUi'], scope => {
          const commands = scope.get?.('commandUi'); if (!commands?.register) return;
          let unregister;
          const t = ctx.locale.bind(NS);
          const update = enabled => {
            if (!enabled) { unregister?.(); unregister = undefined; return; }
            if (unregister) return;
            try { unregister = commands.register({ name: 'fast', description: () => t('codex.fastCommand'), available: () => codexRuntimeKnown,
              ui: { kind: 'popupSelect', options: async session => {
                const state = await loadCodexSpeed(ctx, session.sessionId);
                if (!state.visible) throw new Error(t('codex.fastUnavailable'));
                return ['standard', 'fast'].map(id => ({ id, label: t('codex.' + id), active: id === state.tier }));
              }, onSelect: async (option, session) => {
                const result = await ctx.connection.rpc.call('/api', 'majed/subscriptions/codex', { action: 'setSpeed', sessionId: session.sessionId, tier: option.id });
                if (!result.ok) throw new Error(t('codex.fastUnavailable'));
              } },
            }); } catch { /* A different owner keeps its existing command contribution. */ }
          };
          codexRuntimeObservers.add(update); update(codexRuntimeKnown);
          scope.effect(() => () => { codexRuntimeObservers.delete(update); unregister?.(); });
        });

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
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({ name: 'settings.general.item', id: 'majed-notify-title', order: 13.35, locale: NS }, NotifyTitleRow));
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({ name: 'settings.general.item', id: 'majed-account-menu', order: 13.4, locale: NS }, AccountMenuRow));
        ctx.slots.inject('conversation.input.left', () => ctx.slots.register({ name: 'conversation.input.left', id: 'majed-auto-approve', order: 50, locale: NS }, AutoApproveSelect));
        ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({ name: 'conversation.session.header.utilities', id: 'majed-auto-approver', order: 9999, locale: NS }, AutoApprover));
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({ name: 'settings.general.item', id: 'majed-auto-copy', order: 13.5, locale: NS }, AutoCopyRow));
        ctx.effect(() => startAccountMenu(), 'dsh-majed: account menu grouping');
        ctx.effect(() => {
          let stop = null;
          const t = ctx.locale.bind(NS);
          const sync = (st) => { if (st.autoCopy && !stop) stop = startAutoCopy((outcome) => showToast(t(outcome === 'copied' ? 'copy.toast' : 'copy.' + outcome), outcome === 'copied' ? undefined : 'error')); else if (!st.autoCopy && stop) { stop(); stop = null; } };
          sync(store.get());
          const unsub = store.subscribe(sync);
          return () => { unsub(); if (stop) stop(); disposeToast(); };
        }, 'dsh-majed: copy on select');
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
            varStyle.textContent = `:root{--majed-ui-d:${s.uiFontSize - UI_BASE_PX}px;}\n`;
            applyFontFamily(s);
            regenerate();
          };

          // DSH loads component stylesheets lazily: re-scan whenever a new one appears.
          let timer = null;
          let disposed = false;
          const pendingSheets = new Set();
          const rescan = () => { if (!disposed) { clearTimeout(timer); timer = setTimeout(regenerate, 120); } };
          const sheetLoaded = (event) => { pendingSheets.delete(event.currentTarget); rescan(); };
          const isSheet = (n) => n.nodeType === 1 && (n.tagName === 'STYLE' || (n.tagName === 'LINK' && /stylesheet/.test(n.rel)));
          const headObserver = new MutationObserver((records) => {
            for (const r of records) for (const n of r.addedNodes) {
              if (!isSheet(n) || isOwnGenerated(n)) continue;
              rescan();
              if (n.tagName === 'LINK') {
                pendingSheets.add(n);
                n.addEventListener('load', sheetLoaded, { once: true });
              }
              return;
            }
          });
          headObserver.observe(document.head, { childList: true });
          headObserver.observe(document.body, { childList: true });
          const bodyObserver = new MutationObserver(() => applyFontFamily(store.get()));
          bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['style', 'data-dsh-claude-typeface', 'data-dsh-skin'] });

          apply(store.get());
          const unsub = store.subscribe(apply);
          return () => {
            disposed = true;
            unsub(); headObserver.disconnect(); bodyObserver.disconnect(); clearTimeout(timer);
            for (const sheet of pendingSheets) sheet.removeEventListener('load', sheetLoaded);
            pendingSheets.clear();
            applyFontFamily({ ...store.get(), fontSource: 'dsh' });
            if (stopBidi) stopBidi();
            varStyle.remove(); sizeStyle.remove();
          };
        }, 'dsh-majed: apply settings');
      },
    };
  },
});
