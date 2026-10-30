const majedSubscriptionsFactory = (require) => {
var module = { exports: {} }; var exports = module.exports;
//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let react = require("react");
react = __toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
react_jsx_runtime = __toESM(react_jsx_runtime);

//#region locale/en.json
var subscriptions$1 = {
	"title": "Subscriptions (Majed)",
	"accounts": "Subscription accounts",
	"providers": "API providers",
	"accountsEmpty": "No subscription accounts yet.",
	"providersEmpty": "No API providers yet.",
	"unreachable": "The Subscriptions host component cannot be reached. Reconnect or check the component on the Plugins page.",
	"coexistence": "The reference plugin dsh-plugin-subscriptions is running too. Only one plugin can serve the shared provider ids (codex, claude, grok, copilot, antigravity) at a time; switch the reference plugin off before using providers from this component.",
	"loginProgress": "Login in progress…",
	"connected": "account(s) connected",
	"notLoggedIn": "Not logged in",
	"clientVersion": "Client version",
	"source_npm": "latest on npm",
	"source_local": "local CLI",
	"source_fallback": "built-in",
	"source_config": "configured",
	"addAccount": "Add account",
	"openAuthorization": "Open authorization page",
	"pasteCallback": "Paste callback URL or code",
	"submitCallback": "Submit",
	"cancelLogin": "Cancel",
	"unknownPlan": "Unknown plan",
	"expires": "Expires",
	"defaultAccount": "Default account",
	"makeDefault": "Make default",
	"logout": "Log out",
	"refreshUsage": "Refresh",
	"usageNotLoaded": "Loading usage…",
	"usageUnavailable": "No usage windows reported.",
	"window_session": "5-hour window",
	"window_weekly": "Weekly",
	"window_other": "Window",
	"resets": "resets",
	"resetCredits": "Usage limit resets",
	"creditExpiryUnknown": "Expiry unknown",
	"creditExpired": "Expired",
	"creditsUnavailable": "Reset credits could not be verified.",
	"useReset": "Use…",
	"confirmLogout": "Log this account out? Its stored credentials will be removed.",
	"confirmReset": "Confirm full reset",
	"resetAcknowledge": "I understand that one credit will be consumed.",
	"cancel": "Cancel",
	"confirm": "Consume 1 reset",
	"login": "Log in",
	"checking": "Checking…",
	"usageTitle": "Usage",
	"plan": "Plan",
	"available": "available",
	"fullReset": "Full reset",
	"providerUnavailable": "Codex unavailable: provider id already registered.",
	"clientVersionHint": "Requests present this CLI version, and newer models may require a recent one.",
	"manualSummary": "Browser flow not working? Paste the callback URL or code",
	"addAccountHint": "Browser authorization signs in whichever account the browser currently uses — switch accounts there first (or use an incognito window with the manual code below) to add a different one.",
	"resetGuard": "You can use this reset when weekly usage reaches at least 80%.",
	"resetRefresh": "Refresh usage to verify current limits and reset availability.",
	"resetReady": "Use this reset — the earliest-expiring credit. Confirmation required.",
	"resetWarning": "This consumes one credit and resets weekly + 5-hour limits. This interface cannot undo it. Confirmation expires in 60 seconds.",
	"intro": "Log a subscription provider in or out. Login opens the provider’s authorization page in a new tab; headless setups can paste the callback URL or code instead.",
	"proxyTestOk": "OK · HTTP {status} · {ms} ms",
	"proxyUsernamePlaceholder": "Proxy username",
	"accountsModels": "Pool model allowlist",
	"modelsContextInvalid": "Enter a positive whole number of tokens for {model}.",
	"proxyLoadFailed": "Failed to load proxy settings: {message}",
	"modelsSave": "Save changes",
	"modelsContextHint": "Leave blank to follow the provider. The requested window is capped by the account’s advertised maximum; account pools use the smallest member window. This controls local history and compaction, not the API’s capacity.",
	"usageRefresh": "Refresh",
	"accountsAlias": "Alias (optional)",
	"accountsSaveFailed": "Could not save changes: {message}",
	"proxyUrlPlaceholder": "http://localhost:7890",
	"proxyPasswordPlaceholder": "Leave blank to keep the saved password",
	"accountsModelsCount": "{count} selected",
	"modelDefaultsTitle": "Default reasoning effort",
	"proxyDialogTitle": "Proxy settings",
	"accountsIndependent": "Show an independent entry in the model picker",
	"modelDefaultsFilterEmpty": "No model matches “{query}”.",
	"modelsSubagentSpeed": "Subagent default speed",
	"accountsPoolEnabled": "Include in the LLM account pool",
	"modelsPartialSave": "Some reasoning defaults were saved. Remaining changes are still in the draft; retry to finish.",
	"accountsModelsAutomatic": "Allow all models, including future models",
	"proxySaveFailed": "Save failed: {message}",
	"proxyStatusError": "Config error: {message}",
	"proxyLoading": "Loading proxy settings…",
	"modelsEdit": "Edit model list",
	"proxyPassword": "Password",
	"proxyBypassPlaceholder": "127.0.0.1, localhost, *.example.com",
	"subscriptionDisplayName": "Subscription display name",
	"modelDisplayName": "Model display name",
	"accountsLoading": "Loading accounts…",
	"accountsLoadFailed": "Could not load account settings: {message}",
	"proxyUrlHint": "HTTP or HTTPS proxy only (Clash/mihomo, v2rayN…); socks is not supported.",
	"accountsIndependentHint": "Independent LLM routes use only this account, with no fallback to another account. This does not isolate tools or the whole session.",
	"modelsToolsHint": "Changes apply only to sessions created after saving. Existing sessions keep their tools. Shared tools remain available if any supporting provider is enabled.",
	"proxySaving": "Saving…",
	"subscriptionDisplayNameHint": "Used in the quota bar and subscription headings. Leave blank for the default.",
	"modelsUnavailable": "Currently unavailable",
	"speedFast": "Fast",
	"proxyClearPassword": "Clear the saved password",
	"proxyDialogClose": "Close",
	"proxySave": "Save",
	"modelsSelectAll": "Select all",
	"proxyUrl": "Proxy URL",
	"accountsCatalogUnavailable": "Model discovery is currently unavailable. Saved model selections are preserved.",
	"modelsAutomatic": "Automatically show all models, including new models",
	"speedStandard": "Standard",
	"modelsHint": "Configure model visibility, default reasoning effort, subagent speed, context and tools here; Save changes below submits them together with the account settings. Hidden models remain usable by existing sessions; tool changes apply to new sessions.",
	"modelDefaultsSaving": "Saving…",
	"accountsHint": "Choose which accounts serve pooled LLM requests. Pool exclusion applies only to LLM routing, not tools or session-wide isolation.",
	"accountsNoModels": "No models reported for this account.",
	"proxyUsername": "Username (optional)",
	"modelDefaultsFilterPlaceholder": "Filter models",
	"modelDefaultsLoading": "Loading models…",
	"proxyConfigure": "Configure…",
	"proxyTestFail": "Failed: {message}",
	"proxyTestOkDirect": "OK (DSH network settings) · HTTP {status} · {ms} ms",
	"modelsContextBounds": "Default {default} · Maximum {max}",
	"proxyStatusEnabled": "Enabled · {url}",
	"accountsModelsAll": "All models",
	"imageClose": "Close",
	"proxyStatusNone": "Plugin proxy disabled — using DSH network settings.",
	"modelDisplayNameHint": "Leave blank for the original name. Reasoning effort stays separate.",
	"proxyEnabled": "Route subscription requests through a proxy",
	"accountsTitle": "Manage {provider}",
	"proxyNote": "On DSH v0.1.3-alpha.1, prefer the host HTTP_PROXY / HTTPS_PROXY / ALL_PROXY / NO_PROXY settings and leave this plugin proxy disabled. This optional override is retained for older hosts and subscription-only routing. Disabled or bypassed requests use DSH network settings; they are not necessarily direct. Applies to token exchange, model APIs, usage and tools. Browser OAuth follows the browser/system proxy.",
	"proxyBypassHint": "Comma-separated hostnames that skip this plugin proxy and use DSH network settings.",
	"proxyCancel": "Cancel",
	"modelsContext": "Context (tokens)",
	"displayNameReset": "Restore default",
	"modelsTools": "Provider tools",
	"proxySaved": "Saved — new requests use the updated network settings.",
	"modelDefaultsRetry": "Retry",
	"proxyBypass": "Bypass hosts",
	"modelsSelectNone": "Clear selection",
	"modelDefaultsFollowProvider": "Follow provider",
	"proxyTesting": "Testing…",
	"accountsManage": "Manage",
	"accountsModelsHint": "Applies only to pooled LLM routing, not independent entries. An empty selection allows no models. Turning off pool participation keeps this selection for later.",
	"proxyTitle": "Proxy",
	"modelsSubagentSpeedHint": "Applies to subsequent subagent requests using this model, regardless of the parent model. Main conversations keep their own Speed setting. Fast requires model support.",
	"proxyTest": "Test",
	"proxyUsernameHint": "Username is optional",
	"proxyPasswordHint": "Leave blank to keep the saved password",
	"modelsWebSearch": "Web search",
	"modelsImage": "Image generation",
	"modelsVideo": "Video generation",
	"modelsSearch": "X search",
	"modelDefaultsLoadFailed": "Failed to load models: {message}",
	"modelDefaultsRefresh": "Refresh model lists",
	"modelDefaultsNoModels": "This provider reports no models.",
	"modelDefaultsNoAccount": "No connected accounts. Connect one on the provider card first.",
	"modelDefaultsDiscoveryFailed": "Model discovery failed or timed out. Use Refresh to try again.",
	"modelDefaultsSaveFailedNamed": "Save failed for {model}: {message}"
};

//#endregion
//#region locale/ar.json
var subscriptions = {
	"title": "الاشتراكات (Majed)",
	"accounts": "حسابات الاشتراك",
	"providers": "موفرو API",
	"accountsEmpty": "لا توجد حسابات اشتراك بعد.",
	"providersEmpty": "لا يوجد موفرو API بعد.",
	"unreachable": "يتعذر الوصول إلى مكوّن الاشتراكات على المضيف. أعد الاتصال أو تحقق من المكوّن في صفحة الإضافات.",
	"coexistence": "الإضافة المرجعية dsh-plugin-subscriptions تعمل أيضًا. يمكن لإضافة واحدة فقط تقديم معرّفات الموفّرين المشتركة (codex, claude, grok, copilot, antigravity) في الوقت نفسه؛ أوقف الإضافة المرجعية قبل استخدام الموفّرين من هذا المكوّن.",
	"loginProgress": "جارٍ تسجيل الدخول…",
	"connected": "حساب متصل",
	"notLoggedIn": "لم يتم تسجيل الدخول",
	"clientVersion": "إصدار العميل",
	"source_npm": "سجل npm",
	"source_local": "واجهة الأوامر المحلية",
	"source_fallback": "الإصدار الاحتياطي المرفق",
	"source_config": "الإعدادات",
	"addAccount": "إضافة حساب",
	"openAuthorization": "فتح صفحة التفويض",
	"pasteCallback": "ألصق رابط العودة أو الرمز",
	"submitCallback": "إرسال",
	"cancelLogin": "إلغاء",
	"unknownPlan": "خطة غير معروفة",
	"expires": "تنتهي الصلاحية",
	"defaultAccount": "الحساب الافتراضي",
	"makeDefault": "تعيين كافتراضي",
	"logout": "تسجيل الخروج",
	"refreshUsage": "تحديث",
	"usageNotLoaded": "جارٍ تحميل الاستخدام…",
	"usageUnavailable": "لم تُبلّغ أي فترات استخدام.",
	"window_session": "فترة خمس ساعات",
	"window_weekly": "أسبوعي",
	"window_other": "فترة الاستخدام",
	"resets": "إعادة التعيين",
	"resetCredits": "إعادات تعيين حدود الاستخدام",
	"creditExpiryUnknown": "انتهاء الصلاحية غير معروف",
	"creditExpired": "منتهي الصلاحية",
	"creditsUnavailable": "تعذر التحقق من أرصدة إعادة التعيين.",
	"useReset": "استخدام…",
	"confirmLogout": "هل تريد تسجيل خروج هذا الحساب؟ ستُحذف بيانات اعتماده المخزنة.",
	"confirmReset": "تأكيد إعادة التعيين الكاملة",
	"resetAcknowledge": "أفهم أن هذا سيستهلك رصيد إعادة تعيين واحدًا.",
	"cancel": "إلغاء",
	"confirm": "استهلاك رصيد واحد",
	"login": "تسجيل الدخول",
	"checking": "جارٍ التحقق…",
	"usageTitle": "الاستخدام",
	"plan": "الخطة",
	"available": "متاح",
	"fullReset": "إعادة تعيين كاملة",
	"providerUnavailable": "Codex غير متاح: معرّف الموفّر مسجّل بالفعل.",
	"clientVersionHint": "تستخدم الطلبات إصدار واجهة الأوامر هذا؛ قد تتطلب النماذج الأحدث إصدارًا حديثًا.",
	"manualSummary": "هل تعذّر مسار المتصفح؟ ألصق رابط العودة أو الرمز",
	"addAccountHint": "يسجّل تفويض المتصفح الدخول بالحساب المستخدم حاليًا في المتصفح — بدّل الحساب هناك أولًا (أو استخدم نافذة خاصة مع الرمز اليدوي أدناه) لإضافة حساب آخر.",
	"resetGuard": "يمكنك استخدام إعادة التعيين عندما يبلغ الاستخدام الأسبوعي 80٪ على الأقل.",
	"resetRefresh": "حدّث الاستخدام للتحقق من الحدود الحالية وتوفّر إعادة التعيين.",
	"resetReady": "استخدم الرصيد الأقرب لانتهاء الصلاحية. يلزم التأكيد.",
	"resetWarning": "يستهلك هذا رصيدًا واحدًا ويعيد تعيين الحد الأسبوعي وحد الخمس ساعات. لا يمكن التراجع من هذه الواجهة. ينتهي التأكيد بعد 60 ثانية.",
	"intro": "سجّل الدخول إلى موفّر اشتراك أو اخرج منه. يفتح تسجيل الدخول صفحة تفويض الموفّر في تبويب جديد؛ ويمكن لصق رابط العودة أو الرمز في الأنظمة بلا متصفح.",
	"proxyTestOk": "نجح · HTTP {status} · {ms} مللي ثانية",
	"proxyUsernamePlaceholder": "اسم مستخدم الوكيل",
	"accountsModels": "قائمة النماذج المسموح بها للمجموعة",
	"modelsContextInvalid": "أدخل عدداً صحيحاً موجباً لرموز {model}.",
	"proxyLoadFailed": "تعذر تحميل إعدادات الوكيل: {message}",
	"modelsSave": "حفظ التغييرات",
	"modelsContextHint": "اتركه فارغاً لاتباع المزوّد. يُقيّد بالحجم الأقصى المعلن للحساب؛ تستخدم المجموعة أصغر نافذة. يضبط السجل والضغط المحليين وليس سعة الواجهة.",
	"usageRefresh": "تحديث",
	"accountsAlias": "اسم مستعار (اختياري)",
	"accountsSaveFailed": "تعذر حفظ التغييرات: {message}",
	"proxyUrlPlaceholder": "مثال: http://localhost:7890",
	"proxyPasswordPlaceholder": "اتركها فارغة للاحتفاظ بكلمة المرور المحفوظة",
	"accountsModelsCount": "{count} محدد",
	"modelDefaultsTitle": "مستوى الاستدلال الافتراضي",
	"proxyDialogTitle": "إعدادات الوكيل الشبكي",
	"accountsIndependent": "عرض إدخال مستقل في منتقي النماذج",
	"modelDefaultsFilterEmpty": "لا نموذج يطابق «{query}».",
	"modelsSubagentSpeed": "السرعة الافتراضية للوكيل الفرعي",
	"accountsPoolEnabled": "تضمين في مجموعة حسابات النماذج",
	"modelsPartialSave": "حُفظت بعض افتراضيات الاستدلال. التغييرات المتبقية ما زالت في المسودة؛ أعد المحاولة.",
	"accountsModelsAutomatic": "السماح بكل النماذج بما فيها المستقبلية",
	"proxySaveFailed": "تعذر الحفظ: {message}",
	"proxyStatusError": "خطأ إعداد: {message}",
	"proxyLoading": "جارٍ تحميل إعدادات الوكيل…",
	"modelsEdit": "تحرير قائمة النماذج",
	"proxyPassword": "كلمة المرور",
	"proxyBypassPlaceholder": "مثال: 127.0.0.1, localhost, *.example.com",
	"subscriptionDisplayName": "اسم عرض الاشتراك",
	"modelDisplayName": "اسم عرض النموذج",
	"accountsLoading": "جارٍ تحميل الحسابات…",
	"accountsLoadFailed": "تعذر تحميل إعدادات الحسابات: {message}",
	"proxyUrlHint": "وكيل HTTP أو HTTPS فقط؛ SOCKS غير مدعوم.",
	"accountsIndependentHint": "يستخدم المسار المستقل هذا الحساب فقط دون الرجوع إلى حساب آخر. لا يعزل الأدوات أو الجلسة.",
	"modelsToolsHint": "تنطبق التغييرات على الجلسات المنشأة بعد الحفظ فقط. تحتفظ الجلسات الحالية بأدواتها. تبقى الأدوات المشتركة متاحة إذا كان أي مزوّد داعم مفعّلاً.",
	"proxySaving": "جارٍ الحفظ…",
	"subscriptionDisplayNameHint": "يُستخدم في عناوين الاشتراك وشريط الحصة. اتركه فارغاً للاسم الافتراضي.",
	"modelsUnavailable": "غير متاح حالياً",
	"speedFast": "سريعة",
	"proxyClearPassword": "مسح كلمة المرور المحفوظة",
	"proxyDialogClose": "إغلاق",
	"proxySave": "حفظ",
	"modelsSelectAll": "تحديد الكل",
	"proxyUrl": "عنوان الوكيل",
	"accountsCatalogUnavailable": "اكتشاف النماذج غير متاح حالياً. تُحفظ التحديدات السابقة.",
	"modelsAutomatic": "إظهار كل النماذج تلقائياً بما فيها الجديدة",
	"speedStandard": "عادية",
	"modelsHint": "اضبط ظهور النماذج والاستدلال الافتراضي وسرعة الوكيل الفرعي والسياق والأدوات. يحفظ الزر أدناه هذه التغييرات مع إعدادات الحسابات. تبقى النماذج المخفية قابلة للاستخدام في الجلسات الحالية؛ تغييرات الأدوات للجلسات الجديدة.",
	"modelDefaultsSaving": "جارٍ الحفظ…",
	"accountsHint": "اختر الحسابات التي تخدم طلبات مجموعة النماذج. الاستبعاد لا يعزل الأدوات أو الجلسة بأكملها.",
	"accountsNoModels": "لم يُبلّغ عن نماذج لهذا الحساب.",
	"proxyUsername": "اسم المستخدم (اختياري)",
	"modelDefaultsFilterPlaceholder": "تصفية النماذج",
	"modelDefaultsLoading": "جارٍ تحميل النماذج…",
	"proxyConfigure": "تهيئة…",
	"proxyTestFail": "فشل: {message}",
	"proxyTestOkDirect": "نجح (إعدادات شبكة DSH) · HTTP {status} · {ms} مللي ثانية",
	"modelsContextBounds": "الافتراضي {default} · الحد الأقصى {max}",
	"proxyStatusEnabled": "مفعّل · {url}",
	"accountsModelsAll": "كل النماذج",
	"imageClose": "إغلاق",
	"proxyStatusNone": "وكيل الإضافة معطّل — تُستخدم إعدادات شبكة DSH.",
	"modelDisplayNameHint": "اتركه فارغاً للاسم الأصلي. يبقى مستوى الاستدلال مستقلاً.",
	"proxyEnabled": "توجيه طلبات الاشتراك عبر وكيل شبكي",
	"accountsTitle": "إدارة {provider}",
	"proxyNote": "يُفضّل استخدام إعدادات شبكة DSH وترك هذا التجاوز الاختياري معطّلاً. تستخدم الطلبات المستثناة أو المعطّلة إعدادات DSH ولا تكون مباشرة بالضرورة. ينطبق على تبادل الرموز وواجهات النماذج والاستخدام والأدوات. يتبع تسجيل الدخول إعدادات المتصفح والنظام.",
	"proxyBypassHint": "أسماء مضيفين مفصولة بفواصل تتجاوز وكيل الإضافة وتستخدم إعدادات شبكة DSH.",
	"proxyCancel": "إلغاء",
	"modelsContext": "السياق (رموز)",
	"displayNameReset": "استعادة الافتراضي",
	"modelsTools": "أدوات المزوّد",
	"proxySaved": "تم الحفظ — تستخدم الطلبات الجديدة الإعدادات المحدّثة.",
	"modelDefaultsRetry": "إعادة المحاولة",
	"proxyBypass": "مضيفون مستثنون",
	"modelsSelectNone": "مسح التحديد",
	"modelDefaultsFollowProvider": "اتباع المزوّد",
	"proxyTesting": "جارٍ الاختبار…",
	"accountsManage": "إدارة",
	"accountsModelsHint": "ينطبق على توجيه المجموعة فقط، لا الإدخالات المستقلة. التحديد الفارغ لا يسمح بأي نموذج. يُحفظ التحديد عند تعطيل المشاركة.",
	"proxyTitle": "الوكيل الشبكي",
	"modelsSubagentSpeedHint": "ينطبق على طلبات الوكيل الفرعي اللاحقة بهذا النموذج. تحتفظ المحادثات الرئيسية بسرعتها. تتطلب السرعة العالية دعم النموذج.",
	"proxyTest": "اختبار",
	"proxyUsernameHint": "اسم المستخدم اختياري",
	"proxyPasswordHint": "اتركها فارغة للاحتفاظ بكلمة المرور المحفوظة",
	"modelsWebSearch": "بحث الويب",
	"modelsImage": "توليد الصور",
	"modelsVideo": "توليد الفيديو",
	"modelsSearch": "بحث X",
	"modelDefaultsLoadFailed": "تعذر تحميل النماذج: {message}",
	"modelDefaultsRefresh": "تحديث قوائم النماذج",
	"modelDefaultsNoModels": "لم يُبلّغ المزوّد عن نماذج.",
	"modelDefaultsNoAccount": "لا حسابات متصلة. أضف حساباً أولاً.",
	"modelDefaultsDiscoveryFailed": "تعذر اكتشاف النماذج أو انتهت المهلة. حدّث لإعادة المحاولة.",
	"modelDefaultsSaveFailedNamed": "تعذر حفظ {model}: {message}"
};

//#endregion
//#region src/settings/subscriptions-rpc.ts
/**
* The node half mounts every endpoint as an exact POST route on the shared
* `/api` channel (`/api/majed-subscriptions.<endpoint>`), so the browser
* reaches it through the `/api` channel with a prefixed endpoint name.
* A dedicated channel is no longer used: since dsh 0.1.5 `rpc.handle`
* cannot register one from a plugin (see `src/auth/rpc.ts`).
*/
const SUBSCRIPTIONS_AUTH_CHANNEL = "/api";
const SUBSCRIPTIONS_AUTH_PREFIX = "majed-subscriptions.";
/** Business error returned by a `subscriptions-auth` endpoint (error branch message). */
var SubscriptionsAuthError = class extends Error {};
/**
* Call one `subscriptions-auth` endpoint and unwrap the business result.
* Shared by the settings section, the composer Speed toggle, the usage
* badge, and the image/video toolviews.
* @param rpc - Connection RPC caller.
* @param endpoint - endpoint name (`status`, `usage`, `image`, ...).
* @param payload - endpoint-owned request payload.
* @returns the success value, cast by the caller to the endpoint's shape.
*/
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

//#endregion
//#region src/settings/ProxySettings.tsx
/** Draft/test/save behavior ported from v0.9.12 SubscriptionsSection. Password never pre-fills. */
function ProxySettings({ rpc, t }) {
	const [view, setView] = (0, react.useState)();
	const [open, setOpen] = (0, react.useState)(false);
	const [draft, setDraft] = (0, react.useState)({});
	const [error, setError] = (0, react.useState)("");
	const [busy, setBusy] = (0, react.useState)("");
	const [result, setResult] = (0, react.useState)();
	const dialog = (0, react.useRef)(null);
	const generation = (0, react.useRef)(0);
	(0, react.useEffect)(() => () => {
		generation.current++;
	}, []);
	const close = () => {
		generation.current++;
		setOpen(false);
		setBusy("");
	};
	(0, react.useEffect)(() => {
		let alive = true;
		callSubscriptionsAuth(rpc, "proxyGet", {}).then((value) => {
			if (alive) setView(value);
		}).catch((reason) => {
			if (alive) setError(String(reason.message));
		});
		return () => {
			alive = false;
		};
	}, [rpc]);
	(0, react.useEffect)(() => {
		if (!open) return;
		const previous = document.activeElement;
		dialog.current?.showModal();
		return () => {
			dialog.current?.close();
			if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
		};
	}, [open]);
	const field = (key, value) => setDraft((old) => ({
		...old,
		[key]: value
	}));
	const run = async (test) => {
		if (busy) return;
		const request = ++generation.current;
		setBusy(test ? "test" : "save");
		setError("");
		setResult(void 0);
		const password = draft.clearPassword ? { password: null } : draft.password ? { password: draft.password } : {};
		try {
			if (test) {
				const tested = await callSubscriptionsAuth(rpc, "proxyTest", { proxy: {
					enabled: draft.enabled,
					url: draft.url.trim(),
					...draft.username.trim() !== "" ? { username: draft.username.trim() } : {},
					...password,
					bypass: draft.bypass.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
				} });
				if (generation.current === request) setResult(tested);
			} else {
				const saved = await callSubscriptionsAuth(rpc, "proxySet", {
					enabled: draft.enabled,
					url: draft.url.trim(),
					username: draft.username,
					...password,
					bypass: draft.bypass.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
				});
				if (generation.current === request) {
					setView(saved);
					setOpen(false);
				}
			}
		} catch (reason) {
			if (generation.current === request) setError(reason.message);
		} finally {
			if (generation.current === request) setBusy("");
		}
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
		className: "majed-proxy-settings",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("proxyTitle") }),
				" ",
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: !view,
					onClick: () => {
						setDraft({
							...view,
							username: view.username ?? "",
							password: "",
							clearPassword: false,
							bypass: view.bypass.join(", ")
						});
						setError("");
						setResult(void 0);
						setOpen(true);
					},
					children: t("proxyConfigure")
				})
			] }),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				role: "status",
				children: view ? view.error ? t("proxyStatusError", { message: view.error }) : view.enabled ? t("proxyStatusEnabled", { url: view.url }) : t("proxyStatusNone") : t("proxyLoading")
			}),
			error && !open && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				role: "alert",
				children: error
			}),
			open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dialog", {
				ref: dialog,
				"aria-labelledby": "majed-proxy-title",
				onCancel: close,
				style: {
					maxInlineSize: 560,
					inlineSize: "calc(100% - 32px)"
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
					id: "majed-proxy-title",
					children: t("proxyDialogTitle")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: {
						display: "grid",
						gap: 12
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: draft.enabled,
							onChange: (event) => field("enabled", event.target.checked)
						}), t("proxyEnabled")] }),
						[
							"url",
							"username",
							"password",
							"bypass"
						].map((key) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							style: {
								display: "grid",
								gap: 4
							},
							children: [
								t(`proxy${key[0].toUpperCase()}${key.slice(1)}`),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: key === "password" ? "password" : "text",
									autoComplete: "off",
									dir: key === "url" ? "ltr" : void 0,
									value: draft[key],
									onChange: (event) => field(key, event.target.value)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t(`proxy${key[0].toUpperCase()}${key.slice(1)}Hint`) })
							]
						}, key)),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: draft.clearPassword,
							onChange: (event) => field("clearPassword", event.target.checked)
						}), t("proxyClearPassword")] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("proxyNote") }),
						error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							role: "alert",
							children: error
						}),
						result && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							role: "status",
							children: result.ok ? t(result.viaProxy ? "proxyTestOk" : "proxyTestOkDirect", {
								status: String(result.status),
								ms: String(result.latencyMs)
							}) : t("proxyTestFail", { message: result.error ?? "" })
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: !!busy,
								onClick: () => void run(true),
								children: t(busy === "test" ? "proxyTesting" : "proxyTest")
							}),
							" ",
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: !!busy,
								onClick: () => void run(false),
								children: t(busy === "save" ? "proxySaving" : "proxySave")
							}),
							" ",
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: close,
								children: t("proxyCancel")
							})
						] })
					]
				})]
			})
		]
	});
}

