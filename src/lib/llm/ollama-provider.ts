import {
  type ChatMessage,
  type GenerateOptions,
  type GenerateResult,
  type LLMProvider,
  LLMTimeoutError,
  LLMUnavailableError,
} from "./provider";

// Generous defaults: CPU-only inference on a loaded host can be very slow
// (observed as low as ~2 tokens/sec on a busy shared dev machine). Tune
// these down on faster hardware/GPU deployments if snappier UX is wanted.
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_TOKENS = 220;

export class OllamaProvider implements LLMProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string
  ) {}

  async generateResponse(messages: ChatMessage[], options?: GenerateOptions): Promise<GenerateResult> {
    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new LLMUnavailableError(`Ollama returned ${res.status}: ${body.slice(0, 300)}`);
      }

      const data = (await res.json()) as { message?: { content?: string } };
      return { text: data.message?.content ?? "" };
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
