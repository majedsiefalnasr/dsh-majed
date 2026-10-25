// Vision/offloaded attachment normalization and complete attachment references.
//
// Attachments are bound to [provider, account, model]. Normalization never
// leaks incompatible private state across account/model changes: a reference
// captured under one account/model is not replayed as valid private state
// under another.

export const ATTACHMENT_KIND_VISION = 'vision';
export const ATTACHMENT_KIND_OFFLOADED = 'offloaded';

function requiredString(value, name) {
  if (typeof value !== 'string' || !value) throw new Error(`Invalid ${name}.`);
  return value;
}

/** Normalize one attachment into a complete, bound reference. */
export function normalizeAttachment(attachment, binding = {}) {
  if (!attachment || typeof attachment !== 'object' || Array.isArray(attachment))
    throw new Error('Invalid attachment.');
  const { id, type, mime, url, data, provider, account, model, vision, offloaded } = attachment;
  const ref = {
    id: requiredString(id, 'attachment id'),
    type: type === undefined ? 'file' : requiredString(type, 'attachment type'),
    ...(mime !== undefined ? { mime: requiredString(mime, 'attachment mime') } : {}),
    ...(url !== undefined ? { url: requiredString(url, 'attachment url') } : {}),
    ...(data !== undefined ? { data } : {}),
    ...(provider !== undefined ? { provider: requiredString(provider, 'attachment provider') } : {}),
    ...(account !== undefined ? { account: requiredString(account, 'attachment account') } : {}),
    ...(model !== undefined ? { model: requiredString(model, 'attachment model') } : {}),
    vision: Boolean(vision),
    offloaded: Boolean(offloaded),
  };
  if (binding.provider !== undefined) ref.provider = requiredString(binding.provider, 'binding provider');
  if (binding.account !== undefined) ref.account = requiredString(binding.account, 'binding account');
  if (binding.model !== undefined) ref.model = requiredString(binding.model, 'binding model');
  return Object.freeze(ref);
}

/** Complete an attachment reference: fill missing binding from context and report completeness. */
export function completeAttachmentReference(attachment, context = {}) {
  const normalized = normalizeAttachment(attachment, {
    provider: context.provider,
    account: context.account,
    model: context.model,
  });
  const complete = normalized.id !== undefined
    && (normalized.url !== undefined || normalized.data !== undefined)
    && normalized.provider !== undefined
    && normalized.account !== undefined
    && normalized.model !== undefined;
  return { ...normalized, complete };
}

export function isVisionAttachment(attachment) {
  return attachment !== null && typeof attachment === 'object' && attachment.vision === true;
}

export function isOffloadedAttachment(attachment) {
  return attachment !== null && typeof attachment === 'object' && attachment.offloaded === true;
}

export default {
  normalizeAttachment,
  completeAttachmentReference,
  isVisionAttachment,
  isOffloadedAttachment,
  ATTACHMENT_KIND_VISION,
  ATTACHMENT_KIND_OFFLOADED,
};
