import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export const CREDIT_PACKS = [
  { id: "starter", name: "Starter", price: 2900, credits: 500, label: "$29" },
  { id: "growth", name: "Growth", price: 7900, credits: 2000, label: "$79" },
  { id: "pro", name: "Pro", price: 14900, credits: 5000, label: "$149" },
  { id: "scale", name: "Scale", price: 29900, credits: 15000, label: "$299" },
] as const;

export const GOOGLE_MAPS_PACKS = [
  { id: "gm-starter", name: "Starter", price: 2900, credits: 2000, label: "$29" },
  { id: "gm-growth", name: "Growth", price: 5900, credits: 5000, label: "$59" },
  { id: "gm-pro", name: "Pro", price: 9900, credits: 10000, label: "$99" },
  { id: "gm-scale", name: "Scale", price: 19900, credits: 25000, label: "$199" },
] as const;

export const B2B_PACKS = [
  { id: "b2b-starter", name: "Starter", price: 4900, credits: 1000, label: "$49" },
  { id: "b2b-growth", name: "Growth", price: 9900, credits: 3000, label: "$99" },
  { id: "b2b-pro", name: "Pro", price: 19900, credits: 8000, label: "$199" },
  { id: "b2b-scale", name: "Scale", price: 39900, credits: 20000, label: "$399" },
] as const;