//#endregion
//#region src/settings/account-preferences.ts
/** Missing allowlist follows discovery; explicit [] must remain empty. */
function accountPoolSelection(account, models) {
	return new Set(account.poolModels ?? models.map((model) => model.id));
}
/** Retain unavailable saved IDs so a temporary catalog failure cannot erase them. */
function accountModelRows(account, preferences) {
	const known = new Set(account.models.map((model) => model.id));
	return [...account.models.map((model) => ({
		...model,
		unavailable: false
	})), ...(preferences.poolModels ?? []).filter((id) => !known.has(id)).map((id) => ({
		id,
		name: id,
		unavailable: true
	}))];
}

//#endregion
//#region src/settings/model-filter.ts
/**
* Which empty state the model list is in.
*
* `provider-empty` means the provider shows NO rows at all — the filter box cannot match
* anything in that state, and printing `No model matches “”.` next to it reads like a broken
* control rather than like an explanation (issue #147).
*
* `filter-empty` keeps the existing message for a query that filtered everything out of a
* provider that does have rows.
*/
function modelListState(total, matched) {
	if (total === 0) return "provider-empty";
	return matched === 0 ? "filter-empty" : "rows";
}
/**
* Row ids the editor can still show when discovery returned nothing: saved visibility,
* display names and subagent speeds must count towards the total —
* otherwise a temporary catalog failure would hide the rows that edit them.
*/
function savedModelIds(visibleModels, displayNames, subagentSpeeds = void 0) {
	return [...new Set([
		...visibleModels ?? [],
		...Object.keys(displayNames ?? {}),
		...Object.keys(subagentSpeeds ?? {})
	])];
}
/**
* Why the provider has no models — read from the data the host already sends.
*
* `total === 0` alone cannot tell these apart, and guessing wrong re-creates the very
* defect issue #147 is about: telling a user who IS logged in to go and log in. The
* catalog payload carries one row per connected account with `unavailable: true` when that
* account's discovery failed or timed out (src/index.ts).
*
*  · no account at all                       → `noAccount`;
*  · accounts exist, every discovery failed  → `discoveryFailed` (retry, not log in);
*  · a connected account answered (possibly with an empty catalog) → `noModels`.
*/
function modelEditorNotice(accounts) {
	if (accounts.length === 0) return "noAccount";
	return accounts.every((account) => account.unavailable === true) ? "discoveryFailed" : "noModels";
}
/** Locale keys for the three honest empty states. */
const NOTICE_KEYS = {
	noAccount: "modelDefaultsNoAccount",
	discoveryFailed: "modelDefaultsDiscoveryFailed",
	noModels: "modelDefaultsNoModels"
};
/**
* The editor's whole empty-state decision, in one testable place: how many rows exist
* (discovered + the user's saved ids), whether a query filtered them all out, and which
* notice to show when there are none.
*/
function modelEditorState(input) {
	return {
		listState: modelListState(input.discovered + input.saved, input.matched),
		noticeKey: NOTICE_KEYS[modelEditorNotice(input.accounts)]
	};
}

