// Public tool names/aliases, native search behavior and supported tool views.
//
// Search tools (Codex web_search, Grok x_search) are native capabilities:
// they are never installed, granted or enabled through Auto membership.
// Direct search/attachment scheduling is independent of Auto enrollment.

export const VIEW_CHAT = 'chat';
export const VIEW_SEARCH = 'search';
export const VIEW_ATTACHMENT = 'attachment';

const DEFAULT_VIEWS = Object.freeze([VIEW_CHAT]);

function requiredString(value, name) {
  if (typeof value !== 'string' || !value) throw new Error(`Invalid ${name}.`);
  return value;
}

/** Build a frozen tool entry from validated input. */
function buildTool(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Invalid tool.');
  const name = requiredString(input.name, 'tool name');
  const provider = input.provider === undefined ? undefined : requiredString(input.provider, 'tool provider');
  const aliases = input.aliases === undefined
    ? Object.freeze([name])
    : Object.freeze([...new Set([name, ...input.aliases.map(String)])]);
  const views = input.views === undefined
    ? DEFAULT_VIEWS
    : Object.freeze([...input.views.map(String)]);
  return Object.freeze({
    name,
    aliases,
    provider,
    native: Boolean(input.native),
    search: Boolean(input.search),
    attachment: Boolean(input.attachment),
    views,
    capabilities: input.capabilities === undefined ? undefined : Object.freeze({ ...input.capabilities }),
  });
}

/** Registry of public tools. Registration is explicit: nothing is auto-installed. */
export function createToolsRegistry(initial = {}) {
  const byName = new Map(); // tool name -> tool entry
  const byAlias = new Map(); // alias -> tool name

  function add(input) {
    const tool = buildTool(input);
    if (byName.has(tool.name)) throw new Error(`Tool ${tool.name} already registered.`);
    for (const alias of tool.aliases) {
      if (byAlias.has(alias)) throw new Error(`Alias ${alias} already registered.`);
      byAlias.set(alias, tool.name);
    }
    byName.set(tool.name, tool);
    return tool;
  }

  for (const tool of (initial.tools || [])) add(tool);

  return {
    /** Register one public tool by name. Explicit only — no auto-install. */
    register(input) { return add(input); },
    /** Resolve a tool by public name or alias. */
    get(name) {
      if (typeof name !== 'string' || !name) return undefined;
      const toolName = byAlias.get(name);
      return toolName === undefined ? undefined : byName.get(toolName);
    },
    has(name) { return this.get(name) !== undefined; },
    list() { return [...byName.values()]; },
    /** Native search tools only. */
    searchTools() { return this.list().filter(t => t.search === true); },
    supportsView(name, view) {
      const tool = this.get(name);
      return tool !== undefined && tool.views.includes(view);
    },
    isNative(name) {
      const tool = this.get(name);
      return tool !== undefined && tool.native === true;
    },
    isSearch(name) {
      const tool = this.get(name);
      return tool !== undefined && tool.search === true;
    },
    snapshot() {
      return {
        tools: this.list().map(t => ({
          ...t,
          aliases: [...t.aliases],
          views: [...t.views],
          ...(t.capabilities !== undefined ? { capabilities: { ...t.capabilities } } : {}),
        })),
      };
    },
  };
}

export default { createToolsRegistry, VIEW_CHAT, VIEW_SEARCH, VIEW_ATTACHMENT };
