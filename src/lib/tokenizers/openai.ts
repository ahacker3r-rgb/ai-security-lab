import type { TokenizerAdapter, TokenizerResult } from "./types";
import { buildNormalizedTokens } from "./normalize";

export async function loadOpenAITokenizer(): Promise<TokenizerAdapter> {
  const [{ Tiktoken }, { default: o200k_base }] = await Promise.all([
    import("js-tiktoken/lite"),
    import("js-tiktoken/ranks/o200k_base"),
  ]);

  const encoder = new Tiktoken(o200k_base);

  return {
    id: "gpt",
    label: "GPT (OpenAI)",
    description: "o200k_base — the byte-level BPE tokenizer used by GPT-4o and newer OpenAI models.",
    tokenize(text: string): TokenizerResult {
      if (!text) return { tokens: [], tokenIds: [], tokenCount: 0 };
      const ids = encoder.encode(text, "all");
      const tokens = buildNormalizedTokens(ids, (id) => encoder.decode([id]));
      return { tokens, tokenIds: ids, tokenCount: ids.length };
    },
  };
}
