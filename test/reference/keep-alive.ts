// Reference test-runner lifecycle support; see src/PROVENANCE.md.
import { after } from 'node:test';
const keepAlive = setInterval(() => undefined, 60 * 60_000);
after(() => { clearInterval(keepAlive); });
