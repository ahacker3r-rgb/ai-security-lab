import type { NormalizedToken } from "@/lib/tokenizers/types";
import { cn } from "@/lib/utils";

export function TokenIdsView({
  tokens,
  selectedIndex,
  onSelect,
}: {
  tokens: NormalizedToken[] | null;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}) {
  if (!tokens) return null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3 overflow-x-auto">
      <div className="flex items-center gap-1.5 w-max" role="list" aria-label="Token IDs">
        {tokens.map((token) => (
          <button
            key={token.index}
            type="button"
            onClick={() => onSelect(selectedIndex === token.index ? null : token.index)}
            aria-pressed={selectedIndex === token.index}
            className={cn(
              "rounded-[4px] border border-transparent bg-slate-800/50 px-1.5 py-0.5 font-mono text-xs text-slate-300 transition-colors hover:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
              selectedIndex === token.index && "!border-orange-500 !bg-orange-500/15 !text-orange-200"
            )}
          >
            {token.id}
          </button>
        ))}
      </div>
    </div>
  );
}
