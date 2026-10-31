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

//#region src/ImageGallery.tsx
/** Display box for a lone image (platform rule): long edge 240px with the
* rendered aspect ratio clamped to [0.25, 4] — the overflow is cropped by
* `object-fit: cover` — and never upscaled past the image's natural size. The
* crop anchor keeps the top of very tall images and the left of very wide
* ones, where the informative content usually starts. */
function singleFit(attachment) {
	const natural = attachment.width / attachment.height;
	const ratio = Math.min(4, Math.max(.25, natural));
	const box = ratio >= 1 ? {
		width: 240,
		height: 240 / ratio
	} : {
		width: 240 * ratio,
		height: 240
	};
	const scale = Math.min(1, attachment.width / box.width, attachment.height / box.height);
	return {
		width: Math.max(1, Math.round(box.width * scale)),
		height: Math.max(1, Math.round(box.height * scale)),
		objectPosition: natural < .25 ? "center top" : natural > 4 ? "left center" : "center"
	};
}
const styles$6 = {
	gallery: {
		display: "flex",
		flexWrap: "wrap",
		gap: 8,
		justifyContent: "flex-start"
	},
	frame: {
		display: "grid",
		placeItems: "center",
		overflow: "hidden",
		padding: 0,
		border: "1px solid var(--dsw-alias-border-l2-darkmode-thin)",
		borderRadius: 8,
		background: "var(--dsw-alias-interactive-bg-hover-solid)",
		cursor: "zoom-in"
	},
	tile: {
		width: 64,
		height: 64
	},
	img: {
		width: "100%",
		height: "100%",
		objectFit: "cover",
		display: "block"
	},
	loading: {
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-tertiary)",
		padding: "0 8px"
	},
	error: {
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-state-error-primary)",
		cursor: "pointer",
		border: "1px solid var(--dsw-alias-border-l2-darkmode-thin)",
		borderRadius: 8,
		background: "transparent",
		padding: "6px 10px"
	},
	overlay: {
		position: "fixed",
		inset: 0,
		zIndex: 1e3,
		display: "grid",
		placeItems: "center",
		background: "var(--dsw-alias-bg-mask-1)",
		padding: 24
	},
	overlayImg: {
		maxWidth: "92vw",
		maxHeight: "92vh",
		objectFit: "contain",
		borderRadius: 4
	},
	close: {
		position: "absolute",
		insetBlockStart: 12,
		insetInlineEnd: 12,
		width: 32,
		height: 32,
		display: "grid",
		placeItems: "center",
		border: "none",
		borderRadius: "50%",
		cursor: "pointer",
		background: "var(--dsw-alias-bg-layer-1)",
		color: "var(--dsw-alias-label-primary)",
		font: "var(--dsw-font-s-13)"
	}
};
/**
* Full-viewport original-image preview: backdrop or close-control click and
* Escape all dismiss; the image itself is inert so a click on it does not
* fall through to the backdrop dismissal.
*/
function ImageLightbox({ src, alt, labels, onClose }) {
	const closeButton = (0, react.useRef)(null);
	(0, react.useEffect)(() => {
		const opener = document.activeElement;
		closeButton.current?.focus();
		const onKey = (event) => {
			if (event.key === "Escape") onClose();
			if (event.key === "Tab") {
				event.preventDefault();
				closeButton.current?.focus();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			opener?.focus();
		};
	}, [onClose]);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		role: "dialog",
		"aria-modal": true,
		"aria-label": labels.dialog,
		style: styles$6.overlay,
		onClick: onClose,
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
			src,
			alt,
			style: styles$6.overlayImg,
			onClick: (event) => {
				event.stopPropagation();
			}
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			ref: closeButton,
			type: "button",
			"aria-label": labels.close,
			style: styles$6.close,
			onClick: onClose,
			children: "×"
		})]
	});
}
/**
* Compact history renderer with retryable loading and click-to-open original
* preview. A lone image renders at its `singleFit` size; an image among
* several renders as a fixed 64px square tile.
*/
function MessageImage({ attachment, load, variant, labels }) {
	const [src, setSrc] = (0, react.useState)(null);
	const [error, setError] = (0, react.useState)(false);
	const [open, setOpen] = (0, react.useState)(false);
	const [attempt, setAttempt] = (0, react.useState)(0);
	const retry = (0, react.useCallback)(() => {
		setAttempt((a) => a + 1);
	}, []);
	const close = (0, react.useCallback)(() => {
		setOpen(false);
	}, []);
	const fit = (0, react.useMemo)(() => variant === "single" ? singleFit(attachment) : void 0, [attachment, variant]);
	(0, react.useEffect)(() => {
		let live = true;
		setError(false);
		setSrc(null);
		load(attachment).then((url) => {
			if (live) setSrc(url);
		}).catch(() => {
			if (live) setError(true);
		});
		return () => {
			live = false;
		};
	}, [
		attachment,
		load,
		attempt
	]);
	const label = attachment.name ?? labels.image;
	if (error) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
		type: "button",
		style: styles$6.error,
		onClick: retry,
		children: labels.loadFailed
	});
	const box = fit === void 0 ? styles$6.tile : {
		width: fit.width,
		height: fit.height
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
		type: "button",
		style: {
			...styles$6.frame,
			...box
		},
		title: labels.open,
		"aria-label": labels.openNamed(label),
		onClick: () => {
			if (src !== null) setOpen(true);
		},
		children: src === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			style: styles$6.loading,
			children: labels.loading
		}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
			src,
			alt: label,
			style: {
				...styles$6.img,
				objectPosition: fit?.objectPosition
			},
			onError: () => {
				setOpen(false);
				setError(true);
			}
		})
	}), open && src !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ImageLightbox, {
		src,
		alt: label,
		labels: labels.lightbox,
		onClose: close
	})] });
}
/** Wrapping image group: a lone image renders large, several render as 64px
* square tiles (same rule as the platform gallery). */
function ImageGallery({ images, load, labels }) {
	if (images.length === 0) return null;
	const variant = images.length === 1 ? "single" : "tile";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		style: styles$6.gallery,
		children: images.map((image, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MessageImage, {
			attachment: image.attachment,
			load,
			variant,
			labels
		}, `${image.attachment.attachmentId}:${index}`))
	});
}

//#endregion
//#region src/subscriptions-rpc.ts
async function callSubscriptionsAuth$1(rpc, endpoint, payload) {
	const result = await rpc.call("/api", `majed-subscriptions.${endpoint}`, payload);
	if (!result?.ok) throw new Error(result?.error?.message ?? "Subscriptions unavailable");
	return result.value;
}

//#endregion
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
	"modelDefaultsSaveFailedNamed": "Save failed for {model}: {message}",
	"speed": "Speed",
	"speedStandardDescription": "Default speed",
	"speedFastDescription": "1.5x speed, more usage",
	"commandFast": "Switch the Codex speed tier (Standard/Fast)",
	"commandFastUnavailable": "The current model has no fast tier; /fast only works on Codex models whose catalog advertises one",
	"usageBadgeTitle": "Subscription usage",
	"usageBadgeCurrent": "current",
	"usageBadgeMoreWindows": "More quota windows ({count})",
	"usageBadgeModelCount": "{count} model quotas",
	"usageBadgeModelUnavailable": "Current model quota unavailable",
	"usageBadgeDisplay": "Status-bar quota display",
	"usageBadgeDisplayRecent": "Current / most recent subscription only",
	"usageBadgeDisplayHidden": "Hidden",
	"usageBadgeDisplayHint": "Saved automatically in this browser. At most one subscription is shown; non-subscription models keep the most recent subscription selected in this view, or show nothing. Hiding does not affect usage details here.",
	"usageBadgeDisplaySaveFailed": "Could not save the display preference. Check browser storage permissions.",
	"usagePlan": "Plan: {plan}",
	"usageSession": "5-hour window",
	"usageWeekly": "Weekly",
	"usageWindow": "Window",
	"claudeProviderUnavailable": "Claude unavailable: provider id already registered.",
	"addAccountOAuth": "Browser authorization",
	"addAccountKeychain": "Import Claude Code",
	"claudeAddAccountHint": "Browser authorization signs in whichever account the browser currently uses. Import Claude Code copies the account Claude Code is signed in to and keeps it in sync; sign in with the claude command first.",
	"claudePromptCacheTtl": "Prompt cache lifetime",
	"claudePromptCacheTtlHint": "How long Anthropic keeps the conversation cache after its last use. Cache reads cost the same either way; a one-hour cache write costs 2× base input instead of 1.25×. Applies from the next turn.",
	"claudePromptCacheTtlDefault": "Follow config ({ttl})",
	"claudePromptCacheTtl5m": "5 minutes",
	"claudePromptCacheTtl1h": "1 hour",
	"grokProviderUnavailable": "Grok registration is unavailable.",
	"image": "Image",
	"viewImage": "View image",
	"viewImageNamed": "View {name}",
	"imageLoading": "Loading image…",
	"imageLoadFailed": "Could not load image. Retry",
	"imagePreview": "Image preview",
	"generating": "Generating image…",
	"generatingVideo": "Generating video…",
	"videoLoading": "Loading video…",
	"videoLoadFailed": "Could not load video: {message}",
	"videoPlaybackFailed": "The browser could not play this video."
};

//#endregion
//#region src/locales.ts
const en = subscriptions$1;

