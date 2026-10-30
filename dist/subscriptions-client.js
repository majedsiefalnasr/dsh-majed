const majedSubscriptionsFactory = (require) => {
var module = { exports: {} }; var exports = module.exports;

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
	"intro": "Log a subscription provider in or out. Login opens the provider’s authorization page in a new tab; headless setups can paste the callback URL or code instead."
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
	"intro": "سجّل الدخول إلى موفّر اشتراك أو اخرج منه. يفتح تسجيل الدخول صفحة تفويض الموفّر في تبويب جديد؛ ويمكن لصق رابط العودة أو الرمز في الأنظمة بلا متصفح."
};

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
		}, h("style", null, controlCss), part("card", styles.card, part("header", styles.cardHeader, h("span", {
			"aria-hidden": true,
			style: {
				...styles.dot,
				background: busy ? "var(--dsw-alias-state-warn-label)" : status?.accounts?.length ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-label-dimmed)"
			}
		}), h("span", { style: styles.name }, "Codex (ChatGPT)"), status?.clientVersion ? h("span", {
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
			}, account.account ?? account.key), account.plan ? h("bdi", { style: styles.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => {
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