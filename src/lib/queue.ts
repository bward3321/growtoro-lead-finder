import { prisma } from "@/lib/prisma";
import * as scravio from "@/lib/scravio";
import * as spherescout from "@/lib/spherescout";
import { sendScrapeCompletedEmail, sendScrapeFailedEmail } from "@/lib/email";

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

      const scravioCampaignId =
        scravioResult?.campaign?._id?.toString() ||
        scravioResult?.campaign?.id?.toString() ||
        scravioResult?._id?.toString() ||
        scravioResult?.id?.toString() ||
        null;

      console.log(`[Queue] Scravio create response keys:`, Object.keys(scravioResult || {}));
      if (scravioResult?.campaign) {
        console.log(`[Queue] Scravio campaign object keys:`, Object.keys(scravioResult.campaign));
      }
      console.log(`[Queue] Extracted scravioCampaignId: ${scravioCampaignId}`);

      if (!scravioCampaignId) {
        console.error(`[Queue] WARNING: No campaign ID found in Scravio response for campaign ${campaign.id}. Full response:`, JSON.stringify(scravioResult));
      }

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: "RUNNING",
          scravioCampaignId,
        },
      });

      launched++;
    } catch (error) {
      console.error(`Failed to launch queued campaign ${campaign.id}:`, error);

      // Mark as failed and refund all credits
      await prisma.$transaction([
        prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: "FAILED", creditsUsed: 0, creditsRefunded: campaign.creditsUsed },
        }),
        prisma.user.update({
          where: { id: campaign.userId },
          data: { credits: { increment: campaign.creditsUsed } },
        }),
      ]);

      console.log(`Refunded ${campaign.creditsUsed} credits to user ${campaign.userId} for failed campaign ${campaign.id}`);

      const user = await prisma.user.findUnique({
        where: { id: campaign.userId },
      });
      if (user?.email) {
        await sendScrapeFailedEmail(user.email, {
          campaignId: campaign.id,
          name: campaign.name,
          platform: campaign.platform,
          extractionType: campaign.extractionType,
          config: campaign.config,
          leadsFound: 0,
        });
      }
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
    const obj = scravioData.campaign || scravioData;
    const rawStatus = obj.status || "";
    const leadsFound =
      obj.emailScanCount || obj.emails_found || obj.leads_count || obj.leadsFound || 0;

    // Map Scravio statuses to our statuses
    const STATUS_MAP: Record<string, string> = {
      fully_completed: "COMPLETED",
      completed: "COMPLETED",
      scraping: "RUNNING",
      running: "RUNNING",
      in_progress: "RUNNING",
      failed: "FAILED",
      error: "FAILED",
      stopped: "STOPPED",
      paused: "STOPPED",
      queued: "RUNNING", // Scravio queued means it's accepted, treat as running on our end
      pending: "RUNNING",
    };
    const status = STATUS_MAP[rawStatus.toLowerCase()] || rawStatus.toUpperCase();

    // Credit reconciliation from Scravio's creditSettlement
    const settlement = obj.creditSettlement;
    let creditsRefunded = 0;
    let actualCreditsUsed = campaign.creditsUsed;

    if (status === "FAILED") {
      // Full refund on failure
      creditsRefunded = campaign.creditsUsed;
      actualCreditsUsed = 0;
    } else if (settlement) {
      const charged = settlement.creditCharged ?? settlement.creditUsed ?? campaign.creditsUsed;
      creditsRefunded = Math.max(0, campaign.creditsUsed - charged);
      actualCreditsUsed = charged;
      console.log(`[CreditSettlement] campaign=${campaignId} reserved=${campaign.creditsUsed} charged=${charged} refund=${creditsRefunded}`, settlement);
    }

    const updateData: Record<string, unknown> = { status, leadsFound };

    // Only update credits if transitioning to a terminal state and not already refunded
    const isTerminal = status === "COMPLETED" || status === "FAILED" || status === "STOPPED";
    const wasRunning = campaign.status === "RUNNING";
    if (isTerminal && wasRunning && creditsRefunded > 0 && campaign.creditsRefunded === 0) {
      updateData.creditsUsed = actualCreditsUsed;
      updateData.creditsRefunded = creditsRefunded;
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData,
    });

    // If transitioning to terminal state, refund credits and notify
    if (isTerminal && wasRunning && creditsRefunded > 0 && campaign.creditsRefunded === 0) {
      await prisma.user.update({
        where: { id: campaign.userId },
        data: { credits: { increment: creditsRefunded } },
      });
      console.log(`Refunded ${creditsRefunded} credits to user ${campaign.userId} for campaign ${campaign.id} (status: ${status})`);
    }

    if (isTerminal && wasRunning) {
      const user = await prisma.user.findUnique({
        where: { id: campaign.userId },
      });

      if (user?.email) {
        if (status === "COMPLETED") {
          await sendScrapeCompletedEmail(user.email, {
            campaignId: campaign.id,
            name: campaign.name,
            platform: campaign.platform,
            extractionType: campaign.extractionType,
            config: campaign.config,
            leadsFound,
          });
        } else {
          await sendScrapeFailedEmail(user.email, {
            campaignId: campaign.id,
            name: campaign.name,
            platform: campaign.platform,
            extractionType: campaign.extractionType,
            config: campaign.config,
            leadsFound: 0,
          });
        }
      }

      await processQueue();
    }

    return updated;
  } catch (error) {
    console.error(`Failed to sync campaign ${campaignId}:`, error);
    return campaign;
  }
}

export async function syncAllActiveCampaigns() {
  const active = await prisma.campaign.findMany({
    where: {
      status: { in: ["RUNNING", "PENDING"] },
      scravioCampaignId: { not: null },
    },
  });

  let synced = 0;
  let completed = 0;
  let failed = 0;

  for (const campaign of active) {
    try {
      const updated = await syncCampaignStatus(campaign.id);
      synced++;
      if (updated?.status === "COMPLETED") completed++;
      if (updated?.status === "FAILED") failed++;
    } catch (error) {
      console.error(`Failed to sync campaign ${campaign.id}:`, error);
    }
  }

  return { synced, completed, failed, total: active.length };
}

export async function syncSphereScoutCampaigns() {
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

        const user = await prisma.user.findUnique({ where: { id: campaign.userId } });
        if (user?.email) {
          await sendScrapeCompletedEmail(user.email, {
            campaignId: campaign.id,
            name: campaign.name,
            platform: campaign.platform,
            extractionType: campaign.extractionType,
            config: campaign.config,
            leadsFound: campaign.targetCount,
          });
        }
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

        const user = await prisma.user.findUnique({ where: { id: campaign.userId } });
        if (user?.email) {
          await sendScrapeFailedEmail(user.email, {
            campaignId: campaign.id,
            name: campaign.name,
            platform: campaign.platform,
            extractionType: campaign.extractionType,
            config: campaign.config,
            leadsFound: 0,
          });
        }
        failed++;
      }

      synced++;
    } catch (error) {
      console.error(`[SphereScout Sync] Failed to sync campaign ${campaign.id}:`, error);
    }
  }

  return { synced, completed, failed, total: active.length };
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
