const DEFAULT_MODEL = 'grok-3-mini'
const SEARCH_MODEL = 'grok-4-1-fast-non-reasoning'

export async function chat(client, prompt, options = {}) {
  const hasTools = options.search || options.xsearch

  let userContent = prompt
  if (options.stdin) {
    userContent = `${options.stdin}\n\n${prompt}`
  }

  if (hasTools) {
    const model = options.model || SEARCH_MODEL
    const body = {
      model,
      input: [{ role: 'user', content: userContent }]
    }
    if (options.system) {
      body.instructions = options.system
    }
    const tools = []
    if (options.search) tools.push({ type: 'web_search' })
    if (options.xsearch) tools.push({ type: 'x_search' })
    body.tools = tools
    if (options.temperature !== undefined) body.temperature = options.temperature
    return client.post('/responses', body)
  }

  const model = options.model || DEFAULT_MODEL
  const messages = []
  if (options.system) {
    messages.push({ role: 'system', content: options.system })
  }
  messages.push({ role: 'user', content: userContent })
  const body = { model, messages }
  if (options.temperature !== undefined) body.temperature = options.temperature
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens
  if (options.responseFormat) body.response_format = options.responseFormat
  return client.post('/chat/completions', body)
}

export async function* chatStream(client, prompt, options = {}) {
  const model = options.model || DEFAULT_MODEL
  let userContent = prompt
  if (options.stdin) {
    userContent = `${options.stdin}\n\n${prompt}`
  }
  const messages = []
  if (options.system) {
    messages.push({ role: 'system', content: options.system })
  }
  messages.push({ role: 'user', content: userContent })
  const body = { model, messages }
  if (options.temperature !== undefined) body.temperature = options.temperature
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens
  if (options.responseFormat) body.response_format = options.responseFormat
  yield* client.stream('/chat/completions', body)
}
