import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('parseArgs', () => {
  it('parses chat command with prompt', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['chat', 'hello world'])
    assert.equal(result.command, 'chat')
    assert.deepEqual(result.args, ['hello world'])
  })

  it('parses --model flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['chat', 'hi', '-m', 'grok-4'])
    assert.equal(result.options.model, 'grok-4')
  })

  it('parses --json flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['models', '--json'])
    assert.equal(result.options.json, true)
  })

  it('parses --stream flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['chat', 'hi', '--stream'])
    assert.equal(result.options.stream, true)
  })

  it('parses --search and --xsearch flags', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['chat', 'news', '--search', '--xsearch'])
    assert.equal(result.options.search, true)
    assert.equal(result.options.xsearch, true)
  })

  it('parses --temperature flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['chat', 'hi', '-t', '0.5'])
    assert.equal(result.options.temperature, 0.5)
  })

  it('parses --output flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['image', 'a cat', '-o', 'cat.png'])
    assert.equal(result.options.output, 'cat.png')
  })

  it('parses --pro flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['image', 'a cat', '--pro'])
    assert.equal(result.options.pro, true)
  })

  it('defaults to help command', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs([])
    assert.equal(result.command, 'help')
  })

  it('parses auth set subcommand', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['auth', 'set', 'xai-12345'])
    assert.equal(result.command, 'auth')
    assert.deepEqual(result.args, ['set', 'xai-12345'])
  })

  it('parses --file flag', async () => {
    const { parseArgs } = await import('../bin/grok.js')
    const result = parseArgs(['embed', '--file', 'data.txt'])
    assert.equal(result.options.file, 'data.txt')
  })
})
