import assert from 'node:assert/strict';
import vm from 'node:vm';

// Deliberately small boundary fixtures, not a browser, React reconciler, or DSH
// runtime. The real, uninstrumented client is evaluated and its public registrations
// are rendered with persistent hook cells. Effects/subscriptions are cleaned up
// on unmount. DOM observers and timers advance only when a test asks them to.
// No host imports, filesystem access, account state, or real browser storage.
export const SETTINGS_KEY = 'dsh-majed:settings:v1';

class EventTargetFixture {
  events = new Map();
  addEventListener(type, fn, options = false) {
    const capture = typeof options === 'boolean' ? options : !!options.capture;
    const entries = this.events.get(type) || [];
    if (!entries.some((e) => e.fn === fn && e.capture === capture)) {
      entries.push({ fn, capture, once: !!options?.once });
    }
    this.events.set(type, entries);
  }
  removeEventListener(type, fn, options = false) {
    const capture = typeof options === 'boolean' ? options : !!options.capture;
    this.events.set(type, (this.events.get(type) || []).filter((e) => e.fn !== fn || e.capture !== capture));
  }
  dispatch(type, event = {}) {
    for (const entry of [...(this.events.get(type) || [])]) {
      if (entry.once) this.removeEventListener(type, entry.fn, entry.capture);
      entry.fn(event);
    }
  }
  listenerCount() { return [...this.events.values()].reduce((n, entries) => n + entries.length, 0); }
}

class StyleFixture {
  values = new Map();
  setProperty(name, value, priority = '') { this.values.set(name, { value, priority }); }
  getPropertyValue(name) { return this.values.get(name)?.value || ''; }
  getPropertyPriority(name) { return this.values.get(name)?.priority || ''; }
  removeProperty(name) { const value = this.getPropertyValue(name); this.values.delete(name); return value; }
}

