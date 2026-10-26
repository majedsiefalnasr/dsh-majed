// Late-bound public host exports. Disabled startup imports no native LLM package.
export let LlmAdapter, LlmError, attributionHeaders, ReasoningEffortId, resolveRetryPolicy;
export let CONTEXT_WINDOW_EXCEEDED_CODE, EMPTY_RESPONSE_CODE, QUOTA_EXCEEDED_CODE;
export let isContextWindowExceededError, isQuotaExceededError, CallId, ToolCallId, offloadedImageText;

export function bindHostLlm(namespace) {
  const functions = ['LlmAdapter', 'LlmError', 'attributionHeaders', 'ReasoningEffortId', 'resolveRetryPolicy', 'isContextWindowExceededError', 'isQuotaExceededError'];
  if (!namespace || functions.some(name => typeof namespace[name] !== 'function') || typeof (namespace.ToolCallId || namespace.CallId) !== 'function') throw Object.assign(new Error('runtime_unavailable'), { code: 'runtime_unavailable' });
  ({ LlmAdapter, LlmError, attributionHeaders, ReasoningEffortId, resolveRetryPolicy,
    CONTEXT_WINDOW_EXCEEDED_CODE, EMPTY_RESPONSE_CODE, QUOTA_EXCEEDED_CODE,
    isContextWindowExceededError, isQuotaExceededError, CallId, ToolCallId, offloadedImageText } = namespace);
}
