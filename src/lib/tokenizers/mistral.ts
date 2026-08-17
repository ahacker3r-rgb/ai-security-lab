import type { TokenizerAdapter, TokenizerResult } from "./types";
import { buildNormalizedTokens } from "./normalize";

export async function loadMistralTokenizer(): Promise<TokenizerAdapter> {
  const { default: mistralTokenizer } = await import("mistral-tokenizer-js");

  return {
    id: "mistral",
    label: "Mistral",
    description: "SentencePiece BPE tokenizer used by Mistral-family models.",
    tokenize(text: string): TokenizerResult {
      if (!text) return { tokens: [], tokenIds: [], tokenCount: 0 };
      const ids = mistralTokenizer.encode(text, false, false);
      const tokens = buildNormalizedTokens(ids, (id) => mistralTokenizer.decode([id], false, false));
      return { tokens, tokenIds: ids, tokenCount: ids.length };
    },
  };
}