class ElementFixture extends EventTargetFixture {
  constructor(tagName) {
    super();
    this.tagName = tagName.toUpperCase();
    this.nodeType = 1;
    this.attributes = new Map();
    this.style = new StyleFixture();
    this.children = [];
    this.parentElement = null;
    this.textContent = '';
    this.sheet = null;
  }
  get isConnected() { return this.documentRoot || !!this.parentElement?.isConnected; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  get dataset() { return { pluginCss: this.getAttribute('data-plugin-css') }; }
  get rel() { return this.getAttribute('rel') || ''; }
  get lastElementChild() { return this.children.at(-1); }
  set innerHTML(value) {
    // Toast markup is not interpreted as HTML. Only its text destination matters.
    assert.match(value, /<span><\/span>/, 'fixture only supports the toast text destination');
    this.appendChild(new ElementFixture('span'));
  }
  appendChild(node) { node.remove(); this.children.push(node); node.parentElement = this; return node; }
  append(...nodes) { nodes.forEach((node) => this.appendChild(node)); }
  remove() {
    if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((n) => n !== this);
    this.parentElement = null;
  }
  matches(selector) {
    return selector.split(',').some((part) => {
      const pieces = part.trim().split(/\s+(?![^[]*\])/);
      const simple = pieces.pop();
      if (simple === '*') return true;
      const match = /^(\w+)?(?:\[([\w-]+)(?:(~=|\*=|=)"([^"]*)")?\])?$/.exec(simple);
      assert.ok(match, `unsupported fixture selector: ${simple}`);
      const [, tag, attr, op, value] = match;
      if (tag && this.tagName !== tag.toUpperCase()) return false;
      if (attr) {
        const actual = attr === 'style' ? [...this.style.values.keys()].join(';') : this.getAttribute(attr);
        if (actual == null) return false;
        if (op === '=' && actual !== value) return false;
        if (op === '*=' && !actual.includes(value)) return false;
        if (op === '~=' && !actual.split(/\s+/).includes(value)) return false;
      }
      return !pieces.length || !!this.parentElement?.closest(pieces.join(' '));
    });
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  querySelectorAll(selector) {
    return this.children.flatMap((child) => [
      ...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector),
    ]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}

// Explicit render/re-render; no automatic scheduling, portals, synthetic events,
// layout, StrictMode, or concurrent rendering. Tests invoke rendered handlers.
function createReactFixture() {
  let current = null;
  const cell = (init) => {
    assert.ok(current, 'hooks must run in a rendered public slot component');
    const index = current.index++;
    return current.cells[index] || (current.cells[index] = init());
  };
  const React = {
    createElement(type, props, ...children) { return { type, props: { ...props, children: children.flat(Infinity) } }; },
    useState(initial) {
      const state = cell(() => ({ value: typeof initial === 'function' ? initial() : initial }));
      return [state.value, (next) => { state.value = typeof next === 'function' ? next(state.value) : next; }];
    },
    useRef(initial) { return cell(() => ({ current: initial })); },
    useSyncExternalStore(subscribe, snapshot) {
      const state = cell(() => ({ cleanup: subscribe(() => {}) }));
      assert.equal(typeof state.cleanup, 'function');
      return snapshot();
    },
    useEffect(effect, deps) {
      const state = cell(() => ({}));
      if (!state.deps || !deps || deps.some((dep, i) => !Object.is(dep, state.deps[i]))) {
        state.deps = deps;
        current.pending.push(() => { state.cleanup?.(); state.cleanup = effect(); });
      }
    },
  };
  function mount(Component, initialProps) {
    const instances = new Map();
    let props = initialProps;
    let tree;
    let unmounted = false;
    function resolve(node, path, pending) {
      if (node == null || typeof node !== 'object') return node;
      if (Array.isArray(node)) return node.map((n, i) => resolve(n, `${path}.${i}`, pending));
      if (typeof node.type === 'function') {
        let instance = instances.get(path);
        if (!instance) { instance = { cells: [] }; instances.set(path, instance); }
        current = { cells: instance.cells, index: 0, pending };
        let output;
        try { output = node.type(node.props); } finally { current = null; }
        return resolve(output, `${path}.output`, pending);
      }
      return { ...node, props: { ...node.props, children: resolve(node.props.children, `${path}.children`, pending) } };
    }
    const view = {
      render(nextProps = props) {
        assert.equal(unmounted, false);
        props = nextProps;
        const pending = [];
        tree = resolve(React.createElement(Component, props), 'root', pending);
        pending.forEach((fn) => fn());
        return view;
      },
      nodes(predicate) {
        const found = [];
        const visit = (node) => {
          if (!node || typeof node !== 'object') return;
          if (Array.isArray(node)) return node.forEach(visit);
          if (predicate(node)) found.push(node);
          visit(node.props.children);
        };
        visit(tree);
        return found;
      },
      one(predicate) { const nodes = view.nodes(predicate); assert.equal(nodes.length, 1); return nodes[0]; },
      unmount() {
        if (unmounted) return;
        unmounted = true;
        for (const instance of instances.values()) for (const state of instance.cells) state.cleanup?.();
      },
    };
    return view.render();
  }
  return { React, mount };
}

export function createBaselineHarness(source, { stored, extension, confirm = true } = {}) {
  const document = new EventTargetFixture();
  document.head = new ElementFixture('head');
  document.body = new ElementFixture('body');
  document.head.documentRoot = document.body.documentRoot = true;
  document.hidden = false;
  document.hasFocus = () => true;
  document.createElement = (tag) => new ElementFixture(tag);
  document.querySelectorAll = (selector) => [document.head, ...document.head.querySelectorAll(selector), document.body, ...document.body.querySelectorAll(selector)].filter((node) => node.matches(selector));
  document.querySelector = (selector) => document.querySelectorAll(selector)[0] || null;
  document.activeElement = document.body;
  const observers = [];
  class MutationObserverFixture {
    targets = [];
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target, options) { this.targets.push({ target, options }); }
    disconnect() { this.targets = []; }
  }
  const timers = new Map();
  const frames = new Map();
  let nextId = 0;
  const storage = new Map(stored === undefined ? [] : [[SETTINGS_KEY, typeof stored === 'string' ? stored : JSON.stringify(stored)]]);
  const storageReads = [];
  const localStorage = {
    getItem(key) { storageReads.push(key); return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, String(value)); },
  };
  const notifications = [];
  class NotificationFixture {
    static permission = 'granted';
    static async requestPermission() { return NotificationFixture.permission; }
    constructor(title, options) { this.title = title; this.options = options; this.closed = false; notifications.push(this); }
    close() { this.closed = true; this.onclose?.(); }
  }
  const confirms = [];
  const openedSessions = [];
  const modules = [];
  const imports = [];
  const window = {
    __ModuleLoader__: { load(module) { modules.push(module); } },
    isSecureContext: true,
    confirm(message) { confirms.push(message); return typeof confirm === 'function' ? confirm(message) : confirm; },
    focus() {},
  };
  if (extension !== undefined) window.__dshMajed = extension;
  const { React, mount } = createReactFixture();
  const primitives = { Menu: 'fixture-menu' };
  const sandbox = vm.createContext({
    window, document, localStorage, navigator: {}, Notification: NotificationFixture,
    MutationObserver: MutationObserverFixture,
    requestAnimationFrame(fn) { const id = ++nextId; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(fn, delay) { const id = ++nextId; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  // No injected require/process/fetch: the script can only request these two
  // public client dependencies through its registered factory.
  new vm.Script(source, { filename: 'baseline-client.js' }).runInContext(sandbox, { timeout: 1000 });
  const registrations = new Map();
  const dictionaries = new Map();
  const cleanups = [];
  const views = [];
  const injectCalls = [];
  const context = {
    effect(effect) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); },
    locale: {
      register(ns, locales) { dictionaries.set(ns, locales); return () => dictionaries.delete(ns); },
      bind(ns) { return (key) => dictionaries.get(ns)?.en[key] ?? key; },
    },
    slots: {
      inject(name, register) { injectCalls.push(name); const cleanup = register(); if (cleanup) cleanups.push(cleanup); },
      register(metadata, Component) {
        assert.equal(registrations.has(metadata.id), false, `duplicate slot ${metadata.id}`);
        registrations.set(metadata.id, { metadata, Component });
        return () => registrations.delete(metadata.id);
      },
    },
    uiWorkspace: { openSession(id) { openedSessions.push(id); } },
  };
  let plugin;
  return {
    modules, imports, document, window, storage, storageReads, registrations, dictionaries, injectCalls,
    confirms, notifications, openedSessions, timers, frames, observers,
    apply() {
      assert.equal(modules.length, 1);
      plugin = modules[0].factory((id) => {
        imports.push(id);
        if (id === 'react') return React;
        if (id === '@deepseek-ai/dsh-client-ui-primitives') return primitives;
        throw new Error(`Unexpected client import: ${id}`);
      });
      plugin.apply(context);
      return plugin;
    },
    render(id, props = {}) {
      const registration = registrations.get(id);
      assert.ok(registration, `slot ${id} must be registered`);
      const view = mount(registration.Component, { t: context.locale.bind('majed'), ...props });
      views.push(view);
      return view;
    },
    element(tag, attrs = {}) {
      const el = document.createElement(tag);
      for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
      return el;
    },
    mutate(record) {
      for (const observer of observers) {
        if (observer.targets.some(({ target, options }) => (record.target === target || (options.subtree && target.querySelectorAll('*').includes(record.target))) && options[record.type])) {
          observer.callback([record]);
        }
      }
    },
    flushFrames() { const pending = [...frames.values()]; frames.clear(); pending.forEach((fn) => fn()); },
    runTimers(delay) {
      for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); timer.fn(); }
    },
    dispose() {
      views.splice(0).reverse().forEach((view) => view.unmount());
      cleanups.splice(0).reverse().forEach((fn) => fn());
    },
  };
}