//#endregion
//#region src/ImageGenerateToolview.tsx
/** DSH 0.1.7 renamed IconSparkle16; resolving it by name keeps older hosts working too. */
const SparkleIcon$1 = (_props) => null;
/** Title prompt truncation budget (characters). */
const PROMPT_MAX_LENGTH$1 = 60;
/**
* Build the ImageGallery loader over the `image` endpoint.
* @param rpc - Connection RPC caller.
* @returns loader resolving an attachment ref to a data URL.
*/
function createImageLoader(rpc) {
	return (attachment) => callSubscriptionsAuth$1(rpc, "image", { ...attachment }).then((result) => `data:${result.mediaType};base64,${result.dataBase64}`);
}
/**
* English-dictionary fallback for a missing locale seat (standalone renders);
* the framework always supplies the namespace-bound one.
* @param key - dictionary key.
* @param params - `{name}` template params.
* @returns the template with params substituted.
*/
function fallbackTranslate$3(key, params) {
	let text = en[key];
	for (const [name, value] of Object.entries(params ?? {})) text = text.replaceAll(`{${name}}`, String(value));
	return text;
}
/** Extract the prompt from the call's raw args JSON; falls back to the first string value, then the raw line. */
function derivePrompt$1(argsRaw) {
	let parsed;
	try {
		parsed = JSON.parse(argsRaw);
	} catch {
		parsed = void 0;
	}
	let prompt;
	if (typeof parsed === "object" && parsed !== null) {
		const args = parsed;
		if (typeof args.prompt === "string" && args.prompt !== "") prompt = args.prompt;
		else for (const value of Object.values(args)) if (typeof value === "string" && value !== "") {
			prompt = value;
			break;
		}
	}
	const line = (prompt ?? argsRaw).split("\n", 1)[0] ?? "";
	return line.length > PROMPT_MAX_LENGTH$1 ? `${line.slice(0, PROMPT_MAX_LENGTH$1)}…` : line;
}
/** Flatten a settled result's text blocks (the degraded text-only route and the error line). */
function resultText$1(block) {
	if (!("kind" in block)) return "";
	const parts = [];
	for (const part of block.content) if (part.type === "text") parts.push(part.text);
	if (parts.length === 0 && block.error !== void 0) parts.push(`${block.error.name}: ${block.error.code}`);
	return parts.join("\n");
}
/** Image attachments of a settled result; empty while running or on the text-only route. */
function resultImages(block) {
	if (!("kind" in block)) return [];
	const images = [];
	for (const part of block.content) if (part.type === "image") images.push({ attachment: part.attachment });
	return images;
}
const styles$5 = {
	container: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		padding: "4px 0"
	},
	row: {
		display: "flex",
		alignItems: "center",
		gap: 6,
		minWidth: 0
	},
	icon: {
		display: "inline-flex",
		flexShrink: 0,
		color: "var(--dsw-alias-label-tertiary)"
	},
	title: {
		font: "var(--dsw-font-s-13)",
		color: "var(--dsw-alias-label-primary)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap"
	},
	subtle: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-tertiary)"
	},
	output: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-secondary)",
		whiteSpace: "pre-wrap",
		overflowWrap: "anywhere"
	},
	error: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-state-error-primary)"
	}
};
/**
* The `image_generate` keyed toolview component.
* @param props - owner share, inject face, and locale seat (spread flat).
* @returns the call row plus, once settled, the gallery / text / error body.
*/
function ImageGenerateToolview(props) {
	const { block, load } = props;
	const t = props.t ?? fallbackTranslate$3;
	if (block === void 0) return null;
	const settled = "kind" in block;
	const argsRaw = (settled ? block.call?.argsRaw : "argsRaw" in block ? block.argsRaw : void 0) ?? "";
	let references = 0;
	try {
		const args = JSON.parse(argsRaw);
		if (Array.isArray(args?.referenceImages)) references = args.referenceImages.length;
	} catch {}
	const title = `image_generate${references > 0 ? ` (${references} ref)` : ""}: ${derivePrompt$1(argsRaw)}`;
	const images = resultImages(block);
	const text = settled ? resultText$1(block) : "";
	const labels = {
		image: t("image"),
		open: t("viewImage"),
		openNamed: (name) => t("viewImageNamed", { name }),
		loading: t("imageLoading"),
		loadFailed: t("imageLoadFailed"),
		lightbox: {
			dialog: t("imagePreview"),
			close: t("imageClose")
		}
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: styles$5.container,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: styles$5.row,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$5.icon,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SparkleIcon$1, { size: 14 })
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$5.title,
					children: title
				})]
			}),
			!settled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$5.subtle,
				children: t("generating")
			}),
			settled && block.isError && text !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$5.error,
				children: text.split("\n", 1)[0]
			}),
			settled && !block.isError && images.length > 0 && load !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ImageGallery, {
				images,
				load,
				labels
			}),
			settled && !block.isError && images.length === 0 && text !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$5.output,
				children: text
			})
		]
	});
}

