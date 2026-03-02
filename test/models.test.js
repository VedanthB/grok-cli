import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('models', () => {
  it('fetches model list from API', async () => {
    const mockClient = {
      get: mock.fn(async () => ({
        data: [
          { id: 'grok-3-mini', owned_by: 'xai' },
          { id: 'grok-4', owned_by: 'xai' }
        ]
      }))
    }
    const { listModels } = await import('../lib/models.js')
    const result = await listModels(mockClient)
    assert.equal(mockClient.get.mock.calls[0].arguments[0], '/models')
    assert.equal(result.data.length, 2)
  })
})
