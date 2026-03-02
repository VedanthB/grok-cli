import { readFileSync } from 'node:fs'
import { extname } from 'node:path'

const MIME_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' }

function toImageUrl(input) {
  if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('data:')) {
    return input
  }
  const ext = extname(input).toLowerCase()
  const mime = MIME_TYPES[ext] || 'image/png'
  const data = readFileSync(input).toString('base64')
  return `data:${mime};base64,${data}`
}

export async function analyzeImage(client, imagePath, prompt, options = {}) {
  const model = options.model || 'grok-4-1-fast-non-reasoning'
  return client.post('/chat/completions', {
    model,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: toImageUrl(imagePath) } }
      ]
    }]
  })
}
