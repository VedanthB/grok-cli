# grok-cli Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a zero-dependency CLI that wraps the xAI Grok API for one-shot chat, web/X search, image generation, vision, and embeddings.

**Architecture:** Stitch-CLI mirror pattern. Single `bin/grok.js` entrypoint with subcommands, lib modules per feature. Built-in `fetch()` for HTTP + SSE streaming. Node's built-in test runner for TDD.

**Tech Stack:** Node.js 18+, zero runtime deps, built-in fetch + test runner.

---

### Task 1: Project scaffold and package.json

**Files:**
- Create: `package.json`
- Create: `bin/grok.js`
- Create: `lib/` (directory)
- Create: `test/` (directory)

**Step 1: Initialize package.json**

```json
{
  "name": "grok-terminal",
  "version": "1.0.0",
  "description": "AI from your terminal — xAI Grok API CLI",
  "type": "module",
  "bin": {
    "grok": "bin/grok.js"
  },
  "scripts": {
    "test": "node --test test/*.test.js"
  },
  "engines": {
    "node": ">=18"
  },
  "keywords": ["grok", "xai", "ai", "cli", "chat", "search", "image"],
  "license": "MIT",
  "author": "Vedanth Bora",
  "repository": {
    "type": "git",
    "url": "https://github.com/VedanthB/grok-cli"
  }
}
```

**Step 2: Create minimal bin/grok.js**

```js
#!/usr/bin/env node

console.log('grok-cli v1.0.0')
```

**Step 3: Create directories**

```bash
mkdir -p lib test
```

**Step 4: Initialize git and commit**

```bash
git init
echo "node_modules/" > .gitignore
git add package.json bin/grok.js .gitignore
git commit -m "feat: project scaffold"
```

---

### Task 2: Auth module (TDD)

**Files:**
- Create: `test/auth.test.js`
- Create: `lib/auth.js`

**Step 1: Write failing tests**

```js
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// Override config dir for tests
const TEST_DIR = join(tmpdir(), 'grok-cli-test-' + Date.now())

describe('auth', () => {
  beforeEach(() => { mkdirSync(TEST_DIR, { recursive: true }) })
  afterEach(() => { rmSync(TEST_DIR, { recursive: true, force: true }) })

  it('getApiKey returns --api-key flag first', async () => {
    const { getApiKey } = await import('../lib/auth.js')
    const key = getApiKey({ apiKey: 'flag-key' }, TEST_DIR)
    assert.equal(key, 'flag-key')
  })

  it('getApiKey returns XAI_API_KEY env second', async () => {
    const { getApiKey } = await import('../lib/auth.js')
    process.env.XAI_API_KEY = 'env-key'
    const key = getApiKey({}, TEST_DIR)
    assert.equal(key, 'env-key')
    delete process.env.XAI_API_KEY
  })

  it('getApiKey reads config file third', async () => {
    const { getApiKey } = await import('../lib/auth.js')
    delete process.env.XAI_API_KEY
    writeFileSync(join(TEST_DIR, 'config.json'), JSON.stringify({ apiKey: 'file-key' }))
    const key = getApiKey({}, TEST_DIR)
    assert.equal(key, 'file-key')
  })

  it('getApiKey throws when no key found', async () => {
    const { getApiKey } = await import('../lib/auth.js')
    delete process.env.XAI_API_KEY
    assert.throws(() => getApiKey({}, TEST_DIR), /API key/)
  })

  it('saveApiKey writes config file', async () => {
    const { saveApiKey } = await import('../lib/auth.js')
    saveApiKey('saved-key', TEST_DIR)
    const config = JSON.parse(readFileSync(join(TEST_DIR, 'config.json'), 'utf8'))
    assert.equal(config.apiKey, 'saved-key')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `node --test test/auth.test.js`
Expected: FAIL — cannot import `../lib/auth.js`

**Step 3: Implement auth.js**

```js
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const DEFAULT_CONFIG_DIR = join(homedir(), '.config', 'grok')

