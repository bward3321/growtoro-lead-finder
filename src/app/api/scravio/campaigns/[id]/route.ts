import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncCampaignStatus, getQueuePosition } from "@/lib/queue";
import * as spherescout from "@/lib/spherescout";

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

  // SphereScout campaigns: sync status directly
  if (campaign.source === "spherescout" && campaign.spherescoutSearchId) {
    if (!["COMPLETED", "FAILED"].includes(campaign.status)) {
      try {
        const result = await spherescout.getDownloadStatus(campaign.spherescoutSearchId);
        const ssStatus = (result.status || "").toUpperCase();
        console.log(`[SphereScout Sync] campaign=${id} status=${ssStatus}`, JSON.stringify(result));

        if (ssStatus === "COMPLETED") {
          const updated = await prisma.campaign.update({
            where: { id },
            data: { status: "COMPLETED", leadsFound: campaign.targetCount },
          });
          return Response.json({ campaign: updated, spherescoutStatus: ssStatus });
        } else if (ssStatus === "FAILED" || ssStatus === "ERROR") {
          const updated = await prisma.campaign.update({
            where: { id },
            data: { status: "FAILED", creditsUsed: 0, creditsRefunded: campaign.creditsUsed },
          });
          await prisma.user.update({
            where: { id: campaign.userId },
            data: { credits: { increment: campaign.creditsUsed } },
          });
          return Response.json({ campaign: updated, spherescoutStatus: ssStatus });
        }

        return Response.json({ campaign, spherescoutStatus: ssStatus });
      } catch (error: any) {
        console.error(`[SphereScout Sync] Failed for campaign ${id}:`, error.message);
        return Response.json({ campaign });
      }
    }
    return Response.json({ campaign });
  }

  // Scravio campaigns: sync via queue
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
