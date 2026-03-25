import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as spherescout from "@/lib/spherescout";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { category, categoryName, countries, emailOnly, phoneOnly } = body;

  if (!category || !countries) {
    return Response.json(
      { error: "category and countries are required" },
      { status: 400 }
    );
  }

  // Check user has at least 1 credit
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || user.credits < 1) {
    return Response.json({ error: "Insufficient credits" }, { status: 402 });
  }

  // Call SphereScout first to get lead_count
  let result;
  try {
    // V1: only category + countries — level2_locations uses internal codes we don't have yet
    result = await spherescout.downloadCsv({
      category: parseInt(String(category), 10),
      countries,
    });
  } catch (error: any) {
    console.error("[SphereScout Export]", error.message);
    return Response.json(
      { error: `Export failed: ${error.message}` },
      { status: 502 }
    );
  }

  const searchId = result.search_id;
  const leadCount = result.lead_count || 0;

  if (!searchId) {
    return Response.json({ error: "No search ID returned from API" }, { status: 502 });
  }

  // Deduct credits based on actual lead_count (capped at user's balance)
  const creditsToDeduct = Math.min(leadCount, Math.floor(user.credits));

  const campaign = await prisma.campaign.create({
    data: {
      userId: session.id,
      name: `Google Maps - ${categoryName || "Business Search"}`,
      platform: "googlemaps",
      extractionType: "GOOGLEMAPS_BUSINESS_SEARCH",
      source: "spherescout",
      targetCount: leadCount,
      creditsUsed: creditsToDeduct,
      config: JSON.stringify({ category, categoryName, countries, emailOnly, phoneOnly }),
      status: "PROCESSING",
      spherescoutSearchId: searchId,
    },
  });

  await prisma.user.update({
    where: { id: session.id },
    data: { credits: { decrement: creditsToDeduct } },
  });

  return Response.json({
    campaign,
    searchId,
    leadCount,
  });
}
