"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { TOKENIZER_DESCRIPTORS } from "@/lib/tokenizers/registry";
import type { TokenizerAdapter, TokenizerResult } from "@/lib/tokenizers/types";
import { cn } from "@/lib/utils";
import { TokenizedView } from "./tokenized-view";
import { TokenIdsView } from "./token-ids-view";

type Entry = { adapter: TokenizerAdapter; result: TokenizerResult } | "error";

export function CompareTokenizers({ text, onClose }: { text: string; onClose: () => void }) {
  const [entries, setEntries] = useState<Map<string, Entry>>(new Map());
  // Tracks which input string the current `entries` were computed for, so
  // "loading" can be derived from a plain render-time comparison instead
  // of an extra setState call at the top of the effect.
  const [loadedForText, setLoadedForText] = useState<string | null>(null);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [inspectSelectedIndex, setInspectSelectedIndex] = useState<number | null>(null);

  const loading = loadedForText !== text;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results: [string, Entry][] = await Promise.all(
        TOKENIZER_DESCRIPTORS.map(async (d): Promise<[string, Entry]> => {
          try {
            const adapter = await d.load();
            return [d.id, { adapter, result: adapter.tokenize(text) }];
          } catch (err) {
            console.error("[compare-tokenizers] failed to load", d.id, err);
            return [d.id, "error"];
          }
        })
      );
      if (!cancelled) {
        setEntries(new Map(results));
        setLoadedForText(text);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [text]);

  const counts = [...entries.values()].map((e) => (e === "error" ? 0 : e.result.tokenCount));
  const maxCount = Math.max(1, ...counts);
  const inspectEntry = inspectId ? entries.get(inspectId) : null;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="font-semibold text-slate-100">Compare Tokenizers</h2>
            <p className="text-xs text-slate-500 mt-0.5">Same input, different tokenizer implementations.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Same Input</p>
          <p className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-slate-300 break-words">
            {text}
          </p>

          <div className="flex flex-col gap-3">
            {TOKENIZER_DESCRIPTORS.map((d) => {
              const entry = entries.get(d.id);
              const count = entry && entry !== "error" ? entry.result.tokenCount : 0;
              const pct = Math.max(4, Math.round((count / maxCount) * 100));
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    if (entry && entry !== "error") {
                      setInspectId(d.id);
                      setInspectSelectedIndex(null);
                    }
                  }}
                  disabled={!entry || entry === "error"}
                  className={cn(
                    "text-left rounded-lg border px-4 py-3 transition-colors",
                    inspectId === d.id ? "border-orange-600/60 bg-orange-500/5" : "border-slate-800 hover:border-slate-700",
                    (!entry || entry === "error") && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-200">
                      {d.label} <span className="text-slate-500 font-normal">({d.family})</span>
                    </span>
                    <span className="font-mono text-sm text-slate-300">
                      {loading && !entry ? "…" : entry === "error" ? "unavailable" : `${count} tokens`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-500 transition-all"
                      style={{ width: entry && entry !== "error" ? `${pct}%` : "0%" }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {inspectEntry && inspectEntry !== "error" && (
            <div className="flex flex-col gap-4 pt-2 border-t border-slate-800">
              <p className="text-xs font-semibold tracking-wide text-slate-500">
                {inspectEntry.adapter.label.toUpperCase()} - TOKEN BREAKDOWN
              </p>
              <TokenizedView
                tokens={inspectEntry.result.tokens}
                loading={false}
                selectedIndex={inspectSelectedIndex}
                onSelect={setInspectSelectedIndex}
              />
              <TokenIdsView
                tokens={inspectEntry.result.tokens}
                selectedIndex={inspectSelectedIndex}
                onSelect={setInspectSelectedIndex}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
