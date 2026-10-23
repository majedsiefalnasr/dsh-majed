// Disposable protocol peer, not a replacement MCP client/SDK.
const assert = require('node:assert/strict');
const { createInterface } = require('node:readline');
assert.equal(process.env.DSH_MANAGEMENT_MCP_FIXTURE, '1');
assert.equal(process.cwd(), process.env.HOME);
const red = process.argv.includes('--red-result');
let initialized = false;
const reply = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
const input = createInterface({ input: process.stdin });
input.on('line', line => {
  const message = JSON.parse(line);
  if (message.method === 'initialize') return reply(message.id, {
    protocolVersion: message.params.protocolVersion,
    capabilities: { tools: {} }, serverInfo: { name: 'owned-fixture', version: '1' },
  });
  if (message.method === 'notifications/initialized') { initialized = true; return; }
  if (message.method === 'tools/list') {
    assert.ok(initialized, 'Initialization notification must precede discovery');
    return reply(message.id, { tools: [{ name: 'echo', description: 'Disposable echo',
      inputSchema: { type: 'object', properties: { mode: { type: 'string' } }, required: ['mode'], additionalProperties: false } }] });
  }
  if (message.method === 'tools/call') {
    assert.ok(initialized);
    assert.equal(message.params.name, 'echo');
    const mode = message.params.arguments.mode;
    if (mode === 'hang') return; // Client deadline/cancellation must settle this.
    return reply(message.id, { content: [{ type: 'text', text: mode === 'error' ? 'fixture intentional error' : red ? 'corrupted fixture value' : 'fixture hello' }], ...(mode === 'error' ? { isError: true } : {}) });
  }
  if (message.id !== undefined) process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'Unsupported fixture method' } }) + '\n');
});
input.on('close', () => process.exit(0));
// Independent orphan bound, including an abruptly killed parent.
setTimeout(() => process.exit(2), 15000).unref();
