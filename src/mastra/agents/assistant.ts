import { Agent } from "@mastra/core/agent";

export const assistantAgent = new Agent({
  id: "assistant",
  name: "Assistant",
  instructions: `You are a helpful assistant for the montez-tstack application.
Answer clearly and concisely. If you do not know something, say so.`,
  model: "openrouter/openai/gpt-4o-mini",
});