//#endregion
//#region src/settings/ProviderModelEditor.tsx
const border$1 = "0.5px solid var(--dsw-alias-border-l2, #ddd)";
const actions$1 = {
	display: "flex",
	flexWrap: "wrap",
	gap: 8,
	alignItems: "center"
};
/**
* Embedded section of the account manager dialog. It owns the model draft
* (visibility, effort, context, tools) but not its submission: the dialog
* collects the draft through the handle and saves it with the account edits
* in one go, so there is a single Save/Cancel pair.
*/
const ProviderModelEditor = (0, react.forwardRef)(function ProviderModelEditor$1({ provider, rpc, t, disabled = false, onDirtyChange }, ref) {
	const [catalog, setCatalog] = (0, react.useState)();
	const [draft, setDraft] = (0, react.useState)({});
	const [contexts, setContexts] = (0, react.useState)({});
	const [efforts, setEfforts] = (0, react.useState)({});
	const [query, setQuery] = (0, react.useState)("");
	const [busy, setBusy] = (0, react.useState)(false);
	const [dirty, setDirty] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)("");
	const generation = (0, react.useRef)(0);
	(0, react.useEffect)(() => () => {
		generation.current++;
	}, []);
	(0, react.useEffect)(() => {
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
			const data = await callSubscriptionsAuth(rpc, "providerSettings", {
				provider,
				force
			});
			if (generation.current === request) reset(data);
		} catch (error$1) {
			if (generation.current === request) setError(String(error$1 instanceof Error ? error$1.message : error$1));
		} finally {
			if (generation.current === request) setBusy(false);
		}
	}
	function edit(next) {
		setDraft(next);
		setDirty(true);
	}
	(0, react.useEffect)(() => {
		load();
	}, [provider, rpc]);
	(0, react.useImperativeHandle)(ref, () => ({ collect() {
		if (!catalog || !dirty) return { efforts: [] };
		const windows = Object.create(null);
		for (const [model, text] of Object.entries(contexts)) {
			if (!text.trim()) continue;
			const value = Number(text);
			const limits = catalog.models.find((entry) => entry.id === model);
			if (!/^\d+$/.test(text.trim()) || !Number.isSafeInteger(value) || value <= 0 || limits?.maxContextWindow !== void 0 && value > limits.maxContextWindow) {
				setError(t("modelsContextInvalid", { model }));
				return;
			}
			windows[model] = value;
		}
		setError("");
		const { accounts: _accounts,...settings } = {
			...draft,
			...provider === "codex" ? { contextWindows: windows } : {}
		};
		return {
			settings,
			original: catalog.settings,
			efforts: catalog.models.flatMap((model) => {
				const effort = efforts[model.id] ?? "";
				return effort === (model.configured ?? "") || !model.efforts?.length ? [] : [{
					model: model.id,
					effort
				}];
			})
		};
	} }), [
		catalog,
		dirty,
		draft,
		contexts,
		efforts,
		provider
	]);
	const allModels = catalog?.models ?? [];
	const known = new Set(allModels.map((model) => model.id));
	const missing = savedModelIds(draft.visibleModels, draft.modelDisplayNames, draft.subagentSpeeds).filter((id) => !known.has(id)).map((id) => ({
		id,
		name: id
	}));
	const customName = (id) => Object.hasOwn(draft.modelDisplayNames ?? {}, id) ? draft.modelDisplayNames[id] : "";
	const editName = (id, value) => {
		const names = Object.assign(Object.create(null), draft.modelDisplayNames);
		if (value.trim()) names[id] = value;
		else delete names[id];
		edit({
			...draft,
			modelDisplayNames: names
		});
	};
	const models = [...allModels, ...missing].filter((model) => `${model.name} ${model.id} ${customName(model.id)}`.toLowerCase().includes(query.trim().toLowerCase()));
	const editorState = modelEditorState({
		discovered: allModels.length,
		saved: missing.length,
		matched: models.length,
		accounts: catalog?.accounts ?? []
	});
	const selected = new Set(draft.visibleModels ?? allModels.map((model) => model.id));
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			borderBlockStart: border$1,
			marginBlockStart: 12,
			paddingBlockStart: 12
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
			style: { margin: 0 },
			children: t("modelsEdit")
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				display: "grid",
				gap: 12,
				marginBlockStart: 12
			},
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "majed-subscription-hint",
					children: t("modelsHint")
				}),
				error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					role: "alert",
					children: error
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: actions$1,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "majed-subscription-quiet",
						disabled: busy || disabled || dirty,
						onClick: () => {
							load(true);
						},
						children: t("usageRefresh")
					}), busy && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						role: "status",
						children: t("modelDefaultsLoading")
					})]
				}),
				catalog && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
					disabled: busy || disabled,
					style: {
						border: 0,
						padding: 0,
						margin: 0,
						minWidth: 0,
						display: "grid",
						gap: 12
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: draft.visibleModels === void 0,
								onChange: (event) => {
									const next = { ...draft };
									if (event.target.checked) delete next.visibleModels;
									else next.visibleModels = allModels.map((model) => model.id);
									edit(next);
								}
							}),
							" ",
							t("modelsAutomatic")
						] }),
						editorState.listState === "provider-empty" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "majed-subscription-hint",
							children: t(editorState.noticeKey)
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: actions$1,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									style: { flex: "1 1 180px" },
									value: query,
									onChange: (event) => setQuery(event.target.value),
									placeholder: t("modelDefaultsFilterPlaceholder"),
									"aria-label": t("modelDefaultsFilterPlaceholder")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => edit({
										...draft,
										visibleModels: allModels.map((model) => model.id)
									}),
									children: t("modelsSelectAll")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => edit({
										...draft,
										visibleModels: []
									}),
									children: t("modelsSelectNone")
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								maxHeight: 360,
								overflowY: "auto",
								display: "grid",
								gap: 8
							},
							children: [models.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									borderBlockEnd: border$1,
									padding: "8px 2px",
									display: "grid",
									gap: 8
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										style: { overflowWrap: "anywhere" },
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: selected.has(model.id),
												onChange: (event) => {
													const next = new Set(selected);
													if (event.target.checked) next.add(model.id);
													else next.delete(model.id);
													edit({
														...draft,
														visibleModels: [...next]
													});
												}
											}),
											" ",
											model.name,
											!known.has(model.id) && ` (${t("modelsUnavailable")})`
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", {
										style: {
											color: "var(--dsw-alias-label-tertiary)",
											overflowWrap: "anywhere"
										},
										children: ["ID: ", model.id]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: actions$1,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											style: {
												display: "grid",
												gap: 6,
												flex: "1 1 200px",
												minWidth: 0
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: { fontSize: 12 },
												children: t("modelDisplayName")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												maxLength: 80,
												"aria-label": `${model.name} ${t("modelDisplayName")}`,
												placeholder: model.name,
												value: customName(model.id),
												onChange: (event) => editName(model.id, event.target.value)
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											style: { alignSelf: "end" },
											"aria-label": `${model.name} ${t("displayNameReset")}`,
											disabled: !customName(model.id),
											onClick: () => editName(model.id, ""),
											children: t("displayNameReset")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
										style: { color: "var(--dsw-alias-label-tertiary)" },
										children: t("modelDisplayNameHint")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: actions$1,
										children: [(model.efforts?.length ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											style: actions$1,
											children: [t("modelDefaultsTitle"), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												"aria-label": `${model.name} ${t("modelDefaultsTitle")}`,
												value: efforts[model.id] ?? "",
												onChange: (event) => {
													setEfforts({
														...efforts,
														[model.id]: event.target.value
													});
													setDirty(true);
												},
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "",
														children: t("modelDefaultsFollowProvider")
													}),
													model.configured && !model.efforts?.some((effort) => effort.id === model.configured) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
														value: model.configured,
														disabled: true,
														children: [
															model.configured,
															" (",
															t("modelsUnavailable"),
															")"
														]
													}),
													model.efforts?.map((effort) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: effort.id,
														children: effort.name
													}, effort.id))
												]
											})]
										}), provider === "codex" && model.maxContextWindow !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: actions$1,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												style: actions$1,
												children: [t("modelsContext"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													style: { width: 140 },
													inputMode: "numeric",
													value: contexts[model.id] ?? "",
													"aria-label": `${model.name} ${t("modelsContext")}`,
													placeholder: String(model.defaultContextWindow),
													onChange: (event) => {
														setContexts({
															...contexts,
															[model.id]: event.target.value
														});
														setDirty(true);
													}
												})]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("modelsContextBounds", {
												default: model.defaultContextWindow,
												max: model.maxContextWindow
											}) })]
										})]
									}),
									provider === "codex" && (model.fastTier || Object.hasOwn(draft.subagentSpeeds ?? {}, model.id)) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "grid",
											gap: 6
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											style: actions$1,
											children: [t("modelsSubagentSpeed"), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												"aria-label": `${model.name} ${t("modelsSubagentSpeed")}`,
												value: Object.hasOwn(draft.subagentSpeeds ?? {}, model.id) ? draft.subagentSpeeds[model.id] : "standard",
												onChange: (event) => edit({
													...draft,
													subagentSpeeds: {
														...draft.subagentSpeeds,
														[model.id]: event.target.value
													}
												}),
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: "standard",
													children: t("speedStandard")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
													value: "fast",
													disabled: !model.fastTier,
													children: [t("speedFast"), !model.fastTier && ` (${t("modelsUnavailable")})`]
												})]
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("modelsSubagentSpeedHint") })]
									})
								]
							}, model.id)), models.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("modelDefaultsFilterEmpty", { query }) })]
						})] }),
						provider === "codex" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("modelsContextHint") }),
						catalog.tools.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "grid",
								gap: 8
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("modelsTools") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("modelsToolsHint") }),
								catalog.tools.map((tool) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: draft.tools?.[tool] !== false,
										onChange: (event) => edit({
											...draft,
											tools: {
												...draft.tools,
												[tool]: event.target.checked
											}
										})
									}),
									" ",
									t(tool === "image_generate" ? "modelsImage" : tool === "video_generate" ? "modelsVideo" : tool === "web_search" ? "modelsWebSearch" : "modelsSearch")
								] }, tool))
							]
						})
					]
				})
			]
		})]
	});
});

