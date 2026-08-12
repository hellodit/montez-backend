import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { env } from "../config";

/**
 * Mastra model-router string ("provider/model"). No AI SDK provider object needed —
 * Mastra resolves it and picks up OPENROUTER_API_KEY from env automatically.
 */
export const scriptModel = `openrouter/${env.OPENROUTER_MODEL}`;

export function getEmbeddingModel() {
  return new ModelRouterEmbeddingModel({
    providerId: "openrouter",
    modelId: env.AI_EMBED_MODEL,
    url: env.OPENROUTER_BASE_URL,
    apiKey: env.OPENROUTER_API_KEY,
    headers: {
      "HTTP-Referer": env.OPENROUTER_SITE_URL ?? env.BETTER_AUTH_URL,
      "X-Title": env.OPENROUTER_APP_NAME,
    },
  });
}
