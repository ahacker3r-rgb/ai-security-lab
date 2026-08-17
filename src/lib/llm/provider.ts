export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface GenerateOptions {
  /** Hard cap on output length to bound cost/latency and avoid runaway generations. */
  maxTokens?: number;
  temperature?: number;
  /** Abort the request if the provider hasn't responded within this many ms. */
  timeoutMs?: number;
}

export interface GenerateResult {
  text: string;
}

/**
 * Provider-agnostic LLM interface. Application code (lab engine, chat API
 * routes) should only ever depend on this interface, never on a specific
 * backend, so the underlying model/provider can be swapped by changing
 * config alone.
 */
export interface LLMProvider {
  generateResponse(messages: ChatMessage[], options?: GenerateOptions): Promise<GenerateResult>;
}

export class LLMTimeoutError extends Error {
  constructor() {
    super("LLM request timed out");
    this.name = "LLMTimeoutError";
  }
}

export class LLMUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMUnavailableError";
  }
}
