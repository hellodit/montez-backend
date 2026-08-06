import { env } from "@montez-tstack/env/server"

// Port dari bedah-akun/src/analyzer/gemini-vision.js (uploadToGemini, baris 534-616).
// Resumable upload → poll sampai file ACTIVE. Kompresi ffmpeg 480p DI-SKIP (known
// limitation v1: video sangat besar akan lambat).

const UPLOAD_BASE = 'https://generativelanguage.googleapis.com/upload/v1beta/files'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const MAX_POLL = 90 // 90 x 2s = 3 menit

type Deps = {
  fetchFn?: typeof fetch
  sleep?: (ms: number) => Promise<void>
}

export async function uploadToGemini(
  data: Buffer,
  mimeType: string,
  deps: Deps = {},
): Promise<{ fileUri: string; fileName: string }> {
  const fetchFn = deps.fetchFn ?? fetch
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const key = env.GOOGLE_GENERATIVE_AI_API_KEY
  const numBytes = data.length

  // Step 1: start resumable upload.
  const startRes = await fetchFn(`${UPLOAD_BASE}?key=${key}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(numBytes),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: 'audit-video' } }),
  })
  if (!startRes.ok) {
    throw new Error(`Gemini upload start failed: ${startRes.status}`)
  }
  const uploadUrl = startRes.headers.get('X-Goog-Upload-URL')
  if (!uploadUrl) throw new Error('No upload URL in Gemini response headers')

  // Step 2: upload bytes + finalize.
  const uploadRes = await fetchFn(uploadUrl, {
    method: 'PUT',
    headers: {
      'X-Goog-Upload-Command': 'upload, finalize',
      'X-Goog-Upload-Offset': '0',
      'Content-Length': String(numBytes),
      'Content-Type': mimeType,
    },
    body: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
  })
  if (!uploadRes.ok) {
    throw new Error(`Gemini upload finalize failed: ${uploadRes.status}`)
  }
  const fileInfo: any = await uploadRes.json()
  const fileUri: string | undefined = fileInfo?.file?.uri
  const fileName: string | undefined = fileInfo?.file?.name
  if (!fileUri || !fileName) throw new Error('No file URI in Gemini upload response')

  // Step 3: poll sampai ACTIVE.
  let state: string | undefined = fileInfo?.file?.state
  let attempts = 0
  while (state !== 'ACTIVE' && state !== 'FAILED' && attempts < MAX_POLL) {
    await sleep(2000)
    try {
      const checkRes = await fetchFn(`${API_BASE}/${fileName}?key=${key}`)
      if (checkRes.ok) {
        const checkData: any = await checkRes.json()
        state = checkData?.state
      }
    } catch {
      // network blip → retry
    }
    attempts++
  }
  if (state !== 'ACTIVE') {
    throw new Error(`Gemini file not active after upload, state: ${state}`)
  }

  return { fileUri, fileName }
}