//#endregion
//#region src/VideoGenerateToolview.tsx
/** DSH 0.1.7 renamed IconSparkle16; resolving it by name keeps older hosts working too. */
const SparkleIcon = (_props) => null;
/** Title prompt truncation budget (characters). */
const PROMPT_MAX_LENGTH = 60;
/**
* Build the video loader over the `/subscriptions-auth` `video` endpoint.
* @param rpc - Connection RPC caller.
* @returns loader resolving a bare file name to the decoded bytes.
*/
function createVideoLoader(rpc) {
	return (name) => callSubscriptionsAuth$1(rpc, "video", { name });
}
/**
* English-dictionary fallback for a missing locale seat (standalone renders);
* the framework always supplies the namespace-bound one.
*/
function fallbackTranslate$2(key, params) {
	let text = en[key];
	for (const [name, value] of Object.entries(params ?? {})) text = text.replaceAll(`{${name}}`, String(value));
	return text;
}
/** Extract the prompt from the call's raw args JSON; falls back to the first string value, then the raw line. */
function derivePrompt(argsRaw) {
	let parsed;
	try {
		parsed = JSON.parse(argsRaw);
	} catch {
		parsed = void 0;
	}
	let prompt;
	if (typeof parsed === "object" && parsed !== null) {
		const args = parsed;
		if (typeof args.prompt === "string" && args.prompt !== "") prompt = args.prompt;
		else for (const value of Object.values(args)) if (typeof value === "string" && value !== "") {
			prompt = value;
			break;
		}
	}
	const line = (prompt ?? argsRaw).split("\n", 1)[0] ?? "";
	return line.length > PROMPT_MAX_LENGTH ? `${line.slice(0, PROMPT_MAX_LENGTH)}…` : line;
}
/** Flatten a settled result's text blocks (the fallback body and the error line). */
function resultText(block) {
	if (!("kind" in block)) return "";
	const parts = [];
	for (const part of block.content) if (part.type === "text") parts.push(part.text);
	if (parts.length === 0 && block.error !== void 0) parts.push(`${block.error.name}: ${block.error.code}`);
	return parts.join("\n");
}
/**
* The generated video's bare file name: presentation meta first (top-level
* dispatches), then the render text's "Saved video to …" line (nested
* dispatches compute no meta).
*/
function resolveFileName(block) {
	if (!("kind" in block)) return void 0;
	const meta = block.meta;
	if (typeof meta === "object" && meta !== null) {
		const fileName = meta.fileName;
		if (typeof fileName === "string" && fileName.length > 0) return fileName;
	}
	const match = /^Saved video to (.+\.mp4)/m.exec(resultText(block));
	if (match === null) return void 0;
	const path = match[1];
	return path.slice(path.lastIndexOf("/") + 1);
}
/** Decode a base64 payload into bytes (browser-side; no Buffer). */
function base64Bytes(dataBase64) {
	const binary = atob(dataBase64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
	return bytes;
}
const styles$4 = {
	container: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		padding: "4px 0"
	},
	row: {
		display: "flex",
		alignItems: "center",
		gap: 6,
		minWidth: 0
	},
	icon: {
		display: "inline-flex",
		flexShrink: 0,
		color: "var(--dsw-alias-label-tertiary)"
	},
	title: {
		font: "var(--dsw-font-s-13)",
		color: "var(--dsw-alias-label-primary)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap"
	},
	subtle: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-tertiary)"
	},
	output: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-secondary)",
		whiteSpace: "pre-wrap",
		overflowWrap: "anywhere"
	},
	error: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-state-error-primary)"
	},
	video: {
		display: "block",
		maxWidth: 480,
		width: "100%",
		borderRadius: 8,
		backgroundColor: "var(--dsw-alias-fill-tertiary)"
	}
};
/**
* The `video_generate` keyed toolview component.
* @param props - owner share, inject face, and locale seat (spread flat).
* @returns the call row plus, once settled, the player / text / error body.
*/
function VideoGenerateToolview(props) {
	const { block, loadVideo } = props;
	const t = props.t ?? fallbackTranslate$2;
	const settled = block !== void 0 && "kind" in block;
	const isError = settled && block.isError;
	const fileName = block !== void 0 && settled && !isError ? resolveFileName(block) : void 0;
	const [load, setLoad] = (0, react.useState)({ phase: "loading" });
	(0, react.useEffect)(() => {
		if (fileName === void 0 || loadVideo === void 0) return;
		let cancelled = false;
		let objectUrl;
		setLoad({ phase: "loading" });
		loadVideo(fileName).then((video) => {
			if (cancelled) return;
			objectUrl = URL.createObjectURL(new Blob([base64Bytes(video.dataBase64).slice()], { type: video.mediaType }));
			setLoad({
				phase: "ready",
				url: objectUrl
			});
		}, (error) => {
			if (cancelled) return;
			setLoad({
				phase: "failed",
				message: error instanceof Error ? error.message : String(error)
			});
		});
		return () => {
			cancelled = true;
			if (objectUrl !== void 0) URL.revokeObjectURL(objectUrl);
		};
	}, [fileName, loadVideo]);
	if (block === void 0) return null;
	const title = `video_generate: ${derivePrompt((settled ? block.call?.argsRaw : "argsRaw" in block ? block.argsRaw : void 0) ?? "")}`;
	const text = settled ? resultText(block) : "";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: styles$4.container,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: styles$4.row,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$4.icon,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SparkleIcon, { size: 14 })
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$4.title,
					children: title
				})]
			}),
			!settled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.subtle,
				children: t("generatingVideo")
			}),
			settled && isError && text !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.error,
				children: text.split("\n", 1)[0]
			}),
			settled && !isError && fileName !== void 0 && load.phase === "loading" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.subtle,
				children: t("videoLoading")
			}),
			settled && !isError && fileName !== void 0 && load.phase === "failed" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.error,
				children: t("videoLoadFailed", { message: load.message })
			}),
			settled && !isError && fileName !== void 0 && load.phase === "ready" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("video", {
				style: styles$4.video,
				src: load.url,
				controls: true,
				preload: "metadata",
				onError: () => setLoad({
					phase: "failed",
					message: t("videoPlaybackFailed")
				})
			}),
			settled && !isError && fileName === void 0 && text !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.output,
				children: text
			})
		]
	});
}

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
	"modelDefaultsSaveFailedNamed": "تعذر حفظ {model}: {message}",
	"speed": "السرعة",
	"speedStandardDescription": "السرعة الافتراضية",
	"speedFastDescription": "سرعة 1.5 ضعف، واستهلاك أكبر",
	"commandFast": "تبديل مستوى سرعة Codex (عادية/سريعة)",
	"commandFastUnavailable": "لا يدعم النموذج الحالي المستوى السريع؛ يعمل الأمر /fast فقط مع نماذج Codex التي يعلن كتالوجها عن مستوى سريع",
	"usageBadgeTitle": "استهلاك الاشتراك",
	"usageBadgeCurrent": "الحالي",
	"usageBadgeMoreWindows": "المزيد من نوافذ الحصة ({count})",
	"usageBadgeModelCount": "حصص {count} من النماذج",
	"usageBadgeModelUnavailable": "حصة النموذج الحالي غير متاحة",
	"usageBadgeDisplay": "عرض الحصة في شريط الحالة",
	"usageBadgeDisplayRecent": "الاشتراك الحالي / الأحدث فقط",
	"usageBadgeDisplayHidden": "مخفي",
	"usageBadgeDisplayHint": "يُحفظ تلقائيًا في هذا المتصفح. يُعرض اشتراك واحد على الأكثر؛ وتحتفظ النماذج غير المرتبطة باشتراك بآخر اشتراك تم اختياره في هذا العرض، أو لا تعرض شيئًا. لا يؤثر الإخفاء على تفاصيل الاستهلاك هنا.",
	"usageBadgeDisplaySaveFailed": "تعذر حفظ تفضيل العرض. تحقق من أذونات تخزين المتصفح.",
	"usagePlan": "الخطة: {plan}",
	"usageSession": "نافذة 5 ساعات",
	"usageWeekly": "أسبوعي",
	"usageWindow": "نافذة",
	"claudeProviderUnavailable": "Claude غير متاح: معرّف الموفّر مسجّل بالفعل.",
	"addAccountOAuth": "تفويض المتصفح",
	"addAccountKeychain": "استيراد من Claude Code",
	"claudeAddAccountHint": "يسجّل تفويض المتصفح الدخول بالحساب المستخدم حاليًا في المتصفح. ينسخ الاستيراد من Claude Code الحساب المسجَّل فيه ويبقيه متزامنًا؛ سجّل الدخول أولًا بالأمر claude.",
	"claudePromptCacheTtl": "مدة بقاء ذاكرة المطالبات المؤقتة",
	"claudePromptCacheTtlHint": "المدة التي تحتفظ بها Anthropic بذاكرة المحادثة المؤقتة بعد آخر استخدام. تكلفة قراءة الذاكرة واحدة في الحالتين؛ أما كتابة ذاكرة لمدة ساعة فتكلّف ضعف مدخلات الأساس بدل 1.25 ضعفًا. يسري من الدور التالي.",
	"claudePromptCacheTtlDefault": "اتباع الإعداد ({ttl})",
	"claudePromptCacheTtl5m": "5 دقائق",
	"claudePromptCacheTtl1h": "ساعة واحدة",
	"grokProviderUnavailable": "تسجيل Grok غير متاح.",
	"image": "صورة",
	"viewImage": "عرض الصورة",
	"viewImageNamed": "عرض {name}",
	"imageLoading": "جارٍ تحميل الصورة…",
	"imageLoadFailed": "تعذر تحميل الصورة. أعد المحاولة",
	"imagePreview": "معاينة الصورة",
	"generating": "جارٍ إنشاء الصورة…",
	"generatingVideo": "جارٍ إنشاء الفيديو…",
	"videoLoading": "جارٍ تحميل الفيديو…",
	"videoLoadFailed": "تعذر تحميل الفيديو: {message}",
	"videoPlaybackFailed": "تعذر على المتصفح تشغيل هذا الفيديو."
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
/** Composer controls retain their own geometry, separate from settings forms. */
const subscriptionChromeCss = `
.majed-subscription-usage-pill { corner-shape: round; }
.majed-subscription-usage-panel {
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  backdrop-filter: var(--dsw-menu-backdrop-filter, none);
}
.majed-subscription-speed button:hover:not(:disabled) {
  --majed-subscription-speed-hover: var(--dsw-alias-interactive-bg-hover);
}
.majed-subscription-speed button:active:not(:disabled) {
  --majed-subscription-speed-hover: var(--dsw-alias-interactive-bg-active);
}
.majed-subscription-speed button:disabled { opacity: 0.4; cursor: default; }
.majed-subscription-speed button:focus-visible,
.majed-subscription-usage-pill:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}
`;

