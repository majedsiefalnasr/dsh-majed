// Streamable HTTP MCP fixture: real HTTP server speaking MCP streamable HTTP,
// recording the wire to a journal. Uses the SDK transport's Node.js
// (IncomingMessage, ServerResponse) handleRequest overload.
import http from 'node:http';
import { appendFileSync } from 'node:fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { InitializeRequestSchema, ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
const [port, journal] = process.argv.slice(2);
const record = event => appendFileSync(journal, `${JSON.stringify({ pid: process.pid, ...event })}\n`);
record({ event: 'start', port: Number(port) });
const server = new Server({ name: 'http-test-fixture', version: '1' }, { capabilities: { tools: {} } });
server.setRequestHandler(InitializeRequestSchema, async () => ({ protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'http-test-fixture', version: '1' } }));
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [{ name: 'echo', description: 'Echo arguments over HTTP', inputSchema: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } }] }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'echo') throw new Error('Expected raw echo name');
  return { content: [{ type: 'text', text: `http:${request.params.arguments.message}` }] };
});
import { randomUUID } from 'node:crypto';
const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
server.connect(transport);
const requestListener = async (req, res) => {
  try {
    record({ event: 'request', method: req.method, url: req.url, session: req.headers['mcp-session-id'] });
    if (req.method === 'GET') { res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' }); res.end('no stream'); return; }
    await transport.handleRequest(req, res);
  } catch (error) {
    record({ event: 'error', message: String(error && error.message ? error.message : error) });
    if (!res.writableEnded) { res.writeHead(500, { 'content-type': 'text/plain' }); res.end('error'); }
  }
};
const httpServer = http.createServer(requestListener);
httpServer.listen(port, '127.0.0.1', () => record({ event: 'listening' }));
process.on('SIGTERM', () => { try { httpServer.close(); } catch {}; try { transport.close(); } catch {}; process.exit(0); });
process.on('exit', () => record({ event: 'exit' }));
