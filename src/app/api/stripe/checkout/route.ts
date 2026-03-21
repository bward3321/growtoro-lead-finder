import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { stripe, CREDIT_PACKS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packId } = await request.json();
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return Response.json({ error: "Invalid pack" }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

    console.log("Creating Stripe checkout session:", {
      packId: pack.id,
      price: pack.price,
      credits: pack.credits,
      userId: session.id,
      baseUrl,
    });

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
      success_url: `${baseUrl}/dashboard?payment=success`,
      cancel_url: `${baseUrl}/dashboard/pricing?payment=cancelled`,
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
  } catch (error) {
    console.error("Stripe checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Checkout failed", details: message }, { status: 500 });
  }
}
