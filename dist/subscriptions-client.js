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
	"loginProgress": "Login in progress",
	"connected": "Connected accounts",
	"notLoggedIn": "Not logged in",
	"clientVersion": "Client version",
	"source_npm": "npm registry",
	"source_local": "Local CLI",
	"source_fallback": "Bundled fallback",
	"source_config": "Configuration",
	"addAccount": "Add account",
	"openAuthorization": "Open authorization page",
	"pasteCallback": "Paste callback URL or code",
	"submitCallback": "Submit callback",
	"cancelLogin": "Cancel login",
	"unknownPlan": "Unknown plan",
	"expires": "Expires",
	"defaultAccount": "Default account",
	"makeDefault": "Make default",
	"logout": "Log out",
	"refreshUsage": "Refresh usage",
	"usageNotLoaded": "Usage has not been loaded.",
	"usageUnavailable": "Usage data is unavailable.",
	"window_session": "5-hour",
	"window_weekly": "Weekly",
	"window_other": "Other window",
	"resets": "Resets",
	"resetCredits": "Reset credits",
	"creditsUnavailable": "Reset credits could not be verified.",
	"useReset": "Use reset credit",
	"confirmLogout": "Log this account out? Its stored credentials will be removed.",
	"confirmReset": "Consume one reset credit? Weekly usage must be at least 80%. This action cannot be undone.",
	"resetAcknowledge": "I understand that this spends one reset credit.",
	"cancel": "Cancel",
	"confirm": "Confirm"
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
	"loginProgress": "جارٍ تسجيل الدخول",
	"connected": "الحسابات المتصلة",
	"notLoggedIn": "لم يتم تسجيل الدخول",
	"clientVersion": "إصدار العميل",
	"source_npm": "سجل npm",
	"source_local": "واجهة الأوامر المحلية",
	"source_fallback": "الإصدار الاحتياطي المرفق",
	"source_config": "الإعدادات",
	"addAccount": "إضافة حساب",
	"openAuthorization": "فتح صفحة التفويض",
	"pasteCallback": "ألصق رابط العودة أو الرمز",
	"submitCallback": "إرسال الرمز",
	"cancelLogin": "إلغاء تسجيل الدخول",
	"unknownPlan": "خطة غير معروفة",
	"expires": "تنتهي الصلاحية",
	"defaultAccount": "الحساب الافتراضي",
	"makeDefault": "تعيين كافتراضي",
	"logout": "تسجيل الخروج",
	"refreshUsage": "تحديث الاستخدام",
	"usageNotLoaded": "لم يتم تحميل الاستخدام بعد.",
	"usageUnavailable": "بيانات الاستخدام غير متاحة.",
	"window_session": "خمس ساعات",
	"window_weekly": "أسبوعي",
	"window_other": "فترة أخرى",
	"resets": "إعادة التعيين",
	"resetCredits": "أرصدة إعادة التعيين",
	"creditsUnavailable": "تعذر التحقق من أرصدة إعادة التعيين.",
	"useReset": "استخدام رصيد إعادة تعيين",
	"confirmLogout": "هل تريد تسجيل خروج هذا الحساب؟ ستُحذف بيانات اعتماده المخزنة.",
	"confirmReset": "هل تريد استهلاك رصيد إعادة تعيين؟ يجب ألا يقل الاستخدام الأسبوعي عن 80٪. لا يمكن التراجع عن هذا الإجراء.",
	"resetAcknowledge": "أفهم أن هذا سيستهلك رصيد إعادة تعيين واحدًا.",
	"cancel": "إلغاء",
	"confirm": "تأكيد"
};

