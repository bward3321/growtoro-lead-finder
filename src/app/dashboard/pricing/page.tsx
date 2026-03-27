"use client";

import { useState, useEffect, useRef } from "react";
import {
  InstagramLogo,
  TwitterLogo,
  YouTubeLogo,
  FacebookLogo,
  LinkedInLogo,
  TikTokLogo,
  GoogleMapsLogo,
  B2BContactsLogo,
} from "@/components/PlatformLogos";

const PACKS = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    credits: 3000,
    perCredit: "$0.010",
    popular: false,
    features: [
      "All 8 platforms included",
      "Verified emails & phone numbers",
      "CSV export",
      "No expiration on credits",
      "Only charged for verified results",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 79,
    credits: 10000,
    perCredit: "$0.008",
    popular: true,
    features: [
      "All 8 platforms included",
      "Verified emails & phone numbers",
      "CSV export",
      "No expiration on credits",
      "Only charged for verified results",
      "Best value per credit",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    credits: 20000,
    perCredit: "$0.007",
    popular: false,
    features: [
      "All 8 platforms included",
      "Verified emails & phone numbers",
      "CSV export",
      "No expiration on credits",
      "Only charged for verified results",
      "Priority support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    price: 299,
    credits: 40000,
    perCredit: "$0.007",
    popular: false,
    features: [
      "All 8 platforms included",
      "Verified emails & phone numbers",
      "CSV export",
      "No expiration on credits",
      "Only charged for verified results",
      "Priority support",
      "Bulk export up to 10K per scrape",
    ],
  },
];

const PLATFORMS = [
  { Logo: InstagramLogo, name: "Instagram" },
  { Logo: TwitterLogo, name: "X" },
  { Logo: YouTubeLogo, name: "YouTube" },
  { Logo: FacebookLogo, name: "Facebook" },
  { Logo: LinkedInLogo, name: "LinkedIn" },
  { Logo: TikTokLogo, name: "TikTok" },
  { Logo: GoogleMapsLogo, name: "Google Maps" },
  { Logo: B2BContactsLogo, name: "B2B" },
];

const STATS = [
  {
    value: "500M+",
    label: "contacts available",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    value: "8",
    label: "platforms",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    value: "No",
    label: "subscription required",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "CSV",
    label: "export included",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
];

const FAQS = [
  {
    q: "Do credits expire?",
    a: "No. Your credits never expire. Use them whenever you need leads.",
  },
  {
    q: "Can I use credits on any platform?",
    a: "Yes. 1 credit = 1 lead from any of our 8 supported platforms — Instagram, X, YouTube, Facebook, LinkedIn, TikTok, Google Maps, and B2B Contacts.",
  },
  {
    q: "Is there a subscription?",
    a: "No. One-time purchase. Buy more credits whenever you need them.",
  },
  {
    q: "What data do I get?",
    a: "Verified email addresses, phone numbers, company info, LinkedIn profiles, and more — exported as a clean CSV.",
  },
  {
    q: "What platforms are supported?",
    a: "Growtoro pulls leads from 8 platforms: Instagram, X/Twitter, YouTube, Facebook, LinkedIn, TikTok, Google Maps, and B2B Contacts (500M+ professional database). Use your credits on any combination of platforms — one credit works the same everywhere.",
  },
  {
    q: "Am I charged for leads without emails?",
    a: "No. You are only charged credits for contacts where we successfully find a verified email address. If no email is found, no credit is deducted. You only pay for results.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) setHeight(bodyRef.current.scrollHeight);
  }, [a]);

  return (
    <div className="border-b border-card-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-base font-medium text-white">{q}</span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? height : 0 }}
      >
        <div ref={bodyRef} className="pb-5 text-sm text-gray-300 leading-relaxed">
          {a}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [shineComplete, setShineComplete] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShineComplete(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  async function handleBuy(packId: string) {
    setLoading(packId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-20 pb-20">
      {/* ── HEADER ── */}
      <div className="text-center space-y-5 pt-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Simple pricing. Massive value.
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed sm:whitespace-nowrap">
          One credit = one lead from any platform. No subscriptions. No commitments. Pay once, scrape forever.
        </p>
        <div className="flex flex-col items-center gap-5 pt-4">
          <div className="flex items-start justify-center gap-5 flex-wrap">
            {PLATFORMS.map((p) => (
              <div key={p.name} className="flex flex-col items-center gap-1.5">
                <div className="rounded-xl border border-card-border shadow-sm p-2 transition-transform duration-200 hover:scale-[1.15]">
                  <p.Logo className="w-12 h-12" />
                </div>
                <span className="text-xs text-gray-500">{p.name}</span>
                {p.name === "B2B" && (
                  <span className="text-[10px] font-semibold bg-indigo-600 text-white rounded-full px-2 py-0.5 -mt-0.5">B2B</span>
                )}
              </div>
            ))}
          </div>
          <span
            className="text-xl font-semibold bg-clip-text text-transparent"
            style={{
              backgroundSize: "200% 100%",
              backgroundImage: "linear-gradient(90deg, #06B6D4, #8B5CF6, #06B6D4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "badgeGradient 6s linear infinite",
            }}
          >
            Works across all 8 platforms
          </span>
        </div>
      </div>

      {/* ── PRICING CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PACKS.map((pack, i) => (
          <div
            key={pack.id}
            className={`group relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden ${
              pack.popular
                ? "border-accent/40 bg-gradient-to-b from-[#161d2e] to-[#111624] scale-[1.02] shadow-[0_0_30px_rgba(59,130,246,0.12)]"
                : "border-card-border bg-gradient-to-b from-[#151a25] to-[#111624] hover:border-accent/30"
            } hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(6,182,212,0.10)]`}
          >
            {/* Shine sweep on load */}
            {!shineComplete && (
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.03) 55%, transparent 60%)",
                  animation: `cardSweep 0.6s ease-out ${0.2 + i * 0.2}s both`,
                }}
              />
            )}

            {/* Most Popular badge */}
            {pack.popular && (
              <div className="absolute -top-px left-0 right-0 flex justify-center z-30">
                <span
                  className="relative overflow-hidden px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white rounded-b-full"
                  style={{
                    backgroundSize: "200% 100%",
                    backgroundImage: "linear-gradient(90deg, #8B5CF6 0%, #6D5FD4 25%, #06B6D4 50%, #6D5FD4 75%, #8B5CF6 100%)",
                    animation: "badgeGradient 5s linear infinite, badgeGlow 5s ease-in-out infinite",
                    textShadow: "0 1px 6px rgba(139,92,246,0.4)",
                  }}
                >
                  Most Popular
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 animate-[badgeShineSweep_4s_ease-in-out_infinite]" />
                </span>
              </div>
            )}

            <div className="flex flex-col flex-1 p-8 pt-12">
              {/* Tier name */}
              <p className="text-lg font-bold uppercase tracking-[0.15em] text-gray-400">
                {pack.name}
              </p>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-1.5 flex-nowrap">
                <span className="text-6xl font-extrabold text-white">${pack.price}</span>
                <span className="text-lg text-gray-500 whitespace-nowrap">/one-time</span>
              </div>

              {/* Credits */}
              <p className="mt-3 text-2xl font-bold text-accent-cyan">
                {pack.credits.toLocaleString()} credits
              </p>
              <p className="mt-1 text-base text-gray-400">
                {pack.perCredit}/credit
              </p>

              {/* Divider */}
              <div className="my-6 h-px bg-card-border" />

              {/* Features */}
              <ul className="space-y-4 flex-1">
                {pack.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-base text-gray-300 leading-snug">
                    <svg className="h-5 w-5 mt-0.5 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleBuy(pack.id)}
                disabled={loading !== null}
                className="relative mt-8 w-full py-4 text-lg font-bold text-white rounded-lg overflow-hidden bg-gradient-to-r from-accent-cyan to-accent transition-all disabled:opacity-50 hover:brightness-110"
              >
                <span className="relative z-10">
                  {loading === pack.id ? "Processing..." : "Get Started"}
                </span>
                {/* Btn shine sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[btnSweep_0.6s_ease-out_forwards]" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── TRUST LINE ── */}
      <p className="text-center text-accent-cyan text-sm font-medium -mt-12">
        You&apos;re only charged for verified emails found — never for empty results.
      </p>

      {/* ── TRUST / STATS ── */}
      <div
        ref={statsRef}
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col items-center gap-3 py-8 px-6 rounded-2xl bg-card border border-card-border text-center shadow-[0_0_15px_rgba(6,182,212,0.04)] transition-all duration-700 ${
              statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: statsVisible ? `${i * 200}ms` : "0ms" }}
          >
            <div className="text-accent-cyan">{s.icon}</div>
            <p className="text-4xl font-extrabold text-white">{s.value}</p>
            <p className="text-lg text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── COMPARISON TABLE ── */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">Why Growtoro?</h2>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-400 py-3 px-4" />
                <th className="text-center text-sm font-bold text-accent-cyan py-3 px-4 bg-accent/5 rounded-t-lg">
                  Growtoro
                </th>
                <th className="text-center text-sm font-medium text-gray-500 py-3 px-4">Apollo</th>
                <th className="text-center text-sm font-medium text-gray-500 py-3 px-4">Lusha</th>
                <th className="text-center text-sm font-medium text-gray-500 py-3 px-4">PhantomBuster</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                { label: "Price", gt: "$29 one-time", ap: "$49/mo", sc: "$49/mo", pb: "$69/mo" },
                { label: "Credits", gt: "3,000", ap: "900", sc: "480", pb: "Limited" },
                { label: "Platforms", gt: "8", ap: "1 (B2B)", sc: "1 (B2B)", pb: "3" },
                { label: "Subscription", gt: "check", ap: "x", sc: "x", pb: "x" },
              ].map((row) => (
                <tr key={row.label} className="border-t border-card-border">
                  <td className="py-3.5 px-4 font-medium text-gray-300">{row.label}</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-white bg-accent/5">
                    {row.gt === "check" ? (
                      <span className="inline-flex items-center gap-1 text-success">
                        No
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    ) : (
                      row.gt
                    )}
                  </td>
                  {[row.ap, row.sc, row.pb].map((val, ci) => (
                    <td key={ci} className="py-3.5 px-4 text-center text-gray-500">
                      {val === "x" ? (
                        <span className="inline-flex items-center gap-1 text-danger">
                          Yes
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      ) : (
                        val
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
        {FAQS.map((faq) => (
          <FaqItem key={faq.q} q={faq.q} a={faq.a} />
        ))}
      </div>
    </div>
  );
}
