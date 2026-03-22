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
    return Response.json({ error: "Campaign not linked to Scravio" }, { status: 404 });
  }

  const scravioId = campaign.scravioCampaignId;
  console.log("[Export] Scravio campaign ID:", scravioId);

  try {
    // Step 1: Create the export
    const createResult = await scravio.createListExport(scravioId);
    console.log("[Export] Create response:", JSON.stringify(createResult));

    const exportId = createResult?.data?.exportId;
    console.log("[Export] Extracted exportId:", exportId);

    if (!exportId) {
      return Response.json({
        error: "No export ID in response",
        scravioResponse: createResult,
      }, { status: 500 });
    }

    // Step 2: Get download URL (exports complete instantly)
    const download = await scravio.getListExportDownload(exportId);
    console.log("[Export] Download response:", JSON.stringify(download));

    const downloadUrl = download?.data?.downloadUrl;

    if (downloadUrl) {
      return Response.json({ downloadUrl });
    }

    // If not ready yet, poll a few times
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const retry = await scravio.getListExportDownload(exportId);
      console.log(`[Export] Poll ${i + 1}:`, JSON.stringify(retry));
      const url = retry?.data?.downloadUrl;
      if (url) {
        return Response.json({ downloadUrl: url });
      }
    }

    return Response.json({ error: "Export timed out", lastResponse: download }, { status: 504 });
  } catch (error) {
    console.error("[Export] Error:", error);
    return Response.json({ error: "Export failed", details: String(error) }, { status: 500 });
  }
}
