export async function generateImage(client, prompt, options = {}) {
  const model = options.pro ? 'grok-imagine-image-pro' : 'grok-imagine-image'
  return client.post('/images/generations', {
    model,
    prompt,
    n: 1,
    response_format: 'b64_json'
  })
}
