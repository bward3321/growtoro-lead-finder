import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncCampaignStatus, getQueuePosition } from "@/lib/queue";

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

  // Sync status from Scravio (also triggers queue if completed)
  const updated = await syncCampaignStatus(id);

  let queuePosition = 0;
  if (updated?.status === "QUEUED") {
    queuePosition = await getQueuePosition(id);
  }

  return Response.json({ campaign: updated, queuePosition });
}

export async function DELETE(
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

  // Only allow deleting terminal-state campaigns
  if (!["FAILED", "COMPLETED", "STOPPED"].includes(campaign.status)) {
    return Response.json({ error: "Cannot delete active campaign" }, { status: 400 });
  }

  await prisma.campaign.delete({ where: { id } });

  return Response.json({ deleted: true });
}
