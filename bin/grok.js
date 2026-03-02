#!/usr/bin/env node

import { getApiKey, saveApiKey } from '../lib/auth.js'
import { createClient } from '../lib/client.js'
import { chat, chatStream } from '../lib/chat.js'
import { webSearch, xSearch } from '../lib/search.js'
import { generateImage } from '../lib/image.js'
import { analyzeImage } from '../lib/vision.js'
import { embed } from '../lib/embed.js'
import { listModels } from '../lib/models.js'
import { formatChat, formatModels, formatImage, formatEmbed } from '../lib/format.js'
import { readFileSync, writeFileSync } from 'node:fs'

export function parseArgs(argv) {
  const options = {}
  const args = []
  let command = null

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (!command && !arg.startsWith('-')) {
      command = arg
      continue
    }

    switch (arg) {
      case '--model': case '-m':
        options.model = argv[++i]
        break
      case '--json':
        options.json = true
        break
      case '--stream': case '-s':
        options.stream = true
        break
      case '--search':
        options.search = true
        break
      case '--xsearch':
        options.xsearch = true
        break
      case '--temperature': case '-t':
        options.temperature = parseFloat(argv[++i])
        break
      case '--max-tokens':
        options.maxTokens = parseInt(argv[++i])
        break
      case '--output': case '-o':
        options.output = argv[++i]
        break
      case '--pro':
        options.pro = true
        break
      case '--api-key':
        options.apiKey = argv[++i]
        break
      case '--file':
        options.file = argv[++i]
        break
      default:
        if (!arg.startsWith('-')) {
          args.push(arg)
        }
    }
  }

  return { command: command || 'help', args, options }
}

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('')
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => { data += chunk })
    process.stdin.on('end', () => resolve(data))
  })
}

const HELP = `Usage: grok <command> [options]

Commands:
  chat <prompt>        Send a chat message (default model: grok-3-mini)
  search <query>       Web search via Grok
  xsearch <query>      X/Twitter search via Grok
  image <prompt>       Generate an image
  vision <path> <prompt>  Analyze an image
  embed <text>         Generate embeddings
  models               List available models
  auth                 Manage API key
  auth set <key>       Save API key
  auth check           Verify API key

Options:
  -m, --model <model>  Model selection
  -s, --stream         Stream response
  -t, --temperature <n> Sampling temperature
  --max-tokens <n>     Max response tokens
  --json               Raw JSON output
  --search             Enable web search
  --xsearch            Enable X search
  --pro                Use pro image model
  -o, --output <file>  Save output to file
  --api-key <key>      Override API key
  --file <path>        Read input from file
`

async function main() {
  const { command, args, options } = parseArgs(process.argv.slice(2))

  if (command === 'help' || options.help) {
    console.log(HELP)
    return
  }

  if (command === 'auth') {
    const [sub, value] = args
    if (sub === 'set' && value) {
      saveApiKey(value)
      console.error('API key saved.')
    } else if (sub === 'check') {
      try {
        const key = getApiKey(options)
        const client = createClient(key)
        await listModels(client)
        console.error('API key is valid.')
      } catch (e) {
        console.error(`Auth check failed: ${e.message}`)
        process.exitCode = 1
      }
    } else {
      try {
        const key = getApiKey(options)
        console.log(`Authenticated (key: ${key.slice(0, 8)}...)`)
      } catch (e) {
        console.error(e.message)
        process.exitCode = 1
      }
    }
    return
  }

  const apiKey = getApiKey(options)
  const client = createClient(apiKey)

  switch (command) {
    case 'chat': {
      const prompt = args[0]
      if (!prompt) { console.error('Usage: grok chat <prompt>'); process.exitCode = 1; return }
      const stdin = await readStdin()
      if (options.stream) {
        for await (const chunk of chatStream(client, prompt, { ...options, stdin })) {
          const content = chunk.choices?.[0]?.delta?.content
          if (content) process.stdout.write(content)
        }
        process.stdout.write('\n')
      } else {
        const result = await chat(client, prompt, { ...options, stdin })
        console.log(formatChat(result, options.json))
      }
      break
    }

    case 'search': {
      const query = args[0]
      if (!query) { console.error('Usage: grok search <query>'); process.exitCode = 1; return }
      const result = await webSearch(client, query, options)
      console.log(formatChat(result, options.json))
      break
    }

    case 'xsearch': {
      const query = args[0]
      if (!query) { console.error('Usage: grok xsearch <query>'); process.exitCode = 1; return }
      const result = await xSearch(client, query, options)
      console.log(formatChat(result, options.json))
      break
    }

    case 'image': {
      const prompt = args[0]
      if (!prompt) { console.error('Usage: grok image <prompt>'); process.exitCode = 1; return }
      const result = await generateImage(client, prompt, options)
      if (options.output) {
        const buf = Buffer.from(result.data[0].b64_json, 'base64')
        writeFileSync(options.output, buf)
        console.error(formatImage(result, options.output))
      } else if (options.json) {
        console.log(JSON.stringify(result, null, 2))
      } else {
        console.log(result.data[0].b64_json)
      }
      break
    }

    case 'vision': {
      const imagePath = args[0]
      const prompt = args[1]
      if (!imagePath || !prompt) { console.error('Usage: grok vision <image> <prompt>'); process.exitCode = 1; return }
      const result = await analyzeImage(client, imagePath, prompt, options)
      console.log(formatChat(result, options.json))
      break
    }

    case 'embed': {
      let input = args[0]
      if (options.file) {
        input = readFileSync(options.file, 'utf8')
      }
      if (!input) { console.error('Usage: grok embed <text> or grok embed --file <path>'); process.exitCode = 1; return }
      const result = await embed(client, input)
      console.log(formatEmbed(result, options.json))
      break
    }

    case 'models': {
      const result = await listModels(client)
      console.log(formatModels(result, options.json))
      break
    }

    default:
      console.error(`Unknown command: ${command}`)
      console.log(HELP)
      process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exitCode = 1
})
