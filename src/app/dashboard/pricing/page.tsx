"use client";

import { useState } from "react";

const PACKS = [
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    credits: "500",
    perLead: "$0.058",
    popular: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$79",
    credits: "2,000",
    perLead: "$0.040",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$149",
    credits: "5,000",
    perLead: "$0.030",
    popular: false,
  },
  {
    id: "scale",
    name: "Scale",
    price: "$299",
    credits: "15,000",
    perLead: "$0.020",
    popular: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleBuy(packId: string) {
    setLoading(packId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Buy Credits</h1>
        <p className="text-sm text-muted mt-1">
          One-time credit packs. No subscriptions, pay as you go.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`relative p-6 rounded-xl border transition-all ${
              pack.popular
                ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                : "border-card-border bg-card"
            }`}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-white text-xs font-semibold rounded-full">
                Most Popular
              </div>
            )}
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">{pack.name}</h3>
              <div>
                <span className="text-3xl font-bold">{pack.price}</span>
              </div>
              <div className="space-y-1">
                <p className="text-accent-cyan font-semibold">{pack.credits} leads</p>
                <p className="text-xs text-muted">{pack.perLead} per lead</p>
              </div>
              <button
                onClick={() => handleBuy(pack.id)}
                disabled={loading !== null}
                className={`w-full py-2.5 font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                  pack.popular
                    ? "bg-accent text-white hover:bg-accent/90"
                    : "bg-card border border-card-border text-foreground hover:bg-white/5"
                }`}
              >
                {loading === pack.id ? "Processing..." : "Buy Now"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
