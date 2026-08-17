export interface NormalizedToken {
  id: number;
  /** 0-based position in the sequence. */
  index: number;
  /**
   * This token's text, decoded independently of its neighbors. For
   * byte-level/byte-fallback tokenizers, a token that is only part of a
   * multi-byte character will not decode to valid text on its own — see
   * `isFragment`.
   */
  text: string;
  /**
   * True when `text` could not be decoded to valid Unicode by itself
   * (contains U+FFFD). This is expected and normal for byte-level BPE:
   * some characters (commonly non-Latin scripts and emoji) are split
   * across multiple raw-byte tokens.
   */
  isFragment: boolean;
  /** UTF-8 byte length of `text`, or null when not meaningfully computable (fragments). */
  byteLength: number | null;
  /** Character offset range in the reconstructed (decoded) token stream. */
  start: number;
  end: number;
}

export interface TokenizerResult {
  tokens: NormalizedToken[];
  tokenIds: number[];
  tokenCount: number;
}

export interface TokenizerAdapter {
  id: string;
  label: string;
  description: string;
  tokenize(text: string): TokenizerResult;
}

export interface TokenizerDescriptor {
  id: string;
  label: string;
  family: string;
  load: () => Promise<TokenizerAdapter>;
}
