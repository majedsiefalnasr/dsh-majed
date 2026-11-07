import { LEGACY_TOOL_ALIASES } from '../legacy-names.js';
/** Tool names owned by this plugin and their collision fallbacks. */
export const TOOL_ALIASES = {
    x_search: 'dsh_waycraft_x_search',
    video_generate: 'dsh_waycraft_video_generate',
    image_generate: 'dsh_waycraft_image_generate',
};
/**
 * Register a tool under its canonical name, then a plugin-scoped alias on collision, plus the retired
 * pre-rename name (`LEGACY_TOOL_ALIASES`) as a deprecated alias of the same implementation. The deprecated alias is
 * marked `deferLoading` so it does not bloat model tool lists, and failure to register it is never an error.
 * `names` lists every registered name (canonical first) so callers can restrict all of them together.
 */
export function registerWithAlias(registry, definition, warn = (message) => console.warn(message)) {
    let primary;
    try {
        primary = { name: definition.name, dispose: registry.register(definition) };
    }
    catch (error) {
        const alias = TOOL_ALIASES[definition.name];
        if (alias === undefined)
            throw error;
        try {
            primary = {
                name: alias,
                dispose: registry.register({ ...definition, name: alias }),
            };
        }
        catch (aliasError) {
            warn(`dsh-waycraft: tool ${JSON.stringify(definition.name)} and alias ${JSON.stringify(alias)} are already registered; skipping (${aliasError instanceof Error ? aliasError.message : String(aliasError)})`);
        }
    }
    if (primary === undefined)
        return undefined;
    const names = [primary.name];
    const disposers = [primary.dispose];
    const legacy = LEGACY_TOOL_ALIASES[definition.name];
    if (legacy !== undefined) {
        try {
            disposers.push(registry.register({
                ...definition,
                name: legacy,
                description: `Deprecated alias of ${primary.name}; use that name instead. ${definition.description}`,
                deferLoading: true,
            }));
            names.push(legacy);
        }
        catch (legacyError) {
            // An occupied deprecated name is harmless: the canonical registration already works.
            warn(`dsh-waycraft: deprecated alias ${JSON.stringify(legacy)} could not be registered; skipping (${legacyError instanceof Error ? legacyError.message : String(legacyError)})`);
        }
    }
    return {
        name: primary.name,
        names,
        dispose: () => {
            const failures = [];
            for (const dispose of [...disposers].reverse()) {
                try {
                    dispose();
                }
                catch (error) {
                    failures.push(error);
                }
            }
            if (failures.length === 1)
                throw failures[0];
            if (failures.length > 1)
                throw new AggregateError(failures, 'dsh-waycraft: several tool disposers failed');
        },
    };
}
