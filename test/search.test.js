import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('search', () => {
  it('webSearch posts to /responses with web_search tool', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        output: [{ content: [{ type: 'output_text', text: 'Web result.' }] }]
      }))
    }

    const { webSearch } = await import('../lib/search.js')
    await webSearch(mockClient, 'latest AI news', { model: 'grok-4-1-fast-non-reasoning' })

    const [path, body] = mockClient.post.mock.calls[0].arguments
    assert.equal(path, '/responses')
    assert.ok(body.tools.some(t => t.type === 'web_search'))
    assert.equal(body.input[0].content, 'latest AI news')
  })

  it('xSearch posts to /responses with x_search tool', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        output: [{ content: [{ type: 'output_text', text: 'X result.' }] }]
      }))
    }

    const { xSearch } = await import('../lib/search.js')
    await xSearch(mockClient, 'trending on X', { model: 'grok-4-1-fast-non-reasoning' })

    const [path, body] = mockClient.post.mock.calls[0].arguments
    assert.equal(path, '/responses')
    assert.ok(body.tools.some(t => t.type === 'x_search'))
  })
})
