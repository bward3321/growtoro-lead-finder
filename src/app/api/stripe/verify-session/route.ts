import { getSession } from "@/lib/auth";
import { stripe, CREDIT_PACKS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Strategy 1: Check our DB for a PENDING payment and verify with Stripe
    const pendingPayment = await prisma.payment.findFirst({
      where: { userId: session.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    if (pendingPayment) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(
        pendingPayment.stripeSessionId
      );

      if (checkoutSession.payment_status === "paid") {
        let credits = parseInt(checkoutSession.metadata?.credits || "0");
        if (!credits && checkoutSession.amount_total) {
          const pack = CREDIT_PACKS.find((p) => p.price === checkoutSession.amount_total);
          if (pack) credits = pack.credits;
        }

        if (credits > 0) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: session.id },
              data: { credits: { increment: credits } },
            }),
            prisma.payment.update({
              where: { id: pendingPayment.id },
              data: { status: "COMPLETED" },
            }),
          ]);

          return Response.json({ credited: true, credits });
        }
      }
    }

    // Strategy 2: Search Stripe directly for recent completed sessions
    // This handles cases where the payment record wasn't created or was lost
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return Response.json({ credited: false, reason: "user_not_found" });

    const sessions = await stripe.checkout.sessions.list({
      limit: 5,
    });

    for (const cs of sessions.data) {
      // Match by client_reference_id, metadata userId, or customer email
      const isOurs =
        cs.client_reference_id === session.id ||
        cs.metadata?.userId === session.id ||
        cs.customer_details?.email === user.email;

      if (!isOurs || cs.payment_status !== "paid") continue;

      // Check if we already credited this session
      const existing = await prisma.payment.findFirst({
        where: { stripeSessionId: cs.id, status: "COMPLETED" },
      });
      if (existing) continue;

      let credits = parseInt(cs.metadata?.credits || "0");
      if (!credits && cs.amount_total) {
        const pack = CREDIT_PACKS.find((p) => p.price === cs.amount_total);
        if (pack) credits = pack.credits;
      }
      if (!credits) continue;

      // Credit the user — upsert the payment record
      const existingPending = await prisma.payment.findFirst({
        where: { stripeSessionId: cs.id },
      });

      if (existingPending) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: session.id },
            data: { credits: { increment: credits } },
          }),
          prisma.payment.update({
            where: { id: existingPending.id },
            data: { status: "COMPLETED" },
          }),
        ]);
      } else {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: session.id },
            data: { credits: { increment: credits } },
          }),
          prisma.payment.create({
            data: {
              userId: session.id,
              stripeSessionId: cs.id,
              amount: cs.amount_total || 0,
              credits,
              status: "COMPLETED",
            },
          }),
        ]);
      }

      return Response.json({ credited: true, credits });
    }

    return Response.json({ credited: false, reason: "no_uncredited_payment" });
  } catch (error) {
    console.error("Verify session error:", error);
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}
