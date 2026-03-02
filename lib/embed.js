export async function embed(client, input) {
  return client.post('/embeddings', {
    model: 'grok-embedding-small',
    input
  })
}
