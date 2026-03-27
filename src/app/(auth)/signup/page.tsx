"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
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
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/">
            <Image src="/logo.png" alt="Growtoro Lead Finder" width={129} height={32} priority className="mx-auto" />
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-white">Sign up free</h2>
          <p className="mt-1 text-base text-gray-300">
            No credit card required. Start scraping in seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoFocus
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
              minLength={8}
              className="w-full px-5 py-3 bg-card border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              placeholder="8+ characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-base bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create free account"}
          </button>

          <p className="text-sm text-center text-gray-400">
            You only pay when you purchase lead credits.
          </p>
        </form>

        <p className="text-center text-base text-gray-300">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
