import type { NormalizedToken } from "@/lib/tokenizers/types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="font-mono text-sm text-slate-200 break-all">{value}</span>
    </div>
  );
}

export function TokenDetailPanel({ token }: { token: NormalizedToken | null }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4 flex flex-col gap-3 lg:sticky lg:top-20">
      <span className="text-xs font-semibold tracking-wide text-slate-500">TOKEN DETAILS</span>

      {!token ? (
        <p className="text-xs text-slate-500">Click a token or token ID to inspect it.</p>
      ) : (
        <>
          <Row label="Token" value={token.isFragment ? "(byte fragment — not valid alone)" : JSON.stringify(token.text)} />
          <Row label="Token ID" value={String(token.id)} />
          <Row label="Position" value={String(token.index + 1)} />
          <Row label="Characters" value={token.isFragment ? "—" : String([...token.text].length)} />
          <Row label="Bytes (UTF-8)" value={token.byteLength !== null ? String(token.byteLength) : "—"} />
          <Row
            label="Character Range"
            value={token.isFragment ? "—" : `${token.start}–${token.end}`}
          />
          {token.isFragment && (
            <p className="text-xs text-amber-400/80 leading-relaxed">
              This token is one raw byte-level piece of a multi-byte character. It only forms valid
              text once combined with its neighboring tokens — a normal outcome of byte-level BPE
              on non-Latin scripts, emoji, or unusual symbols.
            </p>
          )}
        </>
      )}
    </div>
  );
}
