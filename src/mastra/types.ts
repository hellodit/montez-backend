/** Pesan yang dikirim ke LLM. Sengaja minimal — bukan bentuk baris DB. */
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}
