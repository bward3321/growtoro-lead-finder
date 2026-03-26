import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const campaignId = request.nextUrl.searchParams.get("campaignId");
  if (!campaignId) {
    return Response.json({ error: "campaignId is required" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: session.id, source: "searchleads" },
  });

  if (!campaign) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (!campaign.searchleadsData) {
    return Response.json({ error: "No data available for this campaign" }, { status: 404 });
  }

  const dateStr = new Date(campaign.createdAt).toISOString().slice(0, 10);
  const filename = `growtoro_b2b_leads_${dateStr}.csv`;

  return new Response(campaign.searchleadsData, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
