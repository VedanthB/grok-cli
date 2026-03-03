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

  it('formatModels returns model ids', async () => {
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

  it('formatChat handles Responses API format', async () => {
    const { formatChat } = await import('../lib/format.js')
    const result = formatChat({
      output: [
        { type: 'web_search_call', status: 'completed' },
        { type: 'message', content: [{ type: 'output_text', text: 'Search result here.' }] }
      ]
    })
    assert.equal(result, 'Search result here.')
  })

  it('formatVideo returns URL when done', async () => {
    const { formatVideo } = await import('../lib/format.js')
    const result = formatVideo({ status: 'done', video: { url: 'https://vidgen.x.ai/video.mp4' } })
    assert.equal(result, 'https://vidgen.x.ai/video.mp4')
  })

  it('formatVideo returns request_id message when pending', async () => {
    const { formatVideo } = await import('../lib/format.js')
    const result = formatVideo({ request_id: 'abc-123' })
    assert.ok(result.includes('abc-123'))
  })
})
