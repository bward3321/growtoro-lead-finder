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
    return Response.json({ error: "Campaign not linked to Scravio" }, { status: 404 });
  }

  const scravioId = campaign.scravioCampaignId;

  // Step 1: Create the export
  let createResult;
  try {
    createResult = await scravio.createListExport(scravioId);
    console.log("[Export] Create response:", JSON.stringify(createResult));
  } catch (error: any) {
    console.error("[Export] POST /list-exports failed:", error.message);
    return Response.json({
      error: `Export creation failed: ${error.message}`,
    }, { status: 502 });
  }

  const exportId = createResult?.data?.exportId || createResult?.exportId;
  if (!exportId) {
    return Response.json({
      error: "Scravio did not return an export ID",
      scravioResponse: createResult,
    }, { status: 502 });
  }

  console.log("[Export] exportId:", exportId);

  // Step 2: Poll GET /list-exports?campaignId={id} until status is "completed"
  const maxPolls = 15; // 15 * 2s = 30 seconds max
  for (let i = 0; i < maxPolls; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const listResult = await scravio.getListExports(scravioId);
      console.log(`[Export] Poll ${i + 1}:`, JSON.stringify(listResult));

      // Find our export in the list
      const exports = listResult?.data || listResult?.exports || listResult;
      const exportList = Array.isArray(exports) ? exports : [];
      const ourExport = exportList.find(
        (e: any) => e.exportId === exportId || e.id === exportId || e._id === exportId
      );

      const status = (ourExport?.status || "").toLowerCase();
      console.log(`[Export] Poll ${i + 1} status:`, status);

      if (status === "completed") {
        // Step 3: Get download URL
        try {
          const download = await scravio.getListExportDownload(exportId);
          console.log("[Export] Download response:", JSON.stringify(download));
          const downloadUrl = download?.data?.downloadUrl || download?.downloadUrl || download?.url;
          if (downloadUrl) {
            return Response.json({ downloadUrl });
          }
        } catch (dlError: any) {
          console.error("[Export] Download fetch failed:", dlError.message);
        }
      }

      if (status === "failed" || status === "error") {
        return Response.json({ error: "Export failed on Scravio" }, { status: 502 });
      }
    } catch (error: any) {
      console.error(`[Export] Poll ${i + 1} error:`, error.message);
    }
  }

  return Response.json({
    error: "Export is taking longer than expected, please try again in a minute",
    exportId,
  }, { status: 504 });
}
