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
