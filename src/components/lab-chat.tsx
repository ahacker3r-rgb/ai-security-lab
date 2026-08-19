"use client";

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  User,
  Wrench,
  Lightbulb,
  RotateCcw,
  Send,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Trophy,
  X,
  Lock,
  Download,
  Paperclip,
} from "lucide-react";
import { UPLOAD_MARKER_TOOL_NAME, type AttackReplayStep, type ContextItem, type SimulatedTool, type TranscriptMessage } from "@/lib/labs/types";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface DisplayMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
}

interface LabMeta {
  slug: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  objective: string;
  estimatedTime: string;
  hintsTotal: number;
  explanation: {
    whatHappened: string;
    whyItHappened: string;
    securityImpact: string;
    defenses: string[];
  };
  attackReplay: AttackReplayStep[];
  contextItems: ContextItem[];
  contextRequiresUpload: boolean;
  tools: SimulatedTool[];
}

function toDisplayMessage(m: TranscriptMessage & { role: "user" | "assistant" | "tool" }): DisplayMessage {
  if (m.role === "tool" && m.toolName === UPLOAD_MARKER_TOOL_NAME) {
    let filename = "document";
    try {
      filename = JSON.parse(m.content)?.filename ?? filename;
    } catch {
      // fall back to generic label
    }
    return { role: "tool", toolName: m.toolName, content: filename };
  }
  return m;
}

const DIFFICULTY_VARIANT = { BEGINNER: "beginner", INTERMEDIATE: "intermediate", ADVANCED: "advanced" } as const;

