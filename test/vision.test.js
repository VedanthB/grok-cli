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

  it('handles data URI input', async () => {
    const mockClient = {
      post: mock.fn(async () => ({
        choices: [{ message: { content: 'An image.' } }]
      }))
    }
    const { analyzeImage } = await import('../lib/vision.js')
    await analyzeImage(mockClient, 'data:image/png;base64,abc123', 'what is this?', { model: 'grok-4-1-fast-non-reasoning' })
    const body = mockClient.post.mock.calls[0].arguments[1]
    const imageUrl = body.messages[0].content[1].image_url.url
    assert.ok(imageUrl.startsWith('data:image/'))
  })
})
