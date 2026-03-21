import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as scravio from "@/lib/scravio";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: session.id },
  });

  if (!campaign) return Response.json({ error: "Not found" }, { status: 404 });

  let scravioData = null;
  if (campaign.scravioCampaignId) {
    try {
      scravioData = await scravio.getCampaign(campaign.scravioCampaignId);
      const newStatus = scravioData.status || scravioData.campaign?.status;
      const leadsFound = scravioData.leads_count || scravioData.campaign?.leads_count || 0;
      if (newStatus || leadsFound) {
        await prisma.campaign.update({
          where: { id },
          data: {
            ...(newStatus ? { status: newStatus.toUpperCase() } : {}),
            leadsFound,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching scravio campaign:", error);
    }
  }

  const updated = await prisma.campaign.findFirst({ where: { id } });
  return Response.json({ campaign: updated, scravioData });
}
