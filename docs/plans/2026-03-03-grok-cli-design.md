# grok-cli Design

## Overview

A zero-dependency CLI for the xAI Grok API. Pipe-friendly, one-shot focused, Unix-composable. Same philosophy as stitch-cli but for xAI's full API surface.

The command is `grok`. Install via `npm install -g grok-terminal`.

## Motivation

No simple, scriptable xAI API CLI exists. Every existing Grok CLI is a coding agent (Claude Code competitor). This CLI wraps the xAI API for quick tasks: one-shot chat, piped input, web/X search, image generation, embeddings.

## Commands

```
grok chat "prompt"                       # One-shot chat (default: grok-3-mini)
grok chat "prompt" -m grok-4             # Specify model
cat file.py | grok chat "review this"    # Pipe stdin as context
grok chat "prompt" --search              # Enable web search tool
grok chat "prompt" --xsearch             # Enable X/Twitter search tool
grok chat "prompt" --stream              # Stream response (SSE)

grok search "query"                      # Web search via Grok
grok xsearch "query"                     # X/Twitter search via Grok

grok image "prompt"                      # Generate image
grok image "prompt" --pro                # Pro model ($0.07 vs $0.02)
grok image "prompt" -o out.png           # Save to file

grok vision path/to/image.png "describe" # Analyze local image
grok vision https://url/img.png "what?"  # Analyze remote image

grok embed "text"                        # Generate embedding
grok embed --file data.txt               # Embed file contents

grok models                              # List available models
grok models --json                       # JSON output

grok auth                                # Show current auth status
grok auth set <key>                      # Save API key
grok auth check                          # Verify key works
```

### Global flags

- `--json` — raw API JSON response
- `--model / -m` — model selection
- `--stream / -s` — streaming output
- `--temperature / -t` — sampling temperature
- `--max-tokens` — max response tokens
- `--api-key` — override API key

## Architecture

```
grok-cli/
├── bin/grok.js        # Entrypoint: arg parsing + command dispatch
├── lib/
│   ├── client.js      # HTTP client (fetch, auth, SSE streaming, errors)
│   ├── chat.js        # Chat completions API
│   ├── search.js      # Web search + X search (chat + forced tools)
│   ├── image.js       # Image generation
│   ├── vision.js      # Vision (chat + image content)
│   ├── embed.js       # Embeddings API
│   ├── models.js      # Models listing
│   ├── auth.js        # API key management
│   └── format.js      # Output formatting
├── test/              # Node built-in test runner, one file per module
├── package.json
└── README.md
```

### Key patterns

- `client.js` is the only module that calls `fetch()` — all others go through it
- Auth priority: `--api-key` flag > `XAI_API_KEY` env > `~/.config/grok/config.json`
- stdout = data, stderr = status messages
- `--json` outputs the full API response
- SSE streaming via ReadableStream line-by-line parsing (zero deps)
- Tests use Node's built-in test runner with mock fetch

### SSE streaming (zero deps)

```js
const response = await fetch(url, opts)
const reader = response.body.getReader()
const decoder = new TextDecoder()
let buffer = ''
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  const lines = buffer.split('\n')
  buffer = lines.pop()
  for (const line of lines) {
    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
      const chunk = JSON.parse(line.slice(6))
      // yield chunk.choices[0].delta.content
    }
  }
}
```

## Auth

API key stored at `~/.config/grok/config.json`:
```json
{ "apiKey": "xai-..." }
```

Get a key at https://console.x.ai/

## API base

All requests go to `https://api.x.ai/v1` with header `Authorization: Bearer <key>`.

xAI's API is OpenAI-compatible for chat/embeddings, with extensions for search tools, image generation, and xAI-specific features.

## Dependencies

Zero runtime dependencies. Node.js 18+ (built-in fetch).

## Testing

TDD with Node's built-in test runner (`node --test`). Mock fetch for all API calls. One test file per lib module.

## npm package

- Name: `grok-terminal` (like stitch-terminal)
- Binary: `grok`
- License: MIT
