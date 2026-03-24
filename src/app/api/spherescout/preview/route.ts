import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const BASE = "https://api.spherescout.io";

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

  // Build URL: always category + countries, optionally level2_locations
  let url = `${BASE}/api/companies/?category=${categoryId}&countries=${countries}`;

  if (level2_locations) {
    const states = level2_locations.split(",").map((s) => s.trim()).filter(Boolean);
    if (states.length > 0) {
      for (const state of states) {
        url += `&level2_locations=${state}`;
      }
    }
  }

  console.log(`[Preview] URL: ${url}`);

  const API_KEY = process.env.SPHERESCOUT_API_KEY!;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Token ${API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "GrowtorLeadFinder/1.0",
    },
  });

  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  console.log(`[Preview] Status: ${res.status}, totalCount: ${body?.totalCount}`);

  if (!res.ok) {
    return Response.json({ error: `API error ${res.status}`, debug: { url, body } }, { status: 502 });
  }

  return Response.json({
    totalCount: body.totalCount ?? body.total_count ?? 0,
    preview: body.preview ?? [],
    debug: { url },
  });
}
