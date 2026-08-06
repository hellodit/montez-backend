import { test, expect, afterEach } from 'bun:test'
import { generateText } from 'ai'

// Env harus diset sebelum providers di-import.
process.env.OPENROUTER_API_KEY = 'sk-or-test'
process.env.OPENROUTER_SITE_URL = 'https://montez.example'
process.env.OPENROUTER_MODEL = 'openai/gpt-4o-mini'
const { scriptModel } = await import('./providers')

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

function captureFetch() {
  const seen: { url: string; headers: Record<string, string>; body: any } = {
    url: '',
    headers: {},
    body: null,
  }
  globalThis.fetch = (async (url: any, init: any) => {
    seen.url = String(url)
    seen.headers = Object.fromEntries(
      Object.entries(init.headers as Record<string, string>).map(([k, v]) => [
        k.toLowerCase(),
        v,
      ]),
    )
    seen.body = JSON.parse(String(init.body))
    return new Response(
      JSON.stringify({
        id: 'test',
        object: 'chat.completion',
        created: 0,
        model: 'openai/gpt-4o-mini',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'ok' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 3, completion_tokens: 5, total_tokens: 8 },
      }),
      { headers: { 'content-type': 'application/json' } },
    )
  }) as typeof fetch
  return seen
}

// Tanpa `.chat`, request pergi ke /responses dan OpenRouter balas 404.
test('scriptModel calls OpenRouter chat completions, not the Responses API', async () => {
  const seen = captureFetch()

  await generateText({ model: scriptModel, prompt: 'hi' })

  expect(seen.url).toBe('https://openrouter.ai/api/v1/chat/completions')
  expect(seen.body.model).toBe('openai/gpt-4o-mini')
  expect(Array.isArray(seen.body.messages)).toBe(true)
})

test('scriptModel sends OpenRouter auth and attribution headers', async () => {
  const seen = captureFetch()

  await generateText({ model: scriptModel, prompt: 'hi' })

  expect(seen.headers.authorization).toBe('Bearer sk-or-test')
  expect(seen.headers['http-referer']).toBe('https://montez.example')
  expect(seen.headers['x-title']).toBe('montez-agent')
})

test('scriptModel maps OpenRouter usage so token cost stays trackable', async () => {
  captureFetch()

  const res = await generateText({ model: scriptModel, prompt: 'hi' })

  expect(res.text).toBe('ok')
  expect(res.usage.inputTokens).toBe(3)
  expect(res.usage.outputTokens).toBe(5)
})
