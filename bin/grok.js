#!/usr/bin/env node

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
