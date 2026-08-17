import type { TokenizerAdapter, TokenizerResult } from "./types";
import { buildNormalizedTokens } from "./normalize";

export async function loadLlamaTokenizer(): Promise<TokenizerAdapter> {
  const { default: llamaTokenizer } = await import("llama-tokenizer-js");

  return {
    id: "llama",
    label: "Llama",
    description: "SentencePiece BPE tokenizer used by LLaMA 1/2-family models.",
    tokenize(text: string): TokenizerResult {
      if (!text) return { tokens: [], tokenIds: [], tokenCount: 0 };
      // No BOS token / no forced preceding space — visualize exactly what
      // this text tokenizes to, not a chat-template artifact.
      const ids = llamaTokenizer.encode(text, false, false);
      const tokens = buildNormalizedTokens(ids, (id) => llamaTokenizer.decode([id], false, false));
      return { tokens, tokenIds: ids, tokenCount: ids.length };
    },
  };
}
