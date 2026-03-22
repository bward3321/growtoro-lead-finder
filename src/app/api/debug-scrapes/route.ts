export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    total: campaigns.length,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      userId: c.userId,
      scravioCampaignId: c.scravioCampaignId,
      name: c.name,
      platform: c.platform,
      extractionType: c.extractionType,
      status: c.status,
      targetCount: c.targetCount,
      creditsUsed: c.creditsUsed,
      creditsRefunded: c.creditsRefunded,
      leadsFound: c.leadsFound,
      config: c.config,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
}
