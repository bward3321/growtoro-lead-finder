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
    window.location.href = "/";
  }

  return (
    <nav className="border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/dashboard">
            <img src="/logo.png" alt="Growtoro" style={{ height: 28, width: "auto" }} />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`px-4 py-2 text-base rounded-md transition-colors ${
                pathname === "/dashboard"
                  ? "text-white bg-accent/20 font-medium"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/history"
              className={`px-4 py-2 text-base rounded-md transition-colors ${
                pathname === "/dashboard/history"
                  ? "text-white bg-accent/20 font-medium"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              History
            </Link>
            <Link
              href="/dashboard/campaigns/new"
              className={`px-4 py-2 text-base rounded-md transition-colors ${
                pathname === "/dashboard/campaigns/new"
                  ? "text-white bg-accent/20 font-medium"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              New Scrape
            </Link>
            <Link
              href="/dashboard/pricing"
              className="px-5 py-2 text-base font-semibold text-white rounded-lg bg-gradient-to-r from-accent to-accent-cyan hover:from-accent/90 hover:to-accent-cyan/90 transition-all"
            >
              Buy Credits
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-card-border rounded-lg">
            <span className="text-sm text-gray-300">Credits</span>
            <span className="text-base font-bold text-accent-cyan">
              {user?.credits?.toLocaleString() ?? "..."}
            </span>
          </div>
          <span className="text-sm text-gray-300">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
