"use client";

import { useState, useMemo, useEffect } from "react";
import { Eraser, Copy, Check, GitCompareArrows } from "lucide-react";
import type { TokenizerAdapter, TokenizerResult } from "@/lib/tokenizers/types";
import { TOKENIZER_DESCRIPTORS, DEFAULT_TOKENIZER_ID, EXAMPLES, MAX_INPUT_LENGTH } from "@/lib/tokenizers/registry";
import { computeTextStats, tokenToWordRatio } from "@/lib/tokenizers/text-stats";
import { TokenizerSelect } from "./tokenizer-select";
import { TokenizedView } from "./tokenized-view";
import { TokenIdsView } from "./token-ids-view";
import { TokenDetailPanel } from "./token-detail-panel";
import { CompareTokenizers } from "./compare-tokenizers";
import { Button } from "@/components/ui/button";

export function TokenLab() {
  const [inputText, setInputText] = useState("");
  const [activeTokenizerId, setActiveTokenizerId] = useState(DEFAULT_TOKENIZER_ID);
  const [adapters, setAdapters] = useState<Map<string, TokenizerAdapter>>(new Map());
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedIds, setCopiedIds] = useState(false);

  useEffect(() => {
    if (adapters.has(activeTokenizerId)) return;
    let cancelled = false;
    (async () => {
      try {
        const descriptor = TOKENIZER_DESCRIPTORS.find((d) => d.id === activeTokenizerId);
        if (!descriptor) throw new Error("Unknown tokenizer");
        const adapter = await descriptor.load();
        if (!cancelled) setAdapters((prev) => new Map(prev).set(activeTokenizerId, adapter));
      } catch (err) {
        console.error("[token-lab] failed to load tokenizer", activeTokenizerId, err);
        if (!cancelled) setFailedIds((prev) => new Set(prev).add(activeTokenizerId));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTokenizerId, adapters]);

  const activeAdapter = adapters.get(activeTokenizerId);
  const loading = !activeAdapter && !failedIds.has(activeTokenizerId);

  const result: TokenizerResult | null = useMemo(() => {
    if (!activeAdapter) return null;
    try {
      return activeAdapter.tokenize(inputText);
    } catch (err) {
      console.error("[token-lab] tokenize failed", err);
      return null;
    }
  }, [activeAdapter, inputText]);

  const stats = useMemo(() => computeTextStats(inputText), [inputText]);
  const ratio = result ? tokenToWordRatio(result.tokenCount, stats.wordCount) : null;

  function handleExample(text: string) {
    setInputText(text);
    setSelectedIndex(null);
  }

  function handleInputChange(text: string) {
    setInputText(text.slice(0, MAX_INPUT_LENGTH));
    setSelectedIndex(null);
  }

  function handleTokenizerChange(id: string) {
    setActiveTokenizerId(id);
    setSelectedIndex(null);
  }

  function handleClear() {
    setInputText("");
    setSelectedIndex(null);
  }

  async function handleCopyInput() {
    if (!inputText) return;
    await navigator.clipboard.writeText(inputText);
    setCopiedInput(true);
    setTimeout(() => setCopiedInput(false), 1500);
  }

  async function handleCopyIds() {
    if (!result || result.tokenIds.length === 0) return;
    await navigator.clipboard.writeText(JSON.stringify(result.tokenIds));
    setCopiedIds(true);
    setTimeout(() => setCopiedIds(false), 1500);
  }

  const selectedToken = selectedIndex !== null ? (result?.tokens[selectedIndex] ?? null) : null;
  const hasInput = inputText.trim().length > 0;
  const tokenizerFailed = failedIds.has(activeTokenizerId) && !activeAdapter;

  return (
    <main className="mx-auto max-w-6xl flex-1 w-full px-4 py-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Token Lab</h1>
          <p className="text-sm text-slate-400 mt-1">Explore how AI models break language into tokens.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Local tokenizer
          </span>
          <TokenizerSelect
            descriptors={TOKENIZER_DESCRIPTORS}
            activeId={activeTokenizerId}
            onChange={handleTokenizerChange}
          />
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="token-lab-input" className="text-xs font-semibold tracking-wide text-slate-500">
            INPUT TEXT
          </label>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleCopyInput} disabled={!inputText} aria-label="Copy input text">
              {copiedInput ? <Check size={14} /> : <Copy size={14} />} {copiedInput ? "Copied" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={!inputText} aria-label="Clear input text">
              <Eraser size={14} /> Clear
            </Button>
          </div>
        </div>
        <textarea
          id="token-lab-input"
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          maxLength={MAX_INPUT_LENGTH}
          placeholder="Type or paste text to explore tokenization..."
          rows={4}
          className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono leading-relaxed"
        />
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          <span>
            Characters <span className="text-slate-300 font-mono">{stats.characterCount}</span>
          </span>
          <span>
            Words <span className="text-slate-300 font-mono">{stats.wordCount}</span>
          </span>
          <span>
            Tokens <span className="text-slate-300 font-mono">{result?.tokenCount ?? "-"}</span>
          </span>
          <span>
            Token/Word <span className="text-slate-300 font-mono">{ratio !== null ? ratio.toFixed(2) : "-"}</span>
          </span>
        </div>
      </div>

      {/* Example explorer */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-wide text-slate-500">TRY AN EXAMPLE</span>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => handleExample(ex.text)}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-orange-700/50 hover:text-orange-400 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {tokenizerFailed ? (
        <div className="rounded-lg border border-red-800/40 bg-red-500/5 px-4 py-6 text-center">
          <p className="text-sm font-medium text-red-400">Tokenizer unavailable</p>
          <p className="text-xs text-slate-500 mt-1">
            This tokenizer could not process the current input. Try another tokenizer or example.
          </p>
        </div>
      ) : !hasInput ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-12 text-center">
          <p className="text-sm font-medium text-slate-300">Start exploring tokens</p>
          <p className="text-xs text-slate-500 mt-1">
            Type something above or choose an example to see how it is tokenized.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="flex flex-col gap-6 min-w-0">
            <section className="flex flex-col gap-2">
              <span className="text-xs font-semibold tracking-wide text-slate-500">TOKENIZED TEXT</span>
              <TokenizedView
                tokens={result?.tokens ?? null}
                loading={loading}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />
            </section>

            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-slate-500">TOKEN IDS</span>
                <Button variant="ghost" size="sm" onClick={handleCopyIds} disabled={!result?.tokenIds.length}>
                  {copiedIds ? <Check size={14} /> : <Copy size={14} />} {copiedIds ? "Copied" : "Copy IDs"}
                </Button>
              </div>
              <TokenIdsView tokens={result?.tokens ?? null} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
            </section>
          </div>

          <div className="order-first lg:order-none">
            <TokenDetailPanel token={selectedToken} />
          </div>
        </div>
      )}

      <div className="flex justify-center pt-2">
        <Button variant="secondary" onClick={() => setCompareOpen(true)} disabled={!hasInput}>
          <GitCompareArrows size={16} /> Compare Tokenizers
        </Button>
      </div>

      {compareOpen && <CompareTokenizers text={inputText} onClose={() => setCompareOpen(false)} />}
    </main>
  );
}
