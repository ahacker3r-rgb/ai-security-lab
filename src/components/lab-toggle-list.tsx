"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface LabRow {
  slug: string;
  title: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  enabled: boolean;
}

const DIFFICULTY_VARIANT = { BEGINNER: "beginner", INTERMEDIATE: "intermediate", ADVANCED: "advanced" } as const;

export function LabToggleList({ labs }: { labs: LabRow[] }) {
  const [rows, setRows] = useState(labs);
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(slug: string, enabled: boolean) {
    setPending(slug);
    setRows((prev) => prev.map((r) => (r.slug === slug ? { ...r, enabled } : r)));
    try {
      const res = await fetch(`/api/instructor/labs/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        setRows((prev) => prev.map((r) => (r.slug === slug ? { ...r, enabled: !enabled } : r)));
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col divide-y divide-slate-800">
      {rows.map((lab) => (
        <div key={lab.slug} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-200">{lab.title}</span>
            <Badge variant={DIFFICULTY_VARIANT[lab.difficulty]}>{lab.difficulty}</Badge>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            {lab.enabled ? "Enabled" : "Disabled"}
            <input
              type="checkbox"
              checked={lab.enabled}
              disabled={pending === lab.slug}
              onChange={(e) => toggle(lab.slug, e.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
          </label>
        </div>
      ))}
    </div>
  );
}
