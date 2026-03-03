import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('chat', () => {
  it('sends basic chat request to /chat/completions', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: 'Hello!' } }]
      }))
    }
    const { chat } = await import('../lib/chat.js')
    const result = await chat(mockClient, 'Hi', { model: 'grok-3-mini' })
    assert.equal(result.choices[0].message.content, 'Hello!')
    const [path, body] = mockClient.post.mock.calls[0].arguments
    assert.equal(path, '/chat/completions')
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

  it('routes to /responses with web_search when --search flag set', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        output: [{ content: [{ type: 'output_text', text: 'Search result.' }] }]
      }))
    }
    const { chat } = await import('../lib/chat.js')
    await chat(mockClient, 'latest AI news', { search: true })
    const [path, body] = mockClient.post.mock.calls[0].arguments
    assert.equal(path, '/responses')
    assert.ok(body.tools.some(t => t.type === 'web_search'))
    assert.equal(body.input[0].content, 'latest AI news')
  })

  it('routes to /responses with x_search when --xsearch flag set', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        output: [{ content: [{ type: 'output_text', text: 'Tweet result.' }] }]
      }))
    }
    const { chat } = await import('../lib/chat.js')
    await chat(mockClient, 'trending on X', { xsearch: true })
    const [path, body] = mockClient.post.mock.calls[0].arguments
    assert.equal(path, '/responses')
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

  it('prepends system message when provided', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: 'Yes sir.' } }]
      }))
    }
    const { chat } = await import('../lib/chat.js')
    await chat(mockClient, 'hello', { model: 'grok-3-mini', system: 'You are a pirate.' })
    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.equal(body.messages[0].role, 'system')
    assert.equal(body.messages[0].content, 'You are a pirate.')
    assert.equal(body.messages[1].role, 'user')
    assert.equal(body.messages[1].content, 'hello')
  })

  it('passes response_format when provided', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: '{"answer":42}' } }]
      }))
    }
    const { chat } = await import('../lib/chat.js')
    await chat(mockClient, 'answer', { model: 'grok-3-mini', responseFormat: { type: 'json_object' } })
    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.deepEqual(body.response_format, { type: 'json_object' })
  })

  it('passes instructions for search with system message', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        output: [{ content: [{ type: 'output_text', text: 'Result.' }] }]
      }))
    }
    const { chat } = await import('../lib/chat.js')
    await chat(mockClient, 'query', { search: true, system: 'Be concise.' })
    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.equal(body.instructions, 'Be concise.')
  })
})
