// Zero-dependency MCP fixture: stdout is exclusively newline-delimited JSON-RPC.
const { createInterface } = require('node:readline');
const { appendFileSync } = require('node:fs');
const [journal, generation] = process.argv.slice(2);
const record = event => appendFileSync(journal, `${JSON.stringify({ pid: process.pid, generation, ...event })}\n`);
record({ event: 'start' });
process.on('exit', () => record({ event: 'exit' }));
const input = createInterface({ input: process.stdin });
input.on('close', () => process.exit(0));
input.on('line', line => {
  const request = JSON.parse(line);
  record({ event: 'request', ...request });
  if (request.id === undefined) return;
  let result;
  switch (request.method) {
    case 'initialize':
      result = { protocolVersion: request.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'local-test-fixture', version: '1' } };
      break;
    case 'tools/list':
      result = { tools: [{ name: 'echo', description: 'Echo arguments from the real wire', inputSchema: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } }] };
      break;
    case 'tools/call':
      if (request.params.name !== 'echo') {
        process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: -32602, message: 'Expected raw echo name' } })}\n`);
        return;
      }
      result = { content: [{ type: 'text', text: `${generation}:${request.params.arguments.message}` }] };
      break;
    default:
      process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Unknown method' } })}\n`);
      return;
  }
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: request.id, result })}\n`);
});
