export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("RAW FRONTEND DATA:", JSON.stringify(data));

    // The frontend sends { filters: { jobTitles, industries, ... } }
    // Unwrap the filters object, or fall back to top-level fields
    const src = data.filters || data;

    // Build SearchLeads filters from whatever field names we find
    const filters: Record<string, unknown> = {};

    const titles = src.jobTitles || src.titles || src["contact.experience.latest.title"] || [];
    const industries = src.industries || src.industry || src["account.industry"] || [];
    const locations = src.locations || src.location || src["contact.location"] || [];
    const seniority = src.seniority || src.seniorityLevel || src["contact.seniority"] || [];
    const technologies = src.technologies || src.technology || src["account.technology"] || [];
    const employeeMin = src.employeeSizeMin ?? src.employeeMin ?? src["account.employeeSize"]?.min ?? null;
    const employeeMax = src.employeeSizeMax ?? src.employeeMax ?? src["account.employeeSize"]?.max ?? null;
    const keyword = src.keyword || src.keywords || "";

    if (Array.isArray(titles) && titles.length > 0) filters["contact.experience.latest.title"] = titles;
    if (Array.isArray(industries) && industries.length > 0) filters["account.industry"] = industries.map((i: string) => i.toLowerCase());
    if (Array.isArray(locations) && locations.length > 0) filters["contact.location"] = locations;
    if (Array.isArray(seniority) && seniority.length > 0) filters["contact.seniority"] = seniority.map((s: string) => s.toLowerCase());
    if (Array.isArray(technologies) && technologies.length > 0) filters["account.technology"] = technologies;
    if (employeeMin !== null || employeeMax !== null) {
      const size: Record<string, number> = {};
      if (employeeMin !== null && Number(employeeMin) > 0) size.min = Number(employeeMin);
      if (employeeMax !== null && Number(employeeMax) > 0) size.max = Number(employeeMax);
      if (Object.keys(size).length > 0) filters["account.employeeSize"] = size;
    }

    const requestBody: Record<string, unknown> = { filters, page: 0, size: 1 };
    if (keyword && String(keyword).trim()) {
      requestBody.textFilters = { "contact.keyword": String(keyword).trim() };
    }

    console.log("SEARCHLEADS REQUEST BODY:", JSON.stringify(requestBody));

    const response = await fetch("https://pro.searchleads.co/functions/v1/people-search", {
      method: "POST",
      cache: "no-store",
      headers: {
        "x-searchleads-api-key": process.env.SEARCHLEADS_API_KEY || "",
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "GrowtorLeadFinder/1.0",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    let result: any;
    try { result = JSON.parse(responseText); } catch { result = responseText; }

    console.log("SEARCHLEADS RESPONSE STATUS:", response.status);
    console.log("SEARCHLEADS RESPONSE BODY:", String(responseText).slice(0, 2000));

    const debug = {
      requestBodySent: requestBody,
      searchLeadsStatus: response.status,
      searchLeadsResponse: String(responseText).slice(0, 500),
    };

    if (!response.ok) {
      return NextResponse.json({ totalElements: 0, error: result, debug });
    }

    const totalElements = result?.totalElements ?? result?.total_elements ?? result?.total ?? 0;
    return NextResponse.json({ totalElements, debug });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Count route error:", error);
    return NextResponse.json({ totalElements: 0, error: msg });
  }
}
