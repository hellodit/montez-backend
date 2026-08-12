import { describe, expect, it } from 'bun:test'
import { transcribe } from './transcribe'

describe('transcribe', () => {
  it('posts multipart to transcription endpoint and returns text + duration', async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    const fetchFn = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init })
      return {
        ok: true,
        status: 200,
        json: async () => ({ text: 'hello world', duration: 12.3 }),
        text: async () => '',
      } as unknown as Response
    }) as unknown as typeof fetch

    const out = await transcribe(Buffer.from('audiobytes'), 'video.mp4', { fetchFn })

    expect(out.text).toBe('hello world')
    expect(out.durationSec).toBe(12.3)
    expect(calls[0]!.url).toContain('/audio/transcriptions')
    expect(calls[0]!.init!.method).toBe('POST')
  })

  it('throws on non-ok response', async () => {
    const fetchFn = (async () =>
      ({ ok: false, status: 500, text: async () => 'err' }) as unknown as Response) as unknown as typeof fetch
    await expect(transcribe(Buffer.from('x'), 'a.mp4', { fetchFn })).rejects.toThrow(
      'Transcription failed',
    )
  })
})
