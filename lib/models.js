export async function listModels(client) {
  return client.get('/models')
}
