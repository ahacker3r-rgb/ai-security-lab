"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export type NavUser = { email: string; role: "STUDENT" | "INSTRUCTOR" } | null;

export function Nav({ user }: { user: NavUser }) {
  const router = useRouter();
  const pathname = usePathname();

  const studentLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/labs", label: "Labs" },
    { href: "/token-lab", label: "Token Lab" },
  ];
  const instructorLinks = [
    { href: "/instructor", label: "Overview" },
    { href: "/token-lab", label: "Token Lab" },
  ];
  const anonymousLinks = [{ href: "/token-lab", label: "Token Lab" }];

  const links = !user ? anonymousLinks : user.role === "INSTRUCTOR" ? instructorLinks : studentLinks;
  const homeHref = !user ? "/" : user.role === "INSTRUCTOR" ? "/instructor" : "/dashboard";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={homeHref} className="flex items-center gap-3">
          <Logo height={22} />
          <span className="hidden sm:block h-5 w-px bg-slate-800" />
          <span className="hidden sm:block text-sm font-medium text-slate-300">AI Security Lab</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                pathname === link.href ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden md:inline text-xs text-slate-500">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut size={14} /> Logout
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                <LogIn size={14} /> Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
