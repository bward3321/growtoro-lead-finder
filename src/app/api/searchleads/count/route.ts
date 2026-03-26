import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import * as searchleads from "@/lib/searchleads";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { filters } = body;

  if (!filters || typeof filters !== "object") {
    return Response.json({ error: "filters object is required" }, { status: 400 });
  }

  // Log what the frontend sent us
  console.log("[SearchLeads Count] Received filters from frontend:", JSON.stringify(filters));

  try {
    // Uses size=1 to minimize credit usage (1 credit per prospect returned)
    const result = await searchleads.getCount(filters);
    console.log("[SearchLeads Count] Result: totalElements =", result.totalElements);
    return Response.json({ totalElements: result.totalElements });
  } catch (error: any) {
    console.error("[SearchLeads Count] Error:", error.message);
    if (error.searchleadsResponse) {
      console.error("[SearchLeads Count] API response:", JSON.stringify(error.searchleadsResponse));
    }
    return Response.json(
      { error: error.message || "Failed to check availability" },
      { status: error.statusCode || 502 }
    );
  }
}