//#endregion
//#region src/settings/ProviderAccountManager.tsx
const PROMPT_CACHE_TTLS = ["5m", "1h"];
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
	const cacheTtlId = (0, react.useId)();
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
						provider === "claude" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							style: {
								...stack,
								gap: 6,
								paddingBlockEnd: 8
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									htmlFor: cacheTtlId,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("claudePromptCacheTtl") })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									id: cacheTtlId,
									value: cacheTtl,
									style: { justifySelf: "start" },
									onChange: (event) => {
										setCacheTtl(event.target.value);
										setCacheTtlDirty(true);
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: t("claudePromptCacheTtlDefault", { ttl: catalog.promptCacheTtlDefault ?? "5m" })
									}), PROMPT_CACHE_TTLS.map((ttl) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: ttl,
										children: t(`claudePromptCacheTtl${ttl}`)
									}, ttl))]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
									className: "majed-subscription-hint",
									children: t("claudePromptCacheTtlHint")
								})
							]
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
const styles$3 = {
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
function createCodexCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	const Input = primitives$1.Input ?? "input";
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
				...styles$3.section,
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
		}) : null, part("card", styles$3.card, part("header", styles$3.cardHeader, h("span", {
			"aria-hidden": true,
			style: {
				...styles$3.dot,
				background: busy ? "var(--dsw-alias-state-warn-label)" : status?.accounts?.length ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-label-dimmed)"
			}
		}), h("span", { style: styles$3.name }, status?.displayName || "Codex (ChatGPT)"), button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.registrationError ? t("providerUnavailable") : busy ? t("loginProgress") : status?.accounts?.length ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			const credits = [...snapshot?.resetCredits ?? []].sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity));
			const next = credits.find((credit) => credit.id && (credit.expiresAt === void 0 || credit.expiresAt > Date.now()));
			const weekly = snapshot?.windows?.find((window$1) => window$1.kind === "weekly" && !window$1.scope);
			const resetBlocked = !weekly || !Number.isFinite(weekly.usedPercent) || !weekly.resetsAt || weekly.resetsAt <= Date.now() || snapshot?.resetCreditsError ? "resetRefresh" : weekly.usedPercent < 80 ? "resetGuard" : !next ? "resetRefresh" : null;
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-majed-codex-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => {
				setAcknowledged(false);
				setConfirmation({
					kind: "logout",
					account: account.key,
					label: account.account
				});
			}, false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), snapshot?.plan ? h("span", { style: styles$3.usagePlan }, t("plan"), ": ", h("bdi", null, snapshot.plan)) : null, button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, false, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !snapshot.windows?.length ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			}), snapshot?.resetCreditsError ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, t("creditsUnavailable"), " ", snapshot.resetCreditsError) : null, snapshot?.resetCredits ? h("details", {
				className: "majed-reset-credits",
				style: styles$3.usageRow
			}, h("summary", { style: {
				...styles$3.usageMeta,
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
					...styles$3.usageMeta,
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
		}), part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : button(t(status?.accounts?.length ? "addAccount" : "login"), startLogin, !!status?.registrationError)), !busy && status?.accounts?.length ? h("p", { style: styles$3.statusLine }, t("addAccountHint")) : null, busy ? h("div", null, (status.pendingAuth ?? login)?.authorizeUrl ? h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization")) : null, h("details", { style: styles$3.manual }, h("summary", null, t("manualSummary")), part("manual-row", styles$3.manualRow, h(Input, {
			style: styles$3.manualInput,
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
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t(confirmation.kind === "logout" ? "confirmLogout" : "confirmReset")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), confirmation.kind === "reset" ? part("reset-context", styles$3.usageMeta, h("span", null, t("window_weekly")), h("strong", null, `${Math.round(confirmation.weeklyUsedPercent)}%`)) : null, confirmation.kind === "reset" ? h("p", { style: styles$3.statusLine }, confirmation.creditExpiresAt === void 0 ? t("creditExpiryUnknown") : h("span", null, t("expires"), " ", h("bdi", null, date(confirmation.creditExpiresAt)))) : null, confirmation.kind === "reset" ? h("p", { style: styles$3.statusLine }, t("resetWarning")) : null, confirmation.kind === "reset" ? h("label", { style: {
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
				...styles$3.actions,
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
//#region src/claude-card.ts
/**
* Claude Settings card (ticket #132). Scoped presentation port of the Claude part of V1ki v0.9.12 b802311
* SubscriptionsSection; see PROVENANCE.md. It only ever receives sanitized status from the owned RPC: account
* labels, plan and expiry, never a token or credential-store path.
*/
function createClaudeCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	const Input = primitives$1.Input ?? "input";
	const DEFAULT_NAME = "Claude (Subscription)";
	return function ClaudeCard() {
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `majed-subscriptions.${endpoint}`, {
				provider: "claude",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.claude ?? { accounts: [] },
				registrationError: value.claudeRegistrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (failure) {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((failure) => {
				if (alive.current) setError(failure.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((failure) => {
					if (alive.current) setError(failure.message);
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
				} catch (failure) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: failure instanceof Error ? failure.message : String(failure) }
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
		const part = (name$1, style, ...children) => h("div", {
			style,
			"data-majed-claude-part": name$1
		}, ...children);
		const startLogin = (method) => {
			action(async () => {
				const result = await call("login", method === void 0 ? {} : { method });
				if (!alive.current) return;
				if (result.authorizeUrl) window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result.authorizeUrl ? result : null);
				await refreshStatus();
			});
		};
		const busy = status?.busy;
		const name = status?.displayName || DEFAULT_NAME;
		const hasAccounts = !!status?.accounts?.length;
		return h("div", {
			style: {
				...styles$3.section,
				textAlign: "start"
			},
			className: "majed-subscriptions-settings",
			"data-majed-claude-card": true
		}, h("style", null, controlCss), manager ? h(ProviderAccountManager, {
			provider: "claude",
			name,
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles$3.card, part("header", styles$3.cardHeader, h("span", {
			"aria-hidden": true,
			style: {
				...styles$3.dot,
				background: busy ? "var(--dsw-alias-state-warn-label)" : hasAccounts ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-label-dimmed)"
			}
		}), h("span", { style: styles$3.name }, name), button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.registrationError ? t("claudeProviderUnavailable") : busy ? t("loginProgress") : hasAccounts ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-majed-claude-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => setConfirmation({
				account: account.key,
				label: account.account
			}), false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, false, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !snapshot.windows?.length ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			})));
		}), part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : hasAccounts ? [button(t("addAccountOAuth"), () => startLogin("oauth"), !!status?.registrationError, { key: "oauth" }), button(t("addAccountKeychain"), () => startLogin("keychain"), !!status?.registrationError, { key: "keychain" })] : button(t("login"), () => startLogin(), !!status?.registrationError)), !busy && hasAccounts ? h("p", { style: styles$3.statusLine }, t("claudeAddAccountHint")) : null, busy ? h("div", null, (status.pendingAuth ?? login)?.authorizeUrl ? h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization")) : null, h("details", { style: styles$3.manual }, h("summary", null, t("manualSummary")), part("manual-row", styles$3.manualRow, h(Input, {
			style: styles$3.manualInput,
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
			"aria-label": t("confirmLogout"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t("confirmLogout")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), h("div", {
			className: "majed-subscription-dialog-actions",
			style: {
				...styles$3.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t("logout"), () => {
			action(async () => {
				await call("logout", { account: confirmation.account });
				setConfirmation(null);
				await refreshStatus();
			});
		}))) : null);
	};
}

//#endregion
//#region src/grok-card.ts
/**
* Grok Settings card (ticket #133). Scoped presentation port of the Grok part of V1ki v0.9.12 b802311
* SubscriptionsSection; see PROVENANCE.md. It only ever receives sanitized status from the owned RPC: account
* labels, plan and expiry, never a token or credential-store path.
*/
function createGrokCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	const Input = primitives$1.Input ?? "input";
	const DEFAULT_NAME = "Grok (Subscription)";
	return function GrokCard() {
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `majed-subscriptions.${endpoint}`, {
				provider: "grok",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.grok ?? { accounts: [] },
				registrationError: value.grokRegistrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (failure) {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((failure) => {
				if (alive.current) setError(failure.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((failure) => {
					if (alive.current) setError(failure.message);
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
				} catch (failure) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: failure instanceof Error ? failure.message : String(failure) }
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
		const part = (name$1, style, ...children) => h("div", {
			style,
			"data-majed-grok-part": name$1
		}, ...children);
		const startLogin = () => {
			action(async () => {
				const result = await call("login");
				if (!alive.current) return;
				if (result.authorizeUrl) window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result.authorizeUrl ? result : null);
				await refreshStatus();
			});
		};
		const busy = status?.busy;
		const name = status?.displayName || DEFAULT_NAME;
		const hasAccounts = !!status?.accounts?.length;
		return h("div", {
			style: {
				...styles$3.section,
				textAlign: "start"
			},
			className: "majed-subscriptions-settings",
			"data-majed-grok-card": true
		}, h("style", null, controlCss), manager ? h(ProviderAccountManager, {
			provider: "grok",
			name,
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles$3.card, part("header", styles$3.cardHeader, h("span", {
			"aria-hidden": true,
			style: {
				...styles$3.dot,
				background: busy ? "var(--dsw-alias-state-warn-label)" : hasAccounts ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-label-dimmed)"
			}
		}), h("span", { style: styles$3.name }, name), button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.registrationError ? t("grokProviderUnavailable") : busy ? t("loginProgress") : hasAccounts ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-majed-grok-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => setConfirmation({
				account: account.key,
				label: account.account
			}), false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, false, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !snapshot.windows?.length ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			})));
		}), part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : button(t(hasAccounts ? "addAccountOAuth" : "login"), () => startLogin(), !!status?.registrationError)), busy ? h("div", null, (status.pendingAuth ?? login)?.authorizeUrl ? h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization")) : null, h("details", { style: styles$3.manual }, h("summary", null, t("manualSummary")), part("manual-row", styles$3.manualRow, h(Input, {
			style: styles$3.manualInput,
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
			"aria-label": t("confirmLogout"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t("confirmLogout")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), h("div", {
			className: "majed-subscription-dialog-actions",
			style: {
				...styles$3.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t("logout"), () => {
			action(async () => {
				await call("logout", { account: confirmation.account });
				setConfirmation(null);
				await refreshStatus();
			});
		}))) : null);
	};
}

//#endregion
//#region src/speed/SpeedSelect.tsx
/**
* The `loadSpeed` half of the inject face: the plugin's own speed state plus
* the host's current model selection (the visibility gate). A model-RPC
* failure throws rather than answering "hidden" — the caller keeps its last
* known state, so a transient failure never locks the toggle away.
*
* `sessionId` is a plain string: slot and command contexts brand it through
* different dsh-session copies, and only the service boundary needs one.
*
* `models` resolves lazily per call: the ui-model-selection service may
* register after this plugin applies, and a shell without it (no model seat
* at all) simply keeps the toggle hidden.
*/
function createSpeedLoader(connection, models, sessionId) {
	return async () => {
		const directories = models();
		const current = directories === void 0 ? null : (await directories.directoryFor(sessionId).load()).current;
		const state = await callSubscriptionsAuth(connection.rpc, "speed", {
			sessionId,
			...current?.provider === "codex" ? { model: current.model } : {}
		});
		return {
			visible: current !== null && current.provider === "codex" && state.fastModels.includes(current.model),
			tier: state.tier
		};
	};
}
/** The `setSpeed` half of the inject face: boolean outcome for the component's busy state. */
function createSpeedSetter(connection, sessionId) {
	return (tier) => callSubscriptionsAuth(connection.rpc, "setSpeed", {
		sessionId,
		tier
	}).then(() => true, () => false);
}
/** English-dictionary fallback for a missing inject `t` (standalone renders). */
function fallbackTranslate$1(key) {
	return subscriptions$1[key] ?? key;
}
const TIERS = ["standard", "fast"];
/**
* The composer Speed control: a trigger reading `Speed · Fast`/`Speed · Standard`
* that opens a two-row menu (standard/fast with descriptions, check mark on
* the current tier). Mount and every open reload the host state so a model
* switch made since the last open self-corrects.
*/
/** How often the control re-reads the host state (model switches arrive only by asking). */
const POLL_INTERVAL_MS = 3e3;
/**
* The composer Speed control: a trigger reading `Speed · Fast`/`Speed · Standard`
* that opens a two-row menu (standard/fast with descriptions, check mark on
* the current tier). The host pushes nothing on a model switch, so the
* control re-reads on a slow poll with a single-flight guard; a failed read
* keeps the last known state, so a transient RPC failure can never lock the
* toggle away (the earlier mount-only load had no recovery path).
*/
function SpeedSelect({ loadSpeed, setSpeed, t }) {
	const translate = t ?? fallbackTranslate$1;
	const [state, setState] = (0, react.useState)(null);
	const [open, setOpen] = (0, react.useState)(false);
	const [busy, setBusy] = (0, react.useState)(false);
	const rootRef = (0, react.useRef)(null);
	const loadRef = (0, react.useRef)(loadSpeed);
	loadRef.current = loadSpeed;
	(0, react.useEffect)(() => {
		if (loadRef.current === void 0) return;
		let cancelled = false;
		let inflight = false;
		const reload = () => {
			const load = loadRef.current;
			if (load === void 0 || inflight) return;
			inflight = true;
			load().then((loaded) => {
				if (!cancelled) setState(loaded);
			}, () => {}).finally(() => {
				inflight = false;
			});
		};
		reload();
		const timer = setInterval(reload, POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, []);
	(0, react.useEffect)(() => {
		if (!open) return;
		const closeOutside = (event) => {
			if (!rootRef.current?.contains(event.target)) setOpen(false);
		};
		document.addEventListener("mousedown", closeOutside);
		return () => {
			document.removeEventListener("mousedown", closeOutside);
		};
	}, [open]);
	if (loadSpeed === void 0 || setSpeed === void 0 || state === null || !state.visible) return null;
	const choose = (tier) => {
		if (busy) return;
		if (tier === state.tier) {
			setOpen(false);
			return;
		}
		setBusy(true);
		setSpeed(tier).then((ok) => {
			setBusy(false);
			if (ok) {
				setState({
					visible: true,
					tier
				});
				setOpen(false);
			}
		});
	};
	const show = () => {
		setOpen(true);
		const load = loadRef.current;
		if (load === void 0) return;
		load().then(setState, () => {});
	};
	const tierName = (tier) => translate(tier === "fast" ? "speedFast" : "speedStandard");
	const tierDescription = (tier) => translate(tier === "fast" ? "speedFastDescription" : "speedStandardDescription");
	const triggerLabel = `${translate("speed")} · ${tierName(state.tier)}`;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		className: "majed-subscription-speed",
		style: styles$2.root,
		onKeyDown: (event) => {
			if (event.key === "Escape" && open) {
				event.preventDefault();
				setOpen(false);
			}
		},
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: subscriptionChromeCss }),
			open && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: styles$2.menu,
				role: "menu",
				"aria-label": translate("speed"),
				children: TIERS.map((tier) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "menuitemradio",
					"aria-checked": tier === state.tier,
					style: styles$2.item,
					disabled: busy,
					onClick: () => {
						choose(tier);
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: styles$2.itemCheck,
						children: tier === state.tier ? "✓" : ""
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: styles$2.itemText,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: styles$2.itemName,
							children: tierName(tier)
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: styles$2.itemDescription,
							children: tierDescription(tier)
						})]
					})]
				}, tier))
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				style: styles$2.trigger,
				"aria-haspopup": "menu",
				"aria-expanded": open,
				title: triggerLabel,
				disabled: busy,
				onClick: () => {
					if (open) setOpen(false);
					else show();
				},
				children: triggerLabel
			})
		]
	});
}
const styles$2 = {
	root: {
		position: "relative",
		display: "inline-flex"
	},
	trigger: {
		border: "0.5px solid var(--dsw-alias-border-l3)",
		borderRadius: "var(--dsw-radius-sm, 8px)",
		background: "var(--majed-subscription-speed-hover, transparent)",
		color: "var(--dsw-alias-label-secondary)",
		font: "inherit",
		fontSize: 12,
		lineHeight: "18px",
		padding: "2px 8px",
		cursor: "pointer",
		whiteSpace: "nowrap"
	},
	menu: {
		position: "absolute",
		bottom: "100%",
		insetInlineEnd: 0,
		marginBottom: 4,
		minWidth: 180,
		padding: 4,
		zIndex: 20,
		background: "var(--dsw-specific-menu, var(--dsw-alias-bg-layer-2))",
		border: 0,
		boxShadow: "var(--dsw-elevation-prominent)",
		borderRadius: "var(--dsw-radius-lg, 16px)",
		display: "flex",
		flexDirection: "column",
		gap: 2
	},
	item: {
		display: "flex",
		alignItems: "flex-start",
		gap: 6,
		width: "100%",
		border: "none",
		borderRadius: "var(--dsw-radius-sm, 8px)",
		background: "var(--majed-subscription-speed-hover, transparent)",
		padding: "6px 8px",
		cursor: "pointer",
		font: "inherit",
		textAlign: "start"
	},
	itemCheck: {
		width: 14,
		flexShrink: 0,
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-primary)"
	},
	itemText: {
		display: "flex",
		flexDirection: "column"
	},
	itemName: {
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-primary)"
	},
	itemDescription: {
		fontSize: 11,
		lineHeight: "16px",
		color: "var(--dsw-alias-label-tertiary)"
	}
};

