import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { stripe, CREDIT_PACKS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { packId } = await request.json();
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return Response.json({ error: "Invalid pack" }, { status: 400 });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${pack.name} - ${pack.credits.toLocaleString()} Lead Credits`,
          },
          unit_amount: pack.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: session.id,
      packId: pack.id,
      credits: pack.credits.toString(),
    },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/pricing?payment=cancelled`,
  });

  await prisma.payment.create({
    data: {
      userId: session.id,
      stripeSessionId: checkoutSession.id,
      amount: pack.price,
      credits: pack.credits,
      status: "PENDING",
    },
  });

  return Response.json({ url: checkoutSession.url });
}
