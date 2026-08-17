"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const devMode = process.env.NEXT_PUBLIC_DEV_OTP_MODE === "true";

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setStep("code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Invalid code.");
        return;
      }
      router.push(data.role === "INSTRUCTOR" ? "/instructor" : "/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center gap-3">
          <Logo height={32} />
          <CardTitle>AI Security Lab</CardTitle>
          <CardDescription>
            {step === "email" ? "Sign in with your training email" : `Enter the code sent to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-3">
              <Input
                type="email"
                required
                placeholder="you@training.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" disabled={loading} className="mt-1">
                {loading ? "Sending..." : "Send code"} <ArrowRight size={16} />
              </Button>
              {devMode && (
                <p className="text-xs text-amber-400/80 text-center mt-1">
                  Dev mode: OTP code is 123456 or printed in the server console.
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
              <Input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
                className="text-center tracking-[0.5em] text-lg"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" disabled={loading || code.length !== 6}>
                {loading ? "Verifying..." : "Verify & sign in"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 mt-1"
              >
                Use a different email
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
