import { prisma } from "@/lib/prisma";
import * as scravio from "@/lib/scravio";

const CONCURRENT_LIMIT = parseInt(process.env.SCRAVIO_CONCURRENT_LIMIT || "4", 10);

export async function processQueue() {
  // 1. Check how many campaigns are currently running on Scravio
  let activeCount = 0;
  try {
    const active = await scravio.listActiveCampaigns();
    const campaigns = active.campaigns || active.data || active;
    activeCount = Array.isArray(campaigns) ? campaigns.length : 0;
  } catch (error) {
    console.error("Failed to check active campaigns:", error);
    // Fall back to our DB count if Scravio API fails
    activeCount = await prisma.campaign.count({
      where: { status: "RUNNING" },
    });
  }

  const slotsAvailable = CONCURRENT_LIMIT - activeCount;
  if (slotsAvailable <= 0) {
    return { launched: 0, activeCount, slotsAvailable: 0 };
  }

  // 2. Get oldest queued scrapes up to available slots
  const queued = await prisma.campaign.findMany({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    take: slotsAvailable,
  });

  let launched = 0;

  for (const campaign of queued) {
    try {
      const config = JSON.parse(campaign.config);
      const scravioResult = await scravio.createCampaign({
        type: campaign.extractionType,
        name: campaign.name,
        target_count: campaign.targetCount,
        ...config,
      });

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: "RUNNING",
          scravioCampaignId:
            scravioResult.id?.toString() ||
            scravioResult.campaign?.id?.toString(),
        },
      });

      launched++;
    } catch (error) {
      console.error(`Failed to launch queued campaign ${campaign.id}:`, error);
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "FAILED" },
      });
    }
  }

  return { launched, activeCount, slotsAvailable };
}

export async function syncCampaignStatus(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign?.scravioCampaignId || campaign.status === "QUEUED") {
    return campaign;
  }

  try {
    const scravioData = await scravio.getCampaign(campaign.scravioCampaignId);
    const rawStatus = scravioData.status || scravioData.campaign?.status || "";
    const leadsFound =
      scravioData.leads_count || scravioData.campaign?.leads_count || 0;

    let status = rawStatus.toUpperCase();
    if (
      rawStatus === "fully_completed" ||
      rawStatus === "FULLY_COMPLETED" ||
      status === "FULLY_COMPLETED"
    ) {
      status = "COMPLETED";
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status, leadsFound },
    });

    // If just completed, trigger the queue to launch next scrape
    if (status === "COMPLETED" && campaign.status === "RUNNING") {
      await processQueue();
    }

    return updated;
  } catch (error) {
    console.error(`Failed to sync campaign ${campaignId}:`, error);
    return campaign;
  }
}

export async function getQueuePosition(campaignId: string): Promise<number> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign || campaign.status !== "QUEUED") return 0;

  const ahead = await prisma.campaign.count({
    where: {
      status: "QUEUED",
      createdAt: { lt: campaign.createdAt },
    },
  });

  return ahead + 1;
}
