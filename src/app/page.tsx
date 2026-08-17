import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Zap, ShieldCheck, Layers, GitBranch, Wrench, Link2 } from "lucide-react";

const LAB_PREVIEW = [
  { icon: Zap, title: "Direct Prompt Injection", tier: "Beginner" },
  { icon: ShieldCheck, title: "System Instruction Disclosure", tier: "Beginner" },
  { icon: Layers, title: "Instruction vs Data", tier: "Beginner" },
  { icon: GitBranch, title: "Indirect Prompt Injection", tier: "Intermediate" },
  { icon: Layers, title: "RAG Injection", tier: "Intermediate" },
  { icon: GitBranch, title: "Multi-Turn Manipulation", tier: "Intermediate" },
  { icon: Wrench, title: "Tool Calling Injection", tier: "Advanced" },
  { icon: Link2, title: "Chained AI Attack", tier: "Advanced" },
];

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect(user.role === "INSTRUCTOR" ? "/instructor" : "/dashboard");

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-4xl px-4 py-24 text-center flex flex-col items-center gap-6">
        <Logo height={40} />
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-100">
          Break the Prompt.
          <br />
          Understand the Risk.
          <br />
          <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
            Build the Defense.
          </span>
        </h1>
        <p className="max-w-xl text-slate-400">
          Hands-on labs where you attack deliberately vulnerable AI applications - prompt injection,
          RAG poisoning, multi-turn manipulation, and agent tool abuse - to learn how AI applications
          fail and how to design them securely.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login">
            <Button size="lg">Start Training</Button>
          </Link>
          <Link href="/token-lab">
            <Button size="lg" variant="secondary">
              Try Token Lab - no sign-in needed
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LAB_PREVIEW.map(({ icon: Icon, title, tier }) => (
            <div key={title} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col gap-2">
              <Icon size={18} className="text-orange-400" />
              <p className="text-sm font-medium text-slate-200">{title}</p>
              <p className="text-xs text-slate-500">{tier}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
