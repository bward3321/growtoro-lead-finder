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

  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: session.id },
  });

  if (!campaign?.scravioCampaignId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");

  try {
    const leads = await scravio.getCampaignLeads(campaign.scravioCampaignId, page);
    return Response.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return Response.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
