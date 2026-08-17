import {
  type ChatMessage,
  type GenerateOptions,
  type GenerateResult,
  type LLMProvider,
  LLMTimeoutError,
  LLMUnavailableError,
} from "./provider";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_TOKENS = 400;

/**
 * Groq's chat completions API is OpenAI-compatible, so this is a thin
 * fetch wrapper - no SDK dependency needed. Groq's inference is fast
 * enough (hundreds of tokens/sec) that the shorter default timeout here
 * (vs. the CPU-bound Ollama provider) is comfortably sufficient.
 */
export class GroqProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl: string = "https://api.groq.com/openai/v1"
  ) {}

  async generateResponse(messages: ChatMessage[], options?: GenerateOptions): Promise<GenerateResult> {
    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new LLMUnavailableError(`Groq returned ${res.status}: ${body.slice(0, 300)}`);
      }

      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return { text: data.choices?.[0]?.message?.content ?? "" };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new LLMTimeoutError();
      }
      if (err instanceof LLMUnavailableError) throw err;
      throw new LLMUnavailableError(err instanceof Error ? err.message : "Unknown LLM error");
    } finally {
      clearTimeout(timeout);
    }
  }
}
