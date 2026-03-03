# grok

AI from your terminal. Zero-dependency CLI for the [xAI Grok API](https://docs.x.ai/api).

```
npm install -g grok-terminal
```

## Usage

```bash
# Chat
grok chat "explain quantum computing in one sentence"
grok chat "explain this code" -m grok-4          # specify model
cat file.py | grok chat "review this"            # pipe stdin
grok chat "hello" --stream                       # stream response
grok chat "be a pirate" --system "You are a pirate"  # system message

# Search (uses Responses API, requires grok-4 family models)
grok search "who won the world series"           # web search
grok xsearch "AI discourse today"                # X/Twitter search
grok chat "latest AI news" --search              # web search via chat
grok chat "trending topics" --xsearch            # X search via chat

# Video generation (async with polling)
grok video "a cat playing with a ball"           # text-to-video
grok video "animate this" --image https://...    # image-to-video
grok video "make it faster" --video-url https:// # edit existing video
grok video "sunset" --duration 10                # set duration (1-15s)
grok video "a wave" --no-poll                    # get request_id only
grok video "a wave" -o wave.mp4                  # save to file

# Image generation
grok image "a cat in space"                      # generate image
grok image "a cat in space" --pro                # pro model
grok image "a cat in space" -o cat.png           # save to file

# Vision
grok vision photo.png "describe this"            # analyze local image
grok vision https://example.com/img.png "what?"  # analyze URL

# Structured outputs
grok chat "capital of France?" --response-format '{"type":"json_object"}' \
  --system "Respond in JSON with an 'answer' field"

# Deferred completions (for reasoning models)
grok chat "prove Fermat's last theorem" --deferred -m grok-4
grok chat "complex reasoning" --deferred --no-poll  # get request_id only

# Embeddings
grok embed "hello world"                         # generate embedding
grok embed --file data.txt                       # embed file contents

# Models
grok models                                      # list available models
grok models --json                               # JSON output

# Auth
grok auth                                        # show auth status
grok auth set xai-your-key-here                  # save API key
grok auth check                                  # verify key works
```

## Auth

Get an API key at [console.x.ai](https://console.x.ai/).

Priority: `--api-key` flag > `XAI_API_KEY` env var > `~/.config/grok/config.json`

```bash
# Option 1: env var
export XAI_API_KEY=xai-...

# Option 2: save to config
grok auth set xai-...

# Option 3: per-command flag
grok chat "hello" --api-key xai-...
```

## Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--model` | `-m` | Model selection |
| `--stream` | `-s` | Stream response |
| `--temperature` | `-t` | Sampling temperature (0-2) |
| `--max-tokens` | | Max response tokens |
| `--json` | | Raw API JSON response |
| `--system` | | System message / instructions |
| `--search` | | Enable web search (Responses API) |
| `--xsearch` | | Enable X search (Responses API) |
| `--deferred` | | Async completion with polling |
| `--response-format` | | Constrain output format (JSON string) |
| `--pro` | | Use pro image model |
| `--duration` | | Video duration in seconds (1-15) |
| `--image` | | Source image URL (image-to-video) |
| `--video-url` | | Source video URL (video editing) |
| `--no-poll` | | Return request_id without waiting |
| `--output` | `-o` | Save output to file |
| `--api-key` | | Override API key |
| `--file` | | Read input from file |

## API Coverage

| Feature | Command/Flag | Endpoint |
|---------|-------------|----------|
| Chat | `grok chat` | `/v1/chat/completions` |
| Streaming | `--stream` | `/v1/chat/completions` (SSE) |
| Web search | `grok search` / `--search` | `/v1/responses` |
| X search | `grok xsearch` / `--xsearch` | `/v1/responses` |
| Image gen | `grok image` | `/v1/images/generations` |
| Video gen | `grok video` | `/v1/videos/generations` |
| Vision | `grok vision` | `/v1/chat/completions` |
| Embeddings | `grok embed` | `/v1/embeddings` |
| Models | `grok models` | `/v1/models` |
| Structured output | `--response-format` | `/v1/chat/completions` |
| Deferred | `--deferred` | `/v1/chat/completions` + polling |
| System messages | `--system` | All chat/search endpoints |

## Requirements

Node.js 18+ (uses built-in `fetch`).

Zero runtime dependencies.

## License

MIT
