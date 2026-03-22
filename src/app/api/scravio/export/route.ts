import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as scravio from "@/lib/scravio";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await request.json();

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: session.id },
  });

  if (!campaign?.scravioCampaignId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await scravio.createListExport(campaign.scravioCampaignId);
    return Response.json({
      exportId: result.id || result.export?.id,
      scravioCampaignId: campaign.scravioCampaignId,
    });
  } catch (error) {
    console.error("Error creating export:", error);
    return Response.json({ error: "Failed to create export" }, { status: 500 });
  }
}