export function getApiKey(options = {}, configDir = DEFAULT_CONFIG_DIR) {
  if (options.apiKey) return options.apiKey
  if (process.env.XAI_API_KEY) return process.env.XAI_API_KEY

  const configPath = join(configDir, 'config.json')
  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, 'utf8'))
    if (config.apiKey) return config.apiKey
  }

  throw new Error('API key not found. Set XAI_API_KEY env var, use --api-key flag, or run "grok auth set <key>".')
}

export function saveApiKey(key, configDir = DEFAULT_CONFIG_DIR) {
  mkdirSync(configDir, { recursive: true })
  const configPath = join(configDir, 'config.json')
  const config = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {}
  config.apiKey = key
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')
}
```

**Step 4: Run tests to verify they pass**

Run: `node --test test/auth.test.js`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add lib/auth.js test/auth.test.js
git commit -m "feat: auth module with key priority chain"
```

---

### Task 3: HTTP client module (TDD)

**Files:**
- Create: `test/client.test.js`
- Create: `lib/client.js`

**Step 1: Write failing tests**

```js
import { describe, it, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

describe('client', () => {
  it('post sends correct headers and body', async () => {
    const mockFetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ result: 'ok' })
    }))

    const { createClient } = await import('../lib/client.js')
    const client = createClient('test-key', mockFetch)
    const result = await client.post('/chat/completions', { model: 'grok-3-mini' })

    assert.equal(mockFetch.mock.calls.length, 1)
    const [url, opts] = mockFetch.mock.calls[0].arguments
    assert.equal(url, 'https://api.x.ai/v1/chat/completions')
    assert.equal(opts.headers['Authorization'], 'Bearer test-key')
    assert.equal(opts.headers['Content-Type'], 'application/json')
    assert.deepEqual(result, { result: 'ok' })
  })

  it('post throws on HTTP error', async () => {
    const mockFetch = mock.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } })
    }))

    const { createClient } = await import('../lib/client.js')
    const client = createClient('bad-key', mockFetch)
    await assert.rejects(
      () => client.post('/chat/completions', {}),
      { message: /Invalid API key/ }
    )
  })

  it('stream returns async iterable of SSE chunks', async () => {
    const sseData = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: [DONE]\n\n'
    ].join('')

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseData))
        controller.close()
      }
    })

    const mockFetch = mock.fn(async () => ({
      ok: true,
      body: stream
    }))

    const { createClient } = await import('../lib/client.js')
    const client = createClient('test-key', mockFetch)
    const chunks = []
    for await (const chunk of client.stream('/chat/completions', {})) {
      chunks.push(chunk)
    }

    assert.equal(chunks.length, 2)
    assert.equal(chunks[0].choices[0].delta.content, 'Hello')
    assert.equal(chunks[1].choices[0].delta.content, ' world')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `node --test test/client.test.js`
Expected: FAIL

**Step 3: Implement client.js**

```js
const BASE_URL = 'https://api.x.ai/v1'

