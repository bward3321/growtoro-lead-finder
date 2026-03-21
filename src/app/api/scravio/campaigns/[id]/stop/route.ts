import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as scravio from "@/lib/scravio";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: session.id },
  });

  if (!campaign?.scravioCampaignId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await scravio.stopCampaign(campaign.scravioCampaignId);
    await prisma.campaign.update({
      where: { id },
      data: { status: "STOPPED" },
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error stopping campaign:", error);
    return Response.json({ error: "Failed to stop campaign" }, { status: 500 });
  }
}
