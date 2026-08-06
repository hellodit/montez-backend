import { google } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { ModelRouterEmbeddingModel } from '@mastra/core/llm'
import type { LanguageModelV4 } from '@ai-sdk/provider'

// Vision = Gemini native (butuh Files API URI + input video); teks = OpenRouter.
export const visionModel: LanguageModelV4 = google(env.GEMINI_MODEL)

const openrouter = createOpenAI({
  baseURL: env.OPENROUTER_BASE_URL,
  apiKey: env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': env.OPENROUTER_SITE_URL ?? env.BETTER_AUTH_URL,
    'X-Title': env.OPENROUTER_APP_NAME,
  },
})

// WAJIB `.chat`: default @ai-sdk/openai v4 = Responses API, tak ada di OpenRouter.
export const scriptModel: LanguageModelV4 = openrouter.chat(env.OPENROUTER_MODEL)

export function getEmbeddingModel() {
  return new ModelRouterEmbeddingModel({
    providerId: 'openrouter',
    modelId: env.AI_EMBED_MODEL,
    url: env.OPENROUTER_BASE_URL,
    apiKey: env.OPENROUTER_API_KEY,
    headers: {
      'HTTP-Referer': env.OPENROUTER_SITE_URL ?? env.BETTER_AUTH_URL,
      'X-Title': env.OPENROUTER_APP_NAME,
    },
  })
}
