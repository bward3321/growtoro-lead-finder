export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { syncCampaignStatus } from "@/lib/queue";

const SCRAVIO_BASE_URL = "https://api.scravio.com/api";
const API_KEY = process.env.SCRAVIO_API_KEY!;

const HEADERS = {
  "X-API-Key": API_KEY,
  "Content-Type": "application/json",
  "Accept": "application/json",
  "User-Agent": "GrowtorLeadFinder/1.0",
};

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Get recent Scravio campaigns
  let scravioCampaigns: Record<string, unknown>[] = [];
  try {
    const res = await fetch(`${SCRAVIO_BASE_URL}/campaigns?perPage=10`, {
      headers: HEADERS,
    });
    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }

    results.scravioResponse = { status: res.status, data };

    // Extract campaigns array from response
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const arr = obj.campaigns || obj.data || (Array.isArray(obj) ? obj : null);
      if (Array.isArray(arr)) {
        scravioCampaigns = arr as Record<string, unknown>[];
      }
    }
  } catch (error) {
    results.scravioError = String(error);
  }

  results.scravioCampaignCount = scravioCampaigns.length;
  results.scravioCampaigns = scravioCampaigns.map((c) => ({
    _id: c._id,
    id: c.id,
    type: c.type,
    name: c.name,
    status: c.status,
    targetUser: (c.inputs as Record<string, unknown>)?.targetUser,
    keywords: (c.inputs as Record<string, unknown>)?.keywords,
    hashtags: (c.inputs as Record<string, unknown>)?.hashtags,
    emailScanCount: c.emailScanCount,
  }));

  // 2. Get our DB campaigns missing scravioCampaignId
  const dbCampaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });

  const unlinked = dbCampaigns.filter((c) => !c.scravioCampaignId);
  results.dbTotal = dbCampaigns.length;
  results.unlinkedCount = unlinked.length;

  // 3. Try to match unlinked DB campaigns to Scravio campaigns
  const matched: { dbId: string; scravioId: string; matchedBy: string }[] = [];

  for (const dbCamp of unlinked) {
    let config: Record<string, string> = {};
    try { config = JSON.parse(dbCamp.config); } catch {}

    for (const sc of scravioCampaigns) {
      const scId = (sc._id || sc.id)?.toString();
      if (!scId) continue;

      // Already matched to another DB campaign?
      if (matched.some((m) => m.scravioId === scId)) continue;

      const scType = (sc.type as string) || "";
      const scInputs = (sc.inputs || {}) as Record<string, unknown>;

      // Match by type
      if (scType !== dbCamp.extractionType) continue;

      // Match by target
      let targetMatch = false;
      let matchedBy = `type:${scType}`;

      // Username match
      if (config.username && scInputs.targetUser) {
        const dbUser = config.username.replace(/^@/, "").toLowerCase();
        const scUser = String(scInputs.targetUser).toLowerCase();
        if (dbUser === scUser) {
          targetMatch = true;
          matchedBy += ` + username:${dbUser}`;
        }
      }

      // Keywords match
      if (config.keywords && scInputs.keywords) {
        const dbKw = config.keywords.toLowerCase();
        const scKw = Array.isArray(scInputs.keywords)
          ? (scInputs.keywords as string[]).join(",").toLowerCase()
          : String(scInputs.keywords).toLowerCase();
        if (scKw.includes(dbKw) || dbKw.includes(scKw)) {
          targetMatch = true;
          matchedBy += ` + keywords:${dbKw}`;
        }
      }

      // Hashtag match
      if (config.hashtag && scInputs.hashtags) {
        const dbHash = config.hashtag.replace(/^#/, "").toLowerCase();
        const scHash = Array.isArray(scInputs.hashtags)
          ? (scInputs.hashtags as string[]).join(",").toLowerCase()
          : String(scInputs.hashtags).toLowerCase();
        if (scHash.includes(dbHash)) {
          targetMatch = true;
          matchedBy += ` + hashtag:${dbHash}`;
        }
      }

      // Name match as fallback
      if (!targetMatch && sc.name && dbCamp.name) {
        if (String(sc.name).toLowerCase() === dbCamp.name.toLowerCase()) {
          targetMatch = true;
          matchedBy += ` + name:${dbCamp.name}`;
        }
      }

      if (targetMatch) {
        matched.push({ dbId: dbCamp.id, scravioId: scId, matchedBy });
        break;
      }
    }
  }

  results.matched = matched;

  // 4. Update matched campaigns in DB
  const updates: { dbId: string; scravioId: string; status: string }[] = [];
  for (const m of matched) {
    await prisma.campaign.update({
      where: { id: m.dbId },
      data: { scravioCampaignId: m.scravioId },
    });

    // Now sync status from Scravio
    const updated = await syncCampaignStatus(m.dbId);
    updates.push({
      dbId: m.dbId,
      scravioId: m.scravioId,
      status: updated?.status || "unknown",
    });
  }

  results.updates = updates;

  return Response.json(results);
}
