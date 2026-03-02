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
})
