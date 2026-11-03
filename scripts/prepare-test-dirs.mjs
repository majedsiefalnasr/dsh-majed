import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Legacy fixture prefixes use these parents; mkdtemp only creates the leaf.
// Prepare them before parallel test workers instead of relying on prior runs.
export async function prepareTestDirectories(root = '/tmp') {
  await Promise.all(['majed-t129', 'majed-t130', 'majed-t134'].map(
    name => mkdir(`${root}/${name}`, { recursive: true }),
  ));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await prepareTestDirectories();
}
