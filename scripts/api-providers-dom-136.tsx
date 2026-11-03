// Actual component, synthetic public remotes only. No DSH/profile/provider access.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createApiProviders } from '../src/api-providers.js';
import en from '../locale/en.json';
import ar from '../locale/ar.json';
const params = new URLSearchParams(location.search);
const arabic = params.get('locale') === 'ar',
  dark = params.get('theme') === 'dark';
const dict = arabic ? ar.subscriptions : en.subscriptions;
document.documentElement.lang = arabic ? 'ar' : 'en';
document.documentElement.dir = arabic ? 'rtl' : 'ltr';
document.body.style.cssText = `margin:0;padding:24px;font:14px/22px system-ui;background:${dark ? '#181818' : '#fff'};color:${dark ? '#eee' : '#222'}`;
document.documentElement.style.cssText = `--dsw-alias-label-primary:${dark ? '#eee' : '#222'};--dsw-alias-label-secondary:${dark ? '#bbb' : '#555'};--dsw-alias-settings-card-fill:${dark ? '#242424' : '#fafafa'};--dsw-alias-settings-card-stroke:${dark ? '#484848' : '#ddd'};--dsw-alias-border-l2:${dark ? '#484848' : '#ddd'};--dsw-alias-interactive-secondary-hover:${dark ? '#383838' : '#eee'};--dsw-radius-md:8px;--dsw-radius-xl:12px`;
const ok = (value?: any) => ({ ok: true, value });
const ns = {
  ns: 'llm-pi-ai',
  revision: 1,
  user: {
    providers: {
      fixture: {
        displayName: arabic
          ? 'موفر تجريبي باسم طويل لاختبار التفاف النص داخل الإعدادات'
          : 'Synthetic provider with a deliberately long display name for wrapping verification',
        models: [
          {
            id: 'synthetic-model-with-a-long-identifier',
            name: 'Synthetic model',
            contextWindow: 8192,
            input: ['text'],
            reasoningEfforts: false,
          },
        ],
      },
    },
  },
  base: {},
  value: {},
};
ns.value = structuredClone(ns.user);
const remote = {
  $on: () => () => {},
  settings: {
    describe: async () =>
      ok({ writable: true, namespaces: [structuredClone(ns)] }),
    mutate: async (_: any, ops: any[], revision: number) => {
      if (revision !== ns.revision)
        return { ok: false, error: { code: 'settings/conflict' } };
      for (const op of ops) {
        let value: any = ns.user;
        for (const key of op.path.slice(0, -1)) value = value[key] ??= {};
        if (op.op === 'unset') delete value[op.path.at(-1)];
        else value[op.path.at(-1)] = structuredClone(op.value);
      }
      ns.revision++;
      ns.value = structuredClone(ns.user);
      return ok(structuredClone(ns));
    },
  },
  credentials: {
    describe: async () => ok({}),
    set: async () => ok(),
    unset: async () => ok(),
  },
  llm: {
    listConfigurableProviders: async () =>
      ok(
        ['fixture', 'catalog-example'].map((provider) => ({
          provider,
          displayName:
            provider === 'fixture' ? 'Synthetic provider' : 'Catalog example',
          settingsNs: ns.ns,
          settingsPath: ['providers', provider],
          declared: provider === 'fixture',
        })),
      ),
    listProviders: async () => ok([]),
    discoverModels: async () =>
      ok([
        {
          id: 'discovered-fixture',
          name: 'Synthetic discovered model',
          inputModalities: ['text'],
        },
      ]),
  },
};
const Card = createApiProviders(
  React,
  remote,
  (key) => dict[key as keyof typeof dict],
);
createRoot(document.getElementById('root')!).render(
  <main>
    <h1>{dict.providers}</h1>
    <Card />
  </main>,
);
