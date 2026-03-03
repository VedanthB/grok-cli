export async function generateVideo(client, prompt, options = {}) {
  const body = {
    model: 'grok-imagine-video',
    prompt
  }
  if (options.duration) body.duration = options.duration
  if (options.image) body.image = { url: options.image }
  if (options.videoUrl) body.video = { url: options.videoUrl }
  return client.post('/videos/generations', body)
}

export async function getVideoStatus(client, requestId) {
  return client.get(`/videos/${requestId}`)
}

export async function pollVideo(client, requestId, { interval = 5000, maxAttempts = 60, onPoll } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getVideoStatus(client, requestId)
    if (result.status === 'done') return result
    if (result.status === 'expired') throw new Error('Video generation expired')
    if (onPoll) onPoll(result.status, i + 1)
    await new Promise(r => setTimeout(r, interval))
  }
  throw new Error('Video generation timed out')
}
