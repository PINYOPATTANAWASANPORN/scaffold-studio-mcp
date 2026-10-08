import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createCallToolHandler } from '../.test-build/core/call-tool-handler.js';

const request = (name = 'token_deploy', args) => ({ method: 'tools/call', params: { name, ...(args === undefined ? {} : { arguments: args }) } });
const invoke = execute => createCallToolHandler([{ name: 'token_deploy', execute }])(request());
const payload = response => JSON.parse(response.content[0].text);
const fallbackSuggestion = 'Check the tool arguments and consult the server stderr diagnostics for details.';

test('returned failures carry the tool, suggestion and MCP error flag', async () => {
  const result = await invoke(() => ({ success: false, error: 'Invalid contract', suggestion: 'Check the contract ID' }));
  assert.equal(result.isError, true);
  assert.deepEqual(payload(result), { success: false, tool: 'token_deploy', error: 'Invalid contract', suggestion: 'Check the contract ID' });
});

test('returned failure does not serialize diagnostic stack, cause or unrelated data', async () => {
  const result = await invoke(() => ({ success: false, error: 'Cannot execute', stack: 'PRIVATE_STACK', cause: new Error('PRIVATE_CAUSE'), data: { secret: 'PRIVATE_DATA' } }));
  assert.deepEqual(payload(result), { success: false, tool: 'token_deploy', error: 'Cannot execute', suggestion: fallbackSuggestion });
});

test('thrown SDK error is generic on the wire and preserves explicit suggestion', async () => {
  const error = Object.assign(new Error('SDK request contains SECRET'), { suggestion: 'Try a different network' });
  const result = await invoke(() => { throw error; });
  assert.equal(result.isError, true);
  assert.deepEqual(payload(result), { success: false, tool: 'token_deploy', error: 'Tool execution failed', suggestion: 'Try a different network' });
});

test('Zod validation failures retain actionable diagnostics', async () => {
  const result = await invoke(() => z.object({ amount: z.number().positive() }).parse({ amount: -1 }));
  assert.equal(result.isError, true);
  assert.match(payload(result).error, /amount/);
  assert.match(payload(result).error, /greater than 0/);
});

for (const [label, cause] of [['null', null], ['undefined', undefined], ['string', 'PRIVATE_STRING'], ['number', 42]]) {
  test(`throwing ${label} is handled without a second exception`, async () => {
    const result = await invoke(() => { throw cause; });
    assert.equal(result.isError, true);
    assert.deepEqual(payload(result), { success: false, tool: 'token_deploy', error: 'Tool execution failed', suggestion: fallbackSuggestion });
  });
}

test('empty returned error and invalid suggestion get actionable fallbacks', async () => {
  assert.deepEqual(payload(await invoke(() => ({ success: false, error: '', suggestion: { private: 'hidden' } }))), {
    success: false, tool: 'token_deploy', error: 'Tool execution failed', suggestion: fallbackSuggestion,
  });
});

test('blank returned suggestions get a fallback while supplied advice is preserved', async () => {
  for (const suggestion of ['', '  \n\t']) {
    assert.equal(payload(await invoke(() => ({ success: false, error: 'Failed', suggestion }))).suggestion, fallbackSuggestion);
  }
  assert.equal(payload(await invoke(() => ({ success: false, error: 'Failed', suggestion: '  Keep this advice  ' }))).suggestion, '  Keep this advice  ');
});

test('successful nested BigInt output retains the established wire contract', async () => {
  const result = await invoke(() => ({ success: true, data: { amount: 123n, nested: [4n, null] }, suggestion: 'Done' }));
  assert.equal(result.isError, undefined);
  assert.deepEqual(payload(result), { success: true, data: { amount: '123', nested: ['4', null] }, suggestion: 'Done' });
});

test('arguments and omitted arguments reach the selected tool unchanged', async () => {
  const args = { value: '7' };
  const seen = [];
  const handler = createCallToolHandler([{ name: 'token_deploy', execute: arg => { seen.push(arg); return { success: true }; } }]);
  await handler(request('token_deploy', args));
  await handler(request());
  assert.equal(seen[0], args);
  assert.deepEqual(seen[1], {});
});

test('unknown tool still rejects outside the execution error handler', async () => {
  await assert.rejects(createCallToolHandler([])(request('missing')), /Tool not found: missing/);
});

test('full thrown stack goes to stderr, never to stdout or MCP content', () => {
  const script = `
    import { createCallToolHandler } from './.test-build/core/call-tool-handler.js';
    const error = new Error('PRIVATE_DIAGNOSTIC');
    error.stack = 'Error: PRIVATE_DIAGNOSTIC\\n    at retainedStackFrame (internal.ts:123:4)';
    const handler = createCallToolHandler([{name:'nft_deploy',execute(){throw error;}}]);
    const response = await handler({method:'tools/call',params:{name:'nft_deploy'}});
    process.stdout.write(JSON.stringify(response));
  `;
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', cwd: new URL('../', import.meta.url) });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stderr, /call_tool:"nft_deploy"/);
  assert.match(child.stderr, /retainedStackFrame \(internal.ts:123:4\)/);
  assert.doesNotMatch(child.stdout, /PRIVATE_DIAGNOSTIC|retainedStackFrame/);
  assert.equal(payload(JSON.parse(child.stdout)).tool, 'nft_deploy');
});

test('actual MCP client receives error flags and successful BigInt results', async () => {
  const server = new Server({ name: 'handler-regression-server', version: '1' }, { capabilities: { tools: {} } });
  const client = new Client({ name: 'handler-regression-client', version: '1' });
  server.setRequestHandler(CallToolRequestSchema, createCallToolHandler([
    { name: 'failed', execute: () => ({ success: false, error: 'Invalid contract', suggestion: 'Check contract ID' }) },
    { name: 'succeeded', execute: () => ({ success: true, data: 99n }) },
    { name: 'throws', execute: () => { throw new Error('PRIVATE_SDK_DIAGNOSTIC'); } },
  ]));
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  try {
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const failed = await client.callTool({ name: 'failed' });
    assert.equal(failed.isError, true);
    assert.deepEqual(payload(failed), { success: false, tool: 'failed', error: 'Invalid contract', suggestion: 'Check contract ID' });
    const succeeded = await client.callTool({ name: 'succeeded' });
    assert.equal(succeeded.isError, undefined);
    assert.deepEqual(payload(succeeded), { success: true, data: '99' });
    const thrown = await client.callTool({ name: 'throws' });
    assert.equal(thrown.isError, true);
    assert.deepEqual(payload(thrown), { success: false, tool: 'throws', error: 'Tool execution failed', suggestion: fallbackSuggestion });
    assert.doesNotMatch(JSON.stringify(thrown), /PRIVATE_SDK_DIAGNOSTIC/);
    await assert.rejects(client.callTool({ name: 'missing' }), /Tool not found: missing/);
  } finally {
    await client.close();
    await server.close();
  }
});
