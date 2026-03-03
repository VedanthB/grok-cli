export function formatChat(response, json = false) {
  if (json) return JSON.stringify(response, null, 2)
  // Chat Completions format
  if (response.choices) {
    return response.choices[0]?.message?.content || ''
  }
  // Responses API format
  if (response.output) {
    const textParts = response.output
      .filter(item => item.type === 'message' || item.content)
      .flatMap(item => item.content || [])
      .filter(part => part.type === 'output_text')
      .map(part => part.text)
    return textParts.join('\n') || ''
  }
  return ''
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

export function formatVideo(response) {
  if (response.status === 'done' && response.video?.url) {
    return response.video.url
  }
  if (response.request_id) {
    return `Video generation started (request_id: ${response.request_id})`
  }
  return JSON.stringify(response, null, 2)
}
