import { NextRequest } from "next/server";
import { stripe, CREDIT_PACKS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    console.error("Stripe webhook: missing signature header");
    return Response.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    // Determine credits from metadata or amount
    let credits = parseInt(session.metadata?.credits || "0");
    if (!credits && session.amount_total) {
      const pack = CREDIT_PACKS.find((p) => p.price === session.amount_total);
      if (pack) credits = pack.credits;
    }

    console.log("Stripe webhook checkout.session.completed:", {
      sessionId: session.id,
      userId,
      credits,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
    });

    if (!userId || credits <= 0) {
      console.error("Webhook: missing userId or invalid credits", { userId, credits });
      return Response.json({ received: true, error: "missing_data" });
    }

    // Check if already processed (idempotency)
    const existingPayment = await prisma.payment.findFirst({
      where: { stripeSessionId: session.id },
    });

    if (existingPayment?.status === "COMPLETED") {
      console.log("Webhook: payment already processed, skipping", session.id);
      return Response.json({ received: true, already_processed: true });
    }

    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: credits } },
        }),
        prisma.payment.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: "COMPLETED" },
        }),
      ]);

      console.log(`Webhook: credited ${credits} to user ${userId}`);
    } catch (dbError) {
      console.error("Webhook: database update failed:", dbError);
      return Response.json({ error: "Database update failed" }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