//#endregion
//#region src/speed/fast-command.ts
/** Build the locale resolver used by the /fast command contribution. */
function fastCommandDescription(t) {
	return () => t();
}

//#endregion
//#region src/usage-badge/usage-types.ts
/** Bar fill color: success normally, warn from 80%, error from 95%. */
function usageBarColor(usedPercent$1) {
	if (usedPercent$1 >= 95) return "var(--dsw-alias-state-error-primary)";
	if (usedPercent$1 >= 80) return "var(--dsw-alias-state-warn-label)";
	return "var(--dsw-alias-state-success-primary)";
}

//#endregion
//#region src/usage-badge/host-icons.ts
/** A decorative glyph the host lacks renders nothing rather than crashing. */
const NoIcon = () => null;
/**
* Resolve one 16px glyph under either host naming.
* @param icons - the host primitives module (`import * as`), read by name.
* @param name - the glyph name without prefix or size, e.g. `Sparkle`.
* @returns the host's component, or one rendering nothing.
*/
function hostIcon(icons, name) {
	const exports$1 = icons;
	return exports$1[`Icon${name}Regular`] ?? exports$1[`Icon${name}16`] ?? NoIcon;
}

//#endregion
//#region src/usage-badge/host-modules.ts
let primitives;
let reactDom;
/** `@deepseek-ai/dsh-client-ui-primitives`, resolved on first use. */
function hostPrimitives() {
	return primitives ??= require("@deepseek-ai/dsh-client-ui-primitives");
}
/** `react-dom` (portals), resolved on first use. */
function hostReactDom() {
	return reactDom ??= require("react-dom");
}

//#endregion
//#region src/usage-badge/usage-badge-preferences.ts
const MODE_KEY = "majed.subscriptions.usageBadgeMode";
const MODE_EVENT = "majed:subscriptions:usage-badge-mode";
/** Read the browser preference; blocked storage retains the default display. */
function readUsageBadgeMode() {
	if (typeof window === "undefined") return "recent";
	try {
		return window.localStorage.getItem(MODE_KEY) === "hidden" ? "hidden" : "recent";
	} catch (error) {
		if (!(error instanceof DOMException) || error.name !== "SecurityError") throw error;
		return "recent";
	}
}
/** Save first, then notify; the settings control reports a rejected write. */
function setUsageBadgeMode(mode) {
	if (mode !== "recent" && mode !== "hidden") throw new TypeError("Invalid subscription usage display mode");
	window.localStorage.setItem(MODE_KEY, mode);
	window.dispatchEvent(new Event(MODE_EVENT));
}
/** Same-tab writes need a custom event; other tabs use the storage event. */
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
/** Shared React snapshot used by the settings control and every mounted badge. */
function useUsageBadgeMode() {
	return (0, react.useSyncExternalStore)(subscribeUsageBadgeMode, readUsageBadgeMode, () => "recent");
}

