// Ported from V1ki/dsh-plugin-subscriptions v0.9.12 test/tools.spec.ts (image_generate subset); see src/PROVENANCE.md.
// Grok fallback/provider cases, x_search and video_generate belong to ticket #133 and are excluded.
import './keep-alive.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LlmError } from '@deepseek-ai/dsh-llm'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import type { FetchFn } from '../../src/providers/common.js'
import { AccountTokenManager } from '../../src/providers/accounts.js'
import type { CodexSession } from '../../src/auth/store.js'
import {
  IMAGE_EDIT_URL,
  IMAGE_GENERATE_URL,
  buildImageGenerateBody,
  createImageGenerateTool,
  parseImageGenerateResponse,
  sniffImageMediaType,
} from '../../src/tools/image-generate.js'

/** Minimal execution context: the tools read only `signal`. */
function fakeExec(): ToolRunContext {
  return { signal: new AbortController().signal } as unknown as ToolRunContext
}

function memoryTokens<S extends { accessToken: string; refreshToken: string; expiresAt: number }>(
  initial: S | undefined,
): AccountTokenManager<S> {
  let stored = initial
  return new AccountTokenManager<S>({
    provider: 'codex',
    displayName: 'Test',
    makeOptions: () => ({
      preemptMs: 0,
      refresh: session => Promise.resolve(session),
      isPermanent: () => false,
    }),
    io: {
      list: () => Promise.resolve(stored === undefined ? [] : [{ key: 'acct', session: stored }]),
      get: () => Promise.resolve(stored),
      save: (_account, session) => {
        stored = session
        return Promise.resolve()
      },
      remove: () => {
        stored = undefined
        return Promise.resolve()
      },
    },
  })
}

function jsonFetch(payload: unknown, status = 200): { fetchFn: FetchFn; lastBody: () => unknown } {
  let body: unknown
  const fetchFn: FetchFn = ((_url: string, init?: RequestInit) => {
    body = init?.body === undefined ? undefined : JSON.parse(String(init.body))
    return Promise.resolve(new Response(JSON.stringify(payload), { status }))
  }) as FetchFn
  return { fetchFn, lastBody: () => body }
}

const codexSession: CodexSession = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresAt: Date.now() + 3_600_000,
  accountId: 'acct-1',
}
test('buildImageGenerateBody: validation and pass-through', () => {
  assert.throws(() => buildImageGenerateBody({ prompt: ' ' }), /non-empty/)
  assert.deepEqual(buildImageGenerateBody({ prompt: 'a square', size: '1024x1024', quality: 'low' }), {
    prompt: 'a square',
    model: 'gpt-image-2',
    size: '1024x1024',
    quality: 'low',
  })
  assert.deepEqual(buildImageGenerateBody({ prompt: 'p' }), { prompt: 'p', model: 'gpt-image-2' })
})

