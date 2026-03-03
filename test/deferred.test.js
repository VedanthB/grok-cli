import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('deferredChat', () => {
  it('posts to /chat/completions with deferred: true', async () => {
    const mockClient = {
      post: mock.fn(async () => ({ request_id: 'req_123' }))
    }
    const { deferredChat } = await import('../lib/deferred.js')
    const result = await deferredChat(mockClient, 'Hello')
    const [path, body] = mockClient.post.mock.calls[0].arguments
    assert.equal(path, '/chat/completions')
    assert.equal(body.deferred, true)
    assert.equal(result.request_id, 'req_123')
  })

  it('uses grok-4 as default model', async () => {
    const mockClient = {
      post: mock.fn(async () => ({ request_id: 'req_456' }))
    }
    const { deferredChat } = await import('../lib/deferred.js')
    await deferredChat(mockClient, 'Hello')
    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.equal(body.model, 'grok-4')
  })

  it('includes system message when provided', async () => {
    const mockClient = {
      post: mock.fn(async () => ({ request_id: 'req_789' }))
    }
    const { deferredChat } = await import('../lib/deferred.js')
    await deferredChat(mockClient, 'Hello', { system: 'You are helpful.' })
    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.equal(body.messages[0].role, 'system')
    assert.equal(body.messages[0].content, 'You are helpful.')
    assert.equal(body.messages[1].role, 'user')
    assert.equal(body.messages[1].content, 'Hello')
  })

  it('passes temperature and max_tokens', async () => {
    const mockClient = {
      post: mock.fn(async () => ({ request_id: 'req_abc' }))
    }
    const { deferredChat } = await import('../lib/deferred.js')
    await deferredChat(mockClient, 'Hello', { temperature: 0.7, maxTokens: 500 })
    const body = mockClient.post.mock.calls[0].arguments[1]
    assert.equal(body.temperature, 0.7)
    assert.equal(body.max_tokens, 500)
  })
})

describe('getDeferredResult', () => {
  it('calls getWithStatus on /chat/deferred-completion/{requestId}', async () => {
    const mockClient = {
      getWithStatus: mock.fn(async () => ({
        status: 200,
        data: { choices: [{ message: { content: 'Done!' } }] }
      }))
    }
    const { getDeferredResult } = await import('../lib/deferred.js')
    const result = await getDeferredResult(mockClient, 'req_123')
    assert.equal(mockClient.getWithStatus.mock.calls[0].arguments[0], '/chat/deferred-completion/req_123')
    assert.equal(result.status, 200)
    assert.equal(result.data.choices[0].message.content, 'Done!')
  })
})

describe('pollDeferred', () => {
  it('returns when result has choices', async () => {
    const mockClient = {
      getWithStatus: mock.fn(async () => ({
        status: 200,
        data: { choices: [{ message: { content: 'Result!' } }] }
      }))
    }
    const { pollDeferred } = await import('../lib/deferred.js')
    const result = await pollDeferred(mockClient, 'req_123', { interval: 0 })
    assert.equal(result.choices[0].message.content, 'Result!')
    assert.equal(mockClient.getWithStatus.mock.calls.length, 1)
  })

  it('keeps polling when result has no choices (202)', async () => {
    let callCount = 0
    const mockClient = {
      getWithStatus: mock.fn(async () => {
        callCount++
        if (callCount < 3) return { status: 202, data: null }
        return { status: 200, data: { choices: [{ message: { content: 'Finally!' } }] } }
      })
    }
    const { pollDeferred } = await import('../lib/deferred.js')
    const polls = []
    const result = await pollDeferred(mockClient, 'req_456', {
      interval: 0,
      onPoll: (attempt) => polls.push(attempt)
    })
    assert.equal(result.choices[0].message.content, 'Finally!')
    assert.equal(mockClient.getWithStatus.mock.calls.length, 3)
    assert.deepEqual(polls, [1, 2])
  })
})