//#endregion
//#region src/usage-badge/SubscriptionUsageBadge.tsx
/** DSH renamed the data icon in 0.1.7; retain older supported hosts too. */
function usageBadgeIcon(icons) {
	return hostIcon(icons, "DataOutline");
}
let resolvedIcon;
/** The data glyph resolved from the host on first render (never at bundle load). */
function UsageBadgeIcon() {
	resolvedIcon ??= usageBadgeIcon(hostPrimitives());
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(resolvedIcon, {});
}
/** How often the badge re-reads usage; the server also shares its own cache/negative-cache across UI surfaces. */
const USAGE_POLL_INTERVAL_MS = 15 * 6e4;
/** How often the badge re-reads the session's current model (model switches arrive only by asking). */
const MODEL_POLL_INTERVAL_MS = 3e3;
/** Distance between the trigger's top edge and the dialog's bottom (host stat dialogs use the same). */
const PANEL_GAP = 8;
/** Distance kept between the dialog and each viewport edge. */
const PANEL_MARGIN = 12;
/** The account the collapsed pill reads: the default one, else the first listed. */
function pillAccountOf(d) {
	return d.accounts.find((a) => a.isDefault) ?? d.accounts[0];
}
/** Brand display names (short form for the compact badge). */
const PROVIDER_NAMES = {
	codex: "Codex",
	claude: "Claude",
	grok: "Grok",
	copilot: "Copilot",
	antigravity: "Antigravity"
};
/**
* The `currentModel` half of the inject face: the session's effective
* model selection through ui-model-selection's `modelDirectories` service,
* resolved lazily per call (the service may register after this plugin, and
* a shell without it reports "unknown"; the badge keeps the most recent
* subscription selected in this view, or stays hidden).
*/
function createCurrentModelReader(models, sessionId) {
	return async () => {
		const directories = models();
		if (directories === void 0) return void 0;
		const { current } = await directories.directoryFor(sessionId).load();
		return current ?? void 0;
	};
}
/**
* Compact time-remaining label derived from the window's `resetsAt` timestamp:
* "6d 18h" (days+hours), "1h 58m" (hours+minutes), or "42m" (minutes only).
* Falls back to the scope/kind abbreviation when no reset time is known.
*/
function windowLabel(w) {
	if (w.resetsAt === void 0) {
		if (w.scope !== void 0 && w.scope !== "") return w.scope;
		switch (w.kind) {
			case "session": return "5h";
			case "weekly": return "Wk";
			default: return "W";
		}
	}
	const ms = Math.max(0, w.resetsAt - Date.now());
	const minutes = Math.floor(ms / 6e4);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	if (days > 0) return `${days}d ${hours % 24}h`;
	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	return `${Math.max(1, minutes)}m`;
}
/** Clamp and round a window's used share for display. */
function usedPercent(w) {
	return Math.round(Math.min(100, Math.max(0, w.usedPercent)));
}
/** Keep model quotas separate: matching percentages do not imply a shared pool. */
function prioritizeWindows(windows, model) {
	return model === void 0 ? [...windows] : [...windows.filter((w) => w.scope === model), ...windows.filter((w) => w.scope !== model)];
}
/** Small previews keep a live model catalog from taking over the dialog. */
const WINDOW_PREVIEW_LIMIT = 4;
function previewWindows(windows, model, provider) {
	const ordered = prioritizeWindows(windows, model);
	const limit = provider === "antigravity" ? Math.min(2, model === void 0 ? 0 : windows.filter((w) => w.scope === model).length) : WINDOW_PREVIEW_LIMIT;
	return {
		shown: ordered.slice(0, limit),
		hidden: ordered.slice(limit)
	};
}
/** Bounded readout; Antigravity quotas belong to individual models, not the account. */
function compactSegment(d, model, t = fallbackTranslate) {
	const windows = pillAccountOf(d).windows;
	if (d.provider === "antigravity") {
		const matching = model === void 0 ? [] : windows.filter((w) => w.scope === model);
		if (matching.length === 0) return `${d.name} ${t(model === void 0 ? "usageBadgeModelCount" : "usageBadgeModelUnavailable", { count: new Set(windows.map((w) => w.scope).filter(Boolean)).size })}`;
		const parts$1 = matching.slice(0, 2).map((w) => `${w.kind === "weekly" ? t("usageWeekly") : t("usageWindow")} ${usedPercent(w)}%`);
		return `${d.name} ${parts$1.join(" · ")}`;
	}
	const parts = windows.slice(0, 2).map((w) => `${windowLabel(w)} ${usedPercent(w)}%`);
	if (windows.length > 2) parts.push(`+${windows.length - 2}`);
	return `${d.name} ${parts.join(" · ")}`;
}
/** Remember only the most recent subscription in this view, including its model scope. */
function retainSubscriptionSelection(previous, current) {
	return current !== void 0 && Object.hasOwn(PROVIDER_NAMES, current.provider) ? current : previous;
}
/** At most one provider; no known selection or no usage means no badge. */
function collapsedDisplays(displays, current) {
	const match = displays.find((d) => d.provider === current);
	return match === void 0 ? [] : [match];
}
/** Order for the expanded dialog: the current provider first, the rest in poll order. */
function expandedDisplays(displays, current) {
	const match = displays.find((d) => d.provider === current);
	return match === void 0 ? displays : [match, ...displays.filter((d) => d !== match)];
}
/**
* A provider's logged-in accounts, the effective default first. When no
* account is flagged default the first listed stands in, matching what
* direct routes fall back to.
*/
function accountsOf(status) {
	if (status === void 0 || status.accounts.length === 0) return [];
	const fallback = status.accounts.find((a) => a.isDefault) ?? status.accounts[0];
	return status.accounts.map((a) => a === fallback ? {
		...a,
		isDefault: true
	} : a).sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}
