const assert = require('node:assert/strict');
const { appendFileSync } = require('node:fs');
const { relative, basename } = require('node:path');
const { createInterface } = require('node:readline');
assert.equal(process.env.DSH_MANAGED_MCP_FIXTURE, '1');
assert.ok(!relative(process.env.HOME, process.cwd()).startsWith('..'));
if (process.argv.includes('--bad')) process.exit(1);
let initialized = false, refreshed = false;
const reply = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
const definition = name => ({ name, description: 'Controlled protocol fixture', inputSchema: { type: 'object', properties: { mode: { type: 'string' } }, additionalProperties: false } });
const input = createInterface({ input: process.stdin });
input.on('line', line => {
  const message = JSON.parse(line);
  if (message.method === 'initialize' && process.argv.includes('--hang-init')) return;
  if (process.env.MCP_JOURNAL) appendFileSync(process.env.MCP_JOURNAL, JSON.stringify({ pid: process.pid, cwd: basename(process.cwd()), method: message.method }) + '\n');
  if (message.method === 'initialize') return reply(message.id, { protocolVersion: message.params.protocolVersion, capabilities: { tools: { listChanged: true } }, serverInfo: { name: 'controlled', version: '1' } });
  if (message.method === 'notifications/initialized') { initialized = true; return; }
  if (message.method === 'tools/list') { assert.ok(initialized); return reply(message.id, { tools: [definition('echo'), ...(refreshed ? [definition('added')] : [])] }); }
  if (message.method === 'tools/call') {
    assert.ok(initialized); const mode = message.params.arguments?.mode;
    if (mode === 'hang') return;
    if (mode === 'refresh') { refreshed = true; process.stdout.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' }) + '\n'); }
    const content = mode === 'image' ? [{ type: 'image', mimeType: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=' }] : [{ type: 'text', text: mode === 'error' ? 'fixture intentional error' : mode === 'cwd' ? basename(process.cwd()) : 'fixture MCP result' }];
    reply(message.id, { content, ...(mode === 'error' ? { isError: true } : {}) });
    if (mode === 'disconnect') setTimeout(() => process.exit(0), 10);
    return;
  }
  if (message.id !== undefined) process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'Unsupported fixture method' } }) + '\n');
});
input.on('close', () => process.exit(0));
setTimeout(() => process.exit(2), 30000).unref();
