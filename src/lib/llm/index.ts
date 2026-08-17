import "server-only";
import { OllamaProvider } from "./ollama-provider";
import { GroqProvider } from "./groq";
import type { ChatMessage, GenerateOptions, GenerateResult, LLMProvider } from "./provider";

export type { ChatMessage, GenerateOptions, GenerateResult, LLMProvider };
export { LLMTimeoutError, LLMUnavailableError } from "./provider";

let provider: LLMProvider | null = null;

function buildProvider(): LLMProvider {
  const kind = (process.env.LLM_PROVIDER ?? "ollama").toLowerCase();

  if (kind === "groq") {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("LLM_PROVIDER=groq requires GROQ_API_KEY to be set.");
    const model = process.env.LLM_MODEL ?? "llama-3.3-70b-versatile";
    return new GroqProvider(apiKey, model);
  }

  const baseUrl = process.env.LLM_BASE_URL ?? "http://localhost:11434";
  const model = process.env.LLM_MODEL ?? "gemma3:4b";
  return new OllamaProvider(baseUrl, model);
}

function getProvider(): LLMProvider {
  if (!provider) provider = buildProvider();
  return provider;
}

/**
 * The one function application code should call to talk to the model.
 * Backed by whichever LLMProvider is configured — swap models/providers
 * by changing LLM_PROVIDER (+ its associated env vars), not this call site.
 */
export async function generateResponse(
  messages: ChatMessage[],
  options?: GenerateOptions
): Promise<GenerateResult> {
  return getProvider().generateResponse(messages, options);
}
