import { getSession } from "@/lib/auth";
import { stripe, CREDIT_PACKS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Find the user's most recent PENDING payment
    const pendingPayment = await prisma.payment.findFirst({
      where: { userId: session.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    if (!pendingPayment) {
      return Response.json({ credited: false, reason: "no_pending_payment" });
    }

    // Check the session status on Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      pendingPayment.stripeSessionId
    );

    if (checkoutSession.payment_status !== "paid") {
      return Response.json({ credited: false, reason: "not_paid" });
    }

    // Determine credits from metadata or from amount
    let credits = parseInt(checkoutSession.metadata?.credits || "0");

    if (!credits && checkoutSession.amount_total) {
      const pack = CREDIT_PACKS.find((p) => p.price === checkoutSession.amount_total);
      if (pack) credits = pack.credits;
    }

    if (!credits) {
      return Response.json({ credited: false, reason: "unknown_amount" });
    }

    // Credit the user and mark payment as completed
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
  } catch (error) {
    console.error("Verify session error:", error);
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}
