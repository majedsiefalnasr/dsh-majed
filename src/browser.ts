// Independently implemented presence lifecycle; reference recipe and slot conventions only.
import { ImageGenerateToolview, createImageLoader } from './ImageGenerateToolview.js';
import { VideoGenerateToolview, createVideoLoader } from './VideoGenerateToolview.js';
import en from '../locale/en.json';
import ar from '../locale/ar.json';
import { createCodexCard } from './codex-card.js';
import { createClaudeCard } from './claude-card.js';
import { createGrokCard } from './grok-card.js';
import { SpeedSelect, createSpeedLoader, createSpeedSetter } from './speed/SpeedSelect.js';
import { fastCommandDescription } from './speed/fast-command.js';
import { SubscriptionUsageBadge, createCurrentModelReader } from './usage-badge/SubscriptionUsageBadge.js';
import { UsageBadgeDisplaySetting } from './usage-badge/UsageBadgeDisplaySetting.js';
import { guarded } from './usage-badge/error-boundary.js';
import type { ModelDirectoriesLike } from './usage-badge/usage-types.js';

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
    // A Claude card failure must not remove the Codex card or the rest of the section (#132 isolation).
    const ClaudeCard = guarded(React, createClaudeCard(React, primitives, connection.rpc, t), 'Claude card');
    const GrokCard = guarded(React, createGrokCard(React, primitives, connection.rpc, t), 'Grok card');
    const GuardedSetting = guarded(React, UsageBadgeDisplaySetting as any, 'usage display setting');
    const GuardedSpeed = guarded(React, SpeedSelect as any, 'Speed control');
    const GuardedBadge = guarded(React, SubscriptionUsageBadge as any, 'usage badge');
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
          part === 'accounts' ? h('div', null, h('p', { style: { marginBlock: '0 var(--dsw-spacing-3)', color: 'var(--dsw-alias-label-tertiary)' } }, t('intro')), h(GuardedSetting, { t }), h(CodexCard), h(ClaudeCard), h(GrokCard)) : h('p', { style: { color: 'var(--dsw-alias-label-tertiary)' } }, t(`${part}Empty`)))));
    }
    // Composer surfaces (ticket #131): the usage badge, the Speed control and /fast exist only while the component
    // answers and the reference plugin is not serving the same provider ids. Each registration is isolated so a
    // failure in one surface cannot affect core dsh-majed, the Settings section or the other surfaces.
    const models = (): ModelDirectoriesLike | undefined => ctx.get('modelDirectories') as ModelDirectoriesLike | undefined;
    const surfaceWanted = () => !disposed && present && !referenceEnabled;
    const surfaces: Dispose[] = [];
    let surfacesActive = false;
    function syncSurfaces() {
      if (surfaceWanted() && !surfacesActive) {
        surfacesActive = true;
        const add = (register: () => unknown) => isolate(() => {
          const off = register();
          if (typeof off === 'function') surfaces.push(off as Dispose);
        });
        for (const [name, view, inject] of [
          ['image_generate', ImageGenerateToolview, () => ({ load: createImageLoader(connection.rpc) })],
          ['video_generate', VideoGenerateToolview, () => ({ loadVideo: createVideoLoader(connection.rpc) })],
        ] as const) for (const key of [name, `dsh_majed_${name}`]) {
          add(() => ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({ name: 'tool.call.toolview', id: `majed-toolview-${key}`, key, locale: NS, inject }, guarded(React, view as any, name))));
        }
        add(() => ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
          name: 'conversation.input.right', id: 'majed-subscription-speed', order: 0, locale: NS,
          inject: (sessionId: string) => ({ loadSpeed: createSpeedLoader(connection, models, sessionId), setSpeed: createSpeedSetter(connection, sessionId) }),
        }, GuardedSpeed)));
        add(() => ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock', id: 'majed-subscription-usage', order: 10, locale: NS,
          inject: (sessionId: string) => ({ rpc: connection.rpc, currentModel: createCurrentModelReader(models, sessionId) }),
        }, GuardedBadge)));
      } else if (!surfaceWanted() && surfacesActive) {
        surfacesActive = false;
        for (const off of surfaces.splice(0)) isolate(off);
      }
    }
    // /fast: registered once per command service. `available` and `options` re-check presence on every use, so
    // the command disappears from the list and cannot act while the component is off or the reference serves.
    isolate(() => ctx.inject(['commandUi'], (scope: any) => isolate(() => {
      const command = scope.get('commandUi');
      scope.effect(() => command.register({
        name: 'fast',
        description: fastCommandDescription(() => t('commandFast')),
        available: () => surfaceWanted(),
        ui: {
          kind: 'popupSelect',
          options: async (session: { sessionId: string }) => {
            if (!surfaceWanted()) throw new Error(t('commandFastUnavailable'));
            const state = await createSpeedLoader(connection, models, session.sessionId)();
            if (!state.visible) throw new Error(t('commandFastUnavailable'));
            return ([
              { id: 'standard', label: t('speedStandard'), detail: t('speedStandardDescription') },
              { id: 'fast', label: t('speedFast'), detail: t('speedFastDescription') },
            ] as const).map(option => ({ ...option, active: option.id === state.tier }));
          },
          onSelect: async (option: { id: string }, session: { sessionId: string }) => {
            if (!surfaceWanted()) return;
            await createSpeedSetter(connection, session.sessionId)(option.id as 'standard' | 'fast');
          },
        },
      }), 'dsh-majed: /fast contribution');
    })));
    function update() {
      isolate(syncSurfaces);
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
      return () => { disposed = true; sequence++; clearInterval(timer); unsubscribe(); isolate(syncSurfaces); withdraw?.(); listeners.clear(); };
    }), 'dsh-majed: subscriptions presence'));
  })));
}
