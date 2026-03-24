import { prisma } from "@/lib/prisma";
import * as spherescout from "@/lib/spherescout";

export async function GET() {
  // Find all SphereScout campaigns that are stuck (not COMPLETED/FAILED)
  const stuck = await prisma.campaign.findMany({
    where: {
      source: "spherescout",
      status: { notIn: ["COMPLETED", "FAILED"] },
      spherescoutSearchId: { not: null },
    },
    select: {
      id: true,
      status: true,
      spherescoutSearchId: true,
      name: true,
      targetCount: true,
      leadsFound: true,
      createdAt: true,
    },
  });

  const results = [];

  for (const campaign of stuck) {
    let statusResult: unknown = null;
    let error: string | null = null;

    try {
      statusResult = await spherescout.getDownloadStatus(campaign.spherescoutSearchId!);
    } catch (e: any) {
      error = e.message;
    }

    const sphereStatus = statusResult && typeof statusResult === "object"
      ? ((statusResult as Record<string, unknown>).status as string || "").toUpperCase()
      : null;

    // If SphereScout says COMPLETED, update our DB immediately
    if (sphereStatus === "COMPLETED") {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: "COMPLETED",
          leadsFound: campaign.targetCount,
        },
      });
    }

    results.push({
      campaignId: campaign.id,
      name: campaign.name,
      ourStatus: campaign.status,
      spherescoutSearchId: campaign.spherescoutSearchId,
      spherescoutStatus: sphereStatus,
      spherescoutRawResponse: statusResult,
      error,
      fixedToCompleted: sphereStatus === "COMPLETED",
    });
  }

  return Response.json({
    stuckCampaigns: stuck.length,
    results,
  });
}
