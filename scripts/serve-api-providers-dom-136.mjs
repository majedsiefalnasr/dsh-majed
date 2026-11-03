// Serve a separately bundled synthetic fixture, never a replacement DSH server.
// Supply the browser IIFE bundle path as argv[2]. Bundler setup is a pending gate.
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
if (!process.argv[2])
  throw new Error(
    'Supply the bundled api-providers-dom-136.tsx browser IIFE path.',
  );
const script = await readFile(process.argv[2]);
const server = createServer((request, response) => {
  if (request.url?.split('?')[0] === '/fixture.js') {
    response.setHeader('content-type', 'text/javascript');
    response.end(script);
  } else if (request.url?.split('?')[0] === '/') {
    response.setHeader('content-type', 'text/html');
    response.end(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic #136 provider fixture</title><div id="root"></div><script src="/fixture.js"></script>',
    );
  } else {
    response.writeHead(404);
    response.end();
  }
});
server.listen(0, '127.0.0.1', () =>
  console.log(
    `Synthetic fixture http://127.0.0.1:${server.address().port}/?locale=en&theme=light`,
  ),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close());