export function LabChat({
  lab,
  nextLabSlug,
  initialMessages,
  initialCompleted,
  initialAttemptCount,
  initialHintCount,
}: {
  lab: LabMeta;
  nextLabSlug: string | null;
  initialMessages: TranscriptMessage[];
  initialCompleted: boolean;
  initialAttemptCount: number;
  initialHintCount: number;
}) {
  const [messages, setMessages] = useState<DisplayMessage[]>(() =>
    initialMessages
      .filter((m): m is TranscriptMessage & { role: "user" | "assistant" | "tool" } => m.role !== "system")
      .map(toDisplayMessage)
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(initialCompleted);
  const [attemptCount, setAttemptCount] = useState(initialAttemptCount);
  const [hintCount, setHintCount] = useState(initialHintCount);
  const [hints, setHints] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setLoading(true);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await fetch(`/api/labs/${lab.slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const newMessages: DisplayMessage[] = [];
      for (const call of data.toolCalls ?? []) {
        newMessages.push({
          role: "tool",
          toolName: call.name,
          content: `${JSON.stringify(call.args)} -> ${JSON.stringify(call.result)}`,
        });
      }
      newMessages.push({ role: "assistant", content: data.reply });

      setMessages((prev) => [...prev, ...newMessages]);
      setAttemptCount(data.attemptCount);

      if (data.completed && !completed) {
        setCompleted(true);
        setShowSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleHint() {
    const res = await fetch(`/api/labs/${lab.slug}/hint`, { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      setHintCount(data.hintCount);
      setHints((prev) => (prev.length < data.hintCount ? [...prev, data.hint.text] : prev));
      setShowHints(true);
    }
  }

  async function handleReset() {
    if (!confirm("Reset this lab? Your conversation and hints will be cleared.")) return;
    setResetting(true);
    try {
      await fetch(`/api/labs/${lab.slug}/reset`, { method: "POST" });
      setMessages([]);
      setAttemptCount(0);
      setHintCount(0);
      setHints([]);
      setError(null);
      setUploadError(null);
      setCompleted(false);
      setShowSuccess(false);
    } finally {
      setResetting(false);
    }
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      const content = await file.text();
      const res = await fetch(`/api/labs/${lab.slug}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setUploadError(data.error ?? "Upload failed.");
        return;
      }
      setMessages((prev) => [...prev, { role: "tool", toolName: UPLOAD_MARKER_TOOL_NAME, content: file.name }]);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const status = completed ? "Completed" : messages.length > 0 ? "In Progress" : "Available";

  return (
    <main className="mx-auto max-w-4xl flex-1 w-full px-4 py-6 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-100">{lab.title}</h1>
          <Badge variant={DIFFICULTY_VARIANT[lab.difficulty]}>{lab.difficulty}</Badge>
          <Badge variant={completed ? "success" : "default"}>{status}</Badge>
        </div>
        <p className="text-sm text-slate-400 flex items-start gap-1.5">
          <Target size={14} className="shrink-0 mt-0.5 text-orange-400" /> {lab.objective}
        </p>
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Clock size={12} /> {lab.estimatedTime}
        </p>
      </div>

      {lab.contextItems.length > 0 && (
        <div className="rounded-lg border border-amber-800/40 bg-amber-500/5">
          <button
            onClick={() => setShowContext((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-amber-300"
          >
            Lab Context - {lab.contextItems.length} item{lab.contextItems.length > 1 ? "s" : ""} available to the assistant
            {showContext ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showContext && (
            <div className="flex flex-col gap-3 px-4 pb-4">
              {lab.contextItems.map((item) =>
                item.downloadPassword ? (
                  <LockedFile key={item.source} item={item} />
                ) : (
                  <div key={item.source} className="rounded-md border border-slate-800 bg-slate-950">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800">
                      <span className="text-xs font-mono text-slate-400">{item.source}</span>
                      <Badge variant={item.trusted ? "success" : "advanced"}>{item.trusted ? "trusted" : "untrusted"}</Badge>
                    </div>
                    <pre className="whitespace-pre-wrap px-3 py-2 text-xs text-slate-300 font-mono overflow-x-auto">
                      {item.content}
                    </pre>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div ref={scrollRef} className="flex flex-col gap-3 p-4 h-[420px] overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Bot size={16} /> Say hello to get started.
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "tool" ? (
              m.toolName === UPLOAD_MARKER_TOOL_NAME ? (
                <div key={i} className="flex items-center gap-2 text-xs text-emerald-400/80 bg-emerald-500/5 border border-emerald-800/30 rounded-md px-3 py-1.5 self-start">
                  <Paperclip size={12} /> <span>Uploaded {m.content}</span>
                </div>
              ) : (
                <div key={i} className="flex items-center gap-2 text-xs text-sky-400/80 bg-sky-500/5 border border-sky-800/30 rounded-md px-3 py-1.5 self-start">
                  <Wrench size={12} /> <span className="font-mono">{m.toolName}</span>
                  <span className="text-slate-500 truncate max-w-xs">{m.content}</span>
                </div>
              )
            ) : (
              <div key={i} className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-slate-700" : "bg-orange-500/15 text-orange-400"}`}>
                  {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div
                  className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-slate-800 text-slate-100" : "bg-slate-800/60 text-slate-200 border border-slate-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            )
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 self-start">
              <Loader2 size={14} className="animate-spin" /> Thinking...
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-2 text-sm text-red-400 bg-red-500/5 border-t border-red-900/40">{error}</div>
        )}
        {uploadError && (
          <div className="px-4 py-2 text-sm text-red-400 bg-red-500/5 border-t border-red-900/40">{uploadError}</div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-800 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </form>

        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2.5 text-xs text-slate-500">
          <span>Attempts: {attemptCount}</span>
          <span>Status: {status}</span>
          <div className="flex items-center gap-2">
            {lab.contextRequiresUpload && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,text/plain"
                  className="hidden"
                  onChange={handleFileSelected}
                />
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />} Upload Document
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleHint} disabled={hintCount >= lab.hintsTotal && hints.length >= lab.hintsTotal}>
              <Lightbulb size={14} /> Hint ({hintCount}/{lab.hintsTotal})
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={resetting}>
              <RotateCcw size={14} /> Reset Lab
            </Button>
          </div>
        </div>
      </div>

      {showHints && hints.length > 0 && (
        <div className="rounded-lg border border-sky-800/40 bg-sky-500/5 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sky-300 flex items-center gap-1.5">
              <Lightbulb size={14} /> Hints
            </span>
            <button onClick={() => setShowHints(false)} className="text-slate-500 hover:text-slate-300">
              <X size={14} />
            </button>
          </div>
          <ol className="list-decimal list-inside flex flex-col gap-1 text-sm text-slate-300">
            {hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        </div>
      )}

      {completed && !showSuccess && (
        <button
          onClick={() => setShowSuccess(true)}
          className="flex items-center justify-center gap-2 rounded-lg border border-orange-800/40 bg-orange-500/5 px-4 py-3 text-sm font-medium text-orange-400 hover:bg-orange-500/10"
        >
          <Trophy size={16} /> Challenge already completed - view explanation
        </button>
      )}

      {showSuccess && (
        <SuccessOverlay
          lab={lab}
          nextLabSlug={nextLabSlug}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </main>
  );
}

function SuccessOverlay({
  lab,
  nextLabSlug,
  onClose,
}: {
  lab: LabMeta;
  nextLabSlug: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-orange-800/40 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2 text-orange-400">
            <CheckCircle2 size={20} />
            <span className="font-semibold">Challenge Completed</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-100">{lab.title} - Successful</h2>

          <Section title="What Happened?" text={lab.explanation.whatHappened} />
          <Section title="Why Did It Happen?" text={lab.explanation.whyItHappened} />
          <Section title="Security Impact" text={lab.explanation.securityImpact} />

          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">How To Defend</h3>
            <ul className="list-disc list-inside flex flex-col gap-1 text-sm text-slate-400">
              {lab.explanation.defenses.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Attack Replay</h3>
            <div className="flex flex-col gap-1.5">
              {lab.attackReplay.map((step, i) => (
                <div key={i} className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
                  <TrustDot trust={step.trust} />
                  <div>
                    <p className="text-xs font-medium text-slate-200">{step.label}</p>
                    <p className="text-xs text-slate-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 px-6 py-4">
          <Button variant="ghost" onClick={onClose}>
            Replay Attack
          </Button>
          <Link href="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
          {nextLabSlug && (
            <Link href={`/labs/${nextLabSlug}`}>
              <Button>Next Lab</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

function LockedFile({ item }: { item: ContextItem }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleDownload(e: FormEvent) {
    e.preventDefault();
    if (input !== item.downloadPassword) {
      setError("Incorrect password.");
      return;
    }
    setError(null);
    const blob = new Blob([item.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.filename ?? "document.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-md border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800">
        <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
          <Lock size={12} /> {item.filename ?? item.source}
        </span>
        <Badge variant={item.trusted ? "success" : "advanced"}>{item.trusted ? "trusted" : "untrusted"}</Badge>
      </div>
      <div className="flex flex-col gap-2 px-3 py-2.5">
        <p className="text-xs text-slate-500">
          This file is password protected.
        </p>
        <form onSubmit={handleDownload} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter password"
            className="h-8 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <Button type="submit" size="sm">
            <Download size={12} /> Download
          </Button>
        </form>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}

function TrustDot({ trust }: { trust: AttackReplayStep["trust"] }) {
  const color =
    trust === "trusted"
      ? "bg-green-500"
      : trust === "untrusted"
        ? "bg-red-500"
        : trust === "model"
          ? "bg-sky-500"
          : trust === "tool"
            ? "bg-amber-500"
            : "bg-slate-500";
  return <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${color}`} />;
}
