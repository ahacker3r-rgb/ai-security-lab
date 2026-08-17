"use client";

import { useState } from "react";
import type { NormalizedToken } from "@/lib/tokenizers/types";
import { cn } from "@/lib/utils";

function displayGlyph(text: string): string {
  if (text === "") return "·";
  return text.replace(/\n/g, "↵").replace(/\t/g, "⇥");
}

export function TokenChip({
  token,
  selected,
  onSelect,
}: {
  token: NormalizedToken;
  selected: boolean;
  onSelect: () => void;
}) {
  const [showTip, setShowTip] = useState(false);
  const zebra = token.index % 2 === 0;

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        aria-pressed={selected}
        aria-describedby={`token-tip-${token.index}`}
        className={cn(
          "whitespace-pre rounded-[4px] border px-1 py-0.5 font-mono text-sm leading-relaxed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
          token.isFragment
            ? "border-dashed border-amber-700/60 bg-amber-500/5 text-amber-400"
            : zebra
              ? "border-transparent bg-slate-800/70 text-slate-200 hover:border-slate-600"
              : "border-transparent bg-slate-800/40 text-slate-200 hover:border-slate-600",
          selected && "!border-orange-500 !bg-orange-500/15 !text-orange-200"
        )}
      >
        {displayGlyph(token.text)}
      </button>
      {showTip && (
        <span
          role="tooltip"
          id={`token-tip-${token.index}`}
          className="absolute left-1/2 top-full z-30 mt-1.5 w-max max-w-[220px] -translate-x-1/2 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs shadow-lg"
        >
          <span className="block text-slate-500">Token</span>
          <span className="block font-mono text-slate-200 mb-1 break-all">
            {token.isFragment ? "(byte fragment)" : JSON.stringify(token.text)}
          </span>
          <span className="block text-slate-500">Token ID</span>
          <span className="block font-mono text-slate-200 mb-1">{token.id}</span>
          <span className="block text-slate-500">Position</span>
          <span className="block font-mono text-slate-200">{token.index + 1}</span>
        </span>
      )}
    </span>
  );
}
