import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as scravio from "@/lib/scravio";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: exportId } = await params;
  const scravioCampaignId = request.nextUrl.searchParams.get("campaignId");

  if (!scravioCampaignId) {
    return Response.json({ error: "Missing campaignId" }, { status: 400 });
  }

  // Verify the user owns a campaign with this scravio ID
  const campaign = await prisma.campaign.findFirst({
    where: { scravioCampaignId, userId: session.id },
  });

  if (!campaign) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await scravio.getListExportDownload(scravioCampaignId, exportId);
    return Response.json({
      status: result.status || result.state,
      downloadUrl: result.download_url || result.url || null,
    });
  } catch (error) {
    console.error("Error getting export download:", error);
    return Response.json({ error: "Failed to get download" }, { status: 500 });
  }
}
