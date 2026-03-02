const SEARCH_MODEL = 'grok-4-1-fast-non-reasoning'

export async function webSearch(client, query, options = {}) {
  const model = options.model || SEARCH_MODEL
  const body = {
    model,
    input: [{ role: 'user', content: query }],
    tools: [{ type: 'web_search' }]
  }
  if (options.temperature !== undefined) body.temperature = options.temperature
  return client.post('/responses', body)
}

export async function xSearch(client, query, options = {}) {
  const model = options.model || SEARCH_MODEL
  const body = {
    model,
    input: [{ role: 'user', content: query }],
    tools: [{ type: 'x_search' }]
  }
  if (options.temperature !== undefined) body.temperature = options.temperature
  return client.post('/responses', body)
}
