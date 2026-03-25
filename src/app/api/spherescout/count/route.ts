import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const SPHERESCOUT_BASE_URL = "https://api.spherescout.io";
const API_KEY = process.env.SPHERESCOUT_API_KEY!;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const countries = searchParams.get("countries");
  const level2_locations = searchParams.get("level2_locations") || "";

  if (!category || !countries) {
    return Response.json({ error: "category and countries are required" }, { status: 400 });
  }

  const categoryId = parseInt(category, 10);
  if (isNaN(categoryId)) {
    return Response.json({ error: "category must be a valid integer ID" }, { status: 400 });
  }

  let url = `${SPHERESCOUT_BASE_URL}/api/companies/?category=${categoryId}&countries=${countries}`;

  if (level2_locations) {
    const states = level2_locations.split(",").map((s) => s.trim()).filter(Boolean);
    for (const state of states) {
      url += `&level2_locations=${encodeURIComponent(state)}`;
    }
  }

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Authorization: `Token ${API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "GrowtorLeadFinder/1.0",
      },
    });

    if (!res.ok) {
      return Response.json({ error: `API error ${res.status}` }, { status: 502 });
    }

    const body = await res.json();
    const totalCount = body.totalCount ?? body.total_count ?? 0;

    return Response.json({ totalCount });
  } catch (error: any) {
    console.error("[SphereScout Count]", error.message);
    return Response.json({ error: "Failed to fetch count" }, { status: 502 });
  }
}
