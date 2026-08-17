import type { TokenizerDescriptor } from "@/lib/tokenizers/types";
import { ChevronDown } from "lucide-react";

export function TokenizerSelect({
  descriptors,
  activeId,
  onChange,
}: {
  descriptors: TokenizerDescriptor[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="relative">
      <label htmlFor="tokenizer-select" className="sr-only">
        Tokenizer
      </label>
      <select
        id="tokenizer-select"
        value={activeId}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-slate-700 bg-slate-900 py-1.5 pl-3 pr-8 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
      >
        {descriptors.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label} ({d.family})
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  );
}
