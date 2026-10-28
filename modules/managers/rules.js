import { object, text, fail } from '../managers/validation.js';

const RULE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const PATTERN = /^[A-Za-z0-9_./*-]{1,128}$/;
const SCOPES = ['global', 'project', 'agent'];

// Tool rules are hook policies that deny matching tool calls by wildcard name
// and run no code. They never grant authority and never override native guards.
export function validateRule(value) {
  object(value, ['id', 'pattern', 'enabled', 'scope']);
  if (!RULE_ID.test(text(value.id, 64))) fail();
  if (!PATTERN.test(text(value.pattern, 128))) fail();
  if (typeof value.enabled !== 'boolean') fail();
  if (!SCOPES.includes(value.scope)) fail();
  return { id: value.id, pattern: value.pattern, enabled: value.enabled, scope: value.scope };
}

export function validateRules(value = []) {
  if (!Array.isArray(value) || value.length > 64) fail();
  const result = value.map(validateRule);
  if (new Set(result.map(rule => rule.id)).size !== result.length) fail();
  return result;
}

export function enabledRulePatterns(rules) {
  return rules.filter(rule => rule.enabled).map(rule => rule.pattern);
}

export const rulesConfigFields = { rules: { type: 'array', default: [], description: 'Legacy Tool Rules definitions retained for compatibility; feature disabled and not enforced.' } };
