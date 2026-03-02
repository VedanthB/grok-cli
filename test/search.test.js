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
