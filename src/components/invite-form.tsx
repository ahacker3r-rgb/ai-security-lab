"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/instructor/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus({ ok: false, message: data.error ?? "Failed to invite student." });
        return;
      }
      setStatus({ ok: true, message: `${email} can now sign in.` });
      setEmail("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleInvite} className="flex flex-col gap-2">
      <Input
        type="email"
        required
        placeholder="student@training.local"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" disabled={loading} size="sm">
        <UserPlus size={14} /> {loading ? "Inviting..." : "Invite"}
      </Button>
      {status && <p className={`text-xs ${status.ok ? "text-orange-400" : "text-red-400"}`}>{status.message}</p>}
    </form>
  );
}
