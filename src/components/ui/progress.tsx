import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-800", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-orange-400 transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
