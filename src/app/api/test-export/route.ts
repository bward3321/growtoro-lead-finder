export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

const SCRAVIO_BASE_URL = "https://api.scravio.com/api";
const API_KEY = process.env.SCRAVIO_API_KEY!;

const HEADERS = {
  "X-API-Key": API_KEY,
  "Content-Type": "application/json",
  "Accept": "application/json",
  "User-Agent": "GrowtorLeadFinder/1.0",
};

export async function GET() {
  // 1. Find most recent completed scrape with a scravioCampaignId
  const campaign = await prisma.campaign.findFirst({
    where: {
      status: "COMPLETED",
      scravioCampaignId: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!campaign?.scravioCampaignId) {
    return Response.json({ error: "No completed scrape with scravioCampaignId found" });
  }

  const scravioId = campaign.scravioCampaignId;
  const payload = { campaignId: scravioId, emailOnly: true, fileFormat: "csv" };

  // 2. Call POST /list-exports
  let createStatus: number | string = "N/A";
  let createBody: unknown = null;
  try {
    const res = await fetch(`${SCRAVIO_BASE_URL}/list-exports`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(payload),
    });
    createStatus = res.status;
    const text = await res.text();
    try { createBody = JSON.parse(text); } catch { createBody = text; }
  } catch (error) {
    createBody = { fetchError: String(error) };
  }

  // 3. Also try GET /list-exports?campaignId=X to see existing exports
  let listStatus: number | string = "N/A";
  let listBody: unknown = null;
  try {
    const res = await fetch(`${SCRAVIO_BASE_URL}/list-exports?campaignId=${scravioId}`, {
      headers: HEADERS,
    });
    listStatus = res.status;
    const text = await res.text();
    try { listBody = JSON.parse(text); } catch { listBody = text; }
  } catch (error) {
    listBody = { fetchError: String(error) };
  }

  return Response.json({
    campaign: {
      dbId: campaign.id,
      scravioCampaignId: scravioId,
      name: campaign.name,
      status: campaign.status,
      leadsFound: campaign.leadsFound,
    },
    createExport: {
      requestBody: payload,
      responseStatus: createStatus,
      responseBody: createBody,
    },
    listExports: {
      responseStatus: listStatus,
      responseBody: listBody,
    },
  });
}