/** English-dictionary fallback for a missing inject `t` (standalone renders). */
function fallbackTranslate(key, params) {
	return (subscriptions$1[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => String(params?.[name] ?? ""));
}
/** Localized label of one usage window (kind, plus the model scope when named). */
function usageWindowLabel(t, window$1) {
	const base = window$1.kind === "session" ? t("usageSession") : window$1.kind === "weekly" ? t("usageWeekly") : t("usageWindow");
	return window$1.scope !== void 0 && window$1.scope !== "" ? `${base} · ${window$1.scope}` : base;
}
/**
* The composer subscription-usage badge: a pill reading e.g.
* `Codex 6d 1h 25%` for the current model's provider, opening a dialog with
* every provider's accounts and their windows. Returns null when no data is
* available.
*/
function SubscriptionUsageBadge({ rpc, currentModel, t }) {
	const translate = t ?? fallbackTranslate;
	const [displays, setDisplays] = (0, react.useState)([]);
	const [selection, setSelection] = (0, react.useState)(void 0);
	const [lastSubscription, setLastSubscription] = (0, react.useState)(void 0);
	const displayMode = useUsageBadgeMode();
	const current = selection?.provider;
	const badgeSelection = retainSubscriptionSelection(lastSubscription, selection);
	const [open, setOpen] = (0, react.useState)(false);
	const [hover, setHover] = (0, react.useState)(false);
	const inflightRef = (0, react.useRef)(false);
	const mountedRef = (0, react.useRef)(true);
	const rootRef = (0, react.useRef)(null);
	const panelRef = (0, react.useRef)(null);
	const seatRef = (0, react.useRef)(null);
	const currentRef = (0, react.useRef)(currentModel);
	currentRef.current = currentModel;
	const lastKnownRef = (0, react.useRef)(/* @__PURE__ */ new Map());
	const namesRevision = (0, react.useRef)(0);
	const recentNames = (0, react.useRef)(/* @__PURE__ */ new Map());
	const refresh = (0, react.useCallback)(async () => {
		if (rpc === void 0 || inflightRef.current) return;
		inflightRef.current = true;
		const revision = namesRevision.current;
		try {
			const statusResp = await callSubscriptionsAuth(rpc, "status", {});
			if (!mountedRef.current) return;
			const roster = [];
			for (const provider of Object.keys(statusResp.providers)) for (const account of accountsOf(statusResp.providers[provider])) roster.push({
				provider,
				account
			});
			const keyOf = (provider, account) => `${provider}:${account.key}`;
			const lastKnown = lastKnownRef.current;
			const live = new Set(roster.map(({ provider, account }) => keyOf(provider, account)));
			for (const key of lastKnown.keys()) if (!live.has(key)) lastKnown.delete(key);
			if (roster.length === 0) {
				setDisplays([]);
				return;
			}
			const results = await Promise.allSettled(roster.map(async ({ provider, account }) => {
				return {
					provider,
					account,
					usage: await callSubscriptionsAuth(rpc, "usage", {
						provider,
						account: account.key,
						force: false
					})
				};
			}));
			if (!mountedRef.current) return;
			const plans = /* @__PURE__ */ new Map();
			for (const r of results) {
				if (r.status !== "fulfilled") continue;
				const { provider, account, usage } = r.value;
				const key = keyOf(provider, account);
				if (usage.plan !== void 0) plans.set(key, usage.plan);
				if (!usage.supported || !usage.windows || usage.windows.length === 0) {
					lastKnown.delete(key);
					continue;
				}
				lastKnown.set(key, usage.windows);
			}
			const byProvider = /* @__PURE__ */ new Map();
			for (const { provider, account } of roster) {
				const key = keyOf(provider, account);
				const windows = lastKnown.get(key);
				if (windows === void 0) continue;
				const plan = plans.get(key) ?? account.plan;
				const row = {
					key: account.key,
					isDefault: account.isDefault,
					...account.account === void 0 ? {} : { account: account.account },
					...plan === void 0 ? {} : { plan },
					windows
				};
				const display = byProvider.get(provider);
				if (display === void 0) byProvider.set(provider, {
					provider,
					name: statusResp.providers[provider]?.displayName || PROVIDER_NAMES[provider],
					accounts: [row]
				});
				else display.accounts.push(row);
			}
			setDisplays([...byProvider.values()].map((row) => {
				const saved = recentNames.current.get(row.provider);
				return saved && saved.revision > revision ? {
					...row,
					name: saved.name
				} : row;
			}));
		} catch {} finally {
			inflightRef.current = false;
		}
	}, [rpc]);
	(0, react.useEffect)(() => {
		const update = (event) => {
			const { provider, displayName } = event.detail;
			recentNames.current.set(provider, {
				revision: ++namesRevision.current,
				name: displayName || PROVIDER_NAMES[provider]
			});
			setDisplays((current$1) => current$1.map((row) => row.provider === provider ? {
				...row,
				name: displayName || PROVIDER_NAMES[provider]
			} : row));
		};
		window.addEventListener(DISPLAY_NAME_CHANGED, update);
		return () => {
			window.removeEventListener(DISPLAY_NAME_CHANGED, update);
		};
	}, []);
	(0, react.useEffect)(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);
	(0, react.useEffect)(() => {
		if (displayMode === "hidden") return;
		refresh();
		const timer = setInterval(() => {
			refresh();
		}, USAGE_POLL_INTERVAL_MS);
		return () => {
			clearInterval(timer);
		};
	}, [refresh, displayMode]);
	(0, react.useEffect)(() => {
		if (currentRef.current === void 0) return;
		let cancelled = false;
		let inflight = false;
		const reload = () => {
			const read = currentRef.current;
			if (read === void 0 || inflight) return;
			inflight = true;
			read().then((model) => {
				if (cancelled) return;
				setLastSubscription((previous) => retainSubscriptionSelection(previous, model));
				setSelection(model);
			}, () => {}).finally(() => {
				inflight = false;
			});
		};
		reload();
		const timer = setInterval(reload, MODEL_POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, []);
	const { useAnchoredPosition, useDismissOnOutsidePointer } = hostPrimitives();
	const pos = useAnchoredPosition({
		open,
		anchorRef: rootRef,
		panelRef,
		side: "top",
		gap: PANEL_GAP,
		margin: PANEL_MARGIN
	});
	useDismissOnOutsidePointer(rootRef, open, setOpen, panelRef);
	(0, react.useEffect)(() => {
		if (!open) return;
		const onKeyDown = (event) => {
			if (event.key === "Escape") setOpen(false);
		};
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);
	const [statsRow, setStatsRow] = (0, react.useState)(null);
	(0, react.useEffect)(() => {
		const seat$1 = seatRef.current;
		if (seat$1 === null) return;
		const scope = statsScopeOf(seat$1);
		if (scope === null) return;
		const find = () => scope.querySelector("[data-composer-stats]");
		setStatsRow(find());
		const observer = new MutationObserver(() => {
			setStatsRow(find());
		});
		observer.observe(scope, {
			childList: true,
			subtree: true
		});
		return () => {
			observer.disconnect();
		};
	}, []);
	(0, react.useEffect)(() => {
		if (displayMode === "hidden") setOpen(false);
	}, [displayMode]);
	const seat = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
		ref: seatRef,
		style: styles$1.seat,
		"aria-hidden": true
	});
	const collapsed = collapsedDisplays(displays, badgeSelection?.provider);
	if (displayMode === "hidden" || collapsed.length === 0) return seat;
	const label = compactSegment(collapsed[0], badgeSelection?.model, translate);
	const expanded = expandedDisplays(displays, badgeSelection?.provider);
	const title = translate("usageBadgeTitle");
	const toggle = () => {
		const next = !open;
		setOpen(next);
		if (next) refresh();
	};
	const pill = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
		ref: rootRef,
		style: styles$1.anchor,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: subscriptionChromeCss }),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "majed-subscription-usage-pill",
				style: {
					...styles$1.pill,
					...hover || open ? styles$1.pillActive : {}
				},
				"aria-haspopup": "dialog",
				"aria-expanded": open,
				"aria-label": `${title} · ${label}`,
				title,
				onMouseEnter: () => {
					setHover(true);
				},
				onMouseLeave: () => {
					setHover(false);
				},
				onClick: toggle,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UsageBadgeIcon, {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$1.label,
					children: label
				})]
			}),
			open && hostReactDom().createPortal(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: panelRef,
				role: "dialog",
				"aria-label": title,
				className: "majed-subscription-usage-panel",
				style: {
					...styles$1.panel,
					...pos ?? MEASURE_STYLE
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: styles$1.title,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: styles$1.titleLabel,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UsageBadgeIcon, {}), title]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: styles$1.titleRule,
						"aria-hidden": true
					}),
					expanded.map((d, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						style: index === 0 ? void 0 : styles$1.section,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: styles$1.providerRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: styles$1.providerName,
								children: [d.name, d.provider === current && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: styles$1.currentTag,
									children: translate("usageBadgeCurrent")
								})]
							}), d.accounts.length === 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AccountMeta, {
								account: d.accounts[0],
								translate
							})]
						}), d.accounts.map((account, accountIndex) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: accountIndex === 0 ? void 0 : styles$1.accountBlock,
							children: [d.accounts.length > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: styles$1.accountRow,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AccountMeta, {
									account,
									translate
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AccountWindows, {
								windows: account.windows,
								model: d.provider === badgeSelection?.provider ? badgeSelection.model : void 0,
								provider: d.provider,
								translate
							}, `${d.provider}:${badgeSelection?.model ?? ""}`)]
						}, account.key))]
					}, d.provider))
				]
			}), document.body)
		]
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [seat, statsRow !== null && statsRow.isConnected ? hostReactDom().createPortal(pill, statsRow) : pill] });
}
/**
* Nearest ancestor of the dock seat that can contain the host's stats row:
* the composer bar. Bounded so a badge in an unfamiliar layout never adopts
* some other composer's pills.
*/
function statsScopeOf(seat) {
	let node = seat.parentElement;
	for (let depth = 0; node !== null && depth < 4; depth++) {
		if (node.querySelector("[data-composer-stats]") !== null) return node;
		node = node.parentElement;
	}
	return seat.parentElement;
}
/**
* One account's handle and plan: `★ user@example.com · Plan: pro`. The star
* marks the default account (the one direct routes serve and the collapsed
* pill reads), the same glyph Settings → Subscriptions uses.
*/
function AccountMeta({ account, translate }) {
	const parts = [account.account, account.plan === void 0 ? void 0 : translate("usagePlan", { plan: account.plan })].filter((part) => part !== void 0 && part !== "");
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
		style: styles$1.providerMeta,
		title: account.account,
		children: [account.isDefault && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			style: styles$1.defaultStar,
			"aria-label": translate("defaultAccount"),
			children: "★ "
		}), parts.join(" · ")]
	});
}
/** Preview each account independently; all remaining quotas stay accessible. */
function AccountWindows({ windows, model, provider, translate }) {
	const { shown, hidden } = previewWindows(windows, model, provider);
	const rows = (items) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dl", {
		style: styles$1.details,
		children: items.map((w, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WindowRow, {
			label: `${usageWindowLabel(translate, w)}${model !== void 0 && w.scope === model ? ` · ${translate("usageBadgeCurrent")}` : ""}`,
			window: w
		}, i))
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [rows(shown), hidden.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
		style: styles$1.moreWindows,
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", {
			style: styles$1.moreSummary,
			children: translate("usageBadgeMoreWindows", { count: hidden.length })
		}), rows(hidden)]
	})] });
}
/** One `dt`/`dd` pair: window name → `25% · 6d 1h`, with the bar underneath. */
function WindowRow({ label, window: w }) {
	const percent = usedPercent(w);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", {
			style: styles$1.dt,
			children: label
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", {
			style: styles$1.dd,
			children: [
				percent,
				"%",
				w.resetsAt !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					style: styles$1.reset,
					children: [" · ", windowLabel(w)]
				})
			]
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			style: styles$1.bar,
			"aria-hidden": true,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: {
				...styles$1.barFill,
				width: `${percent}%`,
				background: usageBarColor(percent)
			} })
		})
	] });
}
/**
* Unplaced portal panel: hidden but laid out so the clamp measures real
* dimensions (the `useAnchoredPosition` measure pass).
*/
const MEASURE_STYLE = {
	visibility: "hidden",
	left: 0,
	top: 0
};
const styles$1 = {
	seat: { display: "none" },
	anchor: {
		minWidth: 0,
		maxWidth: "100%",
		display: "inline-flex"
	},
	pill: {
		boxSizing: "border-box",
		maxWidth: "100%",
		color: "var(--dsw-alias-label-tertiary)",
		font: "inherit",
		fontSize: "calc(var(--dsh-content-font-size-secondary, 13px) - 1px)",
		fontVariantNumeric: "tabular-nums",
		lineHeight: "calc(20px + var(--dsh-content-font-delta-secondary, 0px))",
		whiteSpace: "nowrap",
		background: "transparent",
		border: "none",
		borderRadius: 999,
		alignItems: "center",
		gap: 6,
		padding: "1px 8px",
		display: "inline-flex",
		cursor: "pointer"
	},
	pillActive: {
		background: "var(--dsw-alias-interactive-bg-hover)",
		color: "var(--dsw-alias-label-secondary)"
	},
	label: {
		textOverflow: "ellipsis",
		minWidth: 0,
		overflow: "hidden"
	},
	panel: {
		position: "fixed",
		zIndex: 1100,
		boxSizing: "border-box",
		background: "var(--dsw-specific-menu)",
		width: "max-content",
		minWidth: "min(300px, 100vw - 24px)",
		maxWidth: "min(440px, 100vw - 24px)",
		maxHeight: "min(560px, 100dvh - 24px)",
		overflowY: "auto",
		overscrollBehavior: "contain",
		boxShadow: "var(--dsw-elevation-prominent)",
		color: "var(--dsw-alias-label-secondary)",
		cursor: "default",
		border: 0,
		borderRadius: "var(--dsw-radius-lg, 16px)",
		padding: 16,
		fontSize: 12,
		lineHeight: "18px"
	},
	title: {
		color: "var(--dsw-alias-label-primary)",
		display: "flex",
		justifyContent: "space-between",
		gap: 16,
		marginBottom: 8,
		fontWeight: 500
	},
	titleLabel: {
		alignItems: "center",
		gap: 6,
		minWidth: 0,
		display: "inline-flex"
	},
	titleRule: {
		borderTop: "0.5px solid var(--dsw-alias-border-l2)",
		marginBottom: 10
	},
	section: {
		marginTop: 12,
		paddingTop: 10,
		borderTop: "0.5px solid var(--dsw-alias-border-l2)"
	},
	providerRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "baseline",
		gap: 16,
		marginBottom: 6
	},
	providerName: {
		color: "var(--dsw-alias-label-primary)",
		fontWeight: 500,
		display: "inline-flex",
		alignItems: "center",
		gap: 6
	},
	currentTag: {
		fontSize: 10,
		lineHeight: "14px",
		fontWeight: 400,
		padding: "0 5px",
		borderRadius: 7,
		color: "var(--dsw-alias-label-secondary)",
		background: "var(--dsw-alias-interactive-bg-hover)"
	},
	providerMeta: {
		color: "var(--dsw-alias-label-tertiary)",
		minWidth: 0,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap"
	},
	defaultStar: { color: "var(--dsw-alias-state-warn-label)" },
	accountBlock: { marginTop: 8 },
	accountRow: {
		display: "flex",
		marginBottom: 4
	},
	details: {
		color: "var(--dsw-alias-label-tertiary)",
		display: "grid",
		gridTemplateColumns: "minmax(0, 1fr) max-content",
		gap: "4px 16px",
		margin: 0
	},
	moreWindows: { marginTop: 8 },
	moreSummary: {
		cursor: "pointer",
		color: "var(--dsw-alias-label-secondary)",
		marginBottom: 8
	},
	dt: {
		minWidth: 0,
		margin: 0,
		overflowWrap: "anywhere"
	},
	dd: {
		minWidth: 0,
		margin: 0,
		color: "var(--dsw-alias-label-secondary)",
		fontVariantNumeric: "tabular-nums",
		textAlign: "end"
	},
	reset: { color: "var(--dsw-alias-label-tertiary)" },
	bar: {
		gridColumn: "1 / -1",
		height: 4,
		borderRadius: 2,
		overflow: "hidden",
		background: "var(--dsw-alias-border-l2)",
		marginBottom: 2
	},
	barFill: {
		height: "100%",
		borderRadius: 2
	}
};

