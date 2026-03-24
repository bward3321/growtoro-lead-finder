import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as scravio from "@/lib/scravio";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await request.json();

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
    console.log("[Export] Created:", JSON.stringify(createResult));
  } catch (error: any) {
    console.error("[Export] Create failed:", error.message);
    return Response.json({ error: `Export creation failed: ${error.message}` }, { status: 502 });
  }

  const exportId = createResult?.data?.exportId || createResult?.exportId;
  if (!exportId) {
    return Response.json({ error: "No export ID returned", response: createResult }, { status: 502 });
  }

  // Step 2: Wait then try to get download URL, retry up to 5 times
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 3000));

    try {
      const download = await scravio.getListExportDownload(exportId);
      console.log(`[Export] Download attempt ${i + 1}:`, JSON.stringify(download));

      const url = download?.data?.downloadUrl || download?.downloadUrl || download?.url;
      if (url) {
        return Response.json({ downloadUrl: url });
      }
    } catch (error: any) {
      console.log(`[Export] Attempt ${i + 1} not ready:`, error.message);
    }
  }

  return Response.json({
    error: "Export is taking longer than expected, please try again in a minute",
  }, { status: 504 });
}
