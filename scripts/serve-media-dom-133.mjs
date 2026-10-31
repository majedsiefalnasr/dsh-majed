// Test-scoped synthetic-media transport. No DSH application or provider access.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const script = await readFile(new URL('../.media-dom-133/fixture.js', import.meta.url));
const server = createServer((request, response) => {
  if (request.url?.split('?')[0] === '/fixture.js') { response.setHeader('content-type', 'text/javascript'); response.end(script); }
  else if (request.url?.split('?')[0] === '/') { response.setHeader('content-type', 'text/html'); response.end('<!doctype html><meta charset="utf-8"><title>Controlled #133 media fixture</title><div id="root"></div><script src="/fixture.js"></script>'); }
  else { response.writeHead(404); response.end(); }
});
server.listen(0, '127.0.0.1', () => console.log(`Fixture http://127.0.0.1:${server.address().port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
