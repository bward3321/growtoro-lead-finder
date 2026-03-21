"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  credits: number;
}

export default function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/campaigns/new", label: "New Campaign" },
    { href: "/dashboard/pricing", label: "Buy Credits" },
  ];

  return (
    <nav className="border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            <span className="text-accent">Growtoro</span>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  pathname === item.href
                    ? "text-white bg-accent/20 font-medium"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-card-border rounded-lg">
            <span className="text-xs text-muted">Credits</span>
            <span className="text-sm font-semibold text-accent-cyan">
              {user?.credits?.toLocaleString() ?? "..."}
            </span>
          </div>
          <span className="text-sm text-muted">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
