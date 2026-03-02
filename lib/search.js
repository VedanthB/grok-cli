import { chat } from './chat.js'

export async function webSearch(client, query, options = {}) {
  return chat(client, query, { ...options, search: true })
}

export async function xSearch(client, query, options = {}) {
  return chat(client, query, { ...options, xsearch: true })
}
