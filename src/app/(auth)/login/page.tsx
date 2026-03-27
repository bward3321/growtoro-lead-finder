"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/">
            <Image src="/logo.png" alt="Growtoro Lead Finder" width={129} height={32} priority className="mx-auto" />
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-white">Welcome back</h2>
          <p className="mt-1 text-base text-gray-300">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 text-base text-danger bg-danger/10 border border-danger/20 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-base font-medium text-white mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-3 bg-card border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-white mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-3 bg-card border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-base bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-base text-gray-300">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
