// Adapted from V1ki/dsh-plugin-subscriptions v0.9.12 (b802311) src/client/fast-command.ts, MIT; see src/PROVENANCE.md.
/** Build the locale resolver used by the /fast command contribution. */
export function fastCommandDescription(t: () => string): () => string {
  return () => t()
}