//#endregion
//#region src/settings/display-name-events.ts
/** Notify mounted views after a successful save, without another quota request. */
const DISPLAY_NAME_CHANGED = "majed-subscriptions-display-name-changed";
function notifyDisplayNameChange(provider, displayName) {
	window.dispatchEvent(new CustomEvent(DISPLAY_NAME_CHANGED, { detail: {
		provider,
		...displayName?.trim() ? { displayName: displayName.trim() } : {}
	} }));
}

//#endregion
//#region src/settings/provider-settings-styles.ts
/**
* The host loads one JS client bundle, so keep this small, scoped stylesheet
* with the dialog instead of relying on a separate CSS asset. Geometry and
* theme tokens follow the host's settings-form and ui-primitives controls.
*/
const formScope = ":is(.majed-subscription-manager, .majed-subscriptions-settings)";
const providerSettingsCss = `
.majed-subscription-manager {
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
.majed-subscriptions-settings {
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  color-scheme: light;
}
body[data-ds-dark-theme] ${formScope} {
  color-scheme: dark;
}
.majed-subscription-manager::backdrop {
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
${formScope} .majed-subscription-label {
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
${formScope} .majed-subscription-hint,
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
${formScope} button.majed-subscription-quiet {
  border-color: transparent;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}
${formScope} :is(footer, .majed-subscription-dialog-actions) button {
  min-height: 34px;
  padding: 0 14px;
  border-radius: var(--dsw-radius-md, 8px);
  font-size: 13px;
  line-height: 1.5;
}
${formScope} button.majed-subscription-primary {
  border-color: transparent;
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-label-primary));
  color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-layer-1));
  font-weight: 500;
}
${formScope} button.majed-subscription-primary:hover:not(:disabled) {
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

//#endregion
//#region src/settings/ProviderAccountManager.tsx
const border = "0.5px solid var(--dsw-alias-border-l2)";
const stack = {
	display: "grid",
	gap: 12,
	minWidth: 0
};
const actions = {
	display: "flex",
	flexWrap: "wrap",
	gap: 8,
	alignItems: "center"
};
/** Native top-layer dialog provides keyboard containment, Escape and focus restoration. */
function ProviderAccountManager({ provider, name, rpc, t, onClose }) {
	const dialog = (0, react.useRef)(null);
	const title = (0, react.useId)();
	const description = (0, react.useId)();
	(0, react.useId)();
	const [catalog, setCatalog] = (0, react.useState)();
	const [changes, setChanges] = (0, react.useState)({});
	const [loading, setLoading] = (0, react.useState)(true);
	const [saving, setSaving] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)("");
	const [saveError, setSaveError] = (0, react.useState)("");
	const [attempt, setAttempt] = (0, react.useState)(0);
	const [modelsDirty, setModelsDirty] = (0, react.useState)(false);
	const [displayName, setDisplayName] = (0, react.useState)("");
	const [nameDirty, setNameDirty] = (0, react.useState)(false);
	/** '' follows the plugin config; otherwise an explicit TTL. */
	const [cacheTtl, setCacheTtl] = (0, react.useState)("");
	const [cacheTtlDirty, setCacheTtlDirty] = (0, react.useState)(false);
	const alive = (0, react.useRef)(true);
	const saveLock = (0, react.useRef)(false);
	const editor = (0, react.useRef)(null);
	(0, react.useEffect)(() => {
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
	(0, react.useEffect)(() => {
		let current = true;
		setLoading(true);
		setError("");
		callSubscriptionsAuth(rpc, "providerSettings", { provider }).then((data) => {
			if (current) {
				setCatalog(data);
				setDisplayName(data.settings.displayName ?? "");
				setCacheTtl(data.settings.promptCacheTtl ?? "");
			}
		}).catch((error$1) => {
			if (current) setError(t("accountsLoadFailed", { message: error$1 instanceof Error ? error$1.message : String(error$1) }));
		}).finally(() => {
			if (current) setLoading(false);
		});
		return () => {
			current = false;
		};
	}, [
		provider,
		rpc,
		attempt
	]);
	function edit(key, next) {
		setChanges((current) => ({
			...current,
			[key]: next
		}));
	}
	/**
	* One submit for both drafts: the model editor's (visibility, effort,
	* context, tools) and this dialog's account edits. A failure keeps the
	* dialog open with every edit intact.
	*/
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
				await callSubscriptionsAuth(rpc, "setModelDefault", {
					provider,
					model,
					...effort ? { effort } : {}
				});
				savedEfforts++;
				if (!alive.current) return;
			}
			const original = catalog?.settings ?? {};
			const { accounts: _accounts, displayName: _name, promptCacheTtl: _ttl,...unchanged } = original;
			const savedName = nameDirty ? displayName.trim() : original.displayName;
			const savedTtl = cacheTtlDirty ? cacheTtl : original.promptCacheTtl;
			const { accounts: _editorAccounts, displayName: _editorName, promptCacheTtl: _editorTtl,...editorFields } = models.settings ?? unchanged;
			const settings = {
				...editorFields,
				...original.accounts || Object.keys(changes).length ? { accounts: {
					...original.accounts,
					...changes
				} } : {},
				...savedName ? { displayName: savedName } : {},
				...savedTtl ? { promptCacheTtl: savedTtl } : {}
			};
			await callSubscriptionsAuth(rpc, "setProviderSettings", {
				provider,
				settings,
				original
			});
			notifyDisplayNameChange(provider, settings.displayName);
			if (alive.current) onClose();
		} catch (error$1) {
			if (alive.current) {
				const message = error$1 instanceof Error ? error$1.message : String(error$1);
				setSaveError((savedEfforts ? t("modelsPartialSave") + " " : "") + t("accountsSaveFailed", { message }));
			}
		} finally {
			saveLock.current = false;
			if (alive.current) setSaving(false);
		}
	}
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dialog", {
		className: "majed-subscription-manager",
		ref: dialog,
		"aria-labelledby": title,
		"aria-describedby": description,
		onCancel: (event) => {
			if (saveLock.current) event.preventDefault();
		},
		onClose,
		style: {
			width: 620,
			maxWidth: "calc(100vw - 32px)",
			maxHeight: "calc(100dvh - 32px)",
			overflow: "auto"
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: providerSettingsCss }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				...stack,
				padding: 20
			},
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					style: {
						...actions,
						justifyContent: "space-between"
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						id: title,
						style: { margin: 0 },
						children: t("accountsTitle", { provider: name })
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						autoFocus: true,
						disabled: saving,
						onClick: onClose,
						children: t("imageClose")
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					id: description,
					className: "majed-subscription-hint",
					children: t("accountsHint")
				}),
				error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					role: "alert",
					children: error
				}),
				loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					role: "status",
					className: "majed-subscription-hint",
					children: t("accountsLoading")
				}),
				!loading && !catalog && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setAttempt((value) => value + 1),
					children: t("modelDefaultsRetry")
				}),
				catalog && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
					disabled: saving || loading,
					style: {
						...stack,
						border: 0,
						margin: 0,
						padding: 0
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							style: {
								...stack,
								gap: 6,
								paddingBlockEnd: 8
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									...stack,
									gap: 6
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("subscriptionDisplayName") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									maxLength: 80,
									value: displayName,
									placeholder: name,
									onChange: (event) => {
										setDisplayName(event.target.value);
										setNameDirty(true);
									}
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									...actions,
									justifyContent: "space-between"
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
									className: "majed-subscription-hint",
									children: t("subscriptionDisplayNameHint")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: !displayName,
									onClick: () => {
										setDisplayName("");
										setNameDirty(true);
									},
									children: t("displayNameReset")
								})]
							})]
						}),
						catalog.accounts.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "majed-subscription-hint",
							children: t("accountsEmpty")
						}),
						catalog.accounts.map((account) => {
							const preferences = changes[account.key] ?? catalog.settings.accounts?.[account.key] ?? {};
							const selected = accountPoolSelection(preferences, account.models);
							const models = accountModelRows(account, preferences);
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
								style: {
									...stack,
									border,
									borderRadius: "var(--dsw-radius-lg, 12px)",
									padding: 14,
									margin: 0
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", {
										style: {
											padding: "0 6px",
											overflowWrap: "anywhere",
											maxWidth: "100%"
										},
										children: account.label
									}),
									account.unavailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "majed-subscription-hint",
										children: t("accountsCatalogUnavailable")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										style: {
											...stack,
											gap: 6
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "majed-subscription-label",
											children: t("accountsAlias")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: preferences.alias ?? "",
											placeholder: account.label,
											onChange: (event) => {
												const next = { ...preferences };
												if (event.target.value.trim()) next.alias = event.target.value;
												else delete next.alias;
												edit(account.key, next);
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: preferences.poolEnabled !== false,
											onChange: (event) => edit(account.key, {
												...preferences,
												poolEnabled: event.target.checked
											})
										}),
										" ",
										t("accountsPoolEnabled")
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: preferences.independentEntry === true,
											onChange: (event) => edit(account.key, {
												...preferences,
												independentEntry: event.target.checked
											})
										}),
										" ",
										t("accountsIndependent")
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "majed-subscription-hint",
										children: t("accountsIndependentHint")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", {
										style: {
											cursor: "pointer",
											fontSize: 13
										},
										children: [
											t("accountsModels"),
											" · ",
											preferences.poolModels === void 0 ? t("accountsModelsAll") : t("accountsModelsCount", { count: preferences.poolModels.length })
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											...stack,
											marginBlockStart: 12
										},
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
												className: "majed-subscription-hint",
												children: t("accountsModelsHint")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: preferences.poolModels === void 0,
													onChange: (event) => {
														const next = { ...preferences };
														if (event.target.checked) delete next.poolModels;
														else next.poolModels = account.models.map((model) => model.id);
														edit(account.key, next);
													}
												}),
												" ",
												t("accountsModelsAutomatic")
											] }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: actions,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => edit(account.key, {
														...preferences,
														poolModels: models.map((model) => model.id)
													}),
													children: t("modelsSelectAll")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => edit(account.key, {
														...preferences,
														poolModels: []
													}),
													children: t("modelsSelectNone")
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													...stack,
													gap: 8,
													maxHeight: 240,
													overflowY: "auto"
												},
												children: [models.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
													style: { overflowWrap: "anywhere" },
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															type: "checkbox",
															checked: selected.has(model.id),
															onChange: (event) => {
																const next = new Set(selected);
																if (event.target.checked) next.add(model.id);
																else next.delete(model.id);
																edit(account.key, {
																	...preferences,
																	poolModels: [...next]
																});
															}
														}),
														" ",
														model.name,
														model.unavailable && ` (${t("modelsUnavailable")})`
													]
												}, model.id)), models.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
													className: "majed-subscription-hint",
													children: t("accountsNoModels")
												})]
											})
										]
									})] })
								]
							}, account.key);
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderModelEditor, {
					ref: editor,
					provider,
					rpc,
					t,
					disabled: saving,
					onDirtyChange: setModelsDirty
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
					style: {
						...stack,
						gap: 8,
						borderBlockStart: border,
						padding: "14px 0 8px",
						position: "sticky",
						insetBlockEnd: 0,
						background: "var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1))"
					},
					children: [saveError && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: saveError
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							...actions,
							justifyContent: "flex-end"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: saving,
							onClick: onClose,
							children: t("cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "majed-subscription-primary",
							disabled: loading || saving || !Object.keys(changes).length && !modelsDirty && !nameDirty && !cacheTtlDirty,
							onClick: () => {
								save();
							},
							children: saving ? t("modelDefaultsSaving") : t("modelsSave")
						})]
					})]
				})
			]
		})]
	});
}

//#endregion
//#region src/codex-card.ts
/** Scoped presentation port of V1ki v0.9.12 b802311; see PROVENANCE.md. */
const styles = {
	section: {
		display: "flex",
		flexDirection: "column",
		gap: 12,
		maxInlineSize: 560,
		color: "var(--dsw-alias-label-primary)"
	},
	card: {
		border: "0.5px solid var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l4))",
		borderRadius: "var(--dsw-radius-xl, 20px)",
		background: "var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))",
		padding: "12px 14px",
		display: "flex",
		flexDirection: "column",
		gap: 6
	},
	cardHeader: {
		display: "flex",
		alignItems: "center",
		gap: 8
	},
	dot: {
		inlineSize: 8,
		blockSize: 8,
		borderRadius: "50%",
		flexShrink: 0
	},
	name: {
		font: "var(--dsw-font-s-14)",
		fontWeight: 500,
		color: "var(--dsw-alias-label-primary)"
	},
	statusLine: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-tertiary)"
	},
	clientVersion: {
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-tertiary)",
		fontVariantNumeric: "tabular-nums"
	},
	errorLine: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-state-error-primary)"
	},
	actions: {
		display: "flex",
		gap: 8,
		marginBlockStart: 4,
		alignItems: "center",
		flexWrap: "wrap"
	},
	usage: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		marginBlockStart: 4,
		borderBlockStart: "0.5px solid var(--dsw-alias-border-l2)",
		paddingBlockStart: 8
	},
	usageHeader: {
		display: "flex",
		alignItems: "center",
		gap: 8
	},
	usageTitle: {
		font: "var(--dsw-font-s-12)",
		fontWeight: 500,
		color: "var(--dsw-alias-label-secondary)"
	},
	usagePlan: {
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-tertiary)"
	},
	usageRefresh: {
		minHeight: 22,
		blockSize: 22,
		padding: "0 8px",
		marginInlineStart: "auto"
	},
	usageRow: {
		display: "flex",
		flexDirection: "column",
		gap: 3
	},
	usageMeta: {
		display: "flex",
		justifyContent: "space-between",
		gap: 8,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-tertiary)"
	},
	accountRow: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		border: "0.5px solid var(--dsw-alias-border-l2)",
		borderRadius: "var(--dsw-radius-lg, 16px)",
		padding: "8px 10px",
		marginBlockStart: 4
	},
	accountHeader: {
		display: "flex",
		alignItems: "center",
		gap: 8
	},
	accountName: {
		font: "var(--dsw-font-s-13)",
		color: "var(--dsw-alias-label-primary)",
		userSelect: "all"
	},
	starButton: {
		border: "none",
		padding: 0,
		inlineSize: 28,
		font: "var(--dsw-font-s-14)",
		cursor: "pointer",
		color: "var(--dsw-alias-state-warn-label)"
	},
	usageTrack: {
		blockSize: 6,
		borderRadius: 3,
		overflow: "hidden",
		background: "var(--dsw-alias-bg-layer-1)",
		border: "0.5px solid var(--dsw-alias-border-l2)"
	},
	usageFill: {
		blockSize: "100%",
		borderRadius: 3
	},
	manual: { font: "var(--dsw-font-s-13)" },
	manualRow: {
		display: "flex",
		flexWrap: "wrap",
		gap: 8,
		alignItems: "center",
		marginBlockStart: 8
	},
	manualInput: {
		flex: "1 1 200px",
		minInlineSize: 0
	},
	modal: {
		inlineSize: 460,
		maxInlineSize: "100%",
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
	modalTitle: {
		font: "var(--dsw-font-s-16)",
		fontWeight: 500,
		color: "var(--dsw-alias-label-primary)"
	}
};
const controlCss = `:is(.majed-subscriptions-settings, .majed-reset-dialog) input:not([type="checkbox"]),
:is(.majed-subscriptions-settings, .majed-reset-dialog) select {
  box-sizing: border-box;
  min-width: 0;
  height: 34px;
  padding: 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l4, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font: var(--dsw-font-s-13);
  font-weight: 400;
  line-height: 1.5;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) input::placeholder {
  color: var(--dsw-alias-label-tertiary);
  opacity: 1;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) input:not([type="checkbox"]):focus-visible,
