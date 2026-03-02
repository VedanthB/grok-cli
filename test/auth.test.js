import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const TEST_DIR = join(tmpdir(), 'grok-cli-test-' + Date.now())

describe('auth', () => {
  beforeEach(() => { mkdirSync(TEST_DIR, { recursive: true }) })
  afterEach(() => { rmSync(TEST_DIR, { recursive: true, force: true }) })

  it('getApiKey returns --api-key flag first', async () => {
    const { getApiKey } = await import('../lib/auth.js')
    const key = getApiKey({ apiKey: 'flag-key' }, TEST_DIR)
    assert.equal(key, 'flag-key')
  })

  it('getApiKey returns XAI_API_KEY env second', async () => {
    const { getApiKey } = await import('../lib/auth.js')
    process.env.XAI_API_KEY = 'env-key'
    const key = getApiKey({}, TEST_DIR)
    assert.equal(key, 'env-key')
    delete process.env.XAI_API_KEY
  })

  it('getApiKey reads config file third', async () => {
    const { getApiKey } = await import('../lib/auth.js')
    delete process.env.XAI_API_KEY
    writeFileSync(join(TEST_DIR, 'config.json'), JSON.stringify({ apiKey: 'file-key' }))
    const key = getApiKey({}, TEST_DIR)
    assert.equal(key, 'file-key')
  })

  it('getApiKey throws when no key found', async () => {
    const { getApiKey } = await import('../lib/auth.js')
    delete process.env.XAI_API_KEY
    assert.throws(() => getApiKey({}, TEST_DIR), /API key/)
  })

  it('saveApiKey writes config file', async () => {
    const { saveApiKey } = await import('../lib/auth.js')
    saveApiKey('saved-key', TEST_DIR)
    const config = JSON.parse(readFileSync(join(TEST_DIR, 'config.json'), 'utf8'))
    assert.equal(config.apiKey, 'saved-key')
  })
})
