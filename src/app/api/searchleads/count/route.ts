import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const SEARCHLEADS_BASE_URL = "https://pro.searchleads.co/functions/v1";
const API_KEY = process.env.SEARCHLEADS_API_KEY!;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  console.log("[SearchLeads Count] Raw request body from frontend:", JSON.stringify(body));

  const { filters } = body;
  if (!filters || typeof filters !== "object") {
    return Response.json({ error: "filters object is required" }, { status: 400 });
  }

  // Build SearchLeads filter object from scratch — only include non-empty values
  const slFilters: Record<string, unknown> = {};

  if (filters.jobTitles?.length) {
    slFilters["contact.experience.latest.title"] = filters.jobTitles;
  }
  if (filters.industries?.length) {
    slFilters["account.industry"] = filters.industries.map((i: string) => i.toLowerCase());
  }
  if (filters.locations?.length) {
    slFilters["contact.location"] = filters.locations;
  }
  if (filters.seniority?.length) {
    slFilters["contact.seniority"] = filters.seniority.map((s: string) => s.toLowerCase());
  }
  if (filters.technologies?.length) {
    slFilters["account.technology"] = filters.technologies;
  }
  if (filters.employeeSizeMin != null || filters.employeeSizeMax != null) {
    const sizeFilter: Record<string, number> = {};
    if (filters.employeeSizeMin != null && Number(filters.employeeSizeMin) > 0) {
      sizeFilter.min = Math.floor(Number(filters.employeeSizeMin));
    }
    if (filters.employeeSizeMax != null && Number(filters.employeeSizeMax) > 0) {
      sizeFilter.max = Math.floor(Number(filters.employeeSizeMax));
    }
    if (Object.keys(sizeFilter).length > 0) {
      slFilters["account.employeeSize"] = sizeFilter;
    }
  }

  const searchBody: Record<string, unknown> = { filters: slFilters, page: 0, size: 1 };

  if (filters.keyword?.trim()) {
    searchBody.textFilters = { "contact.keyword": filters.keyword.trim() };
  }

  console.log("[SearchLeads Count] Sending to SearchLeads:", JSON.stringify(searchBody));

  try {
    const res = await fetch(`${SEARCHLEADS_BASE_URL}/people-search`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "x-searchleads-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "GrowtorLeadFinder/1.0",
      },
      body: JSON.stringify(searchBody),
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    console.log("[SearchLeads Count] Response status:", res.status);
    console.log("[SearchLeads Count] Response body:", JSON.stringify(data).slice(0, 2000));

    if (!res.ok) {
      const msg = data?.message || data?.error || data?.detail || text;
      return Response.json({ error: `SearchLeads error ${res.status}: ${msg}` }, { status: 502 });
    }

    const totalElements = data.totalElements ?? data.total_elements ?? data.total ?? 0;
    console.log("[SearchLeads Count] totalElements:", totalElements);

    return Response.json({ totalElements });
  } catch (error: any) {
    console.error("[SearchLeads Count] Fetch error:", error.message);
    return Response.json(
      { error: error.message || "Failed to check availability" },
      { status: 502 }
    );
  }
}
