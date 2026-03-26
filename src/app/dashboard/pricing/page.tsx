"use client";

import { useState } from "react";

const SOCIAL_PACKS = [
  { id: "starter", name: "Starter", price: "$29", credits: "500", perLead: "$0.058", popular: false },
  { id: "growth", name: "Growth", price: "$79", credits: "2,000", perLead: "$0.040", popular: true },
  { id: "pro", name: "Pro", price: "$149", credits: "5,000", perLead: "$0.030", popular: false },
  { id: "scale", name: "Scale", price: "$299", credits: "15,000", perLead: "$0.020", popular: false },
];

const GOOGLEMAPS_PACKS = [
  { id: "gm-starter", name: "Starter", price: "$29", credits: "2,000", perLead: "$0.015", popular: false },
  { id: "gm-growth", name: "Growth", price: "$59", credits: "5,000", perLead: "$0.012", popular: true },
  { id: "gm-pro", name: "Pro", price: "$99", credits: "10,000", perLead: "$0.010", popular: false },
  { id: "gm-scale", name: "Scale", price: "$199", credits: "25,000", perLead: "$0.008", popular: false },
];

const B2B_PACKS = [
  { id: "b2b-starter", name: "Starter", price: "$49", credits: "500", perLead: "$0.098", popular: false },
  { id: "b2b-growth", name: "Growth", price: "$99", credits: "1,500", perLead: "$0.066", popular: true },
  { id: "b2b-pro", name: "Pro", price: "$199", credits: "4,000", perLead: "$0.050", popular: false },
  { id: "b2b-scale", name: "Scale", price: "$399", credits: "10,000", perLead: "$0.040", popular: false },
];

type Mode = "social" | "googlemaps" | "b2bcontacts";

const MODES: { id: Mode; label: string }[] = [
  { id: "social", label: "Social Media" },
  { id: "googlemaps", label: "Google Maps" },
  { id: "b2bcontacts", label: "B2B Contacts" },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("social");

  const packs = mode === "social" ? SOCIAL_PACKS : mode === "googlemaps" ? GOOGLEMAPS_PACKS : B2B_PACKS;
  const isGM = mode === "googlemaps";
  const isB2B = mode === "b2bcontacts";
  const unitLabel = isB2B ? "contacts" : isGM ? "leads" : "verified emails";
  const perUnit = isB2B ? "contact" : isGM ? "lead" : "email";
  const accentColor = isB2B ? "#4F46E5" : isGM ? "#34A853" : "";
  const modeIndex = MODES.findIndex((m) => m.id === mode);

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

        {/* Three-way toggle */}
        <div className="flex items-center justify-center mt-6">
          <div className="relative inline-flex items-center bg-card border border-card-border rounded-full p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`relative z-10 px-5 py-2.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
                  mode === m.id ? "text-white" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {m.label}
              </button>
            ))}
            {/* Sliding pill */}
            <div
              className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out ${
                !accentColor ? "bg-accent" : ""
              }`}
              style={{
                width: `calc(${100 / 3}% - 4px)`,
                transform: `translateX(calc(${modeIndex * 100}% + ${modeIndex * 8}px))`,
                ...(accentColor ? { backgroundColor: accentColor } : {}),
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {packs.map((pack) => {
          const popularBg = isB2B ? "bg-[#4F46E5]" : isGM ? "bg-[#34A853]" : "badge-shine";
          const popularBorder = isB2B
            ? "border-[#4F46E5] bg-[#4F46E5]/5 ring-1 ring-[#4F46E5]/20"
            : isGM
              ? "border-[#34A853] bg-[#34A853]/5 ring-1 ring-[#34A853]/20"
              : "border-accent bg-accent/5 ring-1 ring-accent/20";
          const creditColor = isB2B ? "text-[#818CF8]" : isGM ? "text-[#34A853]" : "text-accent-cyan";
          const btnPopular = isB2B
            ? "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
            : isGM
              ? "bg-[#34A853] text-white hover:bg-[#34A853]/90"
              : "bg-accent text-white hover:bg-accent/90";

          return (
            <div
              key={pack.id}
              className={`relative p-8 rounded-xl border transition-all ${
                pack.popular ? popularBorder : "border-card-border bg-card"
              }`}
            >
              {pack.popular && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1.5 text-sm font-semibold rounded-full text-white ${popularBg}`}
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
                  <p className={`text-xl font-semibold whitespace-nowrap ${creditColor}`}>
                    {pack.credits} {unitLabel}
                  </p>
                  <p className="text-base text-gray-300">
                    {pack.perLead} per {perUnit}
                  </p>
                </div>
                <button
                  onClick={() => handleBuy(pack.id)}
                  disabled={loading !== null}
                  className={`w-full py-4 text-lg font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                    pack.popular
                      ? btnPopular
                      : "bg-card border border-card-border text-white hover:bg-white/5"
                  }`}
                >
                  {loading === pack.id ? "Processing..." : "Buy Now"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
