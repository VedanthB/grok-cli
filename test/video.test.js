import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

describe('video', () => {
  describe('generateVideo', () => {
    it('posts text-to-video with correct body', async () => {
      const mockClient = {
        post: mock.fn(async () => ({ request_id: 'req_123' }))
      }
      const { generateVideo } = await import('../lib/video.js')
      const result = await generateVideo(mockClient, 'a flying cat')
      const [path, body] = mockClient.post.mock.calls[0].arguments
      assert.equal(path, '/videos/generations')
      assert.equal(body.model, 'grok-imagine-video')
      assert.equal(body.prompt, 'a flying cat')
      assert.equal(body.image, undefined)
      assert.equal(body.video, undefined)
      assert.equal(result.request_id, 'req_123')
    })

    it('includes image field for image-to-video', async () => {
      const mockClient = {
        post: mock.fn(async () => ({ request_id: 'req_456' }))
      }
      const { generateVideo } = await import('../lib/video.js')
      await generateVideo(mockClient, 'animate this', { image: 'https://example.com/cat.png' })
      const body = mockClient.post.mock.calls[0].arguments[1]
      assert.deepEqual(body.image, { url: 'https://example.com/cat.png' })
    })

    it('includes video field for video editing', async () => {
      const mockClient = {
        post: mock.fn(async () => ({ request_id: 'req_789' }))
      }
      const { generateVideo } = await import('../lib/video.js')
      await generateVideo(mockClient, 'make it slow motion', { videoUrl: 'https://example.com/clip.mp4' })
      const body = mockClient.post.mock.calls[0].arguments[1]
      assert.deepEqual(body.video, { url: 'https://example.com/clip.mp4' })
    })

    it('passes duration when specified', async () => {
      const mockClient = {
        post: mock.fn(async () => ({ request_id: 'req_dur' }))
      }
      const { generateVideo } = await import('../lib/video.js')
      await generateVideo(mockClient, 'a sunset', { duration: 10 })
      const body = mockClient.post.mock.calls[0].arguments[1]
      assert.equal(body.duration, 10)
    })
  })

  describe('getVideoStatus', () => {
    it('calls GET on /videos/{requestId}', async () => {
      const mockClient = {
        get: mock.fn(async () => ({ status: 'pending' }))
      }
      const { getVideoStatus } = await import('../lib/video.js')
      const result = await getVideoStatus(mockClient, 'req_123')
      const path = mockClient.get.mock.calls[0].arguments[0]
      assert.equal(path, '/videos/req_123')
      assert.equal(result.status, 'pending')
    })
  })

  describe('pollVideo', () => {
    it('returns when status is done', async () => {
      let callCount = 0
      const mockClient = {
        get: mock.fn(async () => {
          callCount++
          if (callCount < 3) return { status: 'pending' }
          return { status: 'done', video: { url: 'https://example.com/video.mp4', duration: 5 } }
        })
      }
      const { pollVideo } = await import('../lib/video.js')
      const pollStatuses = []
      const result = await pollVideo(mockClient, 'req_poll', {
        interval: 0,
        onPoll: (status, attempt) => pollStatuses.push({ status, attempt })
      })
      assert.equal(result.status, 'done')
      assert.equal(result.video.url, 'https://example.com/video.mp4')
      assert.equal(mockClient.get.mock.calls.length, 3)
      assert.deepEqual(pollStatuses, [
        { status: 'pending', attempt: 1 },
        { status: 'pending', attempt: 2 }
      ])
    })

    it('throws on expired status', async () => {
      const mockClient = {
        get: mock.fn(async () => ({ status: 'expired' }))
      }
      const { pollVideo } = await import('../lib/video.js')
      await assert.rejects(
        () => pollVideo(mockClient, 'req_expired', { interval: 0 }),
        { message: 'Video generation expired' }
      )
    })
  })
})
