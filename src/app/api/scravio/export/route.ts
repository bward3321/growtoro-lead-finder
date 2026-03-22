import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as scravio from "@/lib/scravio";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await request.json();
  console.log("[Export] Request for DB campaignId:", campaignId);

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: session.id },
  });

  if (!campaign?.scravioCampaignId) {
    console.error("[Export] No scravioCampaignId for campaign:", campaignId);
    return Response.json({ error: "Campaign not linked to Scravio — no Scravio ID saved" }, { status: 404 });
  }

  const scravioId = campaign.scravioCampaignId;
  console.log("[Export] Scravio campaign ID:", scravioId);

  // Step 1: Create the export
  let createResult;
  try {
    createResult = await scravio.createListExport(scravioId);
    console.log("[Export] Create response:", JSON.stringify(createResult));
  } catch (error: any) {
    console.error("[Export] POST /list-exports failed:", error.message);
    console.error("[Export] Scravio response:", JSON.stringify(error.scravioResponse));
    return Response.json({
      error: `Scravio export creation failed: ${error.message}`,
      scravioStatus: error.statusCode,
      scravioResponse: error.scravioResponse,
    }, { status: 502 });
  }

  const exportId = createResult?.data?.exportId;
  console.log("[Export] Extracted exportId:", exportId);

  if (!exportId) {
    return Response.json({
      error: "Scravio did not return an export ID",
      scravioResponse: createResult,
    }, { status: 502 });
  }

  // Step 2: Get download URL (exports usually complete instantly)
  let download;
  try {
    download = await scravio.getListExportDownload(exportId);
    console.log("[Export] Download response:", JSON.stringify(download));
  } catch (error: any) {
    console.error("[Export] GET /list-exports/{id}/download failed:", error.message);
    console.error("[Export] Scravio response:", JSON.stringify(error.scravioResponse));
    return Response.json({
      error: `Scravio download fetch failed: ${error.message}`,
      scravioStatus: error.statusCode,
      scravioResponse: error.scravioResponse,
    }, { status: 502 });
  }

  const downloadUrl = download?.data?.downloadUrl;
  if (downloadUrl) {
    return Response.json({ downloadUrl });
  }

  // Poll a few times if not ready yet
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const retry = await scravio.getListExportDownload(exportId);
      console.log(`[Export] Poll ${i + 1}:`, JSON.stringify(retry));
      const url = retry?.data?.downloadUrl;
      if (url) {
        return Response.json({ downloadUrl: url });
      }
    } catch (error: any) {
      console.error(`[Export] Poll ${i + 1} failed:`, error.message);
    }
  }

  return Response.json({
    error: "Export created but download URL not available yet — try again in a moment",
    exportId,
    lastResponse: download,
  }, { status: 504 });
}
