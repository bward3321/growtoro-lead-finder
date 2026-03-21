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