test('sniffImageMediaType: png, jpeg, webp, and the png default', () => {
  assert.equal(sniffImageMediaType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png')
  assert.equal(sniffImageMediaType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg')
  assert.equal(sniffImageMediaType(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')])), 'image/webp')
  assert.equal(sniffImageMediaType(Buffer.from([1, 2, 3])), 'image/png')
})

test('parseImageGenerateResponse: b64 decode, revised prompt, empty data', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47])
  const parsed = parseImageGenerateResponse({
    data: [{ b64_json: png.toString('base64'), revised_prompt: 'better prompt' }],
  })
  assert.equal(parsed.length, 1)
  assert.deepEqual(parsed[0].data, png)
  assert.equal(parsed[0].revisedPrompt, 'better prompt')
  assert.throws(() => parseImageGenerateResponse({ data: [] }), /no image data/)
  assert.throws(() => parseImageGenerateResponse({}), /no image data/)
})

test('image_generate excludes a disabled provider and reports the session policy', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'image-policy-'))
  const urls: string[] = []
  const fetchFn = (async (url: string | URL | Request) => {
    urls.push(String(url))
    return new Response(JSON.stringify({ data: [{ b64_json: Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64') }] }))
  }) as FetchFn
  try {
    const enabled = createImageGenerateTool({ codexTokens: memoryTokens(codexSession), providerEnabled: provider => provider === 'codex', fetchFn, imagesDir: dir })
    await enabled.execute({ prompt: 'cat', provider: 'gpt' }, fakeExec())
    assert.equal(urls[0], IMAGE_GENERATE_URL)
    const disabled = createImageGenerateTool({ codexTokens: memoryTokens(codexSession), providerEnabled: () => false, fetchFn, imagesDir: dir })
    await assert.rejects(disabled.execute({ prompt: 'cat' }, fakeExec()), /disabled/)
    assert.equal(urls.length, 1)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('image_generate execute: writes files, error status, and logged-out', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'subscriptions-images-'))
  const png = Buffer.from([1, 2, 3])
  const { fetchFn, lastBody } = jsonFetch({ created: 1, data: [{ b64_json: png.toString('base64') }] })
  const tool = createImageGenerateTool({ codexTokens: memoryTokens(codexSession), fetchFn, imagesDir: dir })
  const value = await tool.execute(
    { prompt: 'a tiny red square', size: '1024x1024', quality: 'low' },
    fakeExec(),
  ) as { paths: string[] }
  assert.equal(value.paths.length, 1)
  assert.ok(value.paths[0].startsWith(dir))
  assert.deepEqual(readFileSync(value.paths[0]), png)
  assert.equal(readdirSync(dir).length, 1)
  const body = lastBody() as Record<string, unknown>
  assert.deepEqual(body, { prompt: 'a tiny red square', model: 'gpt-image-2', size: '1024x1024', quality: 'low' })

  const failing = createImageGenerateTool({
    codexTokens: memoryTokens(codexSession),
    fetchFn: jsonFetch('bad request', 400).fetchFn,
    imagesDir: dir,
  })
  await assert.rejects(
    () => failing.execute({ prompt: 'x' }, fakeExec()),
    (error: unknown) => error instanceof LlmError && error.code === 'HTTP_400',
  )

  const loggedOut = createImageGenerateTool({
    codexTokens: memoryTokens<CodexSession>(undefined),
    fetchFn,
    imagesDir: dir,
  })
  await assert.rejects(
    () => loggedOut.execute({ prompt: 'x' }, fakeExec()),
    (error: unknown) => error instanceof LlmError && error.code === 'MISSING_CREDENTIAL',
  )
})

test('image_generate presentCall', () => {
  const tool = createImageGenerateTool({ codexTokens: memoryTokens(codexSession), fetchFn: jsonFetch({}).fetchFn })
  assert.deepEqual(tool.presentCall?.({ prompt: 'a cat' }), {
    card: 'generic',
    title: 'image_generate: a cat',
  })
})

/** Fake attachment store: saveImage returns a deterministic ref. */
function fakeAttachments() {
  const saved: { name?: string }[] = []
  const store = {
    saveImage: (input: { data: Uint8Array; mediaType: string; name?: string }) => {
      saved.push({ ...input.name === undefined ? {} : { name: input.name } })
      return Promise.resolve({
        attachmentId: 'att-1',
        mediaType: 'image/png',
        bytes: input.data.length,
        width: 2,
        height: 3,
        ...input.name === undefined ? {} : { name: input.name },
      })
    },
  }
  return { store, saved }
}

/** Fake exec carrying an agent routed at the given provider/model. */
function routedExec(provider: string, model: string, extra: Record<string, unknown> = {}): ToolRunContext {
  return {
    signal: new AbortController().signal,
    agent: {
      session: { requestHeader: () => ({ config: { provider, model } }) },
      options: { provider, model },
    },
    ...extra,
  } as unknown as ToolRunContext
}

/** Fake llm service whose resolveModelInfo reports the given modalities. */
function fakeLlm(inputModalities: string[] | undefined) {
  return {
    resolveModelInfo: () => Promise.resolve({
      provider: 'codex',
      id: 'm',
      name: 'm',
      ...inputModalities === undefined ? {} : { inputModalities },
    }),
  }
}

const PNG_BYTES = Buffer.from([1, 2, 3])

test('image_generate: image-capable route commits attachments and returns image refs', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'router-images-'))
  const { store, saved } = fakeAttachments()
  const { fetchFn } = jsonFetch({ created: 1, data: [{ b64_json: PNG_BYTES.toString('base64') }] })
  const tool = createImageGenerateTool({
    codexTokens: memoryTokens(codexSession),
    fetchFn,
    imagesDir: dir,
    resolveAttachments: () => store as never,
    resolveLlm: () => fakeLlm(['text', 'image']) as never,
  })
  const value = await tool.execute(
    { prompt: 'a square' },
    routedExec('codex', 'gpt-5.6-sol'),
  ) as { paths: string[]; images?: { attachmentId: string; mediaType: string }[] }
  assert.equal(saved.length, 1)
  assert.equal(value.images?.length, 1)
  assert.equal(value.images?.[0].attachmentId, 'att-1')
  assert.equal(value.images?.[0].mediaType, 'image/png')
})

