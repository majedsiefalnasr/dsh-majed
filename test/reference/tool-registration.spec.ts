// Ported from V1ki/dsh-plugin-subscriptions v0.9.12 test/tool-registration.spec.ts; see src/PROVENANCE.md.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registerWithAlias, TOOL_ALIASES } from '../../src/tools/registration.js'
import { LEGACY_TOOL_ALIASES } from '../../src/legacy-names.js'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'

function definition(name: string): ToolDefinition {
  return { name, description: name, parameters: {}, output: { schema: { type: 'string' }, render: () => [] }, execute: async () => 'ok' } as unknown as ToolDefinition
}

function registry(occupied: string[]) {
  const names = new Set(occupied)
  return {
    names,
    register(tool: ToolDefinition) {
      if (names.has(tool.name)) throw new Error(`${tool.name} already registered`)
      names.add(tool.name)
      return () => names.delete(tool.name)
    },
  }
}

test('registerWithAlias uses the canonical name when available', () => {
  const tools = registry([])
  const result = registerWithAlias(tools, definition('x_search'))
  assert.equal(result?.name, 'x_search')
  assert.deepEqual([...tools.names], ['x_search', LEGACY_TOOL_ALIASES.x_search])
})

test('registerWithAlias falls back to the plugin namespace on collision', () => {
  const tools = registry(['x_search'])
  const result = registerWithAlias(tools, definition('x_search'))
  assert.equal(result?.name, TOOL_ALIASES.x_search)
  assert.deepEqual([...tools.names].sort(), ['dsh_waycraft_x_search', LEGACY_TOOL_ALIASES.x_search, 'x_search'].sort())
})

test('registerWithAlias skips and warns when canonical and alias collide', () => {
  const tools = registry(['x_search', TOOL_ALIASES.x_search])
  const warnings: string[] = []
  const result = registerWithAlias(tools, definition('x_search'), message => warnings.push(message))
  assert.equal(result, undefined)
  assert.equal(warnings.length, 1)
  assert.match(warnings[0]!, /x_search/)
  assert.deepEqual([...tools.names].sort(), ['dsh_waycraft_x_search', 'x_search'])
})

test('dispose runs every disposer even when one throws, then rethrows', () => {
  const disposed: string[] = []
  const tools = {
    register(tool: ToolDefinition) {
      return () => {
        disposed.push(tool.name)
        if (tool.name === LEGACY_TOOL_ALIASES.x_search) throw new Error('boom')
      }
    },
  }
  const result = registerWithAlias(tools, definition('x_search'))
  assert.throws(() => result?.dispose(), /boom/)
  assert.deepEqual(disposed.sort(), ['x_search', LEGACY_TOOL_ALIASES.x_search].sort())
})

test('registerWithAlias reports a failed deprecated alias through warn and keeps the canonical tool', () => {
  const tools = registry([LEGACY_TOOL_ALIASES.x_search])
  const warnings: string[] = []
  const result = registerWithAlias(tools, definition('x_search'), (message) => warnings.push(message))
  assert.deepEqual(result?.names, ['x_search'])
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /already registered/)
})
