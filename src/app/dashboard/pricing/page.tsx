"use client";

import { useState } from "react";

const SOCIAL_PACKS = [
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

const GOOGLEMAPS_PACKS = [
  {
    id: "gm-starter",
    name: "Starter",
    price: "$29",
    credits: "2,000",
    perLead: "$0.015",
    popular: false,
  },
  {
    id: "gm-growth",
    name: "Growth",
    price: "$59",
    credits: "5,000",
    perLead: "$0.012",
    popular: true,
  },
  {
    id: "gm-pro",
    name: "Pro",
    price: "$99",
    credits: "10,000",
    perLead: "$0.010",
    popular: false,
  },
  {
    id: "gm-scale",
    name: "Scale",
    price: "$199",
    credits: "25,000",
    perLead: "$0.008",
    popular: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [mode, setMode] = useState<"social" | "googlemaps">("social");

  const packs = mode === "social" ? SOCIAL_PACKS : GOOGLEMAPS_PACKS;
  const isGM = mode === "googlemaps";
  const unitLabel = isGM ? "leads" : "verified emails";

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
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Buy Credits</h1>
        <p className="text-base text-gray-300 mt-2">
          One-time credit packs. No subscriptions, pay as you go.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center mt-6">
          <div className="relative inline-flex items-center bg-card border border-card-border rounded-full p-1">
            <button
              onClick={() => setMode("social")}
              className={`relative z-10 px-6 py-2.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
                mode === "social"
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Social Media
            </button>
            <button
              onClick={() => setMode("googlemaps")}
              className={`relative z-10 px-6 py-2.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
                mode === "googlemaps"
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Google Maps
            </button>
            {/* Sliding pill */}
            <div
              className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out ${
                mode === "social"
                  ? "left-1 bg-accent"
                  : "bg-[#34A853]"
              }`}
              style={{
                width: mode === "social" ? "calc(50% - 4px)" : "calc(50% - 4px)",
                transform: mode === "googlemaps" ? "translateX(calc(100% + 8px))" : "translateX(0)",
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className={`relative p-8 rounded-xl border transition-all ${
              pack.popular
                ? isGM
                  ? "border-[#34A853] bg-[#34A853]/5 ring-1 ring-[#34A853]/20"
                  : "border-accent bg-accent/5 ring-1 ring-accent/20"
                : "border-card-border bg-card"
            }`}
          >
            {pack.popular && (
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1.5 text-sm font-semibold rounded-full text-white ${
                  isGM ? "bg-[#34A853]" : "badge-shine"
                }`}
              >
                Most Popular
              </div>
            )}
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-bold text-white">{pack.name}</h3>
              <div>
                <span className="text-5xl font-bold text-white">{pack.price}</span>
              </div>
              <div className="space-y-2">
                <p
                  className={`text-xl font-semibold whitespace-nowrap ${
                    isGM ? "text-[#34A853]" : "text-accent-cyan"
                  }`}
                >
                  {pack.credits} {unitLabel}
                </p>
                <p className="text-base text-gray-300">
                  {pack.perLead} per {isGM ? "lead" : "email"}
                </p>
              </div>
              <button
                onClick={() => handleBuy(pack.id)}
                disabled={loading !== null}
                className={`w-full py-4 text-lg font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                  pack.popular
                    ? isGM
                      ? "bg-[#34A853] text-white hover:bg-[#34A853]/90"
                      : "bg-accent text-white hover:bg-accent/90"
                    : "bg-card border border-card-border text-white hover:bg-white/5"
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