test('image_generate: text-only route degrades to text without saving attachments', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'router-images-'))
  const { store, saved } = fakeAttachments()
  const { fetchFn } = jsonFetch({ created: 1, data: [{ b64_json: PNG_BYTES.toString('base64') }] })
  const tool = createImageGenerateTool({
    codexTokens: memoryTokens(codexSession),
    fetchFn,
    imagesDir: dir,
    resolveAttachments: () => store as never,
    resolveLlm: () => fakeLlm(['text']) as never,
  })
  const value = await tool.execute(
    { prompt: 'a square' },
    routedExec('codex', 'gpt-text-only'),
  ) as { paths: string[]; images?: unknown[] }
  assert.equal(value.paths.length, 1, 'files are still written')
  assert.equal(value.images, undefined)
  assert.equal(saved.length, 0, 'no attachment commit on a text-only route')

  // No llm service at all → same text-only degradation (non-throwing).
  const noLlm = createImageGenerateTool({
    codexTokens: memoryTokens(codexSession),
    fetchFn,
    imagesDir: dir,
    resolveAttachments: () => store as never,
    resolveLlm: () => undefined,
  })
  const degraded = await noLlm.execute({ prompt: 'a square' }, routedExec('codex', 'gpt-5.6-sol')) as { images?: unknown[] }
  assert.equal(degraded.images, undefined)
})

test('image_generate render: image blocks when value.images present, text-only otherwise', () => {
  const tool = createImageGenerateTool({ codexTokens: memoryTokens(codexSession), fetchFn: jsonFetch({}).fetchFn })
  const withImages = tool.output.render({ prompt: 'p' }, {
    paths: ['/tmp/a.png'],
    images: [{ attachmentId: 'att-1', mediaType: 'image/png', bytes: 3, width: 2, height: 3, name: 'a.png' }],
  } as never)
  assert.equal(withImages.length, 2)
  assert.equal(withImages[0].type, 'text')
  assert.deepEqual(withImages[1], {
    type: 'image',
    attachment: { attachmentId: 'att-1', mediaType: 'image/png', bytes: 3, width: 2, height: 3, name: 'a.png' },
  })
  const textOnly = tool.output.render({ prompt: 'p' }, { paths: ['/tmp/a.png'] } as never)
  assert.equal(textOnly.length, 1)
  assert.equal(textOnly[0].type, 'text')
})

/** Fetch stub answering a fixed sequence of responses, recording every request. */
function sequenceFetch(responses: Response[]): {
  fetchFn: FetchFn
  requests: { url: string; method: string; body?: unknown }[]
} {
  const requests: { url: string; method: string; body?: unknown }[] = []
  const queue = [...responses]
  const fetchFn: FetchFn = ((url: string, init?: RequestInit) => {
    requests.push({
      url: String(url),
      method: init?.method ?? 'GET',
      ...init?.body === undefined ? {} : { body: JSON.parse(String(init.body)) },
    })
    const next = queue.shift()
    if (next === undefined) throw new Error('sequenceFetch: no responses left')
    return Promise.resolve(next)
  }) as FetchFn
  return { fetchFn, requests }
}

test('image_generate: nested dispatch defers no context (code mode injects image results itself)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'router-images-'))
  const { store } = fakeAttachments()
  const { fetchFn } = jsonFetch({ created: 1, data: [{ b64_json: PNG_BYTES.toString('base64') }] })
  const tool = createImageGenerateTool({
    codexTokens: memoryTokens(codexSession),
    fetchFn,
    imagesDir: dir,
    resolveAttachments: () => store as never,
    resolveLlm: () => fakeLlm(['text', 'image']) as never,
  })
  const deferred: { content: { type: string }[] }[] = []
  const exec = routedExec('codex', 'gpt-5.6-sol', {
    parent: Symbol('parent'),
    deferContext: (message: { content: { type: string }[] }) => deferred.push(message),
  })
  const value = await tool.execute({ prompt: 'a square' }, exec) as { images?: unknown[] }
  // The render output carries the image block; the harness's code mode defers
  // image-bearing sub-results itself, so the tool must not defer a duplicate.
  assert.equal((value.images ?? []).length, 1)
  assert.equal(deferred.length, 0)
})

/** Editing uses stored bytes, preserving source order and the canonical output contract. */
function editFixture() {
  const ref = { attachmentId: `sha256:${'a'.repeat(64)}`, mediaType: 'image/png' as const, bytes: 3, width: 1, height: 1 }
  const reads: string[] = []
  const store = {
    imageLimits: { maxImagesPerMessage: 5, maxImageBytes: 100, maxMessageImageBytes: 500 },
    readImage: async (input: typeof ref, signal: AbortSignal) => {
      signal.throwIfAborted()
      reads.push(input.attachmentId)
      if (input.bytes !== 3) throw new Error('metadata mismatch')
      return { ref: input, data: Buffer.from(input.attachmentId.includes('bbb') ? 'two' : 'one') }
    },
    saveImage: async () => ref,
  }
  return { ref, reads, store }
}

