const DEFAULT_MODEL = 'grok-3-mini'

export async function chat(client, prompt, options = {}) {
  const model = options.model || DEFAULT_MODEL
  const messages = []
  let userContent = prompt
  if (options.stdin) {
    userContent = `${options.stdin}\n\n${prompt}`
  }
  messages.push({ role: 'user', content: userContent })
  const body = { model, messages }
  if (options.temperature !== undefined) body.temperature = options.temperature
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens
  const tools = []
  if (options.search) tools.push({ type: 'web_search' })
  if (options.xsearch) tools.push({ type: 'x_search' })
  if (tools.length > 0) body.tools = tools
  return client.post('/chat/completions', body)
}

export async function* chatStream(client, prompt, options = {}) {
  const model = options.model || DEFAULT_MODEL
  const messages = []
  let userContent = prompt
  if (options.stdin) {
    userContent = `${options.stdin}\n\n${prompt}`
  }
  messages.push({ role: 'user', content: userContent })
  const body = { model, messages }
  if (options.temperature !== undefined) body.temperature = options.temperature
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens
  const tools = []
  if (options.search) tools.push({ type: 'web_search' })
  if (options.xsearch) tools.push({ type: 'x_search' })
  if (tools.length > 0) body.tools = tools
  yield* client.stream('/chat/completions', body)
}
