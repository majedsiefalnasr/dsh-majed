const majedSubscriptionsFactory = (require) => {
var module = { exports: {} }; var exports = module.exports;

//#region locale/en.json
var subscriptions$1 = {
	"title": "Subscriptions",
	"accounts": "Subscription accounts",
	"providers": "API providers",
	"accountsEmpty": "No subscription accounts yet.",
	"providersEmpty": "No API providers yet.",
	"unreachable": "The Subscriptions host component cannot be reached. Reconnect or check the component on the Plugins page."
};

//#endregion
//#region locale/ar.json
var subscriptions = {
	"title": "الاشتراكات",
	"accounts": "حسابات الاشتراك",
	"providers": "موفرو API",
	"accountsEmpty": "لا توجد حسابات اشتراك بعد.",
	"providersEmpty": "لا يوجد موفرو API بعد.",
	"unreachable": "يتعذر الوصول إلى مكوّن الاشتراكات على المضيف. أعد الاتصال أو تحقق من المكوّن في صفحة الإضافات."
};

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
		const { IconSettingsOutlineMedium } = require("@deepseek-ai/dsh-client-ui-primitives");
		const NS = "majed.subscriptions";
		isolate(() => ctx.effect(() => isolate(() => ctx.locale.register(NS, {
			en: subscriptions$1,
			ar: subscriptions
		})), "dsh-majed: subscriptions dictionaries"));
		const t = ctx.locale.bind(NS);
		let present = false;
		let failing = false;
		let disposed = false;
		let sequence = 0;
		let withdraw;
		const listeners = /* @__PURE__ */ new Set();
		function Section() {
			return h("div", { style: {
				textAlign: "start",
				color: "var(--dsw-alias-label-primary)",
				font: "var(--dsw-font-s-14)"
			} }, React.useSyncExternalStore((fn) => {
				listeners.add(fn);
				return () => listeners.delete(fn);
			}, () => failing) ? h("p", { role: "alert" }, t("unreachable")) : null, ...["accounts", "providers"].map((part) => h("section", {
				key: part,
				style: {
					paddingBlock: "var(--dsw-spacing-4)",
					borderBlockEnd: "1px solid var(--dsw-alias-border-l2)"
				}
			}, h("h3", { style: { font: "var(--dsw-font-s-strong-14)" } }, h(IconSettingsOutlineMedium, { "aria-hidden": true }), t(part)), h("p", { style: { color: "var(--dsw-alias-label-tertiary)" } }, t(`${part}Empty`)))));
		}
		function update() {
			if (present && !withdraw) withdraw = ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "subscriptions",
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