for (const count of [1, 5]) {
  test(`image editing: ${count} ordered references and reusable output`, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'subscriptions-edit-'))
    try {
      const { ref, reads, store } = editFixture()
      const references = Array.from({ length: count }, (_, i) => ({ ...ref, attachmentId: `sha256:${String.fromCharCode(97 + i).repeat(64)}`, originalDimensions: { width: 2, height: 2 } }))
      const wire = sequenceFetch(Array.from({ length: 2 }, () => new Response(JSON.stringify({ data: [{ b64_json: 'b25l' }] }))))
      const tool = createImageGenerateTool({ codexTokens: memoryTokens(codexSession),
        fetchFn: wire.fetchFn, imagesDir: dir, resolveAttachments: () => store as never,
        resolveLlm: () => fakeLlm(['text', 'image']) as never })
      const value = await tool.execute({ prompt: 'change background', provider: 'gpt', referenceImages: references }, routedExec('codex', 'm')) as { paths: string[]; images: typeof ref[] }
      assert.equal(wire.requests[0].url, IMAGE_EDIT_URL)
      const body = wire.requests[0].body as Record<string, unknown>
      const urls = references.map((_, i) => `data:image/png;base64,${Buffer.from(i === 1 ? 'two' : 'one').toString('base64')}`)
      assert.deepEqual(body.images, urls.map(image_url => ({ image_url })))
      assert.equal(body.referenceImages, undefined)
      assert.deepEqual(reads, references.map(r => r.attachmentId))
      assert.equal(readFileSync(value.paths[0], 'utf8'), 'one')
      const rendered = tool.output.render({ prompt: 'change background' }, value as never)
      assert.match((rendered[0] as { text: string }).text, /Image references/)
      // Same structured reference is usable immediately inside a nested Code Mode call.
      await tool.execute({ prompt: 'make it brighter', provider: 'gpt', referenceImages: value.images }, routedExec('codex', 'm', { parent: Symbol('code') }))
      assert.equal(wire.requests.length, 2)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
}

test('image editing: invalid references, missing store, limits, cancellation never generate', async () => {
  const { ref, store } = editFixture()
  let requests = 0
  const fetchFn = (async () => { requests++; throw new Error('must not fetch') }) as FetchFn
  const options = { codexTokens: memoryTokens(codexSession), fetchFn, resolveAttachments: () => store as never }
  const tool = createImageGenerateTool(options)
  for (const references of [[], Array(6).fill(ref), [ref, ref], [{ ...ref, attachmentId: '/tmp/a.png' }], [{ ...ref, width: 0 }], [{ ...ref, bytes: 4 }]]) {
    await assert.rejects(() => tool.execute({ prompt: 'edit', referenceImages: references }, fakeExec()))
  }
  await assert.rejects(() => createImageGenerateTool({ ...options, resolveAttachments: () => undefined }).execute({ prompt: 'edit', referenceImages: [ref] }, fakeExec()), /attachment service/)
  store.imageLimits.maxMessageImageBytes = 2
  await assert.rejects(() => tool.execute({ prompt: 'edit', referenceImages: [ref] }, fakeExec()), /limits/)
  const exec = { ...fakeExec(), signal: AbortSignal.abort() }
  await assert.rejects(() => tool.execute({ prompt: 'edit', referenceImages: [ref] }, exec))
  assert.equal(requests, 0)
})

test('image editing: a disabled provider never edits; upstream errors do not retry', async () => {
  const { ref, store } = editFixture()
  const wire = sequenceFetch([new Response('bad edit', { status: 400 })])
  const options = { codexTokens: memoryTokens(codexSession), fetchFn: wire.fetchFn, resolveAttachments: () => store as never }
  await assert.rejects(() => createImageGenerateTool({ ...options, providerEnabled: () => false }).execute({ prompt: 'edit', provider: 'gpt', referenceImages: [ref] }, fakeExec()), /disabled/)
  assert.equal(wire.requests.length, 0)
  await assert.rejects(() => createImageGenerateTool(options).execute({ prompt: 'edit', provider: 'gpt', referenceImages: [ref] }, fakeExec()), /400/)
  assert.equal(wire.requests.length, 1)
  assert.equal(wire.requests[0].url, IMAGE_EDIT_URL)
})
