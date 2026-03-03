import { describe, it, mock } from 'node:test'
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

  it('get sends correct headers', async () => {
    const mockFetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ data: [] })
    }))

    const { createClient } = await import('../lib/client.js')
    const client = createClient('test-key', mockFetch)
    const result = await client.get('/models')

    const [url, opts] = mockFetch.mock.calls[0].arguments
    assert.equal(url, 'https://api.x.ai/v1/models')
    assert.equal(opts.headers['Authorization'], 'Bearer test-key')
    assert.ok(!opts.method || opts.method === 'GET')
    assert.deepEqual(result, { data: [] })
  })

  it('getWithStatus returns status and data for 202', async () => {
    const mockFetch = mock.fn(async () => ({
      ok: true,
      status: 202,
      json: async () => { throw new SyntaxError('Unexpected end of JSON input') }
    }))

    const { createClient } = await import('../lib/client.js')
    const client = createClient('test-key', mockFetch)
    const result = await client.getWithStatus('/chat/deferred-completion/req_123')

    assert.equal(result.status, 202)
    assert.equal(result.data, null)
  })

  it('getWithStatus returns status and data for 200', async () => {
    const mockFetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 'Done' } }] })
    }))

    const { createClient } = await import('../lib/client.js')
    const client = createClient('test-key', mockFetch)
    const result = await client.getWithStatus('/chat/deferred-completion/req_123')

    assert.equal(result.status, 200)
    assert.equal(result.data.choices[0].message.content, 'Done')
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
