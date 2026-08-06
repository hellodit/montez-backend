import { describe, expect, it } from 'bun:test'
import { uploadToGemini } from './gemini-files'

function res(init: { ok: boolean; status?: number; headers?: Record<string, string>; json?: unknown }) {
  return {
    ok: init.ok,
    status: init.status ?? 200,
    headers: { get: (k: string) => init.headers?.[k] ?? null },
    json: async () => init.json ?? {},
    text: async () => '',
  } as unknown as Response
}

describe('uploadToGemini', () => {
  it('does start + upload, returns fileUri (ACTIVE immediately, no polling)', async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    const fetchFn = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init })
      if (calls.length === 1) {
        return res({ ok: true, headers: { 'X-Goog-Upload-URL': 'https://upload.example/session' } })
      }
      return res({
        ok: true,
        json: { file: { uri: 'gemini://files/abc', name: 'files/abc', state: 'ACTIVE' } },
      })
    }) as unknown as typeof fetch

    const out = await uploadToGemini(Buffer.from('videobytes'), 'video/mp4', { fetchFn })

    expect(out.fileUri).toBe('gemini://files/abc')
    expect(calls.length).toBe(2)
    const startCmd = (calls[0]!.init!.headers as Record<string, string>)['X-Goog-Upload-Command']
    expect(startCmd).toBe('start')
    const uploadCmd = (calls[1]!.init!.headers as Record<string, string>)['X-Goog-Upload-Command']
    expect(uploadCmd).toBe('upload, finalize')
    expect(calls[1]!.url).toBe('https://upload.example/session')
  })

  it('throws when start response lacks upload URL', async () => {
    const fetchFn = (async () => res({ ok: true, headers: {} })) as unknown as typeof fetch
    await expect(uploadToGemini(Buffer.from('x'), 'video/mp4', { fetchFn })).rejects.toThrow(
      'No upload URL',
    )
  })
})
