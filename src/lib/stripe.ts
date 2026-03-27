import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export const CREDIT_PACKS = [
  { id: "starter", name: "Starter", price: 2900, credits: 3000, label: "$29" },
  { id: "growth", name: "Growth", price: 7900, credits: 10000, label: "$79" },
  { id: "pro", name: "Pro", price: 14900, credits: 20000, label: "$149" },
  { id: "scale", name: "Scale", price: 29900, credits: 40000, label: "$299" },
] as const;
