import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as scravio from "@/lib/scravio";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Find the most recent running Scravio scrape
  const campaign = await prisma.campaign.findFirst({
    where: {
      userId: session.id,
      status: { in: ["RUNNING", "PENDING"] },
      scravioCampaignId: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!campaign) {
    return Response.json({ error: "No running Scravio campaign found" }, { status: 404 });
  }

  // Call Scravio directly and return FULL response
  let scravioResponse: unknown;
  let scravioError: string | null = null;
  try {
    scravioResponse = await scravio.getCampaign(campaign.scravioCampaignId!);
  } catch (error: any) {
    scravioError = error.message;
    scravioResponse = error.scravioResponse || null;
  }

  return Response.json({
    ourCampaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      source: campaign.source,
      scravioCampaignId: campaign.scravioCampaignId,
      leadsFound: campaign.leadsFound,
      targetCount: campaign.targetCount,
      creditsUsed: campaign.creditsUsed,
      createdAt: campaign.createdAt,
    },
    scravioResponse,
    scravioError,
  });
}