//#endregion
//#region src/codex-card.ts
/** Codex account controls adapted from the reference SubscriptionsSection, scoped to #129. */
function createCodexCard(React, primitives, rpc, t) {
	const h = React.createElement;
	const Button = primitives.Button ?? "button";
	const Input = primitives.Input ?? "input";
	const style = {
		textAlign: "start",
		paddingBlock: "var(--dsw-spacing-4)",
		borderBlockEnd: "1px solid var(--dsw-alias-border-l2)"
	};
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
		const refreshUsage = async (account) => {
			try {
				const snapshot = await call("usage", {
					account,
					force: true
				});
				if (alive.current) setUsage((previous) => ({
					...previous,
					[account]: snapshot
				}));
			} catch (error$1) {
				if (alive.current) setUsage((previous) => ({
					...previous,
					[account]: { error: error$1 instanceof Error ? error$1.message : String(error$1) }
				}));
			}
		};
		const button = (label, onClick, disabled = false) => h(Button, {
			type: "button",
			disabled: pending || disabled,
			onClick
		}, label);
		const date = (time) => new Date(time).toLocaleString();
		return h("article", {
			style,
			"data-majed-codex-card": true
		}, h("h4", null, "Codex (ChatGPT)"), h("p", { role: "status" }, status?.busy ? t("loginProgress") : status?.accounts?.length ? `${t("connected")}: ${status.accounts.length}` : t("notLoggedIn")), status?.clientVersion ? h("p", null, t("clientVersion"), ": ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null, status?.registrationError ? h("p", { role: "alert" }, t("coexistence"), " ", status.registrationError) : null, error || status?.detail ? h("p", { role: "alert" }, error || status.detail) : null, button(t("addAccount"), () => {
			const tab = window.open("about:blank", "_blank");
			if (tab) tab.opener = null;
			action(async () => {
				try {
					const result = await call("login");
					if (tab) tab.location.href = result.authorizeUrl;
					if (alive.current) {
						setLogin(result);
						await refreshStatus();
					}
				} catch (error$1) {
					tab?.close();
					throw error$1;
				}
			});
		}, status?.busy || !!status?.registrationError), login && status?.busy ? h("div", null, h("a", {
			href: login.authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer"
		}, t("openAuthorization")), h(Input, {
			value: input,
			"aria-label": t("pasteCallback"),
			dir: "ltr",
			onChange: (event) => setInput(event.target.value)
		}), button(t("submitCallback"), () => {
			action(async () => {
				await call("manual", { input });
				setInput("");
				await refreshStatus();
			});
		}, !input.trim()), button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		})) : null, ...(status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			return h("section", {
				key: account.key,
				style
			}, h("p", null, h("bdi", { dir: "ltr" }, account.account ?? account.key), " · ", h("bdi", null, account.plan ?? t("unknownPlan")), account.expiresAt ? h("span", null, " · ", t("expires"), ": ", h("bdi", null, date(account.expiresAt))) : null), button(account.isDefault ? `★ ${t("defaultAccount")}` : `☆ ${t("makeDefault")}`, () => {
				action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, account.isDefault), button(t("logout"), () => {
				setAcknowledged(false);
				setConfirmation({
					kind: "logout",
					account: account.key,
					label: account.account
				});
			}), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key));
			}), !snapshot ? h("p", null, t("usageNotLoaded")) : snapshot.error ? h("p", { role: "alert" }, snapshot.error) : !snapshot.supported || !snapshot.windows?.length ? h("p", null, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", { key: index }, h("span", null, t(`window_${window$1.kind}`), " ", h("bdi", null, `${Math.round(percent)}%`)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: {
						background: "var(--dsw-alias-background-secondary)",
						blockSize: "var(--dsw-spacing-2)"
					}
				}, h("div", { style: {
					background: color,
					inlineSize: `${percent}%`,
					blockSize: "100%"
				} })), window$1.resetsAt ? h("p", null, t("resets"), ": ", h("bdi", null, date(window$1.resetsAt))) : null);
			}), snapshot?.resetCredits ? h("p", null, t("resetCredits"), ": ", snapshot.resetCredits.length) : null, snapshot?.resetCreditsError ? h("p", { role: "alert" }, t("creditsUnavailable"), " ", snapshot.resetCreditsError) : null, snapshot?.resetCredits?.length ? button(t("useReset"), () => {
				action(async () => {
					const prepared = await call("prepareReset", { account: account.key });
					setAcknowledged(false);
					setConfirmation({
						kind: "reset",
						account: account.key,
						...prepared
					});
				});
			}) : null);
		}), confirmation ? h("div", {
			role: "dialog",
			"aria-modal": true,
			"aria-label": confirmation.kind === "logout" ? t("confirmLogout") : t("confirmReset")
		}, h("p", null, confirmation.kind === "logout" ? t("confirmLogout") : t("confirmReset")), confirmation.kind === "reset" ? h("label", null, h("input", {
			type: "checkbox",
			checked: acknowledged,
			onChange: (event) => setAcknowledged(event.target.checked)
		}), t("resetAcknowledge")) : null, button(t("cancel"), () => setConfirmation(null)), button(t("confirm"), () => {
			action(async () => {
				if (confirmation.kind === "logout") await call("logout", { account: confirmation.account });
				else await call("consumeReset", {
					account: confirmation.account,
					ticket: confirmation.ticket
				});
				setConfirmation(null);
				await refreshStatus();
				if (confirmation.kind === "reset") await refreshUsage(confirmation.account);
			});
		}, confirmation.kind === "reset" && (!acknowledged || Date.now() >= confirmation.expiresAt))) : null);
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
			}, h("h3", { style: { font: "var(--dsw-font-s-strong-14)" } }, h(IconSettingsOutlineMedium, { "aria-hidden": true }), t(part)), part === "accounts" ? h(CodexCard) : h("p", { style: { color: "var(--dsw-alias-label-tertiary)" } }, t(`${part}Empty`)))));
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