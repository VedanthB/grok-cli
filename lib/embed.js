export async function embed(client, input, options = {}) {
  return client.post('/embeddings', {
    model: options.model || 'grok-embedding-small',
    input
  })
}
