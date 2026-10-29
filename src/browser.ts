// Independently implemented presence lifecycle; reference recipe and slot conventions only.
import en from '../locale/en.json';
import ar from '../locale/ar.json';
import { createCodexCard } from './codex-card.js';

type Dispose = () => void;
interface Context {
  inject(names: string[], callback: (ctx: any) => void): void;
  effect(callback: () => Dispose, label: string): unknown;
}
export function applySubscriptions(root: Context): void {
  const report = (error: unknown) => console.error('dsh-majed: Subscriptions setup failed', error);
  function isolate<T>(callback: () => T): T | undefined {
    try {
      const result = callback();
      if (result && typeof (result as any).then === 'function') return Promise.resolve(result).catch(report) as T;
      return result;
    } catch (error) { report(error); }
  }
  isolate(() => root.inject(['connection', 'slots', 'locale'], (ctx) => isolate(() => {
    const connection = ctx.get('connection');
    const React = require('react');
    const h = React.createElement;
    const primitives = require('@deepseek-ai/dsh-client-ui-primitives');
    const { IconSettingsOutlineMedium } = primitives;
    const NS = 'majed.subscriptions';
    isolate(() => ctx.effect(() => isolate(() => ctx.locale.register(NS, { en: en.subscriptions, ar: ar.subscriptions })), 'dsh-majed: subscriptions dictionaries'));
    const t = ctx.locale.bind(NS);
    const CodexCard = createCodexCard(React, primitives, connection.rpc, t);
    let present = false;
    let failing = false;
    let referenceEnabled = false;
    let disposed = false;
    let sequence = 0;
    let withdraw: Dispose | undefined;
    const listeners = new Set<() => void>();
    function Section() {
      React.useSyncExternalStore((fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, () => `${failing}:${referenceEnabled}`);
      return h('div', { style: { textAlign: 'start', color: 'var(--dsw-alias-label-primary)', font: 'var(--dsw-font-s-14)' } },
        referenceEnabled ? h('p', { role: 'status' }, t('coexistence')) : null,
        failing ? h('p', { role: 'alert' }, t('unreachable')) : null,
        ...['accounts', 'providers'].map((part) => h('section', { key: part, style: { paddingBlock: 'var(--dsw-spacing-4)', borderBlockEnd: '1px solid var(--dsw-alias-border-l2)' } },
          h('h3', { style: { font: 'var(--dsw-font-s-strong-14)' } }, h(IconSettingsOutlineMedium, { 'aria-hidden': true }), t(part)),
          part === 'accounts' ? h(CodexCard) : h('p', { style: { color: 'var(--dsw-alias-label-tertiary)' } }, t(`${part}Empty`)))));
    }
    function update() {
      if (present && !withdraw) {
        withdraw = ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section', id: 'majed-subscriptions', order: 90, label: () => t('title'),
        }, Section));
      } else if (!present && withdraw) { withdraw(); withdraw = undefined; }
      listeners.forEach((listener) => listener());
    }
    async function probe() {
      const current = ++sequence;
      void probeReference(current);
      try {
        const result = await connection.rpc.call('/api', 'majed-subscriptions.status', {});
        if (disposed || current !== sequence) return;
        present = true;
        failing = !(result?.ok && result.value?.component === 'subscriptions');
      } catch (error) {
        if (disposed || current !== sequence) return;
        // The public RPC transport exposes HTTP status in this exact error string.
        if (error instanceof Error && error.message === 'transport failure for /api/majed-subscriptions.status: HTTP 404') {
          present = false; failing = false;
        } else { present = true; failing = true; }
      }
      isolate(update);
    }
    async function probeReference(current: number) {
      let enabled = false;
      try {
        // Read-only sanitized local configuration; never retain or render its value.
        const result = await connection.rpc.call('/api', 'subscriptions-auth.proxyGet', {});
        enabled = result?.ok === true;
      } catch {
        // Missing route (404) is absent; other failures are unknown. Neither shows a notice.
      }
      if (disposed || current !== sequence) return;
      referenceEnabled = enabled;
      isolate(update);
    }
    isolate(() => ctx.effect(() => isolate(() => {
      void probe();
      const unsubscribe = connection.state.subscribe(() => {
        if (connection.state.getSnapshot() === 'connected') void probe();
      });
      // Row switches do not reconnect the shared connection; periodically reconcile presence.
      const timer = setInterval(() => { void probe(); }, 3000);
      return () => { disposed = true; sequence++; clearInterval(timer); unsubscribe(); withdraw?.(); listeners.clear(); };
    }), 'dsh-majed: subscriptions presence'));
  })));
}
