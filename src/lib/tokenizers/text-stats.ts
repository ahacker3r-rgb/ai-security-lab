export interface TextStats {
  characterCount: number;
  wordCount: number;
}

export function computeTextStats(text: string): TextStats {
  // Count by Unicode code point, not UTF-16 code unit, so a single emoji
  // (often a surrogate pair, sometimes several code points joined by ZWJ)
  // reads closer to how a person would count "characters".
  const characterCount = text.length === 0 ? 0 : Array.from(text).length;
  const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  return { characterCount, wordCount };
}

export function tokenToWordRatio(tokenCount: number, wordCount: number): number | null {
  if (wordCount === 0) return null;
  return tokenCount / wordCount;
}
