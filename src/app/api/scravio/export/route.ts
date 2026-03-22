import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as scravio from "@/lib/scravio";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await request.json();
  console.log("[Export] Request for campaignId:", campaignId);

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: session.id },
  });

  if (!campaign?.scravioCampaignId) {
    console.error("[Export] Campaign not found or missing scravioCampaignId:", { campaignId, scravioCampaignId: campaign?.scravioCampaignId });
    return Response.json({ error: "Campaign not found or not linked to Scravio" }, { status: 404 });
  }

  const scravioId = campaign.scravioCampaignId;
  console.log("[Export] Creating list export for Scravio campaign:", scravioId);

  try {
    // Step 1: Create the export
    const createResult = await scravio.createListExport(scravioId);
    const exportId =
      createResult?._id?.toString() ||
      createResult?.id?.toString() ||
      createResult?.export?._id?.toString() ||
      createResult?.export?.id?.toString();

    console.log("[Export] Create result:", JSON.stringify(createResult));
    console.log("[Export] Extracted exportId:", exportId);

    if (!exportId) {
      return Response.json({
        error: "No export ID returned",
        scravioResponse: createResult,
      }, { status: 500 });
    }

    // Step 2: Poll for completion (up to 60 seconds)
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      try {
        // Check export status by listing exports for this campaign
        const exports = await scravio.getListExports(scravioId);
        console.log(`[Export] Poll ${i + 1} response:`, JSON.stringify(exports));

        const exportList = exports?.data || exports?.exports || (Array.isArray(exports) ? exports : []);
        const ourExport = Array.isArray(exportList)
          ? exportList.find((e: Record<string, unknown>) =>
              (e._id?.toString() || e.id?.toString()) === exportId
            )
          : null;

        if (ourExport) {
          const status = (ourExport.status as string)?.toLowerCase();
          console.log(`[Export] Export status: ${status}`);

          if (status === "completed" || status === "ready") {
            // Step 3: Get download URL
            const download = await scravio.getListExportDownload(exportId);
            console.log("[Export] Download response:", JSON.stringify(download));

            const downloadUrl =
              download?.downloadUrl ||
              download?.download_url ||
              download?.url ||
              download?.fileUrl ||
              download?.file_url;

            if (downloadUrl) {
              return Response.json({ downloadUrl });
            }

            return Response.json({
              error: "Export completed but no download URL",
              downloadResponse: download,
            }, { status: 500 });
          }

          if (status === "failed" || status === "error") {
            return Response.json({ error: "Export failed", exportData: ourExport }, { status: 500 });
          }
        }
      } catch (pollError) {
        console.error(`[Export] Poll ${i + 1} error:`, pollError);
      }
    }

    return Response.json({ error: "Export timed out after 60 seconds" }, { status: 504 });
  } catch (error) {
    console.error("[Export] Error:", error);
    return Response.json({ error: "Failed to create export", details: String(error) }, { status: 500 });
  }
}