export function createClient(apiKey, fetchFn = globalThis.fetch) {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }

  async function post(path, body) {
    const response = await fetchFn(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `HTTP ${response.status}`)
    }
    return response.json()
  }

  async function get(path) {
    const response = await fetchFn(`${BASE_URL}${path}`, { headers })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `HTTP ${response.status}`)
    }
    return response.json()
  }

  async function* stream(path, body) {
    const response = await fetchFn(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, stream: true })
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `HTTP ${response.status}`)
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          yield JSON.parse(line.slice(6))
        }
      }
    }
  }

  return { post, get, stream }
}
```

**Step 4: Run tests to verify they pass**

Run: `node --test test/client.test.js`
Expected: All 3 tests PASS

**Step 5: Commit**

```bash
git add lib/client.js test/client.test.js
git commit -m "feat: HTTP client with fetch, error handling, and SSE streaming"
```

---

### Task 4: Chat module (TDD)

**Files:**
- Create: `test/chat.test.js`
- Create: `lib/chat.js`

**Step 1: Write failing tests**

```js
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('chat', () => {
  it('sends basic chat request', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: 'Hello!' } }]
      }))
    }

    const { chat } = await import('../lib/chat.js')
    const result = await chat(mockClient, 'Hi', { model: 'grok-3-mini' })

    assert.equal(result.choices[0].message.content, 'Hello!')
    const body = JSON.parse(JSON.stringify(mockClient.post.mock.calls[0].arguments[1]))
    assert.equal(body.model, 'grok-3-mini')
    assert.equal(body.messages[0].role, 'user')
    assert.equal(body.messages[0].content, 'Hi')
  })

  it('prepends stdin content to user message', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: 'Reviewed.' } }]
      }))
    }

    const { chat } = await import('../lib/chat.js')
    await chat(mockClient, 'review this', { model: 'grok-3-mini', stdin: 'function add(a,b) { return a+b }' })

    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.ok(body.messages[0].content.includes('function add'))
    assert.ok(body.messages[0].content.includes('review this'))
  })

  it('includes web_search tool when --search flag set', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: 'Search result.' } }]
      }))
    }

    const { chat } = await import('../lib/chat.js')
    await chat(mockClient, 'latest AI news', { model: 'grok-3-mini', search: true })

    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.ok(body.tools.some(t => t.type === 'web_search'))
  })

  it('includes x_search tool when --xsearch flag set', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: 'Tweet result.' } }]
      }))
    }

    const { chat } = await import('../lib/chat.js')
    await chat(mockClient, 'trending on X', { model: 'grok-3-mini', xsearch: true })

    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.ok(body.tools.some(t => t.type === 'x_search'))
  })

  it('passes temperature and max_tokens', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: 'Ok.' } }]
      }))
    }

    const { chat } = await import('../lib/chat.js')
    await chat(mockClient, 'test', { model: 'grok-3-mini', temperature: 0.5, maxTokens: 100 })

    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.equal(body.temperature, 0.5)
    assert.equal(body.max_tokens, 100)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `node --test test/chat.test.js`
Expected: FAIL

**Step 3: Implement chat.js**

```js
const DEFAULT_MODEL = 'grok-3-mini'

export async function chat(client, prompt, options = {}) {
  const model = options.model || DEFAULT_MODEL
  const messages = []

  let userContent = prompt
  if (options.stdin) {
    userContent = `${options.stdin}\n\n${prompt}`
  }
  messages.push({ role: 'user', content: userContent })

  const body = { model, messages }

  if (options.temperature !== undefined) body.temperature = options.temperature
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens

  const tools = []
  if (options.search) tools.push({ type: 'web_search' })
  if (options.xsearch) tools.push({ type: 'x_search' })
  if (tools.length > 0) body.tools = tools

  return client.post('/chat/completions', body)
}

export async function* chatStream(client, prompt, options = {}) {
  const model = options.model || DEFAULT_MODEL
  const messages = []

  let userContent = prompt
  if (options.stdin) {
    userContent = `${options.stdin}\n\n${prompt}`
  }
  messages.push({ role: 'user', content: userContent })

  const body = { model, messages }

  if (options.temperature !== undefined) body.temperature = options.temperature
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens

  const tools = []
  if (options.search) tools.push({ type: 'web_search' })
  if (options.xsearch) tools.push({ type: 'x_search' })
  if (tools.length > 0) body.tools = tools

  yield* client.stream('/chat/completions', body)
}
```

**Step 4: Run tests to verify they pass**

Run: `node --test test/chat.test.js`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add lib/chat.js test/chat.test.js
git commit -m "feat: chat module with stdin piping and search tools"
```

---

### Task 5: Search module (TDD)

**Files:**
- Create: `test/search.test.js`
- Create: `lib/search.js`

**Step 1: Write failing tests**

```js
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('search', () => {
  it('webSearch sends chat with web_search tool forced', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: 'Web result.' } }]
      }))
    }

    const { webSearch } = await import('../lib/search.js')
    await webSearch(mockClient, 'latest AI news', { model: 'grok-3-mini' })

    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.ok(body.tools.some(t => t.type === 'web_search'))
  })

  it('xSearch sends chat with x_search tool forced', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: 'X result.' } }]
      }))
    }

    const { xSearch } = await import('../lib/search.js')
    await xSearch(mockClient, 'trending on X', { model: 'grok-3-mini' })

    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.ok(body.tools.some(t => t.type === 'x_search'))
  })
})
```

**Step 2: Run test, verify fail, implement**

```js
// lib/search.js
import { chat } from './chat.js'

