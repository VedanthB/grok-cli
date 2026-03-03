export async function deferredChat(client, prompt, options = {}) {
  const model = options.model || 'grok-4'
  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    deferred: true
  }
  if (options.system) {
    body.messages.unshift({ role: 'system', content: options.system })
  }
  if (options.temperature !== undefined) body.temperature = options.temperature
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens
  return client.post('/chat/completions', body)
}

export async function getDeferredResult(client, requestId) {
  return client.getWithStatus(`/chat/deferred-completion/${requestId}`)
}

export async function pollDeferred(client, requestId, { interval = 3000, maxAttempts = 120, onPoll } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    const { status, data } = await getDeferredResult(client, requestId)
    if (status === 200 && data?.choices) return data
    if (onPoll) onPoll(i + 1)
    await new Promise(r => setTimeout(r, interval))
  }
  throw new Error('Deferred completion timed out')
}
