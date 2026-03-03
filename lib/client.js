const BASE_URL = 'https://api.x.ai/v1'

export function createClient(apiKey, fetchFn = globalThis.fetch) {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }

  async function post(path, body) {
    const response = await fetchFn(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `HTTP ${response.status}`)
    }
    return response.json()
  }

  async function get(path) {
    const response = await fetchFn(`${BASE_URL}${path}`, { headers })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `HTTP ${response.status}`)
    }
    return response.json()
  }

  async function getWithStatus(path) {
    const response = await fetchFn(`${BASE_URL}${path}`, { headers })
    if (!response.ok && response.status !== 202) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `HTTP ${response.status}`)
    }
    const data = await response.json().catch(() => null)
    return { status: response.status, data }
  }

  async function* stream(path, body) {
    const response = await fetchFn(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, stream: true })
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `HTTP ${response.status}`)
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          yield JSON.parse(line.slice(6))
        }
      }
    }
  }

  return { post, get, getWithStatus, stream }
}
