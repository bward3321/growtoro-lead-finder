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

  try {
    // Uses size=1 to minimize credit usage (1 credit per prospect returned)
    const result = await searchleads.getCount(filters);
    return Response.json({ totalElements: result.totalElements });
  } catch (error: any) {
    console.error("[SearchLeads Count]", error.message);
    return Response.json(
      { error: error.message || "Failed to check availability" },
      { status: error.statusCode || 502 }
    );
  }
}
