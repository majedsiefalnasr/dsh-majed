// Deterministic browser-only comparison. No host, profile, storage or provider access.
// Renderer dependencies live only in /tmp/majed-t129-ui; reference is read-only.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const out = '/tmp/majed-t129-ui';
const require = createRequire(`${out}/package.json`);
const { build } = require('esbuild');
const root = process.cwd();
await mkdir(out, { recursive: true });
const refPath = '/tmp/upstream-0.9.12/src/client/SubscriptionsSection.tsx';
const reference = await readFile(refPath, 'utf8');
const en = JSON.parse(await readFile('locale/en.json', 'utf8')).subscriptions;
const ar = JSON.parse(await readFile('locale/ar.json', 'utf8')).subscriptions;
const sourceMap = { loginInProgress:'loginProgress', loggedInCount:'connected', clientVersionNpm:'source_npm', clientVersionLocal:'source_local', clientVersionFallback:'source_fallback', clientVersionConfig:'source_config', defaultBadge:'defaultAccount', setDefault:'makeDefault', accountExpires:'expires', manualPlaceholder:'pasteCallback', submit:'submitCallback', usageRefresh:'refreshUsage', usageLoading:'usageNotLoaded', usageEmpty:'usageUnavailable', usageSession:'window_session', usageWeekly:'window_weekly', usageWindow:'window_other', usageResets:'resets', usagePlan:'plan', resetCreditsTitle:'resetCredits', resetCreditsAvailable:'available', resetCreditsError:'creditsUnavailable', resetUseButton:'useReset', resetUseGuard:'resetGuard', resetUseRefresh:'resetRefresh', resetUseReady:'resetReady', resetUseConfirmTitle:'confirmReset', resetUseWarning:'resetWarning', resetUseAcknowledge:'resetAcknowledge', resetUseConfirm:'confirm', resetCreditFull:'fullReset', resetCreditExpires:'expires', resetCreditExpiryUnknown:'creditExpiryUnknown' };
let scoped = reference.replace(/const PROVIDERS:[\s\S]*?= \[[\s\S]*?\n\]/, "const PROVIDERS = [{ id: 'codex', name: 'Codex (ChatGPT)' }]");
// Remove only later-ticket surfaces, leaving the original Codex render and helpers intact.
scoped = scoped.replace(/      <p style=\{styles.intro\}>[\s\S]*?      \{PROVIDERS.map/, '      {PROVIDERS.map');
scoped = scoped.replace(/              \{\/\* 与同排[\s\S]*?\{t\('accountsManage'\)\}[\s\S]*?<\/button>\}/, '');
await writeFile(`${out}/reference-scoped.tsx`, scoped);
const entry = `import React from 'react'; import {createRoot} from 'react-dom/client';
import {createCodexCard} from '${root}/src/codex-card.ts';
import {SubscriptionsSection} from '${out}/reference-scoped.tsx';
import {en as original} from '/tmp/upstream-0.9.12/src/client/locales.ts';
const dictionaries=${JSON.stringify({en,ar})}; const mapping=${JSON.stringify(sourceMap)};
const params=new URLSearchParams(location.search), locale=params.get('locale')||'en', state=params.get('state')||'accounts', theme=params.get('theme')||'light';
document.documentElement.lang=locale; document.documentElement.dir=locale==='ar'?'rtl':'ltr'; document.body.dataset.dsDarkTheme=theme==='dark'?'true':'';
if(theme==='dark') document.body.classList.add('dark');
const now=1893456000000; Date.now=()=>now;
const accounts=state==='accounts'||state==='reset'?[{key:'fake-a',account:'alpha@example.test',plan:'plus',isDefault:true},{key:'fake-b',account:'beta@example.test',plan:'pro',isDefault:false}]:[];
const status={accounts,busy:state==='pending',pendingAuth:{authorizeUrl:'https://authorization.example.test/fixture'},clientVersion:{version:'0.99.0',source:'fallback'}};
const usage={supported:true,plan:'plus',windows:[{kind:'session',usedPercent:38,resetsAt:now+3600000},{kind:'weekly',usedPercent:87,resetsAt:now+86400000}],resetCredits:[{id:'fake-credit',expiresAt:now+172800000}]};
const rpc={call:async(_,method,payload)=>{const endpoint=method.split('.').pop(); if(endpoint==='status')return {ok:true,value:{providers:Object.fromEntries(['codex','claude','grok','copilot','antigravity'].map(id=>[id,id==='codex'?status:{accounts:[],busy:false}])),registrationError:state==='collision'?'fake collision':undefined}}; if(endpoint==='usage')return {ok:true,value:usage};if(endpoint==='prepareReset')return {ok:true,value:{ticket:'fake-ticket',expiresAt:now+60000,weeklyUsedPercent:87,creditExpiresAt:now+172800000}};if(endpoint==='proxyGet')return {ok:true,value:{enabled:false}};return {ok:true,value:{}};}};
const dict=dictionaries[locale]; const t=key=>dict[key]||key;
const rt=(key,p={})=>{if(locale==='en')return (original[key]||key).replace(/\\{(\\w+)\\}/g,(_,k)=>p[k]??'');const v=t(mapping[key]||key);if(key==='loggedInCount')return p.count+' '+v;if(key==='clientVersion')return 'CLI '+p.version+' · '+p.source;if(key==='resetCreditsAvailable')return p.count+' '+v;if(key==='usagePlan')return v+': '+p.plan;if(p.date)return v+' '+p.date;return v;};
const Card=createCodexCard(React,{},rpc,t);
function Column({reference}){return React.createElement('section',{className:'column'},React.createElement('h2',null,reference?'Pinned reference · scoped':'Owned fork'),state==='collision'?React.createElement('p',null,dict.coexistence):null,React.createElement(reference?SubscriptionsSection:Card,reference?{rpc,t:rt}:{}));}
createRoot(document.getElementById('root')).render(React.createElement(React.Fragment,null,React.createElement(Column,{reference:true}),React.createElement(Column,{reference:false})));
// Disclosure/dialog state is driven through real rendered controls, never React internals.
setTimeout(()=>{document.querySelectorAll('details').forEach(d=>d.open=true);if(state==='reset'){const column=document.querySelectorAll('.column')[params.get('dialog')==='reference'?0:1];[...column.querySelectorAll('button')].find(b=>b.textContent===dict.useReset)?.click();}},150);
`;
await writeFile(`${out}/entry.jsx`, entry);
await build({ stdin:{contents:entry,resolveDir:out,loader:'jsx'},outfile:`${out}/fixture.js`,bundle:true,format:'iife',jsx:'automatic',nodePaths:[`${out}/node_modules`],plugins:[{name:'reference-only-boundaries',setup(b){b.onResolve({filter:/ProviderAccountManager\.js|UsageBadgeDisplaySetting\.js/},args=>({path:args.path,namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export const ProviderAccountManager=()=>null; export const UsageBadgeDisplaySetting=()=>null;'}));b.onResolve({filter:/^\.\//},args=>args.importer.endsWith('/reference-scoped.tsx')?{path:path.resolve('/tmp/upstream-0.9.12/src/client',args.path.replace(/\.js$/,'.ts'))}:undefined);}}]});
const tokens=`:root{--dsw-alias-label-primary:#202124;--dsw-alias-label-secondary:#42464d;--dsw-alias-label-tertiary:#666970;--dsw-alias-label-dimmed:#74777e;--dsw-alias-bg-layer-1:#fff;--dsw-alias-bg-layer-2:#f8f9fb;--dsw-alias-bg-layer-3:#f0f1f4;--dsw-alias-border-l2:#d8dbe1;--dsw-alias-border-l3:#c5c9d0;--dsw-alias-border-l4:#b9bec7;--dsw-alias-state-success-primary:#18794e;--dsw-alias-state-warn-label:#926300;--dsw-alias-state-error-primary:#bb2222;--dsw-alias-state-business-primary:#245bd6;--dsw-alias-bg-mask-1:#0006;--dsw-elevation-prominent:0 16px 48px #0004;--dsw-radius-xl:20px;--dsw-radius-lg:16px;--dsw-radius-panel:28px;--dsw-font-s-12:12px/18px Arial,sans-serif;--dsw-font-s-13:13px/20px Arial,sans-serif;--dsw-font-s-14:14px/22px Arial,sans-serif;--dsw-font-s-16:16px/24px Arial,sans-serif}.dark{--dsw-alias-label-primary:#f3f4f6;--dsw-alias-label-secondary:#d2d5db;--dsw-alias-label-tertiary:#a9aeb8;--dsw-alias-bg-layer-1:#15171c;--dsw-alias-bg-layer-2:#202329;--dsw-alias-bg-layer-3:#2a2e36;--dsw-alias-border-l2:#484e59;--dsw-alias-border-l3:#5b626f;--dsw-alias-border-l4:#646c7a;--dsw-alias-state-success-primary:#68cd98;--dsw-alias-state-warn-label:#edc46b;--dsw-alias-state-error-primary:#ff9999}body{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:13px/20px Arial,sans-serif;margin:24px}#root{display:grid;grid-template-columns:560px 560px;gap:32px}h2{font:500 14px/22px Arial,sans-serif;margin:0 0 16px}.column{min-width:0}.dsh-subscriptions-settings{max-width:560px} @media(max-width:800px){#root{grid-template-columns:minmax(0,560px)}}`;
await writeFile(`${out}/index.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><title>Codex deterministic comparison</title><style>${tokens}</style><div id="root"></div><script src="fixture.js"></script></html>`);
console.log(`Fixture generated: ${out}/index.html`);
