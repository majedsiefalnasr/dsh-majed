// Shared helpers for subscription tests.
export async function collectAsync(iterable) {
  const chunks = [];
  for await (const chunk of iterable) chunks.push(chunk);
  return chunks;
}
export function collect(iterable) {
  const chunks = [];
  for (const chunk of iterable) chunks.push(chunk);
  return chunks;
}
