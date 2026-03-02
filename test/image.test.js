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
