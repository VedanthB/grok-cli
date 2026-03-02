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
grok chat "latest AI news" --search              # web search
grok chat "trending topics" --xsearch            # X/Twitter search
grok chat "hello" --stream                       # stream response

# Search
grok search "who won the world series"           # web search
grok xsearch "AI discourse today"                # X/Twitter search

# Image generation
grok image "a cat in space"                      # generate image
grok image "a cat in space" --pro                # pro model
grok image "a cat in space" -o cat.png           # save to file

# Vision
grok vision photo.png "describe this"            # analyze local image
grok vision https://example.com/img.png "what?"  # analyze URL

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

## Global flags

| Flag | Short | Description |
|------|-------|-------------|
| `--model` | `-m` | Model selection |
| `--stream` | `-s` | Stream response |
| `--temperature` | `-t` | Sampling temperature (0-2) |
| `--max-tokens` | | Max response tokens |
| `--json` | | Raw API JSON response |
| `--api-key` | | Override API key |
| `--output` | `-o` | Save output to file |

## Requirements

Node.js 18+ (uses built-in `fetch`).

Zero runtime dependencies.

## License

MIT
