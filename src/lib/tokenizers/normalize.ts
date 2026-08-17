import type { NormalizedToken } from "./types";

const REPLACEMENT_CHAR = "�";
const utf8Encoder = new TextEncoder();

/**
 * Builds the normalized token list from a sequence of ids paired with each
 * token's independently-decoded text. Decoding each token in isolation
 * (rather than diffing cumulative decodes) is what correctly surfaces
 * byte-level fragments as fragments instead of silently smoothing them
 * into neighboring tokens — the fragmentation itself is the point of a
 * tokenization visualizer.
 */
export function buildNormalizedTokens(ids: number[], decodeSingle: (id: number) => string): NormalizedToken[] {
  let cursor = 0;
  return ids.map((id, index) => {
    const text = decodeSingle(id);
    const isFragment = text.includes(REPLACEMENT_CHAR);
    const start = cursor;
    const end = cursor + text.length;
    cursor = end;
    return {
      id,
      index,
      text,
      isFragment,
      byteLength: isFragment ? null : utf8Encoder.encode(text).length,
      start,
      end,
    };
  });
}
