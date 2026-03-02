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
