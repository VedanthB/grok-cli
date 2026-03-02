import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const DEFAULT_CONFIG_DIR = join(homedir(), '.config', 'grok')

export function getApiKey(options = {}, configDir = DEFAULT_CONFIG_DIR) {
  if (options.apiKey) return options.apiKey
  if (process.env.XAI_API_KEY) return process.env.XAI_API_KEY

  const configPath = join(configDir, 'config.json')
  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, 'utf8'))
    if (config.apiKey) return config.apiKey
  }

  throw new Error('API key not found. Set XAI_API_KEY env var, use --api-key flag, or run "grok auth set <key>".')
}

export function saveApiKey(key, configDir = DEFAULT_CONFIG_DIR) {
  mkdirSync(configDir, { recursive: true })
  const configPath = join(configDir, 'config.json')
  const config = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {}
  config.apiKey = key
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')
}