:is(.majed-subscriptions-settings, .majed-reset-dialog) select:focus-visible {
  outline: none;
  border-color: var(--dsw-alias-state-business-primary, var(--dsw-alias-brand-primary));
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) input:not([type="checkbox"]):disabled,
:is(.majed-subscriptions-settings, .majed-reset-dialog) select:disabled {
  color: var(--dsw-alias-label-tertiary);
  cursor: default;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) input[aria-invalid="true"] {
  border-color: var(--dsw-alias-state-error-primary);
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) option {
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) label:has(> input[type="checkbox"]) {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font: var(--dsw-font-s-14);
  line-height: 20px;
  cursor: pointer;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) input[type="checkbox"] {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin: 2px 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: inherit;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) label:has(> input[type="checkbox"]:disabled) {
  cursor: default;
  opacity: 0.5;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button {
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
  font: var(--dsw-font-s-12);
  line-height: 18px;
  cursor: pointer;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-3));
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button:active:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-active, var(--dsw-alias-bg-layer-3));
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button:disabled {
  opacity: 0.4;
  cursor: default;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button.majed-subscription-quiet {
  border-color: transparent;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) :is(footer, .majed-subscription-dialog-actions) button {
  min-height: 34px;
  padding: 0 14px;
  border-radius: var(--dsw-radius-md, 8px);
  font: var(--dsw-font-s-13);
  line-height: 1.5;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button.majed-subscription-primary {
  border-color: transparent;
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-label-primary));
  color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-layer-1));
  font-weight: 500;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button.majed-subscription-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-label-secondary));
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) button:focus-visible,
:is(.majed-subscriptions-settings, .majed-reset-dialog) input[type="checkbox"]:focus-visible,
:is(.majed-subscriptions-settings, .majed-reset-dialog) summary:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) summary {
  border-radius: var(--dsw-radius-sm, 6px);
}
:is(.majed-subscriptions-settings, .majed-reset-dialog) summary:hover {
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}

