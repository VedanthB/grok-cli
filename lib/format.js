export function formatChat(response, json = false) {
  if (json) return JSON.stringify(response, null, 2)
  return response.choices?.[0]?.message?.content || ''
}

export function formatModels(response, json = false) {
  if (json) return JSON.stringify(response, null, 2)
  return response.data.map(m => m.id).join('\n')
}

export function formatImage(response, outputPath) {
  if (outputPath) return `Saved to ${outputPath}`
  return 'Image generated (use -o to save to file)'
}

export function formatEmbed(response, json = false) {
  if (json) return JSON.stringify(response, null, 2)
  return JSON.stringify(response.data[0].embedding)
}
