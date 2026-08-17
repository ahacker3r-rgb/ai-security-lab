"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

type AuthMode = "otp" | "access";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("otp");

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [identifier, setIdentifier] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const devMode = process.env.NEXT_PUBLIC_DEV_OTP_MODE === "true";

  function handleModeChange(next: AuthMode) {
    setMode(next);
    setError(null);
    setStep("email");
  }

  function goToDashboard(role: string) {
    router.push(role === "INSTRUCTOR" ? "/instructor" : "/dashboard");
    router.refresh();
  }

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
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Invalid code.");
        return;
      }
      goToDashboard(data.role);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccessLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/access-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, code: accessCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Invalid access code.");
        return;
      }
      goToDashboard(data.role);
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
            {mode === "otp"
              ? step === "email"
                ? "Sign in with your training email"
                : `Enter the code sent to ${email}`
              : "Sign in with your class access code"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => handleModeChange("otp")}
              className={cn(
                "rounded-md py-1.5 text-sm font-medium transition-colors",
                mode === "otp" ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Email code
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("access")}
              className={cn(
                "rounded-md py-1.5 text-sm font-medium transition-colors",
                mode === "access" ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Access code
            </button>
          </div>

          {mode === "otp" ? (
            step === "email" ? (
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
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  className="text-center tracking-[0.5em] text-lg"
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" disabled={loading || otpCode.length !== 6}>
                  {loading ? "Verifying..." : "Verify & sign in"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtpCode("");
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 mt-1"
                >
                  Use a different email
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleAccessLogin} className="flex flex-col gap-3">
              <Input
                required
                placeholder="Email or phone number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoFocus
              />
              <Input
                required
                placeholder="Access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="text-center tracking-[0.3em]"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" disabled={loading || !identifier || !accessCode}>
                {loading ? "Signing in..." : "Sign in"} <ArrowRight size={16} />
              </Button>
              <p className="text-xs text-slate-500 text-center mt-1">
                Use the code your instructor shared with the class.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