//#endregion
//#region src/usage-badge/UsageBadgeDisplaySetting.tsx
/** Browser-local display preference; never changes provider or account settings. */
function UsageBadgeDisplaySetting({ t }) {
	const mode = useUsageBadgeMode();
	const [failed, setFailed] = (0, react.useState)(false);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: styles.card,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				style: styles.field,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("usageBadgeDisplay") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
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
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: "recent",
						children: t("usageBadgeDisplayRecent")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: "hidden",
						children: t("usageBadgeDisplayHidden")
					})]
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles.hint,
				children: t("usageBadgeDisplayHint")
			}),
			failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				role: "alert",
				style: {
					...styles.hint,
					color: "var(--dsw-alias-state-error-primary)"
				},
				children: t("usageBadgeDisplaySaveFailed")
			})
		]
	});
}
const styles = {
	card: {
		border: "0.5px solid var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l4))",
		borderRadius: "var(--dsw-radius-xl, 20px)",
		background: "var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))",
		padding: "12px 14px",
		display: "flex",
		flexDirection: "column",
		gap: 6
	},
	field: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		fontSize: 13,
		fontWeight: 500,
		lineHeight: "20px"
	},
	select: { width: "100%" },
	hint: {
		margin: 0,
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-tertiary)"
	}
};

//#endregion
//#region src/usage-badge/error-boundary.ts
function guarded(React, Component, label, report = (message, error) => console.error(message, error)) {
	class Boundary extends React.Component {
		state = { failed: false };
		static getDerivedStateFromError() {
			return { failed: true };
		}
		componentDidCatch(error) {
			report(`dsh-majed: ${label} failed to render`, error);
		}
		render() {
			return this.state.failed ? null : React.createElement(Component, this.props);
		}
	}
	const wrapped = (props) => React.createElement(Boundary, props);
	Object.defineProperty(wrapped, "name", { value: `Guarded${label.replace(/\W+/g, "")}` });
	return wrapped;
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
		const primitives$1 = require("@deepseek-ai/dsh-client-ui-primitives");
		const { IconSettingsOutlineMedium } = primitives$1;
		const NS = "majed.subscriptions";
		isolate(() => ctx.effect(() => isolate(() => ctx.locale.register(NS, {
			en: subscriptions$1,
			ar: subscriptions
		})), "dsh-majed: subscriptions dictionaries"));
		const t = ctx.locale.bind(NS);
		const CodexCard = createCodexCard(React, primitives$1, connection.rpc, t);
		const ClaudeCard = guarded(React, createClaudeCard(React, primitives$1, connection.rpc, t), "Claude card");
		const GrokCard = guarded(React, createGrokCard(React, primitives$1, connection.rpc, t), "Grok card");
		const GuardedSetting = guarded(React, UsageBadgeDisplaySetting, "usage display setting");
		const GuardedSpeed = guarded(React, SpeedSelect, "Speed control");
		const GuardedBadge = guarded(React, SubscriptionUsageBadge, "usage badge");
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
			} }, t("intro")), h(GuardedSetting, { t }), h(CodexCard), h(ClaudeCard), h(GrokCard)) : h("p", { style: { color: "var(--dsw-alias-label-tertiary)" } }, t(`${part}Empty`)))));
		}
		const models = () => ctx.get("modelDirectories");
		const surfaceWanted = () => !disposed && present && !referenceEnabled;
		const surfaces = [];
		let surfacesActive = false;
		function syncSurfaces() {
			if (surfaceWanted() && !surfacesActive) {
				surfacesActive = true;
				const add = (register) => isolate(() => {
					const off = register();
					if (typeof off === "function") surfaces.push(off);
				});
				for (const [name, view, inject] of [[
					"image_generate",
					ImageGenerateToolview,
					() => ({ load: createImageLoader(connection.rpc) })
				], [
					"video_generate",
					VideoGenerateToolview,
					() => ({ loadVideo: createVideoLoader(connection.rpc) })
				]]) for (const key of [name, `dsh_majed_${name}`]) add(() => ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
					name: "tool.call.toolview",
					id: `majed-toolview-${key}`,
					key,
					locale: NS,
					inject
				}, guarded(React, view, name))));
				add(() => ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
					name: "conversation.input.right",
					id: "majed-subscription-speed",
					order: 0,
					locale: NS,
					inject: (sessionId) => ({
						loadSpeed: createSpeedLoader(connection, models, sessionId),
						setSpeed: createSpeedSetter(connection, sessionId)
					})
				}, GuardedSpeed)));
				add(() => ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
					name: "conversation.composer.dock",
					id: "majed-subscription-usage",
					order: 10,
					locale: NS,
					inject: (sessionId) => ({
						rpc: connection.rpc,
						currentModel: createCurrentModelReader(models, sessionId)
					})
				}, GuardedBadge)));
			} else if (!surfaceWanted() && surfacesActive) {
				surfacesActive = false;
				for (const off of surfaces.splice(0)) isolate(off);
			}
		}
		isolate(() => ctx.inject(["commandUi"], (scope) => isolate(() => {
			const command = scope.get("commandUi");
			scope.effect(() => command.register({
				name: "fast",
				description: fastCommandDescription(() => t("commandFast")),
				available: () => surfaceWanted(),
				ui: {
					kind: "popupSelect",
					options: async (session) => {
						if (!surfaceWanted()) throw new Error(t("commandFastUnavailable"));
						const state = await createSpeedLoader(connection, models, session.sessionId)();
						if (!state.visible) throw new Error(t("commandFastUnavailable"));
						return [{
							id: "standard",
							label: t("speedStandard"),
							detail: t("speedStandardDescription")
						}, {
							id: "fast",
							label: t("speedFast"),
							detail: t("speedFastDescription")
						}].map((option) => ({
							...option,
							active: option.id === state.tier
						}));
					},
					onSelect: async (option, session) => {
						if (!surfaceWanted()) return;
						await createSpeedSetter(connection, session.sessionId)(option.id);
					}
				}
			}), "dsh-majed: /fast contribution");
		})));
		function update() {
			isolate(syncSurfaces);
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
				isolate(syncSurfaces);
				withdraw?.();
				listeners.clear();
			};
		}), "dsh-majed: subscriptions presence"));
	})));
}

//#endregion
exports.applySubscriptions = applySubscriptions;
return module.exports; };