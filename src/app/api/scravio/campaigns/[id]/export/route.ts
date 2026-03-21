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
    const exportResult = await scravio.createExport(campaign.scravioCampaignId);
    return Response.json(exportResult);
  } catch (error) {
    console.error("Error creating export:", error);
    return Response.json({ error: "Failed to create export" }, { status: 500 });
  }
}
