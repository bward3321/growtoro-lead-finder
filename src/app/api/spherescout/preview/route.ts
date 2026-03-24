import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const SPHERESCOUT_BASE_URL = "https://api.spherescout.io";

async function callSphereScout(url: string) {
  const API_KEY = process.env.SPHERESCOUT_API_KEY!;
  console.log(`[SphereScout Preview] GET ${url}`);

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
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  console.log(`[SphereScout Preview] → ${res.status}`, typeof body === "object" ? JSON.stringify(body).slice(0, 500) : body);
  return { status: res.status, ok: res.ok, body };
}

function buildCompaniesUrl(categoryId: number, countries: string, level2_locations: string): string {
  let url = `${SPHERESCOUT_BASE_URL}/api/companies/?category=${categoryId}&countries=${encodeURIComponent(countries)}`;
  if (level2_locations) {
    const states = level2_locations.split(",").map((s) => s.trim()).filter(Boolean);
    for (const state of states) {
      url += `&level2_locations=${encodeURIComponent(state)}`;
    }
  }
  return url;
}

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

  const url = buildCompaniesUrl(categoryId, countries, level2_locations);
  console.log(`[SphereScout Preview] Final URL: ${url}`);

  const result = await callSphereScout(url);

  if (!result.ok) {
    return Response.json(
      { error: `SphereScout API error ${result.status}`, debug: { url, body: result.body } },
      { status: 502 }
    );
  }

  const responseBody = result.body as Record<string, unknown>;

  return Response.json({
    totalCount: responseBody.totalCount ?? responseBody.total_count ?? 0,
    preview: responseBody.preview ?? responseBody.results ?? [],
    debug: { urlCalled: url, responseKeys: responseBody ? Object.keys(responseBody) : [] },
  });
}
