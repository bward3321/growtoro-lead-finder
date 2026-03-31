import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processQueue } from "@/lib/queue";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  // Calculate queue positions for queued campaigns
  const queuedCampaigns = campaigns.filter((c) => c.status === "QUEUED");
  const allQueued = await prisma.campaign.findMany({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  const queuePositions: Record<string, number> = {};
  for (const campaign of queuedCampaigns) {
    const pos = allQueued.findIndex((q) => q.id === campaign.id);
    queuePositions[campaign.id] = pos >= 0 ? pos + 1 : 0;
  }

  return Response.json({ campaigns, queuePositions });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, platform, extractionType, targetCount, config } = body;

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || user.credits < targetCount) {
    return Response.json({ error: "Insufficient credits" }, { status: 402 });
  }

  try {
    // Save as QUEUED instead of immediately calling Scravio
    const campaign = await prisma.campaign.create({
      data: {
        userId: session.id,
        name,
        platform,
        extractionType,
        targetCount,
        creditsUsed: targetCount,
        config: JSON.stringify(config),
        status: "QUEUED",
        queuedAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: session.id },
      data: { credits: { decrement: targetCount } },
    });

    // Trigger queue processing to launch if slots available
    await processQueue();

    // Re-fetch to get updated status (may have changed from QUEUED to RUNNING)
    const updated = await prisma.campaign.findUnique({
      where: { id: campaign.id },
    });

    return Response.json({ campaign: updated });
  } catch (error) {
    console.error("Campaign creation error:", error);
    return Response.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
