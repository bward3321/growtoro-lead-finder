import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as spherescout from "@/lib/spherescout";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const active = await prisma.campaign.findMany({
    where: {
      source: "spherescout",
      status: { in: ["RUNNING", "PENDING", "PROCESSING"] },
      spherescoutSearchId: { not: null },
    },
  });

  let synced = 0;
  let completed = 0;
  let failed = 0;

  for (const campaign of active) {
    try {
      const result = await spherescout.getDownloadStatus(campaign.spherescoutSearchId!);
      const status = (result.status || "").toUpperCase();

      if (status === "COMPLETED") {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: "COMPLETED",
            leadsFound: campaign.targetCount,
          },
        });
        completed++;
      } else if (status === "FAILED" || status === "ERROR") {
        await prisma.$transaction([
          prisma.campaign.update({
            where: { id: campaign.id },
            data: {
              status: "FAILED",
              creditsUsed: 0,
              creditsRefunded: campaign.creditsUsed,
            },
          }),
          prisma.user.update({
            where: { id: campaign.userId },
            data: { credits: { increment: campaign.creditsUsed } },
          }),
        ]);
        failed++;
      }

      synced++;
    } catch (error) {
      console.error(`[SphereScout Sync] Failed to sync campaign ${campaign.id}:`, error);
    }
  }

  return Response.json({ synced, completed, failed, total: active.length });
}
