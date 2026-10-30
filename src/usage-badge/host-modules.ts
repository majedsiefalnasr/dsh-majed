// Host-provided modules are resolved lazily, never at bundle load: a missing or failing host module must only
// affect the composer surface that needs it, not the core client entry that embeds this bundle (isolation).
declare const require: (id: string) => any

let primitives: any
let reactDom: any

/** `@deepseek-ai/dsh-client-ui-primitives`, resolved on first use. */
export function hostPrimitives(): any {
  return primitives ??= require('@deepseek-ai/dsh-client-ui-primitives')
}

/** `react-dom` (portals), resolved on first use. */
export function hostReactDom(): any {
  return reactDom ??= require('react-dom')
}
