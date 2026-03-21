import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as scravio from "@/lib/scravio";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ campaigns });
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
    const scravioResult = await scravio.createCampaign({
      type: extractionType,
      name,
      target_count: targetCount,
      ...config,
    });

    const campaign = await prisma.campaign.create({
      data: {
        userId: session.id,
        scravioCampaignId: scravioResult.id?.toString() || scravioResult.campaign?.id?.toString(),
        name,
        platform,
        extractionType,
        targetCount,
        creditsUsed: targetCount,
        config: JSON.stringify(config),
        status: "RUNNING",
      },
    });

    await prisma.user.update({
      where: { id: session.id },
      data: { credits: { decrement: targetCount } },
    });

    return Response.json({ campaign });
  } catch (error) {
    console.error("Campaign creation error:", error);
    return Response.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