export async function webSearch(client, query, options = {}) {
  return chat(client, query, { ...options, search: true })
}

export async function xSearch(client, query, options = {}) {
  return chat(client, query, { ...options, xsearch: true })
}
```

**Step 3: Run tests, verify pass, commit**

```bash
git add lib/search.js test/search.test.js
git commit -m "feat: search module (web + X search)"
```

---

### Task 6: Image generation module (TDD)

**Files:**
- Create: `test/image.test.js`
- Create: `lib/image.js`

**Step 1: Write failing tests**

```js
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('image', () => {
  it('generates image with default model', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        data: [{ b64_json: 'base64data' }]
      }))
    }

    const { generateImage } = await import('../lib/image.js')
    const result = await generateImage(mockClient, 'a cat')

    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.equal(body.model, 'grok-imagine-image')
    assert.equal(body.prompt, 'a cat')
    assert.equal(body.response_format, 'b64_json')
    assert.equal(result.data[0].b64_json, 'base64data')
  })

  it('uses pro model when --pro flag set', async () => {
    const mockClient = {
      post: mock.fn(async () => ({ data: [{ b64_json: 'data' }] }))
    }

    const { generateImage } = await import('../lib/image.js')
    await generateImage(mockClient, 'a cat', { pro: true })

    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.equal(body.model, 'grok-imagine-image-pro')
  })
})
```

**Step 2: Implement**

```js
// lib/image.js
export async function generateImage(client, prompt, options = {}) {
  const model = options.pro ? 'grok-imagine-image-pro' : 'grok-imagine-image'

  return client.post('/images/generations', {
    model,
    prompt,
    n: 1,
    response_format: 'b64_json'
  })
}
```

**Step 3: Run tests, verify pass, commit**

```bash
git add lib/image.js test/image.test.js
git commit -m "feat: image generation module"
```

---

### Task 7: Vision module (TDD)

**Files:**
- Create: `test/vision.test.js`
- Create: `lib/vision.js`

**Step 1: Write failing tests**

```js
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('vision', () => {
  it('sends URL-based image for analysis', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: 'A cat.' } }]
      }))
    }

    const { analyzeImage } = await import('../lib/vision.js')
    await analyzeImage(mockClient, 'https://example.com/cat.jpg', 'describe', { model: 'grok-4-1-fast-non-reasoning' })

    const body = mockClient.post.mock.calls[0].arguments[1]
    const content = body.messages[0].content
    assert.equal(content[0].type, 'text')
    assert.equal(content[0].text, 'describe')
    assert.equal(content[1].type, 'image_url')
    assert.equal(content[1].image_url.url, 'https://example.com/cat.jpg')
  })

  it('encodes local file as base64', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: 'An image.' } }]
      }))
    }

    const { analyzeImage } = await import('../lib/vision.js')
    // Pass base64 directly for test (real impl reads file)
    await analyzeImage(mockClient, 'data:image/png;base64,abc123', 'what is this?', { model: 'grok-4-1-fast-non-reasoning' })

    const body = mockClient.post.mock.calls[0].arguments[1]
    const imageUrl = body.messages[0].content[1].image_url.url
    assert.ok(imageUrl.startsWith('data:image/'))
  })
})
```

**Step 2: Implement**

```js
// lib/vision.js
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'

const MIME_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' }

function toImageUrl(input) {
  if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('data:')) {
    return input
  }
  const ext = extname(input).toLowerCase()
  const mime = MIME_TYPES[ext] || 'image/png'
  const data = readFileSync(input).toString('base64')
  return `data:${mime};base64,${data}`
}

