/** Codex transport for #129. Proxy configuration UI and routing are deferred to #130.
 * Calls remain lazy; this module neither reads state nor changes a process-wide dispatcher.
 */
export const proxiedFetch: typeof fetch = (input, init) => globalThis.fetch(input, init);
