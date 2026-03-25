import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as spherescout from "@/lib/spherescout";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { category, categoryName, countries, emailOnly, phoneOnly, level1_locations } = body;

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

  // Call SphereScout to start the export
  let result: Record<string, unknown>;
  try {
    result = await spherescout.downloadCsv({
      category: parseInt(String(category), 10),
      countries,
      level1_locations: level1_locations,
      email: emailOnly || undefined,
      phone: phoneOnly || undefined,
    });
    console.log("[SphereScout Export] Full response:", JSON.stringify(result));
  } catch (error: any) {
    console.error("[SphereScout Export] Error:", error.message);
    if (error.spherescoutResponse) {
      console.error("[SphereScout Export] API response:", JSON.stringify(error.spherescoutResponse));
    }
    return Response.json(
      { error: `Export failed: ${error.message}` },
      { status: 502 }
    );
  }

  // SphereScout may return search_id or searchId — handle both
  const searchId = String(result.search_id ?? result.searchId ?? "");
  const leadCount = Number(result.lead_count ?? result.leadCount ?? result.total_count ?? 0);

  console.log("[SphereScout Export] Parsed searchId:", searchId, "leadCount:", leadCount);

  if (!searchId) {
    console.error("[SphereScout Export] No search ID in response. Keys:", Object.keys(result));
    return Response.json(
      { error: "No search ID returned from SphereScout. Response: " + JSON.stringify(result) },
      { status: 502 }
    );
  }

  // Deduct credits based on actual lead_count (capped at user's balance)
  const creditsToDeduct = Math.min(leadCount, Math.floor(user.credits));

  try {
    const campaign = await prisma.campaign.create({
      data: {
        userId: session.id,
        name: `Google Maps - ${categoryName || "Business Search"}`,
        platform: "googlemaps",
        extractionType: "GOOGLEMAPS_BUSINESS_SEARCH",
        source: "spherescout",
        targetCount: leadCount,
        creditsUsed: creditsToDeduct,
        config: JSON.stringify({ category, categoryName, countries, emailOnly, phoneOnly, level1_locations }),
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
  } catch (dbError: any) {
    console.error("[SphereScout Export] Database error:", dbError.message);
    return Response.json(
      { error: `Export succeeded on SphereScout but failed to save: ${dbError.message}` },
      { status: 500 }
    );
  }
}