export async function analyzeImage(client, imagePath, prompt, options = {}) {
  const model = options.model || 'grok-4-1-fast-non-reasoning'

  return client.post('/chat/completions', {
    model,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: toImageUrl(imagePath) } }
      ]
    }]
  })
}
```

**Step 3: Run tests, verify pass, commit**

```bash
git add lib/vision.js test/vision.test.js
git commit -m "feat: vision module with local file + URL support"
```

---

### Task 8: Embeddings module (TDD)

**Files:**
- Create: `test/embed.test.js`
- Create: `lib/embed.js`

**Step 1: Write failing tests**

```js
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('embed', () => {
  it('sends embedding request', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        data: [{ embedding: [0.1, 0.2, 0.3] }]
      }))
    }

    const { embed } = await import('../lib/embed.js')
    const result = await embed(mockClient, 'hello world')

    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.equal(body.model, 'grok-embedding-small')
    assert.equal(body.input, 'hello world')
    assert.deepEqual(result.data[0].embedding, [0.1, 0.2, 0.3])
  })
})
```

**Step 2: Implement**

```js
// lib/embed.js
export async function embed(client, input) {
  return client.post('/embeddings', {
    model: 'grok-embedding-small',
    input
  })
}
```

**Step 3: Run tests, verify pass, commit**

```bash
git add lib/embed.js test/embed.test.js
git commit -m "feat: embeddings module"
```

---

### Task 9: Models module (TDD)

**Files:**
- Create: `test/models.test.js`
- Create: `lib/models.js`

**Step 1: Write failing tests**

```js
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('models', () => {
  it('fetches model list from API', async () => {
    const mockClient = {
      get: mock.fn(async () => ({
        data: [
          { id: 'grok-3-mini', owned_by: 'xai' },
          { id: 'grok-4', owned_by: 'xai' }
        ]
      }))
    }

    const { listModels } = await import('../lib/models.js')
    const result = await listModels(mockClient)

    assert.equal(mockClient.get.mock.calls[0].arguments[0], '/models')
    assert.equal(result.data.length, 2)
  })
})
```

**Step 2: Implement**

```js
// lib/models.js
export async function listModels(client) {
  return client.get('/models')
}
```

**Step 3: Run tests, verify pass, commit**

```bash
git add lib/models.js test/models.test.js
git commit -m "feat: models listing module"
```

---

### Task 10: Output formatter (TDD)

**Files:**
- Create: `test/format.test.js`
- Create: `lib/format.js`

**Step 1: Write failing tests**

```js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('format', () => {
  it('formatChat returns content text', async () => {
    const { formatChat } = await import('../lib/format.js')
    const result = formatChat({
      choices: [{ message: { content: 'Hello!' } }]
    })
    assert.equal(result, 'Hello!')
  })

  it('formatChat returns JSON when json=true', async () => {
    const { formatChat } = await import('../lib/format.js')
    const response = { choices: [{ message: { content: 'Hi' } }] }
    const result = formatChat(response, true)
    assert.equal(result, JSON.stringify(response, null, 2))
  })

  it('formatModels returns table', async () => {
    const { formatModels } = await import('../lib/format.js')
    const result = formatModels({
      data: [{ id: 'grok-3-mini', owned_by: 'xai' }]
    })
    assert.ok(result.includes('grok-3-mini'))
  })

  it('formatImage returns file save message', async () => {
    const { formatImage } = await import('../lib/format.js')
    const result = formatImage({ data: [{ b64_json: 'abc' }] }, 'out.png')
    assert.ok(result.includes('out.png'))
  })
})
```

**Step 2: Implement**

```js
// lib/format.js
export function formatChat(response, json = false) {
  if (json) return JSON.stringify(response, null, 2)
  return response.choices?.[0]?.message?.content || ''
}

export function formatModels(response, json = false) {
  if (json) return JSON.stringify(response, null, 2)
  return response.data.map(m => m.id).join('\n')
}

export function formatImage(response, outputPath) {
  if (outputPath) return `Saved to ${outputPath}`
  return 'Image generated (use -o to save to file)'
}

