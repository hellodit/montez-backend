import { env } from "@montez-tstack/env/server"

// Transkripsi audio via endpoint kompatibel OpenAI/Groq (ganti base URL saja).
type Deps = { fetchFn?: typeof fetch }

export async function transcribe(
  audio: Buffer,
  filename: string,
  deps: Deps = {},
): Promise<{ text: string; durationSec: number | null }> {
  const fetchFn = deps.fetchFn ?? fetch
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(audio)]), filename)
  form.append('model', env.TRANSCRIBE_MODEL)
  form.append('response_format', 'verbose_json')

  const res = await fetchFn(`${env.TRANSCRIBE_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.TRANSCRIBE_API_KEY}` },
    body: form,
  })
  if (!res.ok) {
    throw new Error(`Transcription failed: ${res.status}`)
  }
  const data: any = await res.json()
  return {
    text: typeof data?.text === 'string' ? data.text : '',
    durationSec: typeof data?.duration === 'number' ? data.duration : null,
  }
}
