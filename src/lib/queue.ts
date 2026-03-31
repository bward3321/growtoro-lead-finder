import { prisma } from "@/lib/prisma";
import * as scravio from "@/lib/scravio";
import * as spherescout from "@/lib/spherescout";
import { sendScrapeCompletedEmail, sendScrapeFailedEmail } from "@/lib/email";

const CONCURRENT_LIMIT = parseInt(process.env.SCRAVIO_CONCURRENT_LIMIT || "2", 10);
const MAX_RETRIES = 3;
const QUEUE_WARNING_MS = 30 * 60 * 1000; // 30 minutes

export async function processQueue() {
  // 1. Count active Scravio campaigns from our DB
  const activeCount = await prisma.campaign.count({
    where: {
      source: "scravio",
      status: { in: ["RUNNING", "PENDING"] },
    },
  });

  const slotsAvailable = CONCURRENT_LIMIT - activeCount;
  if (slotsAvailable <= 0) {
    return { launched: 0, activeCount, slotsAvailable: 0 };
  }

  // 2. Get the single oldest queued scrape (only 1 per cycle to avoid overwhelming Scravio)
  const queued = await prisma.campaign.findMany({
    where: {
      status: "QUEUED",
      scravioCampaignId: null,
      source: "scravio",
    },
    orderBy: { queuedAt: "asc" },
    take: 1,
  });

  // 3. Warn about scrapes queued for >30 minutes
  const allQueued = await prisma.campaign.findMany({
    where: {
      status: "QUEUED",
      scravioCampaignId: null,
      source: "scravio",
    },
    select: { id: true, queuedAt: true, createdAt: true },
  });

  const now = Date.now();
  for (const q of allQueued) {
    const queueTime = q.queuedAt ? q.queuedAt.getTime() : q.createdAt.getTime();
    if (now - queueTime > QUEUE_WARNING_MS) {
      console.warn(`[Queue] WARNING: Campaign ${q.id} has been QUEUED for over 30 minutes (since ${new Date(queueTime).toISOString()})`);
    }
  }

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
          status: "PENDING",
          scravioCampaignId,
          retryCount: 0,
        },
      });

      launched++;
    } catch (error) {
      console.error(`Failed to launch queued campaign ${campaign.id} (retry ${campaign.retryCount}/${MAX_RETRIES}):`, error);

      const newRetryCount = campaign.retryCount + 1;

      if (newRetryCount >= MAX_RETRIES) {
        // Max retries reached — fail and refund
        await prisma.$transaction([
          prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: "FAILED", creditsUsed: 0, creditsRefunded: campaign.creditsUsed, retryCount: newRetryCount },
          }),
          prisma.user.update({
            where: { id: campaign.userId },
            data: { credits: { increment: campaign.creditsUsed } },
          }),
        ]);

        console.log(`Refunded ${campaign.creditsUsed} credits to user ${campaign.userId} for failed campaign ${campaign.id} after ${MAX_RETRIES} retries`);

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
      } else {
        // Increment retry count, keep as QUEUED for next cycle
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { retryCount: newRetryCount },
        });
        console.log(`[Queue] Campaign ${campaign.id} will retry on next cycle (attempt ${newRetryCount}/${MAX_RETRIES})`);
      }
    }
  }

  return { launched, activeCount, slotsAvailable };
}

export async function syncCampaignStatus(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign?.scravioCampaignId) {
    return campaign;
  }

  try {
    const scravioData = await scravio.getCampaign(campaign.scravioCampaignId);
    const obj = scravioData.campaign || scravioData.data || scravioData;
    const rawStatus = obj.status || "";
    const leadsFound =
      obj.emailScanCount || obj.emails_found || obj.leads_count || obj.leadsFound || 0;

    console.log(`[Sync] campaign=${campaignId} scravioId=${campaign.scravioCampaignId} rawStatus="${rawStatus}" leadsFound=${leadsFound} progress=${obj.progressPercentage ?? obj.progress ?? "N/A"} keys=${Object.keys(obj).join(",")}`);

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
      queued: "QUEUED",
      pending: "QUEUED",
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
      status: { in: ["RUNNING", "PENDING", "PROCESSING", "QUEUED"] },
      scravioCampaignId: { not: null },
      source: { not: "spherescout" },
    },
  });

  console.log(`[SyncAll] Found ${active.length} active Scravio campaigns to sync`);

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

  const queueTime = campaign.queuedAt || campaign.createdAt;

  const ahead = await prisma.campaign.count({
    where: {
      status: "QUEUED",
      source: "scravio",
      OR: [
        { queuedAt: { lt: queueTime } },
        { queuedAt: null, createdAt: { lt: queueTime } },
      ],
    },
  });

  return ahead + 1;
}

export async function cancelQueuedCampaign(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId, status: "QUEUED" },
  });

  if (!campaign) return null;

  const [updated] = await prisma.$transaction([
    prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "FAILED",
        creditsUsed: 0,
        creditsRefunded: campaign.creditsUsed,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: campaign.creditsUsed } },
    }),
  ]);

  console.log(`[Queue] Cancelled queued campaign ${campaignId}, refunded ${campaign.creditsUsed} credits to user ${userId}`);

  return updated;
}