.majed-reset-credits > summary::-webkit-details-marker { display:none; }
.majed-reset-credits[open] > summary > svg { transform:rotate(90deg); }
[dir="rtl"] .majed-reset-credits > summary > svg { transform:scaleX(-1); }
[dir="rtl"] .majed-reset-credits[open] > summary > svg { transform:rotate(90deg); }
.majed-reset-dialog::backdrop { background:var(--dsw-alias-bg-mask-1); backdrop-filter:var(--dsw-mask-blur, none); }
.majed-subscriptions-settings { font:var(--dsw-font-s-13); }
.majed-subscriptions-settings a { color:var(--dsw-alias-state-business-primary); text-underline-offset: .15em; }
`;
function createCodexCard(React, primitives, rpc, t) {
	const h = React.createElement;
	const Button = primitives.Button ?? "button";
	const Input = primitives.Input ?? "input";
	return function CodexCard() {
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const [acknowledged, setAcknowledged] = React.useState(false);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `majed-subscriptions.${endpoint}`, {
				provider: "codex",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.codex,
				registrationError: value.registrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (error$1) {
				if (alive.current) setError(error$1 instanceof Error ? error$1.message : String(error$1));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((error$1) => {
				if (alive.current) setError(error$1.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((error$1) => {
					if (alive.current) setError(error$1.message);
				});
			}, 2e3);
			return () => clearInterval(timer);
		}, [status?.busy]);
		const refreshUsage = (account, force = false) => {
			if (usageRequests.current.has(account)) return usageRequests.current.get(account);
			const request = (async () => {
				try {
					const snapshot = await call("usage", {
						account,
						force
					});
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: snapshot
					}));
				} catch (error$1) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: error$1 instanceof Error ? error$1.message : String(error$1) }
					}));
				} finally {
					if (usageRequests.current.get(account) === request) usageRequests.current.delete(account);
				}
			})();
			usageRequests.current.set(account, request);
			return request;
		};
		const accountsSignature = JSON.stringify((status?.accounts ?? []).map((account) => account.key));
		React.useEffect(() => {
			const keys = new Set((status?.accounts ?? []).map((account) => account.key));
			const added = [...keys].filter((key) => !accountKeys.current.has(key));
			accountKeys.current = keys;
			for (const key of usageRequests.current.keys()) if (!keys.has(key)) usageRequests.current.delete(key);
			setUsage((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
			for (const key of added) refreshUsage(key);
		}, [accountsSignature]);
		const button = (label, onClick, disabled = false, props = {}) => h(Button, {
			type: "button",
			disabled: pending || disabled,
			onClick,
			...props
		}, label);
		const date = (time) => new Date(time).toLocaleString();
		const part = (name, style, ...children) => h("div", {
			style,
			"data-majed-codex-part": name
		}, ...children);
		const startLogin = () => {
			action(async () => {
				const result = await call("login");
				if (!alive.current) return;
				window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result);
				await refreshStatus();
			});
		};
		const busy = status?.busy;
		return h("div", {
			style: {
				...styles.section,
				textAlign: "start"
			},
			className: "majed-subscriptions-settings",
			"data-majed-codex-card": true
		}, h("style", null, controlCss), h(ProxySettings, {
			rpc,
			t
		}), manager ? h(ProviderAccountManager, {
			provider: "codex",
			name: status?.displayName || "Codex (ChatGPT)",
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles.card, part("header", styles.cardHeader, h("span", {
			"aria-hidden": true,
			style: {
				...styles.dot,
				background: busy ? "var(--dsw-alias-state-warn-label)" : status?.accounts?.length ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-label-dimmed)"
			}
		}), h("span", { style: styles.name }, status?.displayName || "Codex (ChatGPT)"), button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), status?.clientVersion ? h("span", {
			style: styles.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), h("p", {
			style: styles.statusLine,
			role: "status"
		}, status?.registrationError ? t("providerUnavailable") : busy ? t("loginProgress") : status?.accounts?.length ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail ? h("p", { style: styles.statusLine }, status.detail) : null, error ? h("p", {
			style: styles.errorLine,
			role: "alert"
		}, error) : null, ...(status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			const credits = [...snapshot?.resetCredits ?? []].sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity));
			const next = credits.find((credit) => credit.id && (credit.expiresAt === void 0 || credit.expiresAt > Date.now()));
			const weekly = snapshot?.windows?.find((window$1) => window$1.kind === "weekly" && !window$1.scope);
			const resetBlocked = !weekly || !Number.isFinite(weekly.usedPercent) || !weekly.resetsAt || weekly.resetsAt <= Date.now() || snapshot?.resetCreditsError ? "resetRefresh" : weekly.usedPercent < 80 ? "resetGuard" : !next ? "resetRefresh" : null;
			return h("div", {
				key: account.key,
				style: styles.accountRow,
				"data-majed-codex-part": "account"
			}, part("account-header", styles.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => {
				setAcknowledged(false);
				setConfirmation({
					kind: "logout",
					account: account.key,
					label: account.account
				});
			}, false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles.statusLine }, t("usageUnavailable")) : part("usage", styles.usage, part("usage-header", styles.usageHeader, h("span", { style: styles.usageTitle }, t("usageTitle")), snapshot?.plan ? h("span", { style: styles.usagePlan }, t("plan"), ": ", h("bdi", null, snapshot.plan)) : null, button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, false, { style: styles.usageRefresh })), !snapshot ? h("p", { style: styles.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles.errorLine,
				role: "alert"
			}, snapshot.error) : !snapshot.windows?.length ? h("p", { style: styles.statusLine }, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles.usageRow
				}, part("usage-meta", styles.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles.usageTrack
				}, h("div", { style: {
					...styles.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			}), snapshot?.resetCreditsError ? h("p", {
				style: styles.errorLine,
				role: "alert"
			}, t("creditsUnavailable"), " ", snapshot.resetCreditsError) : null, snapshot?.resetCredits ? h("details", {
				className: "majed-reset-credits",
				style: styles.usageRow
			}, h("summary", { style: {
				...styles.usageMeta,
				cursor: "pointer",
				listStyle: "none",
				justifyContent: "flex-start",
				gap: 6
			} }, h("svg", {
				"aria-hidden": true,
				width: 12,
				height: 12,
				viewBox: "0 0 16 16"
			}, h("path", {
				d: "m6 3 5 5-5 5",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.5,
				strokeLinecap: "round",
				strokeLinejoin: "round"
			})), h("span", null, t("resetCredits")), h("span", { style: { marginInlineStart: "auto" } }, credits.filter((c) => c.id && (c.expiresAt === void 0 || c.expiresAt > Date.now())).length, " ", t("available"))), h("div", { style: {
				paddingInlineStart: 18,
				marginBlockStart: 6
			} }, ...credits.map((credit, index) => h("div", {
				key: credit.id ?? index,
				style: {
					...styles.usageMeta,
					minBlockSize: 28,
					gap: 12
				}
			}, h("span", { style: {
				display: "inline-flex",
				alignItems: "center",
				gap: 8,
				flexShrink: 0
			} }, t("fullReset"), credit === next ? button(t("useReset"), () => {
				if (!resetBlocked) action(async () => {
					const prepared = await call("prepareReset", { account: account.key });
					setAcknowledged(false);
					setConfirmation({
						kind: "reset",
						account: account.key,
						label: account.account ?? account.key,
						...prepared
					});
				});
			}, false, {
				"aria-disabled": !!resetBlocked,
				title: t(resetBlocked ?? "resetReady"),
				style: {
					blockSize: 22,
					minBlockSize: 22,
					padding: "0 7px",
					opacity: resetBlocked ? .35 : 1,
					cursor: resetBlocked ? "not-allowed" : "pointer"
				}
			}) : null), h("span", { style: { textAlign: "end" } }, credit.expiresAt === void 0 ? t("creditExpiryUnknown") : h("span", null, t("expires"), " ", h("bdi", null, date(credit.expiresAt)), credit.expiresAt <= Date.now() ? ` · ${t("creditExpired")}` : null)))))) : null));
		}), part("actions", styles.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : button(t(status?.accounts?.length ? "addAccount" : "login"), startLogin, !!status?.registrationError)), !busy && status?.accounts?.length ? h("p", { style: styles.statusLine }, t("addAccountHint")) : null, busy ? h("div", null, (status.pendingAuth ?? login)?.authorizeUrl ? h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles.manual
		}, t("openAuthorization")) : null, h("details", { style: styles.manual }, h("summary", null, t("manualSummary")), part("manual-row", styles.manualRow, h(Input, {
			style: styles.manualInput,
			value: input,
			placeholder: t("pasteCallback"),
			"aria-label": t("pasteCallback"),
			dir: "ltr",
			onChange: (event) => setInput(event.target.value)
		}), button(t("submitCallback"), () => {
			action(async () => {
				await call("manual", { input });
				setInput("");
				await refreshStatus();
			});
		}, !input.trim())))) : null), confirmation ? h("dialog", {
			ref: (node) => {
				if (node && !node.open) node.showModal();
			},
			className: "majed-reset-dialog",
			role: "dialog",
			"aria-modal": true,
			"aria-label": t(confirmation.kind === "logout" ? "confirmLogout" : "confirmReset"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles.modalTitle,
			margin: 0
		} }, t(confirmation.kind === "logout" ? "confirmLogout" : "confirmReset")), h("p", { style: {
			...styles.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), confirmation.kind === "reset" ? part("reset-context", styles.usageMeta, h("span", null, t("window_weekly")), h("strong", null, `${Math.round(confirmation.weeklyUsedPercent)}%`)) : null, confirmation.kind === "reset" ? h("p", { style: styles.statusLine }, confirmation.creditExpiresAt === void 0 ? t("creditExpiryUnknown") : h("span", null, t("expires"), " ", h("bdi", null, date(confirmation.creditExpiresAt)))) : null, confirmation.kind === "reset" ? h("p", { style: styles.statusLine }, t("resetWarning")) : null, confirmation.kind === "reset" ? h("label", { style: {
			display: "flex",
			gap: 8,
			alignItems: "flex-start",
			font: "var(--dsw-font-s-12)"
		} }, h("input", {
			type: "checkbox",
			checked: acknowledged,
			onChange: (event) => setAcknowledged(event.target.checked)
		}), t("resetAcknowledge")) : null, h("div", {
			className: "majed-subscription-dialog-actions",
			style: {
				...styles.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t(confirmation.kind === "reset" ? "confirm" : "logout"), () => {
			action(async () => {
				if (confirmation.kind === "logout") await call("logout", { account: confirmation.account });
				else await call("consumeReset", {
					account: confirmation.account,
					ticket: confirmation.ticket
				});
				setConfirmation(null);
				await refreshStatus();
				if (confirmation.kind === "reset") await refreshUsage(confirmation.account, true);
			});
		}, confirmation.kind === "reset" && (!acknowledged || Date.now() >= confirmation.expiresAt), { className: confirmation.kind === "reset" ? "majed-subscription-primary" : void 0 }))) : null);
	};
}

//#endregion
//#region src/browser.ts
function applySubscriptions(root) {
	const report = (error) => console.error("dsh-majed: Subscriptions setup failed", error);
	function isolate(callback) {
		try {
			const result = callback();
			if (result && typeof result.then === "function") return Promise.resolve(result).catch(report);
			return result;
		} catch (error) {
			report(error);
		}
	}
	isolate(() => root.inject([
		"connection",
		"slots",
		"locale"
	], (ctx) => isolate(() => {
		const connection = ctx.get("connection");
		const React = require("react");
		const h = React.createElement;
		const primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		const { IconSettingsOutlineMedium } = primitives;
		const NS = "majed.subscriptions";
		isolate(() => ctx.effect(() => isolate(() => ctx.locale.register(NS, {
			en: subscriptions$1,
			ar: subscriptions
		})), "dsh-majed: subscriptions dictionaries"));
		const t = ctx.locale.bind(NS);
		const CodexCard = createCodexCard(React, primitives, connection.rpc, t);
		let present = false;
		let failing = false;
		let referenceEnabled = false;
		let disposed = false;
		let sequence = 0;
		let withdraw;
		const listeners = /* @__PURE__ */ new Set();
		function Section() {
			React.useSyncExternalStore((fn) => {
				listeners.add(fn);
				return () => listeners.delete(fn);
			}, () => `${failing}:${referenceEnabled}`);
			return h("div", { style: {
				textAlign: "start",
				color: "var(--dsw-alias-label-primary)",
				font: "var(--dsw-font-s-14)"
			} }, referenceEnabled ? h("p", { role: "status" }, t("coexistence")) : null, failing ? h("p", { role: "alert" }, t("unreachable")) : null, ...["accounts", "providers"].map((part) => h("section", {
				key: part,
				style: {
					paddingBlock: "var(--dsw-spacing-4)",
					borderBlockEnd: "1px solid var(--dsw-alias-border-l2)"
				}
			}, h("h3", { style: { font: "var(--dsw-font-s-strong-14)" } }, h(IconSettingsOutlineMedium, { "aria-hidden": true }), t(part)), part === "accounts" ? h("div", null, h("p", { style: {
				marginBlock: "0 var(--dsw-spacing-3)",
				color: "var(--dsw-alias-label-tertiary)"
			} }, t("intro")), h(CodexCard)) : h("p", { style: { color: "var(--dsw-alias-label-tertiary)" } }, t(`${part}Empty`)))));
		}
		function update() {
			if (present && !withdraw) withdraw = ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "majed-subscriptions",
				order: 90,
				label: () => t("title")
			}, Section));
			else if (!present && withdraw) {
				withdraw();
				withdraw = void 0;
			}
			listeners.forEach((listener) => listener());
		}
		async function probe() {
			const current = ++sequence;
			probeReference(current);
			try {
				const result = await connection.rpc.call("/api", "majed-subscriptions.status", {});
				if (disposed || current !== sequence) return;
				present = true;
				failing = !(result?.ok && result.value?.component === "subscriptions");
			} catch (error) {
				if (disposed || current !== sequence) return;
				if (error instanceof Error && error.message === "transport failure for /api/majed-subscriptions.status: HTTP 404") {
					present = false;
					failing = false;
				} else {
					present = true;
					failing = true;
				}
			}
			isolate(update);
		}
		async function probeReference(current) {
			let enabled = false;
			try {
				enabled = (await connection.rpc.call("/api", "subscriptions-auth.proxyGet", {}))?.ok === true;
			} catch {}
			if (disposed || current !== sequence) return;
			referenceEnabled = enabled;
			isolate(update);
		}
		isolate(() => ctx.effect(() => isolate(() => {
			probe();
			const unsubscribe = connection.state.subscribe(() => {
				if (connection.state.getSnapshot() === "connected") probe();
			});
			const timer = setInterval(() => {
				probe();
			}, 3e3);
			return () => {
				disposed = true;
				sequence++;
				clearInterval(timer);
				unsubscribe();
				withdraw?.();
				listeners.clear();
			};
		}), "dsh-majed: subscriptions presence"));
	})));
}

//#endregion
exports.applySubscriptions = applySubscriptions;
return module.exports; };