export function formatEmbed(response, json = false) {
  if (json) return JSON.stringify(response, null, 2)
  return JSON.stringify(response.data[0].embedding)
}
```

**Step 3: Run tests, verify pass, commit**

```bash
git add lib/format.js test/format.test.js
git commit -m "feat: output formatter for chat, models, images, embeds"
```

---

### Task 11: CLI entrypoint — arg parsing (TDD)

**Files:**
- Create: `test/parse-args.test.js`
- Modify: `bin/grok.js`

**Step 1: Write failing tests**

```js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('parseArgs', () => {
  it('parses chat command with prompt', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['chat', 'hello world'])
    assert.equal(result.command, 'chat')
    assert.deepEqual(result.args, ['hello world'])
  })

  it('parses --model flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['chat', 'hi', '-m', 'grok-4'])
    assert.equal(result.options.model, 'grok-4')
  })

  it('parses --json flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['models', '--json'])
    assert.equal(result.options.json, true)
  })

  it('parses --stream flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['chat', 'hi', '--stream'])
    assert.equal(result.options.stream, true)
  })

  it('parses --search and --xsearch flags', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['chat', 'news', '--search', '--xsearch'])
    assert.equal(result.options.search, true)
    assert.equal(result.options.xsearch, true)
  })

  it('parses --temperature flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['chat', 'hi', '-t', '0.5'])
    assert.equal(result.options.temperature, 0.5)
  })

  it('parses --output flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['image', 'a cat', '-o', 'cat.png'])
    assert.equal(result.options.output, 'cat.png')
  })

  it('parses --pro flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['image', 'a cat', '--pro'])
    assert.equal(result.options.pro, true)
  })

  it('defaults to help command', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs([])
    assert.equal(result.command, 'help')
  })

  it('parses auth set subcommand', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['auth', 'set', 'xai-12345'])
    assert.equal(result.command, 'auth')
    assert.deepEqual(result.args, ['set', 'xai-12345'])
  })

  it('parses --file flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['embed', '--file', 'data.txt'])
    assert.equal(result.options.file, 'data.txt')
  })
})
```

**Step 2: Run test, verify fail, implement full bin/grok.js**

See design doc for full CLI entrypoint with switch-based dispatch. The `parseArgs` function handles all flags, the `main` function dispatches to lib modules.

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add bin/grok.js test/parse-args.test.js
git commit -m "feat: CLI entrypoint with arg parsing and command dispatch"
```

---

### Task 12: Integration wiring — connect all commands in main()

**Files:**
- Modify: `bin/grok.js` — wire up main() switch to all lib modules

This task connects parseArgs output to the actual lib modules: auth, client creation, command dispatch, output formatting, stdin reading, image file saving.

Key behaviors to implement:
- Read stdin when pipe is detected (`!process.stdin.isTTY`)
- Save image to file when `-o` flag is present (write base64 to file)
- Print streaming tokens to stdout as they arrive
- Print status messages to stderr

**Commit:**

```bash
git add bin/grok.js
git commit -m "feat: wire all commands in main dispatch"
```

---

### Task 13: Manual smoke test + README

**Files:**
- Create: `README.md`

**Step 1: Smoke test with real API key**

```bash
export XAI_API_KEY=xai-...
node bin/grok.js chat "say hello in one word"
node bin/grok.js chat "latest AI news" --search
node bin/grok.js models
echo "function add(a,b) { return a+b }" | node bin/grok.js chat "review this code"
```

**Step 2: Write README** (follow stitch-cli README structure)

**Step 3: Final commit**

```bash
git add README.md
git commit -m "docs: README with install, usage, and examples"
```

---

### Task 14: Publish to npm and GitHub

**Step 1: Create GitHub repo**

```bash
gh repo create VedanthB/grok-cli --public --description "AI from your terminal — xAI Grok API CLI"
git remote add origin https://github.com/VedanthB/grok-cli.git
git push -u origin main
```

**Step 2: Publish to npm**

```bash
npm publish
```

**Step 3: Set homepage**

```bash
gh repo edit VedanthB/grok-cli --homepage "https://github.com/VedanthB/grok-cli"
```
