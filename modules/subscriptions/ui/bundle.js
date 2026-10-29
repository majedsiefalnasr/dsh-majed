// Generated from attributed v0.9.11 UI; see modules/subscriptions/ui/PROVENANCE.md.
const React = require("react");
"use strict";
var MajedSubscriptionsUI = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // modules/subscriptions/ui/entry.ts
  var entry_exports = {};
  __export(entry_exports, {
    SubscriptionsSection: () => SubscriptionsSection,
    ar: () => ar,
    en: () => en
  });

  // modules/subscriptions/ui/SubscriptionsSection.tsx
  var import_react5 = __require("react");

  // modules/subscriptions/ui/locales.ts
  var en = {
    accountPause: "Pause",
    accountResume: "Resume",
    accountRemove: "Remove",
    accountRemoveConfirm: "Remove this account and its saved settings?",
    localSignOutDisclaimer: "Sign out only deletes credentials stored on this host. It does not revoke the session at the provider.",
    poolSavedNotApplied: "Saved; applies when manual pools arrive (S09)",
    providerToolsUnavailable: "Provider tools: Image generation and Web search are unavailable (no runtime consumer).",
    accountsManage: "Manage",
    accountsTitle: "Manage {provider}",
    subscriptionDisplayName: "Subscription display name",
    subscriptionDisplayNameHint: "Used in the quota bar and subscription headings. Leave blank for the default.",
    modelDisplayName: "Model display name",
    modelDisplayNameHint: "Leave blank for the original name. Reasoning effort stays separate.",
    displayNameReset: "Restore default",
    claudePromptCacheTtl: "Prompt cache lifetime",
    claudePromptCacheTtlHint: "How long Anthropic keeps the conversation cache after its last use. Cache reads cost the same either way; a one-hour cache write costs 2\xD7 base input instead of 1.25\xD7. Applies from the next turn.",
    claudePromptCacheTtlDefault: "Follow config ({ttl})",
    claudePromptCacheTtl5m: "5 minutes",
    claudePromptCacheTtl1h: "1 hour",
    accountsHint: "Choose which accounts serve pooled LLM requests. Pool exclusion applies only to LLM routing, not tools or session-wide isolation.",
    accountsLoading: "Loading accounts\u2026",
    accountsLoadFailed: "Could not load account settings: {message}",
    accountsSaveFailed: "Could not save changes: {message}",
    accountsEmpty: "No connected accounts. Add an account on the provider card first.",
    accountsAlias: "Alias (optional)",
    accountsPoolEnabled: "Include in the LLM account pool",
    accountsIndependent: "Show an independent entry in the model picker",
    accountsIndependentHint: "Independent LLM routes use only this account, with no fallback to another account. This does not isolate tools or the whole session.",
    accountsModels: "Pool model allowlist",
    accountsModelsAll: "All models",
    accountsModelsCount: "{count} selected",
    accountsModelsHint: "Applies only to pooled LLM routing, not independent entries. An empty selection allows no models. Turning off pool participation keeps this selection for later.",
    accountsModelsAutomatic: "Allow all models, including future models",
    accountsNoModels: "No models reported for this account.",
    accountsCatalogUnavailable: "Model discovery is currently unavailable. Saved model selections are preserved.",
    modelsPartialSave: "Some reasoning defaults were saved. Remaining changes are still in the draft; retry to finish.",
    modelsEdit: "Edit model list",
    modelsHint: "Configure model visibility, default reasoning effort, subagent speed, context and tools here; Save changes below submits them together with the account settings. Hidden models remain usable by existing sessions; tool changes apply to new sessions.",
    modelsAutomatic: "Automatically show all models, including new models",
    modelsSelectAll: "Select all",
    modelsSelectNone: "Clear selection",
    modelsContext: "Context (tokens)",
    modelsContextBounds: "Default {default} \xB7 Maximum {max}",
    modelsContextHint: "Leave blank to follow the provider. The requested window is capped by the account\u2019s advertised maximum; account pools use the smallest member window. This controls local history and compaction, not the API\u2019s capacity.",
    modelsContextInvalid: "Enter a positive whole number of tokens for {model}.",
    modelsSubagentSpeed: "Subagent default speed",
    modelsSubagentSpeedHint: "Applies to subsequent subagent requests using this model, regardless of the parent model. Main conversations keep their own Speed setting. Fast requires model support.",
    modelsTools: "Provider tools",
    modelsToolsHint: "Changes apply only to sessions created after saving. Existing sessions keep their tools. Shared tools remain available if any supporting provider is enabled.",
    modelsImage: "Image generation",
    modelsVideo: "Video generation",
    modelsSearch: "X search",
    modelsWebSearch: "Web search",
    modelsSave: "Save changes",
    modelsUnavailable: "Currently unavailable",
    nav: "Subscriptions",
    intro: "Log a subscription provider in or out. Login opens the provider\u2019s authorization page in a new tab; headless setups can paste the callback URL or code instead.",
    unavailable: "Connection unavailable; subscription status cannot be loaded.",
    checking: "Checking\u2026",
    loginInProgress: "Login in progress\u2026",
    notLoggedIn: "Not logged in",
    loggedInCount: "{count} account(s) connected",
    clientVersion: "CLI {version} \xB7 {source}",
    clientVersionNpm: "latest on npm",
    clientVersionLocal: "local CLI",
    clientVersionFallback: "built-in",
    clientVersionConfig: "configured",
    clientVersionHint: "Requests present this CLI version, and newer models may require a recent one. It is the latest release on npm, or the local CLI / built-in version while npm is unreachable. Refreshing the model list checks again.",
    accountExpires: "expires {date}",
    defaultBadge: "Default",
    setDefault: "Set as default",
    addAccount: "Add account",
    addAccountOAuth: "Browser authorization",
    addAccountKeychain: "Import Claude Code",
    addAccountHint: "Browser authorization signs in whichever account the browser currently uses \u2014 switch accounts there first (or use an incognito window with the manual code below) to add a different one.",
    login: "Log in",
    cancel: "Cancel",
    logout: "Log out",
    logoutAccountConfirm: "Log out {account} of {provider}?",
    manualSummary: "Browser flow not working? Paste the callback URL or code",
    manualPlaceholder: "Paste the callback URL or code",
    submit: "Submit",
    loginMissingUrl: "login answered without an authorizeUrl",
    deviceCodePrompt: "Enter this code on the GitHub verification page:",
    deviceCodeCopy: "Copy code",
    deviceCodeCopied: "Copied",
    deviceCodeOpenPage: "Open GitHub verification page",
    usageTitle: "Usage",
    usageRefresh: "Refresh",
    usageLoading: "Loading usage\u2026",
    usageEmpty: "No usage windows reported.",
    usageError: "Usage lookup failed: {message}",
    usageSession: "5-hour window",
    usageWeekly: "Weekly",
    usageWindow: "Window",
    usageResets: "resets {date}",
    usagePlan: "Plan: {plan}",
    resetCreditsTitle: "Usage limit resets",
    resetCreditsAvailable: "{count} available",
    resetCreditsError: "Usage limit resets unavailable: {message}",
    resetUseButton: "Use\u2026",
    resetUseChecking: "Checking\u2026",
    resetUseGuard: "You can use this reset when weekly usage reaches at least 80%.",
    resetUseRestart: "Reset details are missing. Restart DSH, reload this page, then refresh usage.",
    resetUseRefresh: "Refresh usage to verify current limits and reset availability.",
    resetUseReady: "Use this reset \u2014 the earliest-expiring credit. Confirmation required.",
    resetUseConfirmTitle: "Confirm full reset",
    resetUseWarning: "This consumes one credit and resets weekly + 5-hour limits. This interface cannot undo it. Confirmation expires in 60 seconds.",
    resetUseAcknowledge: "I understand that one credit will be consumed.",
    resetUseConfirm: "Consume 1 reset",
    resetUseSuccess: "Reset confirmed. Usage refreshed.",
    resetCreditFull: "Full reset",
    resetCreditExpires: "Expires {date}",
    resetCreditExpiryUnknown: "Expiry date unavailable",
    modelDefaultsTitle: "Default reasoning effort",
    modelDefaultsHint: "The model picker preselects this level when you switch to the model; models without levels always follow the provider.",
    modelDefaultsFollowProvider: "Follow provider",
    modelDefaultsNoLevels: "{count} model(s) advertise no reasoning levels and always follow the provider.",
    modelDefaultsLoading: "Loading models\u2026",
    modelDefaultsLoadFailed: "Failed to load models: {message}",
    modelDefaultsRetry: "Retry",
    modelDefaultsRefresh: "Refresh model lists (all subscriptions)",
    modelDefaultsSaving: "Saving\u2026",
    modelDefaultsSaveFailedNamed: "Save failed for {model}: {message}",
    modelDefaultsSummary: "{total} model(s) \xB7 {configured} overridden",
    modelDefaultsSummaryNone: "{total} model(s) \xB7 following the provider",
    modelDefaultsSummaryEmpty: "No model advertises reasoning levels",
    modelDefaultsFilterPlaceholder: "Filter models",
    modelDefaultsFilterEmpty: "No model matches \u201C{query}\u201D.",
    modelDefaultsNoModels: "This provider reports no models.",
    modelDefaultsNoAccount: "No connected accounts. Connect one on the provider card first.",
    modelDefaultsDiscoveryFailed: "Model discovery failed or timed out. Use Refresh to try again.",
    generating: "Generating image\u2026",
    image: "image",
    viewImage: "View image",
    viewImageNamed: "View {name}",
    imageLoading: "Loading\u2026",
    imageLoadFailed: "Retry",
    imagePreview: "Image preview",
    imageClose: "Close",
    generatingVideo: "Generating video\u2026",
    videoLoading: "Loading video\u2026",
    videoLoadFailed: "Video failed to load: {message}",
    usageBadgeTitle: "Subscription usage",
    usageBadgeDisplay: "Status-bar quota display",
    usageBadgeDisplayRecent: "Current / most recent subscription only",
    usageBadgeDisplayHidden: "Hidden",
    usageBadgeDisplayHint: "Saved automatically in this browser. At most one subscription is shown; non-subscription models keep the most recent subscription selected in this view, or show nothing. Hiding does not affect usage details here.",
    usageBadgeDisplaySaveFailed: "Could not save the display preference. Check browser storage permissions.",
    usageBadgeCurrent: "current",
    usageBadgeModelCount: "{count} model quotas",
    usageBadgeModelUnavailable: "Current model quota unavailable",
    usageBadgeMoreWindows: "More quota windows ({count})",
    speed: "Speed",
    speedStandard: "Standard",
    speedStandardDescription: "Default speed",
    speedFast: "Fast",
    speedFastDescription: "1.5x speed, more usage",
    commandFast: "Switch the Codex speed tier (Standard/Fast)",
    commandFastUnavailable: "The current model has no fast tier; /fast only works on Codex models whose catalog advertises one",
    proxyTitle: "Proxy",
    proxyStatusNone: "Plugin proxy disabled \u2014 using DSH network settings.",
    proxyStatusEnabled: "Enabled \xB7 {url}",
    proxyStatusError: "Config error: {message}",
    proxyConfigure: "Configure\u2026",
    proxyDialogTitle: "Proxy settings",
    proxyDialogClose: "Close",
    proxyEnabled: "Route subscription requests through a proxy",
    proxyUrl: "Proxy URL",
    proxyUrlPlaceholder: "http://localhost:7890",
    proxyUrlHint: "HTTP or HTTPS proxy only (Clash/mihomo, v2rayN\u2026); socks is not supported.",
    proxyUsername: "Username (optional)",
    proxyUsernamePlaceholder: "Proxy username",
    proxyPassword: "Password",
    proxyPasswordPlaceholder: "Leave blank to keep the saved password",
    proxyClearPassword: "Clear the saved password",
    proxyBypass: "Bypass hosts",
    proxyBypassPlaceholder: "127.0.0.1, localhost, *.example.com",
    proxyBypassHint: "Comma-separated hostnames that skip this plugin proxy and use DSH network settings.",
    proxyTest: "Test",
    proxyTesting: "Testing\u2026",
    proxyTestOk: "OK \xB7 HTTP {status} \xB7 {ms} ms",
    proxyTestOkDirect: "OK (DSH network settings) \xB7 HTTP {status} \xB7 {ms} ms",
    proxyTestFail: "Failed: {message}",
    proxySave: "Save",
    proxyCancel: "Cancel",
    proxySaving: "Saving\u2026",
    proxyLoading: "Loading proxy settings\u2026",
    proxyLoadFailed: "Failed to load proxy settings: {message}",
    proxySaved: "Saved \u2014 new requests use the updated network settings.",
    proxySaveFailed: "Save failed: {message}",
    proxyNote: "On DSH v0.1.3-alpha.1, prefer the host HTTP_PROXY / HTTPS_PROXY / ALL_PROXY / NO_PROXY settings and leave this plugin proxy disabled. This optional override is retained for older hosts and subscription-only routing. Disabled or bypassed requests use DSH network settings; they are not necessarily direct. Applies to token exchange, model APIs, usage and tools. Browser OAuth follows the browser/system proxy."
  };
  var ar = {
    ...Object.fromEntries(Object.keys(en).map((key) => [key, "\u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u064B\u0627"])),
    accountPause: "\u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A",
    accountResume: "\u0627\u0633\u062A\u0626\u0646\u0627\u0641",
    accountRemove: "\u0625\u0632\u0627\u0644\u0629",
    accountRemoveConfirm: "\u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u0625\u0639\u062F\u0627\u062F\u0627\u062A\u0647 \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629\u061F",
    localSignOutDisclaimer: "\u064A\u062D\u0630\u0641 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0645\u062E\u0632\u0646\u0629 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0645\u0636\u064A\u0641 \u0641\u0642\u0637 \u0648\u0644\u0627 \u064A\u0644\u063A\u064A \u062C\u0644\u0633\u0629 \u0627\u0644\u0645\u0632\u0648\u062F.",
    accountsManage: "\u0625\u062F\u0627\u0631\u0629",
    accountsTitle: "\u0625\u062F\u0627\u0631\u0629 {provider}",
    subscriptionDisplayName: "\u0627\u0633\u0645 \u0639\u0631\u0636 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643",
    subscriptionDisplayNameHint: "\u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u064B\u0627 \u0644\u0644\u0627\u0633\u0645 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A.",
    modelDisplayName: "\u0627\u0633\u0645 \u0639\u0631\u0636 \u0627\u0644\u0646\u0645\u0648\u0630\u062C",
    modelDisplayNameHint: "\u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u064B\u0627 \u0644\u0644\u0627\u0633\u0645 \u0627\u0644\u0623\u0635\u0644\u064A.",
    displayNameReset: "\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A",
    accountsHint: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0648\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0645\u0627\u0630\u062C.",
    accountsLoading: "\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A\u2026",
    accountsLoadFailed: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A: {message}",
    accountsSaveFailed: "\u062A\u0639\u0630\u0631 \u062D\u0641\u0638 \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A: {message}",
    accountsEmpty: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062D\u0633\u0627\u0628\u0627\u062A \u0645\u062A\u0635\u0644\u0629.",
    accountsAlias: "\u0627\u0633\u0645 \u0645\u0633\u062A\u0639\u0627\u0631 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)",
    accountsPoolEnabled: "\u062A\u0636\u0645\u064A\u0646 \u0641\u064A \u0645\u062C\u0645\u0648\u0639\u0629 \u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u0646\u0645\u0627\u0630\u062C",
    accountsIndependent: "\u0639\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 \u0645\u0633\u062A\u0642\u0644 \u0641\u064A \u0645\u0646\u062A\u0642\u064A \u0627\u0644\u0646\u0645\u0627\u0630\u062C",
    accountsIndependentHint: "\u064A\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0633\u062A\u0642\u0644 \u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0641\u0642\u0637 \u062F\u0648\u0646 \u0628\u062F\u064A\u0644.",
    accountsModels: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0646\u0645\u0627\u0630\u062C \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647\u0627 \u0644\u0644\u0645\u062C\u0645\u0648\u0639\u0629",
    accountsModelsAll: "\u0643\u0644 \u0627\u0644\u0646\u0645\u0627\u0630\u062C",
    accountsModelsCount: "\u0627\u0644\u0645\u062D\u062F\u062F: {count}",
    accountsModelsHint: "\u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u062D\u0641\u0648\u0638 \u0644\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0627\u0644\u064A\u062F\u0648\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0628\u0644\u064A\u0629 \u0641\u0642\u0637.",
    accountsModelsAutomatic: "\u0627\u0644\u0633\u0645\u0627\u062D \u0628\u0643\u0644 \u0627\u0644\u0646\u0645\u0627\u0630\u062C \u0628\u0645\u0627 \u0641\u064A\u0647\u0627 \u0627\u0644\u0645\u0633\u062A\u0642\u0628\u0644\u064A\u0629",
    accountsNoModels: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u0645\u0627\u0630\u062C \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628.",
    accountsCatalogUnavailable: "\u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0646\u0645\u0627\u0630\u062C \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u061B \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0645\u062D\u0641\u0648\u0638\u0629.",
    poolSavedNotApplied: "\u0645\u062D\u0641\u0648\u0638\u061B \u064A\u064F\u0637\u0628\u0642 \u0639\u0646\u062F \u0648\u0635\u0648\u0644 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0627\u0644\u064A\u062F\u0648\u064A\u0629 (S09)",
    providerToolsUnavailable: "\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0645\u0632\u0648\u062F: \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0635\u0648\u0631 \u0648\u0627\u0644\u0628\u062D\u062B \u0639\u0644\u0649 \u0627\u0644\u0648\u064A\u0628 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u064A\u0646 (\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u0633\u062A\u0647\u0644\u0643 \u0648\u0642\u062A \u062A\u0634\u063A\u064A\u0644).",
    modelsEdit: "\u062A\u062D\u0631\u064A\u0631 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0646\u0645\u0627\u0630\u062C",
    modelsHint: "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0638\u0647\u0648\u0631 \u0648\u0627\u0644\u0627\u0633\u062A\u062F\u0644\u0627\u0644 \u0648\u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0633\u0631\u0639\u0629\u060C \u062B\u0645 \u062D\u0641\u0638 \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A.",
    modelsAutomatic: "\u0625\u0638\u0647\u0627\u0631 \u062C\u0645\u064A\u0639 \u0627\u0644\u0646\u0645\u0627\u0630\u062C \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627 \u0628\u0645\u0627 \u0641\u064A\u0647\u0627 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",
    modelsSelectAll: "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0643\u0644",
    modelsSelectNone: "\u0645\u0633\u062D \u0627\u0644\u062A\u062D\u062F\u064A\u062F",
    modelsContext: "\u0627\u0644\u0633\u064A\u0627\u0642 (\u0631\u0645\u0648\u0632)",
    modelsContextBounds: "\u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A {default} \xB7 \u0627\u0644\u0623\u0642\u0635\u0649 {max}",
    modelsContextHint: "\u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u064B\u0627 \u0644\u0627\u062A\u0628\u0627\u0639 \u0627\u0644\u0645\u0632\u0648\u062F.",
    modelsContextInvalid: "\u0623\u062F\u062E\u0644 \u0639\u062F\u062F\u064B\u0627 \u0635\u062D\u064A\u062D\u064B\u0627 \u0645\u0648\u062C\u0628\u064B\u0627 \u0644\u0644\u0646\u0645\u0648\u0630\u062C {model}.",
    modelsSubagentSpeed: "\u0633\u0631\u0639\u0629 \u0627\u0644\u0648\u0643\u064A\u0644 \u0627\u0644\u0641\u0631\u0639\u064A \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629",
    modelsSubagentSpeedHint: "\u062A\u064F\u0637\u0628\u0642 \u0639\u0644\u0649 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0648\u0643\u0644\u0627\u0621 \u0627\u0644\u0641\u0631\u0639\u064A\u064A\u0646 \u0627\u0644\u0644\u0627\u062D\u0642\u0629\u061B \u062A\u062A\u0637\u0644\u0628 \u0627\u0644\u0633\u0631\u0639\u0629 \u0627\u0644\u0639\u0627\u0644\u064A\u0629 \u062F\u0639\u0645 \u0627\u0644\u0646\u0645\u0648\u0630\u062C.",
    modelsTools: "\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0645\u0632\u0648\u062F",
    modelsSave: "\u062D\u0641\u0638 \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A",
    modelsUnavailable: "\u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u064B\u0627",
    modelsPartialSave: "\u062D\u064F\u0641\u0638\u062A \u0628\u0639\u0636 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u062F\u0644\u0627\u0644\u061B \u0623\u0639\u062F \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0644\u0644\u0628\u0642\u064A\u0629.",
    nav: "\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A",
    intro: "\u0625\u062F\u0627\u0631\u0629 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A. \u064A\u0641\u062A\u062D \u0627\u0644\u062A\u0641\u0648\u064A\u0636 \u0641\u064A \u0646\u0627\u0641\u0630\u0629 \u062C\u062F\u064A\u062F\u0629\u060C \u0648\u0644\u0635\u0642 \u0631\u0627\u0628\u0637 \u0627\u0644\u0631\u062C\u0648\u0639 \u0628\u062F\u064A\u0644 \u064A\u062F\u0648\u064A.",
    unavailable: "\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D.",
    checking: "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0642\u0642\u2026",
    loginInProgress: "\u062C\u0627\u0631\u064D \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644\u2026",
    notLoggedIn: "\u063A\u064A\u0631 \u0645\u0633\u062C\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
    loggedInCount: "{count} \u062D\u0633\u0627\u0628 \u0645\u062A\u0635\u0644",
    clientVersion: "CLI {version} \xB7 {source}",
    clientVersionFallback: "\u0645\u062F\u0645\u062C",
    clientVersionConfig: "\u0645\u064F\u0639\u062F\u0651",
    clientVersionNpm: "\u0627\u0644\u0623\u062D\u062F\u062B \u0639\u0644\u0649 npm",
    clientVersionLocal: "CLI \u0645\u062D\u0644\u064A",
    accountExpires: "\u064A\u0646\u062A\u0647\u064A {date}",
    defaultBadge: "\u0627\u0641\u062A\u0631\u0627\u0636\u064A",
    setDefault: "\u062A\u0639\u064A\u064A\u0646 \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u064B\u0627",
    addAccount: "\u0625\u0636\u0627\u0641\u0629 \u062D\u0633\u0627\u0628",
    addAccountHint: "\u064A\u0633\u062C\u0644 \u062A\u0641\u0648\u064A\u0636 \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u062D\u0627\u0644\u064A\u064B\u0627\u061B \u0628\u062F\u0651\u0644 \u0627\u0644\u062D\u0633\u0627\u0628 \u0647\u0646\u0627\u0643 \u0623\u0648\u0644\u064B\u0627 \u0623\u0648 \u0627\u0633\u062A\u062E\u062F\u0645 \u0646\u0627\u0641\u0630\u0629 \u062E\u0627\u0635\u0629 \u0645\u0639 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u064A\u062F\u0648\u064A.",
    login: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
    cancel: "\u0625\u0644\u063A\u0627\u0621",
    logout: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C",
    logoutAccountConfirm: "\u062A\u0633\u062C\u064A\u0644 \u062E\u0631\u0648\u062C {account} \u0645\u0646 {provider}\u061F",
    manualSummary: "\u0627\u0644\u062A\u0641\u0648\u064A\u0636 \u0644\u0627 \u064A\u0639\u0645\u0644\u061F \u0627\u0644\u0635\u0642 \u0631\u0627\u0628\u0637 \u0627\u0644\u0631\u062C\u0648\u0639",
    manualPlaceholder: "\u0627\u0644\u0635\u0642 \u0631\u0627\u0628\u0637 \u0627\u0644\u0631\u062C\u0648\u0639",
    submit: "\u0625\u0631\u0633\u0627\u0644",
    imageClose: "\u0625\u063A\u0644\u0627\u0642",
    usageTitle: "\u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645",
    usageRefresh: "\u062A\u062D\u062F\u064A\u062B",
    usageLoading: "\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645\u2026",
    usageEmpty: "\u0644\u0645 \u062A\u064F\u0628\u0644\u063A \u0646\u0648\u0627\u0641\u0630 \u0627\u0633\u062A\u062E\u062F\u0627\u0645.",
    usageError: "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645: {message}",
    usageSession: "\u0646\u0627\u0641\u0630\u0629 5 \u0633\u0627\u0639\u0627\u062A",
    usageWeekly: "\u0623\u0633\u0628\u0648\u0639\u064A",
    usageWindow: "\u0646\u0627\u0641\u0630\u0629",
    usageResets: "\u064A\u064F\u0639\u0627\u062F \u0627\u0644\u062A\u0639\u064A\u064A\u0646 {date}",
    usagePlan: "\u0627\u0644\u062E\u0637\u0629: {plan}",
    resetCreditsTitle: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u062D\u062F\u0648\u062F \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645",
    resetCreditsAvailable: "{count} \u0645\u062A\u0627\u062D",
    resetCreditsError: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u0629: {message}",
    resetUseButton: "\u0627\u0633\u062A\u062E\u062F\u0627\u0645\u2026",
    resetUseChecking: "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0642\u0642\u2026",
    resetCreditFull: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0627\u0645\u0644\u0629",
    resetCreditExpires: "\u064A\u0646\u062A\u0647\u064A {date}",
    resetCreditExpiryUnknown: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D",
    resetUseConfirmTitle: "\u062A\u0623\u0643\u064A\u062F \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0643\u0627\u0645\u0644\u0629",
    resetUseWarning: "\u064A\u0633\u062A\u0647\u0644\u0643 \u0631\u0635\u064A\u062F\u064B\u0627 \u0648\u0627\u062D\u062F\u064B\u0627 \u0648\u064A\u0639\u064A\u062F \u0627\u0644\u062D\u062F\u0648\u062F \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A\u0629 \u0648\u0646\u0627\u0641\u0630\u0629 5 \u0633\u0627\u0639\u0627\u062A. \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0631\u0627\u062C\u0639\u061B \u064A\u0646\u062A\u0647\u064A \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u062E\u0644\u0627\u0644 60 \u062B\u0627\u0646\u064A\u0629.",
    resetUseAcknowledge: "\u0623\u0641\u0647\u0645 \u0623\u0646 \u0631\u0635\u064A\u062F\u064B\u0627 \u0648\u0627\u062D\u062F\u064B\u0627 \u0633\u064A\u064F\u0633\u062A\u0647\u0644\u0643.",
    resetUseConfirm: "\u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0648\u0627\u062D\u062F\u0629",
    resetUseSuccess: "\u062A\u0623\u0643\u062F\u062A \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646.",
    resetUseGuard: "\u064A\u0645\u0643\u0646 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0639\u0646\u062F \u0628\u0644\u0648\u063A \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A 80\u066A.",
    resetUseRefresh: "\u062D\u062F\u0651\u062B \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0644\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062D\u062F\u0648\u062F.",
    resetUseReady: "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0623\u0642\u0631\u0628 \u0631\u0635\u064A\u062F \u0627\u0646\u062A\u0647\u0627\u0621\u064B\u061B \u064A\u062A\u0637\u0644\u0628 \u0627\u0644\u062A\u0623\u0643\u064A\u062F.",
    modelDefaultsTitle: "\u062C\u0647\u062F \u0627\u0644\u0627\u0633\u062A\u062F\u0644\u0627\u0644 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A",
    modelDefaultsFollowProvider: "\u0627\u062A\u0628\u0627\u0639 \u0627\u0644\u0645\u0632\u0648\u062F",
    modelDefaultsLoading: "\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0646\u0645\u0627\u0630\u062C\u2026",
    modelDefaultsRetry: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629",
    modelDefaultsFilterPlaceholder: "\u062A\u0635\u0641\u064A\u0629 \u0627\u0644\u0646\u0645\u0627\u0630\u062C",
    modelDefaultsFilterEmpty: "\u0644\u0627 \u0646\u0645\u0648\u0630\u062C \u064A\u0637\u0627\u0628\u0642 {query}.",
    modelDefaultsNoAccount: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062D\u0633\u0627\u0628\u0627\u062A \u0645\u062A\u0635\u0644\u0629.",
    modelDefaultsNoModels: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u0645\u0627\u0630\u062C.",
    modelDefaultsDiscoveryFailed: "\u0641\u0634\u0644 \u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0646\u0645\u0627\u0630\u062C.",
    speed: "\u0627\u0644\u0633\u0631\u0639\u0629",
    speedStandard: "\u0642\u064A\u0627\u0633\u064A\u0629",
    speedFast: "\u0633\u0631\u064A\u0639\u0629",
    usageBadgeTitle: "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643",
    usageBadgeDisplay: "\u0639\u0631\u0636 \u0627\u0644\u062D\u0635\u0629 \u0641\u064A \u0634\u0631\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u0629",
    usageBadgeDisplayRecent: "\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0627\u0644\u062D\u0627\u0644\u064A \u0623\u0648 \u0627\u0644\u0623\u062D\u062F\u062B \u0641\u0642\u0637",
    usageBadgeDisplayHidden: "\u0645\u062E\u0641\u064A",
    usageBadgeDisplayHint: "\u0645\u062D\u0641\u0648\u0638 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0645\u062A\u0635\u0641\u062D.",
    usageBadgeDisplaySaveFailed: "\u062A\u0639\u0630\u0631 \u062D\u0641\u0638 \u062A\u0641\u0636\u064A\u0644 \u0627\u0644\u0639\u0631\u0636."
  };

  // modules/subscriptions/ui/reset-action.ts
  function resetActionBlock(usage, now = Date.now()) {
    const weekly = usage.windows?.find((w) => w.kind === "weekly" && w.scope === void 0);
    if (!weekly || !Number.isFinite(weekly.usedPercent)) return "resetUseRefresh";
    if (weekly.usedPercent < 80) return "resetUseGuard";
    if (weekly.resetsAt === void 0 || weekly.resetsAt <= now || usage.resetCreditsError) return "resetUseRefresh";
    if (!usage.resetCredits?.some((c) => c.id)) return "resetUseRestart";
    if (!usage.resetCredits.some((c) => c.id && (c.expiresAt === void 0 || c.expiresAt > now))) return "resetUseRefresh";
    return void 0;
  }

  // modules/subscriptions/ui/ProviderAccountManager.tsx
  var import_react2 = __require("react");

  // modules/subscriptions/ui/subscriptions-rpc.ts
  var SUBSCRIPTIONS_AUTH_CHANNEL = "/api";
  var SUBSCRIPTIONS_AUTH_PREFIX = "majed/subscriptions.";
  var SubscriptionsAuthError = class extends Error {
  };
  async function callSubscriptionsAuth(rpc, endpoint, payload) {
    let result;
    try {
      result = await rpc.call(SUBSCRIPTIONS_AUTH_CHANNEL, `${SUBSCRIPTIONS_AUTH_PREFIX}${endpoint}`, payload);
    } catch (error) {
      throw new SubscriptionsAuthError(error instanceof Error ? error.message : String(error));
    }
    if (!result.ok) throw new SubscriptionsAuthError(result.error.message);
    return result.value;
  }

  // modules/subscriptions/ui/account-preferences.ts
  function accountPoolSelection(account, models) {
    return new Set(account.poolModels ?? models.map((model) => model.id));
  }
  function accountModelRows(account, preferences) {
    const known = new Set(account.models.map((model) => model.id));
    return [
      ...account.models.map((model) => ({ ...model, unavailable: false })),
      ...(preferences.poolModels ?? []).filter((id) => !known.has(id)).map((id) => ({ id, name: id, unavailable: true }))
    ];
  }
  function mergeLatestAccounts(draft, latest) {
    const { accounts: _stale, ...settings } = draft;
    return { ...settings, ...latest.accounts === void 0 ? {} : { accounts: latest.accounts } };
  }
  function mergeAccountChanges(latest, changes) {
    return { ...latest, accounts: { ...latest.accounts, ...changes } };
  }

  // modules/subscriptions/ui/ProviderModelEditor.tsx
  var import_react = __require("react");

  // modules/subscriptions/ui/model-filter.ts
  function modelListState(total, matched) {
    if (total === 0) return "provider-empty";
    return matched === 0 ? "filter-empty" : "rows";
  }
  function savedModelIds(visibleModels, displayNames, subagentSpeeds = void 0) {
    return [.../* @__PURE__ */ new Set([...visibleModels ?? [], ...Object.keys(displayNames ?? {}), ...Object.keys(subagentSpeeds ?? {})])];
  }
  function modelEditorNotice(accounts) {
    if (accounts.length === 0) return "noAccount";
    return accounts.every((account) => account.unavailable === true) ? "discoveryFailed" : "noModels";
  }
  var NOTICE_KEYS = {
    noAccount: "modelDefaultsNoAccount",
    discoveryFailed: "modelDefaultsDiscoveryFailed",
    noModels: "modelDefaultsNoModels"
  };
  function modelEditorState(input) {
    return {
      listState: modelListState(input.discovered + input.saved, input.matched),
      noticeKey: NOTICE_KEYS[modelEditorNotice(input.accounts)]
    };
  }

  // modules/subscriptions/ui/ProviderModelEditor.tsx
  var border = "0.5px solid var(--dsw-alias-border-l2, #ddd)";
  var actions = { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" };
  var ProviderModelEditor = (0, import_react.forwardRef)(function ProviderModelEditor2({ provider, rpc, t, disabled = false, onDirtyChange }, ref) {
    const [catalog, setCatalog] = (0, import_react.useState)();
    const [draft, setDraft] = (0, import_react.useState)({});
    const [contexts, setContexts] = (0, import_react.useState)({});
    const [efforts, setEfforts] = (0, import_react.useState)({});
    const [query, setQuery] = (0, import_react.useState)("");
    const [busy, setBusy] = (0, import_react.useState)(false);
    const [dirty, setDirty] = (0, import_react.useState)(false);
    const [error, setError] = (0, import_react.useState)("");
    const generation = (0, import_react.useRef)(0);
    (0, import_react.useEffect)(() => () => {
      generation.current++;
    }, []);
    (0, import_react.useEffect)(() => {
      onDirtyChange?.(dirty);
    }, [dirty]);
    function reset(data) {
      setCatalog(data);
      setDraft(data.settings);
      setEfforts(Object.fromEntries(data.models.map((model) => [model.id, model.configured ?? ""])));
      setContexts(Object.fromEntries(Object.entries(data.settings.contextWindows ?? {}).map(([id, value]) => [id, String(value)])));
      setDirty(false);
    }
    async function load(force = false) {
      const request = ++generation.current;
      setBusy(true);
      setError("");
      try {
        const data = await callSubscriptionsAuth(rpc, "providerSettings", { provider, force });
        if (generation.current === request) reset(data);
      } catch (error2) {
        if (generation.current === request) setError(String(error2 instanceof Error ? error2.message : error2));
      } finally {
        if (generation.current === request) setBusy(false);
      }
    }
    function edit(next) {
      setDraft(next);
      setDirty(true);
    }
    (0, import_react.useEffect)(() => {
      void load();
    }, [provider, rpc]);
    (0, import_react.useImperativeHandle)(ref, () => ({
      collect() {
        if (!catalog || !dirty) return { efforts: [] };
        const windows = /* @__PURE__ */ Object.create(null);
        for (const [model, text] of Object.entries(contexts)) {
          if (!text.trim()) continue;
          const value = Number(text);
          if (!/^\d+$/.test(text.trim()) || !Number.isSafeInteger(value) || value <= 0) {
            setError(t("modelsContextInvalid", { model }));
            return void 0;
          }
          windows[model] = value;
        }
        setError("");
        const { accounts: _accounts, ...settings } = { ...draft, ...provider === "codex" ? { contextWindows: windows } : {} };
        return {
          settings,
          efforts: catalog.models.flatMap((model) => {
            const effort = efforts[model.id] ?? "";
            return effort === (model.configured ?? "") || !model.efforts?.length ? [] : [{ model: model.id, effort }];
          })
        };
      }
    }), [catalog, dirty, draft, contexts, efforts, provider]);
    const allModels = catalog?.models ?? [];
    const known = new Set(allModels.map((model) => model.id));
    const savedIds = savedModelIds(draft.visibleModels, draft.modelDisplayNames, draft.subagentSpeeds);
    const missing = savedIds.filter((id) => !known.has(id)).map((id) => ({ id, name: id }));
    const customName = (id) => Object.hasOwn(draft.modelDisplayNames ?? {}, id) ? draft.modelDisplayNames[id] : "";
    const editName = (id, value) => {
      const names = Object.assign(/* @__PURE__ */ Object.create(null), draft.modelDisplayNames);
      if (value.trim()) names[id] = value;
      else delete names[id];
      edit({ ...draft, modelDisplayNames: names });
    };
    const models = [...allModels, ...missing].filter((model) => `${model.name} ${model.id} ${customName(model.id)}`.toLowerCase().includes(query.trim().toLowerCase()));
    const editorState = modelEditorState({
      discovered: allModels.length,
      saved: missing.length,
      matched: models.length,
      accounts: catalog?.accounts ?? []
    });
    const selected = new Set(draft.visibleModels ?? allModels.map((model) => model.id));
    return /* @__PURE__ */ React.createElement("div", { style: { borderTop: border, marginTop: 12, paddingTop: 12 } }, /* @__PURE__ */ React.createElement("h3", { style: { margin: 0 } }, t("modelsEdit")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 12, marginTop: 12 } }, /* @__PURE__ */ React.createElement("p", { className: "dsh-subscription-hint" }, t("modelsHint")), error && /* @__PURE__ */ React.createElement("p", { role: "alert" }, error), /* @__PURE__ */ React.createElement("div", { style: actions }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "dsh-subscription-quiet", disabled: busy || disabled || dirty, onClick: () => {
      void load(true);
    } }, t("usageRefresh")), busy && /* @__PURE__ */ React.createElement("span", { role: "status" }, t("modelDefaultsLoading"))), catalog && /* @__PURE__ */ React.createElement("fieldset", { disabled: busy || disabled, style: { border: 0, padding: 0, margin: 0, minWidth: 0, display: "grid", gap: 12 } }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: draft.visibleModels === void 0, onChange: (event) => {
      const next = { ...draft };
      if (event.target.checked) delete next.visibleModels;
      else next.visibleModels = allModels.map((model) => model.id);
      edit(next);
    } }), " ", t("modelsAutomatic")), editorState.listState === "provider-empty" ? /* @__PURE__ */ React.createElement("p", { className: "dsh-subscription-hint" }, t(editorState.noticeKey)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: actions }, /* @__PURE__ */ React.createElement(
      "input",
      {
        style: { flex: "1 1 180px" },
        value: query,
        onChange: (event) => setQuery(event.target.value),
        placeholder: t("modelDefaultsFilterPlaceholder"),
        "aria-label": t("modelDefaultsFilterPlaceholder")
      }
    ), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => edit({ ...draft, visibleModels: allModels.map((model) => model.id) }) }, t("modelsSelectAll")), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => edit({ ...draft, visibleModels: [] }) }, t("modelsSelectNone"))), /* @__PURE__ */ React.createElement("div", { style: { maxHeight: 360, overflowY: "auto", display: "grid", gap: 8 } }, models.map((model) => /* @__PURE__ */ React.createElement("div", { key: model.id, style: { borderBottom: border, padding: "8px 2px", display: "grid", gap: 8 } }, /* @__PURE__ */ React.createElement("label", { style: { overflowWrap: "anywhere" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: selected.has(model.id), onChange: (event) => {
      const next = new Set(selected);
      if (event.target.checked) next.add(model.id);
      else next.delete(model.id);
      edit({ ...draft, visibleModels: [...next] });
    } }), " ", model.name, !known.has(model.id) && ` (${t("modelsUnavailable")})`), /* @__PURE__ */ React.createElement("small", { style: { color: "var(--dsw-alias-label-tertiary)", overflowWrap: "anywhere" } }, "ID: ", model.id), /* @__PURE__ */ React.createElement("div", { style: actions }, /* @__PURE__ */ React.createElement("label", { style: { display: "grid", gap: 6, flex: "1 1 200px", minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12 } }, t("modelDisplayName")), /* @__PURE__ */ React.createElement(
      "input",
      {
        maxLength: 80,
        "aria-label": `${model.name} ${t("modelDisplayName")}`,
        placeholder: model.name,
        value: customName(model.id),
        onChange: (event) => editName(model.id, event.target.value)
      }
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        style: { alignSelf: "end" },
        "aria-label": `${model.name} ${t("displayNameReset")}`,
        disabled: !customName(model.id),
        onClick: () => editName(model.id, "")
      },
      t("displayNameReset")
    )), /* @__PURE__ */ React.createElement("small", { style: { color: "var(--dsw-alias-label-tertiary)" } }, t("modelDisplayNameHint")), /* @__PURE__ */ React.createElement("div", { style: actions }, (model.efforts?.length ?? 0) > 0 && /* @__PURE__ */ React.createElement("label", { style: actions }, t("modelDefaultsTitle"), /* @__PURE__ */ React.createElement(
      "select",
      {
        "aria-label": `${model.name} ${t("modelDefaultsTitle")}`,
        value: efforts[model.id] ?? "",
        onChange: (event) => {
          setEfforts({ ...efforts, [model.id]: event.target.value });
          setDirty(true);
        }
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, t("modelDefaultsFollowProvider")),
      model.configured && !model.efforts?.some((effort) => effort.id === model.configured) && /* @__PURE__ */ React.createElement("option", { value: model.configured, disabled: true }, model.configured, " (", t("modelsUnavailable"), ")"),
      model.efforts?.map((effort) => /* @__PURE__ */ React.createElement("option", { key: effort.id, value: effort.id }, effort.name))
    )), provider === "codex" && model.maxContextWindow !== void 0 && /* @__PURE__ */ React.createElement("div", { style: actions }, /* @__PURE__ */ React.createElement("label", { style: actions }, t("modelsContext"), /* @__PURE__ */ React.createElement(
      "input",
      {
        style: { width: 140 },
        inputMode: "numeric",
        value: contexts[model.id] ?? "",
        "aria-label": `${model.name} ${t("modelsContext")}`,
        placeholder: String(model.defaultContextWindow),
        onChange: (event) => {
          setContexts({ ...contexts, [model.id]: event.target.value });
          setDirty(true);
        }
      }
    )), /* @__PURE__ */ React.createElement("small", null, t("modelsContextBounds", { default: model.defaultContextWindow, max: model.maxContextWindow })))), provider === "codex" && (model.fastTier || Object.hasOwn(draft.subagentSpeeds ?? {}, model.id)) && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ React.createElement("label", { style: actions }, t("modelsSubagentSpeed"), /* @__PURE__ */ React.createElement(
      "select",
      {
        "aria-label": `${model.name} ${t("modelsSubagentSpeed")}`,
        value: Object.hasOwn(draft.subagentSpeeds ?? {}, model.id) ? draft.subagentSpeeds[model.id] : "standard",
        onChange: (event) => edit({ ...draft, subagentSpeeds: {
          ...draft.subagentSpeeds,
          [model.id]: event.target.value
        } })
      },
      /* @__PURE__ */ React.createElement("option", { value: "standard" }, t("speedStandard")),
      /* @__PURE__ */ React.createElement("option", { value: "fast", disabled: !model.fastTier }, t("speedFast"), !model.fastTier && ` (${t("modelsUnavailable")})`)
    )), /* @__PURE__ */ React.createElement("small", null, t("modelsSubagentSpeedHint"))))), models.length === 0 && /* @__PURE__ */ React.createElement("span", null, t("modelDefaultsFilterEmpty", { query })))), provider === "codex" && /* @__PURE__ */ React.createElement("small", null, t("modelsContextHint")), /* @__PURE__ */ React.createElement("p", { className: "dsh-subscription-hint" }, t("providerToolsUnavailable")), catalog.tools.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 8 } }, /* @__PURE__ */ React.createElement("strong", null, t("modelsTools")), /* @__PURE__ */ React.createElement("small", null, t("modelsToolsHint")), catalog.tools.map((tool) => /* @__PURE__ */ React.createElement("label", { key: tool }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: draft.tools?.[tool] !== false, onChange: (event) => edit({
      ...draft,
      tools: { ...draft.tools, [tool]: event.target.checked }
    }) }), " ", t(tool === "image_generate" ? "modelsImage" : tool === "video_generate" ? "modelsVideo" : tool === "web_search" ? "modelsWebSearch" : "modelsSearch")))))));
  });

  // modules/subscriptions/ui/display-name-events.ts
  var DISPLAY_NAME_CHANGED = "dsh-subscriptions-display-name-changed";
  function notifyDisplayNameChange(provider, displayName) {
    window.dispatchEvent(new CustomEvent(DISPLAY_NAME_CHANGED, {
      detail: { provider, ...displayName?.trim() ? { displayName: displayName.trim() } : {} }
    }));
  }

  // modules/subscriptions/ui/provider-settings-styles.ts
  var formScope = ":is(.dsh-subscription-manager, .dsh-subscriptions-settings)";
  var providerSettingsCss = `
.dsh-subscription-manager {
  box-sizing: border-box;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-panel, 16px);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  box-shadow: var(--dsw-elevation-prominent, 0 20px 70px #0004);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  color-scheme: light;
}
.dsh-subscriptions-settings {
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  color-scheme: light;
}
body[data-ds-dark-theme] ${formScope} {
  color-scheme: dark;
}
.dsh-subscription-manager::backdrop {
  background: var(--dsw-alias-bg-mask-1, #0006);
  backdrop-filter: var(--dsw-mask-blur, none);
}
${formScope} h2 {
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
}
${formScope} h3 {
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
}
${formScope} strong,
${formScope} .dsh-subscription-label {
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
}
${formScope} legend {
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
}
${formScope} small,
${formScope} .dsh-subscription-hint,
${formScope} [role="status"] {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
${formScope} [role="alert"] {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-state-error-primary, #b42318);
}
${formScope} input:not([type="checkbox"]),
${formScope} select {
  box-sizing: border-box;
  min-width: 0;
  height: 34px;
  padding: 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l4, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
}
${formScope} input::placeholder {
  color: var(--dsw-alias-label-tertiary);
  opacity: 1;
}
${formScope} input:not([type="checkbox"]):focus-visible,
${formScope} select:focus-visible {
  outline: none;
  border-color: var(--dsw-alias-state-business-primary, var(--dsw-alias-brand-primary));
}
${formScope} input:not([type="checkbox"]):disabled,
${formScope} select:disabled {
  color: var(--dsw-alias-label-tertiary);
  cursor: default;
}
${formScope} input[aria-invalid="true"] {
  border-color: var(--dsw-alias-state-error-primary, #b42318);
}
${formScope} option {
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
}
${formScope} label:has(> input[type="checkbox"]) {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
}
${formScope} input[type="checkbox"] {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin: 2px 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: inherit;
}
${formScope} label:has(> input[type="checkbox"]:disabled) {
  cursor: default;
  opacity: 0.5;
}
${formScope} button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 28px;
  padding: 0 10px;
  border: 0.5px solid var(--dsw-alias-border-l3, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}
${formScope} button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-3));
}
${formScope} button:active:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-active, var(--dsw-alias-bg-layer-3));
}
${formScope} button:disabled {
  opacity: 0.4;
  cursor: default;
}
${formScope} button.dsh-subscription-quiet {
  border-color: transparent;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}
${formScope} :is(footer, .dsh-subscription-dialog-actions) button {
  min-height: 34px;
  padding: 0 14px;
  border-radius: var(--dsw-radius-md, 8px);
  font-size: 13px;
  line-height: 1.5;
}
${formScope} button.dsh-subscription-primary {
  border-color: transparent;
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-label-primary));
  color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-layer-1));
  font-weight: 500;
}
${formScope} button.dsh-subscription-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-label-secondary));
}
${formScope} button:focus-visible,
${formScope} input[type="checkbox"]:focus-visible,
${formScope} summary:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}
${formScope} summary {
  border-radius: var(--dsw-radius-sm, 6px);
}
${formScope} summary:hover {
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}
`;

  // modules/subscriptions/ui/ProviderAccountManager.tsx
  var PROMPT_CACHE_TTLS = ["5m", "1h"];
  var border2 = "0.5px solid var(--dsw-alias-border-l2)";
  var stack = { display: "grid", gap: 12, minWidth: 0 };
  var actions2 = { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" };
  function ProviderAccountManager({ provider, name, rpc, t, onClose }) {
    const dialog = (0, import_react2.useRef)(null);
    const title = (0, import_react2.useId)();
    const description = (0, import_react2.useId)();
    const cacheTtlId = (0, import_react2.useId)();
    const [catalog, setCatalog] = (0, import_react2.useState)();
    const [changes, setChanges] = (0, import_react2.useState)({});
    const [loading, setLoading] = (0, import_react2.useState)(true);
    const [saving, setSaving] = (0, import_react2.useState)(false);
    const [error, setError] = (0, import_react2.useState)("");
    const [saveError, setSaveError] = (0, import_react2.useState)("");
    const [attempt, setAttempt] = (0, import_react2.useState)(0);
    const [modelsDirty, setModelsDirty] = (0, import_react2.useState)(false);
    const [displayName, setDisplayName] = (0, import_react2.useState)("");
    const [nameDirty, setNameDirty] = (0, import_react2.useState)(false);
    const [cacheTtl, setCacheTtl] = (0, import_react2.useState)("");
    const [cacheTtlDirty, setCacheTtlDirty] = (0, import_react2.useState)(false);
    const alive = (0, import_react2.useRef)(true);
    const saveLock = (0, import_react2.useRef)(false);
    const editor = (0, import_react2.useRef)(null);
    (0, import_react2.useEffect)(() => {
      alive.current = true;
      const element = dialog.current;
      const previous = document.activeElement;
      element.showModal();
      return () => {
        alive.current = false;
        element.close();
        if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
      };
    }, []);
    (0, import_react2.useEffect)(() => {
      let current = true;
      setLoading(true);
      setError("");
      void callSubscriptionsAuth(rpc, "providerSettings", { provider }).then((data) => {
        if (current) {
          setCatalog(data);
          setDisplayName(data.settings.displayName ?? "");
          setCacheTtl(data.settings.promptCacheTtl ?? "");
        }
      }).catch((error2) => {
        if (current) setError(t("accountsLoadFailed", { message: error2 instanceof Error ? error2.message : String(error2) }));
      }).finally(() => {
        if (current) setLoading(false);
      });
      return () => {
        current = false;
      };
    }, [provider, rpc, attempt]);
    function edit(key, next) {
      setChanges((current) => ({ ...current, [key]: next }));
    }
    async function save() {
      if (saveLock.current) return;
      const models = editor.current === null ? { efforts: [] } : editor.current.collect();
      if (models === void 0) return;
      saveLock.current = true;
      setSaving(true);
      setSaveError("");
      let savedEfforts = 0;
      try {
        for (const { model, effort } of models.efforts) {
          await callSubscriptionsAuth(rpc, "setModelDefault", { provider, model, ...effort ? { effort } : {} });
          savedEfforts++;
          if (!alive.current) return;
        }
        const latest = await callSubscriptionsAuth(rpc, "providerSettings", { provider });
        if (!alive.current) return;
        const base = models.settings === void 0 ? latest.settings : mergeLatestAccounts(models.settings, latest.settings);
        const { displayName: _staleName, promptCacheTtl: _staleTtl, ...rest } = mergeAccountChanges(base, changes);
        const savedName = nameDirty ? displayName.trim() : latest.settings.displayName;
        const savedTtl = cacheTtlDirty ? cacheTtl : latest.settings.promptCacheTtl;
        const settings = {
          ...rest,
          ...savedName ? { displayName: savedName } : {},
          ...savedTtl ? { promptCacheTtl: savedTtl } : {}
        };
        await callSubscriptionsAuth(rpc, "setProviderSettings", { provider, settings });
        notifyDisplayNameChange(provider, settings.displayName);
        if (alive.current) onClose();
      } catch (error2) {
        if (alive.current) {
          const message = error2 instanceof Error ? error2.message : String(error2);
          setSaveError((savedEfforts ? t("modelsPartialSave") + " " : "") + t("accountsSaveFailed", { message }));
        }
      } finally {
        saveLock.current = false;
        if (alive.current) setSaving(false);
      }
    }
    return /* @__PURE__ */ React.createElement(
      "dialog",
      {
        className: "dsh-subscription-manager",
        ref: dialog,
        "aria-labelledby": title,
        "aria-describedby": description,
        onCancel: (event) => {
          if (saveLock.current) event.preventDefault();
        },
        onClose,
        style: { width: 620, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100dvh - 32px)", overflow: "auto" }
      },
      /* @__PURE__ */ React.createElement("style", null, providerSettingsCss),
      /* @__PURE__ */ React.createElement("div", { style: { ...stack, padding: 20 } }, /* @__PURE__ */ React.createElement("header", { style: { ...actions2, justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("h2", { id: title, style: { margin: 0 } }, t("accountsTitle", { provider: name })), /* @__PURE__ */ React.createElement("button", { type: "button", autoFocus: true, disabled: saving, onClick: onClose }, t("imageClose"))), /* @__PURE__ */ React.createElement("p", { id: description, className: "dsh-subscription-hint" }, t("accountsHint")), error && /* @__PURE__ */ React.createElement("p", { role: "alert" }, error), loading && /* @__PURE__ */ React.createElement("p", { role: "status", className: "dsh-subscription-hint" }, t("accountsLoading")), !loading && !catalog && /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setAttempt((value) => value + 1) }, t("modelDefaultsRetry")), catalog && /* @__PURE__ */ React.createElement("fieldset", { disabled: saving || loading, style: { ...stack, border: 0, margin: 0, padding: 0 } }, /* @__PURE__ */ React.createElement("section", { style: { ...stack, gap: 6, paddingBottom: 8 } }, /* @__PURE__ */ React.createElement("label", { style: { ...stack, gap: 6 } }, /* @__PURE__ */ React.createElement("strong", null, t("subscriptionDisplayName")), /* @__PURE__ */ React.createElement(
        "input",
        {
          maxLength: 80,
          value: displayName,
          placeholder: name,
          onChange: (event) => {
            setDisplayName(event.target.value);
            setNameDirty(true);
          }
        }
      )), /* @__PURE__ */ React.createElement("div", { style: { ...actions2, justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("small", { className: "dsh-subscription-hint" }, t("subscriptionDisplayNameHint")), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          disabled: !displayName,
          onClick: () => {
            setDisplayName("");
            setNameDirty(true);
          }
        },
        t("displayNameReset")
      ))), provider === "claude" && /* @__PURE__ */ React.createElement("section", { style: { ...stack, gap: 6, paddingBottom: 8 } }, /* @__PURE__ */ React.createElement("label", { htmlFor: cacheTtlId }, /* @__PURE__ */ React.createElement("strong", null, t("claudePromptCacheTtl"))), /* @__PURE__ */ React.createElement(
        "select",
        {
          id: cacheTtlId,
          value: cacheTtl,
          style: { justifySelf: "start" },
          onChange: (event) => {
            setCacheTtl(event.target.value);
            setCacheTtlDirty(true);
          }
        },
        /* @__PURE__ */ React.createElement("option", { value: "" }, t("claudePromptCacheTtlDefault", { ttl: catalog.promptCacheTtlDefault ?? "5m" })),
        PROMPT_CACHE_TTLS.map((ttl) => /* @__PURE__ */ React.createElement("option", { key: ttl, value: ttl }, t(`claudePromptCacheTtl${ttl}`)))
      ), /* @__PURE__ */ React.createElement("small", { className: "dsh-subscription-hint" }, t("claudePromptCacheTtlHint"))), catalog.accounts.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "dsh-subscription-hint" }, t("accountsEmpty")), catalog.accounts.map((account) => {
        const preferences = changes[account.key] ?? catalog.settings.accounts?.[account.key] ?? {};
        const selected = accountPoolSelection(preferences, account.models);
        const models = accountModelRows(account, preferences);
        return /* @__PURE__ */ React.createElement("fieldset", { key: account.key, style: { ...stack, border: border2, borderRadius: "var(--dsw-radius-lg, 12px)", padding: 14, margin: 0 } }, /* @__PURE__ */ React.createElement("legend", { style: { padding: "0 6px", overflowWrap: "anywhere", maxWidth: "100%" } }, account.label), account.unavailable && /* @__PURE__ */ React.createElement("p", { className: "dsh-subscription-hint" }, t("accountsCatalogUnavailable")), /* @__PURE__ */ React.createElement("label", { style: { ...stack, gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "dsh-subscription-label" }, t("accountsAlias")), /* @__PURE__ */ React.createElement(
          "input",
          {
            value: preferences.alias ?? "",
            placeholder: account.label,
            onChange: (event) => {
              const next = { ...preferences };
              if (event.target.value.trim()) next.alias = event.target.value;
              else delete next.alias;
              edit(account.key, next);
            }
          }
        )), /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "checkbox",
            checked: preferences.poolEnabled !== false,
            onChange: (event) => edit(account.key, { ...preferences, poolEnabled: event.target.checked })
          }
        ), " ", t("accountsPoolEnabled")), /* @__PURE__ */ React.createElement("p", { className: "dsh-subscription-hint" }, t("poolSavedNotApplied")), /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "checkbox",
            checked: preferences.independentEntry === true,
            onChange: (event) => edit(account.key, { ...preferences, independentEntry: event.target.checked })
          }
        ), " ", t("accountsIndependent")), /* @__PURE__ */ React.createElement("p", { className: "dsh-subscription-hint" }, t("accountsIndependentHint")), /* @__PURE__ */ React.createElement("details", null, /* @__PURE__ */ React.createElement("summary", { style: { cursor: "pointer", fontSize: 13 } }, t("accountsModels"), " \xB7 ", preferences.poolModels === void 0 ? t("accountsModelsAll") : t("accountsModelsCount", { count: preferences.poolModels.length })), /* @__PURE__ */ React.createElement("div", { style: { ...stack, marginTop: 12 } }, /* @__PURE__ */ React.createElement("p", { className: "dsh-subscription-hint" }, t("accountsModelsHint")), /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: preferences.poolModels === void 0, onChange: (event) => {
          const next = { ...preferences };
          if (event.target.checked) delete next.poolModels;
          else next.poolModels = account.models.map((model) => model.id);
          edit(account.key, next);
        } }), " ", t("accountsModelsAutomatic")), /* @__PURE__ */ React.createElement("div", { style: actions2 }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => edit(account.key, { ...preferences, poolModels: models.map((model) => model.id) }) }, t("modelsSelectAll")), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => edit(account.key, { ...preferences, poolModels: [] }) }, t("modelsSelectNone"))), /* @__PURE__ */ React.createElement("div", { style: { ...stack, gap: 8, maxHeight: 240, overflowY: "auto" } }, models.map((model) => /* @__PURE__ */ React.createElement("label", { key: model.id, style: { overflowWrap: "anywhere" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: selected.has(model.id), onChange: (event) => {
          const next = new Set(selected);
          if (event.target.checked) next.add(model.id);
          else next.delete(model.id);
          edit(account.key, { ...preferences, poolModels: [...next] });
        } }), " ", model.name, model.unavailable && ` (${t("modelsUnavailable")})`)), models.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "dsh-subscription-hint" }, t("accountsNoModels"))))));
      })), /* @__PURE__ */ React.createElement(ProviderModelEditor, { ref: editor, provider, rpc, t, disabled: saving, onDirtyChange: setModelsDirty }), /* @__PURE__ */ React.createElement("footer", { style: {
        ...stack,
        gap: 8,
        borderTop: border2,
        padding: "14px 0 8px",
        position: "sticky",
        bottom: 0,
        background: "var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1))"
      } }, saveError && /* @__PURE__ */ React.createElement("p", { role: "alert" }, saveError), /* @__PURE__ */ React.createElement("div", { style: { ...actions2, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { type: "button", disabled: saving, onClick: onClose }, t("cancel")), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "dsh-subscription-primary",
          disabled: loading || saving || !Object.keys(changes).length && !modelsDirty && !nameDirty && !cacheTtlDirty,
          onClick: () => {
            void save();
          }
        },
        saving ? t("modelDefaultsSaving") : t("modelsSave")
      ))))
    );
  }

  // modules/subscriptions/ui/UsageBadgeDisplaySetting.tsx
  var import_react4 = __require("react");

  // modules/subscriptions/ui/usage-badge-preferences.ts
  var import_react3 = __require("react");
  var MODE_KEY = "dsh.subscriptions.usageBadgeMode";
  var MODE_EVENT = "dsh:subscriptions:usage-badge-mode";
  function readUsageBadgeMode() {
    if (typeof window === "undefined") return "recent";
    try {
      return window.localStorage.getItem(MODE_KEY) === "hidden" ? "hidden" : "recent";
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "SecurityError") throw error;
      return "recent";
    }
  }
  function setUsageBadgeMode(mode) {
    if (mode !== "recent" && mode !== "hidden") throw new TypeError("Invalid subscription usage display mode");
    window.localStorage.setItem(MODE_KEY, mode);
    window.dispatchEvent(new Event(MODE_EVENT));
  }
  function subscribeUsageBadgeMode(notify) {
    const onStorage = (event) => {
      if (event.key === MODE_KEY || event.key === null) notify();
    };
    window.addEventListener(MODE_EVENT, notify);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MODE_EVENT, notify);
      window.removeEventListener("storage", onStorage);
    };
  }
  function useUsageBadgeMode() {
    return (0, import_react3.useSyncExternalStore)(subscribeUsageBadgeMode, readUsageBadgeMode, () => "recent");
  }

  // modules/subscriptions/ui/UsageBadgeDisplaySetting.tsx
  function UsageBadgeDisplaySetting({ t }) {
    const mode = useUsageBadgeMode();
    const [failed, setFailed] = (0, import_react4.useState)(false);
    return /* @__PURE__ */ React.createElement("div", { style: styles.card }, /* @__PURE__ */ React.createElement("label", { style: styles.field }, /* @__PURE__ */ React.createElement("span", null, t("usageBadgeDisplay")), /* @__PURE__ */ React.createElement(
      "select",
      {
        style: styles.select,
        "aria-label": t("usageBadgeDisplay"),
        value: mode,
        onChange: (event) => {
          const value = event.currentTarget.value;
          if (value !== "recent" && value !== "hidden") return;
          try {
            setUsageBadgeMode(value);
            setFailed(false);
          } catch (error) {
            if (!(error instanceof DOMException) || !["SecurityError", "QuotaExceededError"].includes(error.name)) throw error;
            setFailed(true);
          }
        }
      },
      /* @__PURE__ */ React.createElement("option", { value: "recent" }, t("usageBadgeDisplayRecent")),
      /* @__PURE__ */ React.createElement("option", { value: "hidden" }, t("usageBadgeDisplayHidden"))
    )), /* @__PURE__ */ React.createElement("p", { style: styles.hint }, t("usageBadgeDisplayHint")), failed && /* @__PURE__ */ React.createElement("p", { role: "alert", style: { ...styles.hint, color: "var(--dsw-alias-state-error-primary)" } }, t("usageBadgeDisplaySaveFailed")));
  }
  var styles = {
    card: {
      border: "0.5px solid var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l4))",
      borderRadius: "var(--dsw-radius-xl, 20px)",
      background: "var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 6
    },
    field: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 500, lineHeight: "20px" },
    select: { width: "100%" },
    hint: { margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--dsw-alias-label-tertiary)" }
  };

  // modules/subscriptions/ui/SubscriptionsSection.tsx
  var POLL_INTERVAL_MS = 2e3;
  var CLIENT_VERSION_SOURCES = {
    npm: "clientVersionNpm",
    local: "clientVersionLocal",
    fallback: "clientVersionFallback",
    config: "clientVersionConfig"
  };
  var PROVIDERS = [
    { id: "codex", name: "Codex (ChatGPT)" }
  ];
  function messageOf(error) {
    return error instanceof Error ? error.message : String(error);
  }
  function dropStale(map, live) {
    const stale = Object.keys(map).filter((key) => !live.has(key));
    if (stale.length === 0) return map;
    const next = { ...map };
    for (const key of stale) delete next[key];
    return next;
  }
  function fallbackTranslate(key, params) {
    let text = en[key];
    for (const [name, value] of Object.entries(params ?? {})) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  }
  var styles2 = {
    section: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      maxWidth: 560,
      color: "var(--dsw-alias-label-primary)"
    },
    intro: { margin: 0, color: "var(--dsw-alias-label-tertiary)", fontSize: 14, lineHeight: "22px" },
    card: {
      border: "0.5px solid var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l4))",
      borderRadius: "var(--dsw-radius-xl, 20px)",
      background: "var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 6
    },
    proxyCard: {
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 6
    },
    separator: { borderTop: "0.5px solid var(--dsw-alias-border-l2)" },
    cardHeader: { display: "flex", alignItems: "center", gap: 8 },
    dot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
    name: { fontWeight: 500, fontSize: 14, lineHeight: "22px", color: "var(--dsw-alias-label-primary)" },
    statusLine: { margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--dsw-alias-label-tertiary)" },
    clientVersion: { fontSize: 12, lineHeight: "18px", color: "var(--dsw-alias-label-tertiary)", fontVariantNumeric: "tabular-nums" },
    errorLine: { margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--dsw-alias-state-error-primary)" },
    actions: { display: "flex", gap: 8, marginTop: 4, alignItems: "center", flexWrap: "wrap" },
    usage: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      marginTop: 4,
      borderTop: "0.5px solid var(--dsw-alias-border-l2)",
      paddingTop: 8
    },
    usageHeader: { display: "flex", alignItems: "center", gap: 8 },
    usageTitle: { fontSize: 12, lineHeight: "18px", fontWeight: 500, color: "var(--dsw-alias-label-secondary)" },
    usagePlan: { fontSize: 12, lineHeight: "18px", color: "var(--dsw-alias-label-tertiary)" },
    usageRefresh: { minHeight: 22, height: 22, padding: "0 8px", marginLeft: "auto" },
    usageRow: { display: "flex", flexDirection: "column", gap: 3 },
    usageMeta: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8,
      fontSize: 12,
      lineHeight: "18px",
      color: "var(--dsw-alias-label-tertiary)"
    },
    accountRow: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      border: "0.5px solid var(--dsw-alias-border-l2)",
      borderRadius: "var(--dsw-radius-lg, 16px)",
      padding: "8px 10px",
      marginTop: 4
    },
    accountHeader: { display: "flex", alignItems: "center", gap: 8 },
    accountName: { fontSize: 13, lineHeight: "20px", color: "var(--dsw-alias-label-primary)", userSelect: "all" },
    starButton: {
      border: "none",
      padding: 0,
      width: 28,
      font: "inherit",
      fontSize: 14,
      lineHeight: "20px",
      cursor: "pointer",
      color: "var(--dsw-alias-state-warn-label)"
    },
    usageTrack: {
      height: 6,
      borderRadius: 3,
      overflow: "hidden",
      background: "var(--dsw-alias-bg-layer-1)",
      border: "0.5px solid var(--dsw-alias-border-l2)"
    },
    usageFill: { height: "100%", borderRadius: 3 },
    deviceCode: {
      marginTop: 4,
      display: "flex",
      flexDirection: "column",
      gap: 6,
      border: "0.5px solid var(--dsw-alias-border-l2)",
      borderRadius: "var(--dsw-radius-lg, 16px)",
      padding: "10px 12px",
      background: "var(--dsw-alias-bg-layer-1)"
    },
    deviceCodeText: {
      fontFamily: "monospace",
      fontSize: 18,
      lineHeight: "24px",
      letterSpacing: 2,
      color: "var(--dsw-alias-label-primary)",
      userSelect: "all"
    },
    proxyField: { display: "flex", flexDirection: "column", gap: 4 },
    proxyLabel: { fontSize: 13, fontWeight: 500, lineHeight: "20px", color: "var(--dsw-alias-label-primary)" },
    proxyInput: { width: "100%" },
    manual: { fontSize: 13, lineHeight: "20px" },
    manualRow: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 8 },
    manualInput: { flex: "1 1 200px", minWidth: 0 },
    proxyHint: {
      margin: 0,
      fontSize: 12,
      lineHeight: "18px",
      color: "var(--dsw-alias-label-tertiary)"
    },
    proxyCheck: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 13,
      lineHeight: "20px",
      color: "var(--dsw-alias-label-primary)",
      cursor: "pointer"
    },
    proxyMessage: { margin: 0, fontSize: 12, lineHeight: "18px" },
    proxyActions: { display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", marginTop: 2 },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      zIndex: 1e3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      background: "var(--dsw-alias-bg-mask-1, #0006)",
      backdropFilter: "var(--dsw-mask-blur, none)"
    },
    modal: {
      width: 460,
      maxWidth: "100%",
      maxHeight: "90vh",
      overflowY: "auto",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "16px 18px",
      borderRadius: "var(--dsw-radius-panel, 28px)",
      background: "var(--dsw-alias-bg-layer-2)",
      border: 0,
      boxShadow: "var(--dsw-elevation-prominent)"
    },
    modalHeader: { display: "flex", alignItems: "center", gap: 8 },
    modalTitle: { fontWeight: 500, fontSize: 16, lineHeight: "24px", color: "var(--dsw-alias-label-primary)" }
  };
  function dotColor(status) {
    if (status?.busy === true) return "var(--dsw-alias-state-warn-label)";
    if ((status?.accounts.length ?? 0) > 0) return "var(--dsw-alias-state-success-primary)";
    return "var(--dsw-alias-label-dimmed)";
  }
  function ClientVersionTag({ clientVersion, t }) {
    if (clientVersion === void 0) return null;
    return /* @__PURE__ */ React.createElement("span", { style: styles2.clientVersion, title: t("clientVersionHint") }, t("clientVersion", { version: clientVersion.version, source: t(CLIENT_VERSION_SOURCES[clientVersion.source]) }));
  }
  function statusText(t, status) {
    if (status === void 0) return t("checking");
    if (status.busy) return t("loginInProgress");
    if (status.accounts.length > 0) return t("loggedInCount", { count: status.accounts.length });
    return t("notLoggedIn");
  }
  function usageWindowLabel(t, window2) {
    const base = window2.kind === "session" ? t("usageSession") : window2.kind === "weekly" ? t("usageWeekly") : t("usageWindow");
    return window2.scope !== void 0 && window2.scope !== "" ? `${base} \xB7 ${window2.scope}` : base;
  }
  function usageBarColor(usedPercent) {
    if (usedPercent >= 95) return "var(--dsw-alias-state-error-primary)";
    if (usedPercent >= 80) return "var(--dsw-alias-state-warn-label)";
    return "var(--dsw-alias-state-success-primary)";
  }
  function SubscriptionsSection(props) {
    const { rpc } = props;
    const t = props.t ?? fallbackTranslate;
    const [statuses, setStatuses] = (0, import_react5.useState)({});
    const [confirmRemove, setConfirmRemove] = (0, import_react5.useState)();
    const [errors, setErrors] = (0, import_react5.useState)({});
    const [manualDrafts, setManualDrafts] = (0, import_react5.useState)({
      codex: "",
      claude: "",
      grok: "",
      copilot: "",
      antigravity: ""
    });
    const [deviceCodes, setDeviceCodes] = (0, import_react5.useState)({});
    const [copiedCode, setCopiedCode] = (0, import_react5.useState)(void 0);
    const [usages, setUsages] = (0, import_react5.useState)({});
    const [usageErrors, setUsageErrors] = (0, import_react5.useState)({});
    const [usageLoading, setUsageLoading] = (0, import_react5.useState)({});
    const [resetConfirmation, setResetConfirmation] = (0, import_react5.useState)();
    const [resetBusy, setResetBusy] = (0, import_react5.useState)(false);
    const [resetAcknowledged, setResetAcknowledged] = (0, import_react5.useState)(false);
    const [resetMessage, setResetMessage] = (0, import_react5.useState)("");
    const [resetAccount, setResetAccount] = (0, import_react5.useState)();
    const resetDialogRef = (0, import_react5.useRef)(null);
    (0, import_react5.useEffect)(() => {
      if (resetConfirmation) resetDialogRef.current?.showModal();
      else resetDialogRef.current?.close();
    }, [resetConfirmation]);
    const resetInflight = (0, import_react5.useRef)(false);
    const mountedRef = (0, import_react5.useRef)(true);
    const pollersRef = (0, import_react5.useRef)(/* @__PURE__ */ new Map());
    const usageInflightRef = (0, import_react5.useRef)(/* @__PURE__ */ new Set());
    const [proxy, setProxy] = (0, import_react5.useState)(void 0);
    const [proxyLoadError, setProxyLoadError] = (0, import_react5.useState)(void 0);
    const [proxyOpen, setProxyOpen] = (0, import_react5.useState)(false);
    const [managedProvider, setManagedProvider] = (0, import_react5.useState)();
    const [proxyEnabled, setProxyEnabled] = (0, import_react5.useState)(false);
    const [proxyUrl, setProxyUrl] = (0, import_react5.useState)("");
    const [proxyUsername, setProxyUsername] = (0, import_react5.useState)("");
    const [proxyPassword, setProxyPassword] = (0, import_react5.useState)("");
    const [proxyClearPassword, setProxyClearPassword] = (0, import_react5.useState)(false);
    const [proxyBypass, setProxyBypass] = (0, import_react5.useState)("");
    const [proxySaving, setProxySaving] = (0, import_react5.useState)(false);
    const [proxyTesting, setProxyTesting] = (0, import_react5.useState)(false);
    const [proxyMessage, setProxyMessage] = (0, import_react5.useState)(void 0);
    const [proxyTestResult, setProxyTestResult] = (0, import_react5.useState)(void 0);
    const setProviderError = (0, import_react5.useCallback)((provider, message) => {
      if (!mountedRef.current) return;
      setErrors((prev) => {
        const next = { ...prev };
        if (message === void 0) delete next[provider];
        else next[provider] = message;
        return next;
      });
    }, []);
    const stopPolling = (0, import_react5.useCallback)((provider) => {
      const poller = pollersRef.current.get(provider);
      if (poller !== void 0) {
        clearInterval(poller);
        pollersRef.current.delete(provider);
      }
    }, []);
    const refresh = (0, import_react5.useCallback)(async () => {
      if (rpc === void 0) return;
      let response;
      try {
        response = await callSubscriptionsAuth(rpc, "status", {});
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        for (const { id } of PROVIDERS) setProviderError(id, message);
        return;
      }
      if (!mountedRef.current) return;
      if (!response?.providers?.codex) {
        setProviderError("codex", "service_unavailable");
        return;
      }
      setStatuses(response.providers);
      for (const { id } of PROVIDERS) setProviderError(id, void 0);
      for (const { id } of PROVIDERS) {
        const status = response.providers[id];
        if (!status.busy) {
          stopPolling(id);
          setDeviceCodes((prev) => {
            if (prev[id] === void 0) return prev;
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
      }
    }, [rpc, stopPolling, setProviderError]);
    const startPolling = (0, import_react5.useCallback)((provider) => {
      if (pollersRef.current.has(provider)) return;
      pollersRef.current.set(provider, setInterval(() => {
        void refresh();
      }, POLL_INTERVAL_MS));
    }, [refresh]);
    (0, import_react5.useEffect)(() => {
      mountedRef.current = true;
      void refresh().then(() => {
        if (!mountedRef.current) return;
        setStatuses((current) => {
          for (const { id } of PROVIDERS) {
            if (current[id]?.busy === true) startPolling(id);
          }
          return current;
        });
      });
      return () => {
        mountedRef.current = false;
        for (const poller of pollersRef.current.values()) clearInterval(poller);
        pollersRef.current.clear();
      };
    }, [refresh, startPolling]);
    const loadUsage = (0, import_react5.useCallback)(async (provider, account, force = false) => {
      const key = `${provider}:${account}`;
      if (rpc === void 0 || usageInflightRef.current.has(key)) return;
      usageInflightRef.current.add(key);
      setUsageLoading((prev) => ({ ...prev, [key]: true }));
      try {
        const usage = await callSubscriptionsAuth(rpc, "usage", { provider, account, ...force ? { force: true } : {} });
        if (!mountedRef.current) return;
        setUsages((prev) => ({ ...prev, [key]: usage }));
        setUsageErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } catch (error) {
        if (mountedRef.current) setUsageErrors((prev) => ({ ...prev, [key]: messageOf(error) }));
      } finally {
        usageInflightRef.current.delete(key);
        if (mountedRef.current) setUsageLoading((prev) => ({ ...prev, [key]: false }));
      }
    }, [rpc]);
    async function prepareReset(account) {
      if (!rpc || resetInflight.current) return;
      resetInflight.current = true;
      setResetBusy(true);
      setResetAccount(account);
      setResetConfirmation(void 0);
      setResetMessage("");
      try {
        const result = await callSubscriptionsAuth(rpc, "prepareReset", { account });
        setResetAcknowledged(false);
        setResetConfirmation({ ...result, account });
      } catch (error) {
        setResetMessage(messageOf(error));
      } finally {
        resetInflight.current = false;
        setResetBusy(false);
      }
    }
    async function consumeReset() {
      if (!rpc || !resetConfirmation || !resetAcknowledged || resetInflight.current) return;
      const { account, ticket } = resetConfirmation;
      resetInflight.current = true;
      setResetBusy(true);
      setResetConfirmation(void 0);
      try {
        await callSubscriptionsAuth(rpc, "consumeReset", { account, ticket });
        setResetMessage(t("resetUseSuccess"));
      } catch (error) {
        setResetMessage(messageOf(error));
      } finally {
        await loadUsage("codex", account, true);
        resetInflight.current = false;
        setResetBusy(false);
      }
    }
    (0, import_react5.useEffect)(() => {
      const live = /* @__PURE__ */ new Set();
      for (const { id } of PROVIDERS) {
        for (const account of statuses[id]?.accounts ?? []) {
          const key = `${id}:${account.key}`;
          live.add(key);
          if (usages[key] === void 0 && usageErrors[key] === void 0) void loadUsage(id, account.key);
        }
      }
      setUsages((prev) => dropStale(prev, live));
      setUsageErrors((prev) => dropStale(prev, live));
    }, [statuses, usages, usageErrors, loadUsage]);
    const login = (0, import_react5.useCallback)(async (provider, method) => {
      if (rpc === void 0) return;
      setProviderError(provider, void 0);
      try {
        const response = await callSubscriptionsAuth(rpc, "login", {
          provider,
          ...method === void 0 ? {} : { method }
        });
        if (typeof response.authorizeUrl === "string" && response.authorizeUrl === "") {
          await refresh();
          return;
        }
        if (typeof response.authorizeUrl !== "string") {
          throw new SubscriptionsAuthError(t("loginMissingUrl"));
        }
        if (!mountedRef.current) return;
        setStatuses((prev) => ({
          ...prev,
          [provider]: { accounts: prev[provider]?.accounts ?? [], ...prev[provider], busy: true }
        }));
        if (typeof response.userCode === "string" && response.userCode.length > 0) {
          setDeviceCodes((prev) => ({ ...prev, [provider]: { userCode: response.userCode, verificationUrl: response.authorizeUrl } }));
        } else {
          window.open(response.authorizeUrl, "_blank", "noopener");
        }
        startPolling(provider);
      } catch (error) {
        setProviderError(provider, messageOf(error));
      }
    }, [rpc, t, setProviderError, startPolling]);
    const cancel = (0, import_react5.useCallback)(async (provider) => {
      if (rpc === void 0) return;
      stopPolling(provider);
      try {
        await callSubscriptionsAuth(rpc, "cancel", { provider });
      } catch (error) {
        setProviderError(provider, messageOf(error));
      }
      await refresh();
    }, [rpc, stopPolling, setProviderError, refresh]);
    const submitManual = (0, import_react5.useCallback)(async (provider) => {
      if (rpc === void 0) return;
      const input = manualDrafts[provider].trim();
      if (input === "") return;
      setProviderError(provider, void 0);
      try {
        await callSubscriptionsAuth(rpc, "manual", { provider, input });
        if (mountedRef.current) setManualDrafts((prev) => ({ ...prev, [provider]: "" }));
      } catch (error) {
        setProviderError(provider, messageOf(error));
      } finally {
        if (mountedRef.current) setManualDrafts((prev) => ({ ...prev, [provider]: "" }));
      }
      await refresh();
    }, [rpc, manualDrafts, setProviderError, refresh]);
    const logout = (0, import_react5.useCallback)(async (provider, account, display, name) => {
      if (rpc === void 0) return;
      if (!window.confirm(t("logoutAccountConfirm", { provider: name, account: display }))) return;
      setProviderError(provider, void 0);
      try {
        await callSubscriptionsAuth(rpc, "logout", { provider, account });
      } catch (error) {
        setProviderError(provider, messageOf(error));
      }
      await refresh();
    }, [rpc, t, setProviderError, refresh]);
    const setDefault = (0, import_react5.useCallback)(async (provider, account) => {
      if (rpc === void 0) return;
      setProviderError(provider, void 0);
      try {
        await callSubscriptionsAuth(rpc, "setDefault", { provider, account });
      } catch (error) {
        setProviderError(provider, messageOf(error));
      }
      await refresh();
    }, [rpc, setProviderError, refresh]);
    const copyDeviceCode = (0, import_react5.useCallback)((provider, userCode) => {
      void navigator.clipboard?.writeText(userCode).then(() => {
        if (!mountedRef.current) return;
        setCopiedCode(provider);
        setTimeout(() => {
          if (mountedRef.current) {
            setCopiedCode((current) => current === provider ? void 0 : current);
          }
        }, 1500);
      }).catch(() => void 0);
    }, []);
    if (rpc === void 0) {
      return /* @__PURE__ */ React.createElement("p", { style: styles2.intro }, t("unavailable"));
    }
    return /* @__PURE__ */ React.createElement("div", { className: "dsh-subscriptions-settings", style: styles2.section }, /* @__PURE__ */ React.createElement("style", null, providerSettingsCss), /* @__PURE__ */ React.createElement("p", { style: styles2.intro }, t("intro")), /* @__PURE__ */ React.createElement(UsageBadgeDisplaySetting, { t }), PROVIDERS.map(({ id, name }) => {
      const status = statuses[id];
      const busy = status?.busy === true;
      const deviceCode = deviceCodes[id];
      const accounts = status?.accounts ?? [];
      return /* @__PURE__ */ React.createElement("div", { key: id, style: styles2.card }, /* @__PURE__ */ React.createElement("div", { style: styles2.cardHeader }, /* @__PURE__ */ React.createElement("span", { style: { ...styles2.dot, background: dotColor(status) } }), /* @__PURE__ */ React.createElement("span", { style: styles2.name }, status?.displayName || name), status?.displayName && /* @__PURE__ */ React.createElement("small", { style: styles2.statusLine }, name), /* @__PURE__ */ React.createElement(ClientVersionTag, { clientVersion: status?.clientVersion, t })), /* @__PURE__ */ React.createElement("p", { style: styles2.statusLine }, statusText(t, status)), status?.detail !== void 0 && status.detail !== "" && /* @__PURE__ */ React.createElement("p", { style: styles2.statusLine }, status.detail), errors[id] !== void 0 && /* @__PURE__ */ React.createElement("p", { style: styles2.errorLine }, errors[id]), accounts.map((account) => {
        const usageKey = `${id}:${account.key}`;
        const usage = usages[usageKey];
        const usageError = usageErrors[usageKey];
        const display = account.account ?? account.key;
        const sortedCredits = [...usage?.resetCredits ?? []].sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity));
        const nextReset = sortedCredits.find((c) => c.expiresAt === void 0 || c.expiresAt > Date.now());
        const resetBlock = usage ? resetActionBlock(usage) : "resetUseRefresh";
        const resetDisabled = resetBusy || resetBlock !== void 0;
        const showUsage = usage?.supported !== false && (usage !== void 0 || usageError !== void 0 || usageLoading[usageKey] === true);
        return /* @__PURE__ */ React.createElement("div", { key: account.key, style: styles2.accountRow }, /* @__PURE__ */ React.createElement("div", { style: styles2.accountHeader }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            style: styles2.starButton,
            title: account.isDefault ? t("defaultBadge") : t("setDefault"),
            onClick: () => {
              if (!account.isDefault) void setDefault(id, account.key);
            }
          },
          account.isDefault ? "\u2605" : "\u2606"
        ), /* @__PURE__ */ React.createElement("span", { style: styles2.accountName }, display), account.plan !== void 0 && /* @__PURE__ */ React.createElement("span", { style: styles2.usagePlan }, account.plan), account.expiresAt !== void 0 && /* @__PURE__ */ React.createElement("span", { style: styles2.statusLine }, t("accountExpires", { date: new Date(account.expiresAt).toLocaleString() })), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            style: { marginLeft: "auto", flexShrink: 0 },
            onClick: () => {
              void logout(id, account.key, display, name);
            }
          },
          t("logout")
        )), /* @__PURE__ */ React.createElement("div", { style: styles2.actions }, account.state === "connected" && /* @__PURE__ */ React.createElement("button", { onClick: async () => {
          await rpc?.call("/api", "majed/subscriptions/codex", { action: "pause", account: account.key });
          await refresh();
        } }, t("accountPause")), account.state === "paused" && /* @__PURE__ */ React.createElement("button", { onClick: async () => {
          await rpc?.call("/api", "majed/subscriptions/codex", { action: "resume", account: account.key });
          await refresh();
        } }, t("accountResume")), /* @__PURE__ */ React.createElement("button", { onClick: () => setConfirmRemove(account.key) }, t("accountRemove")), confirmRemove === account.key && /* @__PURE__ */ React.createElement("span", { role: "alertdialog" }, /* @__PURE__ */ React.createElement("span", null, t("accountRemoveConfirm")), /* @__PURE__ */ React.createElement("button", { onClick: async () => {
          await rpc?.call("/api", "majed/subscriptions/codex", { action: "remove", account: account.key });
          setConfirmRemove(void 0);
          await refresh();
        } }, t("accountRemove")), /* @__PURE__ */ React.createElement("button", { onClick: () => setConfirmRemove(void 0) }, t("cancel")))), /* @__PURE__ */ React.createElement("p", { style: styles2.statusLine }, t("localSignOutDisclaimer")), showUsage && /* @__PURE__ */ React.createElement("div", { style: styles2.usage }, /* @__PURE__ */ React.createElement("div", { style: styles2.usageHeader }, /* @__PURE__ */ React.createElement("span", { style: styles2.usageTitle }, t("usageTitle")), usage?.plan !== void 0 && /* @__PURE__ */ React.createElement("span", { style: styles2.usagePlan }, t("usagePlan", { plan: usage.plan })), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            style: styles2.usageRefresh,
            disabled: usageLoading[usageKey] === true,
            onClick: () => {
              void loadUsage(id, account.key, true);
            }
          },
          t("usageRefresh")
        )), usage === void 0 && usageError === void 0 && /* @__PURE__ */ React.createElement("p", { style: styles2.statusLine }, t("usageLoading")), usageError !== void 0 && /* @__PURE__ */ React.createElement("p", { style: styles2.errorLine }, t("usageError", { message: usageError })), usage?.windows !== void 0 && usage.windows.length === 0 && /* @__PURE__ */ React.createElement("p", { style: styles2.statusLine }, t("usageEmpty")), (usage?.windows ?? []).map((window2, index) => {
          const percent = Math.min(100, Math.max(0, window2.usedPercent));
          return /* @__PURE__ */ React.createElement("div", { key: index, style: styles2.usageRow }, /* @__PURE__ */ React.createElement("div", { style: styles2.usageMeta }, /* @__PURE__ */ React.createElement("span", null, usageWindowLabel(t, window2)), /* @__PURE__ */ React.createElement("span", null, `${String(Math.round(percent))}%`, window2.resetsAt !== void 0 && ` \xB7 ${t("usageResets", { date: new Date(window2.resetsAt).toLocaleString() })}`)), /* @__PURE__ */ React.createElement("div", { style: styles2.usageTrack }, /* @__PURE__ */ React.createElement("div", { style: { ...styles2.usageFill, width: `${String(percent)}%`, background: usageBarColor(percent) } })));
        }), id === "codex" && usage?.resetCreditsError !== void 0 && /* @__PURE__ */ React.createElement("p", { style: styles2.errorLine }, t("resetCreditsError", { message: usage.resetCreditsError })), id === "codex" && usage?.resetCredits !== void 0 && /* @__PURE__ */ React.createElement("details", { className: "subscriptions-reset-credits", style: styles2.usageRow }, /* @__PURE__ */ React.createElement("summary", { style: { ...styles2.usageMeta, cursor: "pointer", listStyle: "none", justifyContent: "flex-start", gap: 6 } }, /* @__PURE__ */ React.createElement("svg", { "aria-hidden": "true", width: "12", height: "12", viewBox: "0 0 16 16", style: { flexShrink: 0 } }, /* @__PURE__ */ React.createElement("path", { d: "m6 3 5 5-5 5", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })), /* @__PURE__ */ React.createElement("span", null, t("resetCreditsTitle")), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto" } }, t("resetCreditsAvailable", { count: usage.resetCredits.length }))), /* @__PURE__ */ React.createElement("style", null, ".subscriptions-reset-credits > summary::-webkit-details-marker { display: none; }.subscriptions-reset-credits[open] > summary > svg { transform: rotate(90deg); }"), /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 18, marginTop: 6 } }, sortedCredits.map((credit, index) => /* @__PURE__ */ React.createElement("div", { key: credit.id ?? index, style: { ...styles2.usageMeta, minHeight: 28, gap: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 } }, t("resetCreditFull"), credit === nextReset && /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            "aria-disabled": resetDisabled,
            title: t(resetBusy ? "resetUseChecking" : resetBlock ?? "resetUseReady"),
            style: {
              height: 22,
              minHeight: 22,
              padding: "0 7px",
              opacity: resetDisabled ? 0.35 : 1,
              cursor: resetDisabled ? "not-allowed" : "pointer"
            },
            onClick: () => {
              if (!resetDisabled) void prepareReset(account.key);
            }
          },
          resetBusy && resetAccount === account.key ? t("resetUseChecking") : t("resetUseButton")
        )), /* @__PURE__ */ React.createElement("span", { style: { textAlign: "right" } }, credit.expiresAt === void 0 ? t("resetCreditExpiryUnknown") : t("resetCreditExpires", { date: new Date(credit.expiresAt).toLocaleString() })))), resetAccount === account.key && resetMessage && /* @__PURE__ */ React.createElement("p", { role: "status", style: styles2.statusLine }, resetMessage)))));
      }), /* @__PURE__ */ React.createElement("div", { style: styles2.actions }, !busy && accounts.length === 0 && /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
        void login(id);
      } }, t("login")), !busy && accounts.length > 0 && id === "claude" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
        void login(id, "oauth");
      } }, t("addAccountOAuth")), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
        void login(id, "keychain");
      } }, t("addAccountKeychain"))), !busy && accounts.length > 0 && id !== "claude" && /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
        void login(id);
      } }, t("addAccount")), !busy && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          "aria-haspopup": "dialog",
          onClick: () => setManagedProvider({ id, name })
        },
        t("accountsManage")
      ), busy && /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
        void cancel(id);
      } }, t("cancel"))), !busy && accounts.length > 0 && /* @__PURE__ */ React.createElement("p", { style: styles2.statusLine }, t("addAccountHint")), busy && deviceCode !== void 0 && /* @__PURE__ */ React.createElement("div", { style: styles2.deviceCode }, /* @__PURE__ */ React.createElement("span", { style: styles2.statusLine }, t("deviceCodePrompt")), /* @__PURE__ */ React.createElement("span", { style: styles2.deviceCodeText }, deviceCode.userCode), /* @__PURE__ */ React.createElement("div", { style: styles2.actions }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
        copyDeviceCode(id, deviceCode.userCode);
      } }, copiedCode === id ? t("deviceCodeCopied") : t("deviceCodeCopy")), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            window.open(deviceCode.verificationUrl, "_blank", "noopener");
          }
        },
        t("deviceCodeOpenPage")
      ))), busy && deviceCode === void 0 && /* @__PURE__ */ React.createElement("details", { style: styles2.manual }, /* @__PURE__ */ React.createElement("summary", null, t("manualSummary")), /* @__PURE__ */ React.createElement("div", { style: styles2.manualRow }, /* @__PURE__ */ React.createElement(
        "input",
        {
          style: styles2.manualInput,
          value: manualDrafts[id],
          placeholder: t("manualPlaceholder"),
          onChange: (event) => setManualDrafts((prev) => ({ ...prev, [id]: event.target.value }))
        }
      ), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
        void submitManual(id);
      } }, t("submit")))));
    }), managedProvider && /* @__PURE__ */ React.createElement(
      ProviderAccountManager,
      {
        provider: managedProvider.id,
        name: managedProvider.name,
        rpc,
        t,
        onClose: () => {
          setManagedProvider(void 0);
          void refresh();
        }
      }
    ), /* @__PURE__ */ React.createElement("style", null, ".subscriptions-reset-dialog::backdrop { background: var(--dsw-alias-bg-mask-1, #0006); backdrop-filter: var(--dsw-mask-blur, none); }"), /* @__PURE__ */ React.createElement(
      "dialog",
      {
        ref: resetDialogRef,
        className: "subscriptions-reset-dialog",
        "aria-labelledby": "subscriptions-reset-title",
        onCancel: () => setResetConfirmation(void 0),
        onClose: () => setResetConfirmation(void 0),
        style: { ...styles2.modal, display: resetConfirmation ? "flex" : "none", margin: "auto", color: "var(--dsw-alias-label-primary)" }
      },
      resetConfirmation && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h3", { id: "subscriptions-reset-title", style: { ...styles2.modalTitle, margin: 0 } }, t("resetUseConfirmTitle")), /* @__PURE__ */ React.createElement("p", { style: { ...styles2.statusLine, overflowWrap: "anywhere" } }, statuses.codex?.accounts.find((a) => a.key === resetConfirmation.account)?.account ?? resetConfirmation.account), /* @__PURE__ */ React.createElement("div", { style: { ...styles2.usageMeta, gap: 12 } }, /* @__PURE__ */ React.createElement("span", null, t("usageWeekly")), /* @__PURE__ */ React.createElement("strong", null, Math.round(resetConfirmation.weeklyUsedPercent), "%")), /* @__PURE__ */ React.createElement("div", { style: styles2.usageMeta }, /* @__PURE__ */ React.createElement("span", null, resetConfirmation.creditExpiresAt === void 0 ? t("resetCreditExpiryUnknown") : t("resetCreditExpires", { date: new Date(resetConfirmation.creditExpiresAt).toLocaleString() }))), /* @__PURE__ */ React.createElement("p", { style: { ...styles2.statusLine, margin: "4px 0" } }, t("resetUseWarning")), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: resetAcknowledged, onChange: (e) => setResetAcknowledged(e.target.checked) }), t("resetUseAcknowledge")), /* @__PURE__ */ React.createElement("div", { className: "dsh-subscription-dialog-actions", style: { ...styles2.actions, justifyContent: "flex-end", marginTop: 8 } }, /* @__PURE__ */ React.createElement("button", { type: "button", autoFocus: true, onClick: () => setResetConfirmation(void 0) }, t("cancel")), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "dsh-subscription-primary",
          style: { opacity: resetAcknowledged ? 1 : 0.35, cursor: resetAcknowledged ? "pointer" : "not-allowed" },
          disabled: !resetAcknowledged || resetBusy,
          onClick: () => {
            void consumeReset();
          }
        },
        t("resetUseConfirm")
      )))
    ));
  }
  return __toCommonJS(entry_exports);
})();
