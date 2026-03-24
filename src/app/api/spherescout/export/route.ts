import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as spherescout from "@/lib/spherescout";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { category, categoryName, countries, level2_locations, totalCount } = body;

  if (!category || !countries || !totalCount) {
    return Response.json(
      { error: "category, countries, and totalCount are required" },
      { status: 400 }
    );
  }

  // Check credits
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || user.credits < totalCount) {
    return Response.json({ error: "Insufficient credits" }, { status: 402 });
  }

  // Deduct credits and create campaign record
  const campaign = await prisma.campaign.create({
    data: {
      userId: session.id,
      name: `Google Maps - ${categoryName || "Business Search"}`,
      platform: "googlemaps",
      extractionType: "GOOGLEMAPS_BUSINESS_SEARCH",
      source: "spherescout",
      targetCount: totalCount,
      creditsUsed: totalCount,
      config: JSON.stringify({ category, categoryName, countries, level2_locations }),
      status: "RUNNING",
    },
  });

  await prisma.user.update({
    where: { id: session.id },
    data: { credits: { decrement: totalCount } },
  });

  try {
    const result = await spherescout.downloadCsv({
      category: parseInt(String(category), 10),
      countries,
      level2_locations,
    });

    const searchId = result.search_id;

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        spherescoutSearchId: searchId,
        leadsFound: result.lead_count || totalCount,
      },
    });

    return Response.json({
      campaign: { ...campaign, spherescoutSearchId: searchId },
      searchId,
      leadCount: result.lead_count,
    });
  } catch (error: any) {
    console.error("[SphereScout Export]", error.message);

    // Refund credits on failure
    await prisma.$transaction([
      prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: "FAILED",
          creditsUsed: 0,
          creditsRefunded: totalCount,
        },
      }),
      prisma.user.update({
        where: { id: session.id },
        data: { credits: { increment: totalCount } },
      }),
    ]);

    return Response.json(
      { error: `Export failed: ${error.message}` },
      { status: 502 }
    );
  }
}
