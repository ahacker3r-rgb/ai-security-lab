import type { NormalizedToken } from "@/lib/tokenizers/types";
import { TokenChip } from "./token-chip";

export function TokenizedView({
  tokens,
  loading,
  selectedIndex,
  onSelect,
}: {
  tokens: NormalizedToken[] | null;
  loading: boolean;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}) {
  if (loading || !tokens) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-5 w-1/2 animate-pulse rounded bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
      <div className="flex flex-wrap items-center gap-1" role="list" aria-label="Tokenized text">
        {tokens.map((token) => (
          <TokenChip
            key={token.index}
            token={token}
            selected={selectedIndex === token.index}
            onSelect={() => onSelect(selectedIndex === token.index ? null : token.index)}
          />
        ))}
      </div>
    </div>
  );
}
