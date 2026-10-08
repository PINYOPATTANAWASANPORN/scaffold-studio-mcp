import type { CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';
import { serializeBigInt } from '../utils/serialization.js';

interface ExecutableTool {
  name: string;
  execute: (arguments_: Record<string, unknown>) => unknown | Promise<unknown>;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function suggestion(value: unknown): string | undefined {
  return record(value) && typeof value.suggestion === 'string'
    ? value.suggestion
    : undefined;
}

function failure(tool: string, error: string, advice?: string): CallToolResult {
  const recovery = advice?.trim()
    ? advice
    : 'Check the tool arguments and consult the server stderr diagnostics for details.';
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ success: false, tool, error, suggestion: recovery }, null, 2),
    }],
    isError: true,
  };
}

/** Keep diagnostic causes off the MCP wire. console.error writes only to stderr. */
function logFailure(tool: string, cause: unknown): void {
  console.error(`[call_tool:${JSON.stringify(tool)}]`, cause instanceof Error ? cause.stack || cause.message : cause);
}

/** Shared by the production stdio server and transport-level regression tests. */
export function createCallToolHandler(tools: readonly ExecutableTool[]) {
  return async (request: CallToolRequest): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;
    const tool = tools.find(candidate => candidate.name === name);
    // Preserve the existing protocol-error path for an unknown tool.
    if (!tool) throw new Error(`Tool not found: ${name}`);

    try {
      const result = await tool.execute(args || {});
      if (record(result) && result.success === false) {
        // Services already expose their public error/suggestion. Do not serialize
        // arbitrary failure fields (which could include a private stack/cause).
        const message = typeof result.error === 'string' && result.error.length > 0
          ? result.error
          : 'Tool execution failed';
        // A service that discarded its original exception cannot supply its stack.
        // Log the retained cause if available; otherwise label the returned failure.
        if (result.cause instanceof Error) logFailure(name, result.cause);
        else console.error(`[call_tool:${JSON.stringify(name)}] Returned failure:`, message);
        return failure(name, message, suggestion(result));
      }

      // Preserve the existing successful result and BigInt wire representation.
      return { content: [{ type: 'text', text: JSON.stringify(serializeBigInt(result), null, 2) }] };
    } catch (cause: unknown) {
      logFailure(name, cause);
      // SDK exceptions may contain URLs, tokens or request internals. Validation
      // failures remain actionable; diagnostic exceptions stay in stderr only.
      const message = cause instanceof ZodError ? cause.message : 'Tool execution failed';
      return failure(name, message, suggestion(cause));
    }
  };
}
