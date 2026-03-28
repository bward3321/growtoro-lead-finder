import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as searchleads from "@/lib/searchleads";

const SEARCHLEADS_BASE_URL = "https://pro.searchleads.co/functions/v1";
const API_KEY = process.env.SEARCHLEADS_API_KEY!;

/**
 * Build SearchLeads API filters from frontend filter names.
 * MUST match the count route's filter building exactly.
 */
function buildSearchLeadsFilters(src: any) {
  const filters: Record<string, unknown> = {};

  const titles = src.jobTitles || src.titles || [];
  const industries = src.industries || src.industry || [];
  const locations = src.locations || src.location || [];
  const seniority = src.seniority || src.seniorityLevel || [];
  const technologies = src.technologies || src.technology || [];
  const employeeMin = src.employeeSizeMin ?? src.employeeMin ?? null;
  const employeeMax = src.employeeSizeMax ?? src.employeeMax ?? null;

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

  return filters;
}

/**
 * Fetch a page of contacts using the EXPORT endpoint (includes emails & phones).
 * Uses /people-search/export instead of /people-search.
 */
async function fetchExportPage(filters: Record<string, unknown>, keyword: string, page: number, size: number) {
  const requestBody: Record<string, unknown> = { filters, page, size };
  if (keyword && keyword.trim()) {
    requestBody.textFilters = { "contact.keyword": keyword.trim() };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetch(`${SEARCHLEADS_BASE_URL}/people-search/export`, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "x-searchleads-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "GrowtorLeadFinder/1.0",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (fetchErr: any) {
    clearTimeout(timeout);
    const msg = fetchErr.name === "AbortError"
      ? "B2B export service timed out. Please try again in a moment."
      : "B2B export service temporarily unavailable. Please try again in a moment.";
    const err = new Error(msg);
    (err as any).statusCode = 503;
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  // Guard against non-JSON responses (Cloudflare 502/503 HTML pages)
  const slContentType = res.headers.get("content-type");
  if (!slContentType || !slContentType.includes("application/json")) {
    console.error("[SearchLeads Export] Non-JSON response, status:", res.status);
    const err = new Error("B2B export service temporarily unavailable. Please try again in a moment.");
    (err as any).statusCode = 503;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();

    // Handle 402 — insufficient SearchLeads export credits
    if (res.status === 402) {
      const err = new Error("Export temporarily unavailable, please try again later");
      (err as any).statusCode = 402;
      throw err;
    }

    throw new Error(`SearchLeads export API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();

  // Log structure on first page for debugging
  if (page === 0) {
    console.log("[SearchLeads Export] RAW RESPONSE TOP KEYS:", JSON.stringify(Object.keys(data)));
    console.log("[SearchLeads Export] FULL RESPONSE (first 2000 chars):", JSON.stringify(data).substring(0, 2000));
  }

  const inner = data?.results || data;
  return inner?.content || data?.content || [];
}

/**
 * Extract contact from the EXPORT endpoint response.
 * Export fields: id, index, first_name, last_name, personal_email, email,
 * email_status, valid_mobile_number, name, headline, title, linkedin_url,
 * skills, department, sub_department.
 * Also handles the nested profile/company structure from search endpoint as fallback.
 */
function extractContact(item: any): searchleads.SearchLeadsContact {
  function str(val: unknown): string {
    if (val == null) return "";
    if (typeof val === "object") return "";
    return String(val);
  }

  // Export endpoint flat fields
  const firstName = str(item?.first_name);
  const lastName = str(item?.last_name);
  const exportName = str(item?.name);

  // Nested profile/company (fallback from search endpoint structure)
  const profile = item?.profile || {};
  const company = item?.company || {};
  const link = item?.link || {};
  const loc = item?.location || {};
  const companyLink = company.link || {};
  const companyStaff = company.staff || {};
  const positionGroups = item?.position_groups || [];
  const currentPosition = positionGroups[0] || {};
  const currentCompanyFromPosition = currentPosition.company || {};

  // Name: prefer export flat fields, fall back to profile
  const fullName =
    exportName ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    str(profile.full_name) ||
    [str(profile.first_name), str(profile.last_name)].filter(Boolean).join(" ");

  // Email: export endpoint provides personal_email and email
  const email =
    str(item?.email) ||
    str(item?.personal_email) ||
    str(profile.email) ||
    str(profile.work_email);

  // Phone: export endpoint provides valid_mobile_number
  const phone =
    str(item?.valid_mobile_number) ||
    str(item?.phone) ||
    str(item?.mobile_phone) ||
    str(item?.direct_phone) ||
    str(profile.phone);

  // Job title
  const jobTitle =
    str(item?.title) ||
    str(item?.headline) ||
    str(profile.title) ||
    str(profile.headline);

  // Company name
  const companyName =
    str(item?.company_name) ||
    str(currentCompanyFromPosition.name) ||
    str(company.name) ||
    str(company.summary);

  // Industry
  const industry =
    str(item?.industry) ||
    str(item?.department) ||
    (Array.isArray(company.industries) ? str(company.industries[0]) : "");

  // Location
  let location = "";
  if (typeof loc === "string") {
    location = loc;
  } else if (typeof loc === "object" && loc !== null) {
    location = str(loc.default) || [str(loc.city), str(loc.state), str(loc.country)].filter(Boolean).join(", ");
  }

  // LinkedIn URL
  const linkedinUrl =
    str(item?.linkedin_url) ||
    str(link.linkedin);

  return {
    fullName,
    email,
    phone,
    jobTitle,
    company: companyName,
    industry,
    location,
    linkedinUrl,
    companyWebsite: str(companyLink.website) || str(company.domain),
    companySize: str(companyStaff.total),
    seniority: str(item?.seniority),
  };
}

function contactsToCsv(contacts: searchleads.SearchLeadsContact[]): string {
  const headers = [
    "Full Name", "Email", "Phone", "Job Title", "Company",
    "Industry", "Location", "LinkedIn URL", "Company Website",
    "Company Size", "Seniority",
  ];
  const rows = contacts.map((c) =>
    [
      c.fullName, c.email, c.phone, c.jobTitle, c.company,
      c.industry, c.location, c.linkedinUrl, c.companyWebsite,
      c.companySize, c.seniority,
    ].map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const frontendFilters = body.filters || body;
  const desiredCount = body.desiredCount;

  console.log("[SearchLeads Export] Frontend filters:", JSON.stringify(frontendFilters));

  if (!desiredCount) {
    return Response.json({ error: "desiredCount is required" }, { status: 400 });
  }

  // Build SearchLeads filters — same as count route
  const slFilters = buildSearchLeadsFilters(frontendFilters);
  const keyword = frontendFilters.keyword || frontendFilters.keywords || "";

  console.log("[SearchLeads Export] SearchLeads filters:", JSON.stringify(slFilters));

  // B2B contacts cost 2 credits each (matches SearchLeads export credit cost)
  const creditsNeeded = desiredCount * 2;

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || user.credits < creditsNeeded) {
    return Response.json(
      { error: `Insufficient credits. Need ${creditsNeeded.toLocaleString()}, have ${(user?.credits || 0).toLocaleString()}` },
      { status: 402 }
    );
  }

  // Deduct credits upfront
  await prisma.user.update({
    where: { id: session.id },
    data: { credits: { decrement: creditsNeeded } },
  });

  // Build campaign name
  const nameparts: string[] = [];
  const titles = frontendFilters.jobTitles || [];
  const industries = frontendFilters.industries || [];
  if (titles.length) nameparts.push(titles.slice(0, 2).join(", "));
  if (industries.length) nameparts.push(industries[0]);
  const campaignName = `B2B - ${nameparts.join(" / ") || "Contact Search"}`;

  // Create campaign as PROCESSING so user gets redirected immediately
  const campaign = await prisma.campaign.create({
    data: {
      userId: session.id,
      name: campaignName,
      platform: "b2bcontacts",
      extractionType: "B2B_CONTACT_SEARCH",
      source: "searchleads",
      targetCount: desiredCount,
      creditsUsed: creditsNeeded,
      config: JSON.stringify(frontendFilters),
      status: "PROCESSING",
    },
  });

  const campaignId = campaign.id;

  try {
    const contacts: searchleads.SearchLeadsContact[] = [];
    const pageSize = 100;
    let page = 0;

    while (contacts.length < desiredCount) {
      const remaining = desiredCount - contacts.length;
      const size = Math.min(pageSize, remaining);
      const results = await fetchExportPage(slFilters, keyword, page, size);

      if (!Array.isArray(results) || results.length === 0) break;

      // Log first contact from export endpoint
      if (page === 0 && results.length > 0) {
        const c0 = results[0];
        console.log("[SearchLeads Export] FIRST EXPORT CONTACT KEYS:", JSON.stringify(Object.keys(c0)));
        console.log("[SearchLeads Export] FIRST EXPORT CONTACT:", JSON.stringify(c0).substring(0, 3000));
        console.log("[SearchLeads Export] email:", c0?.email, "| personal_email:", c0?.personal_email, "| valid_mobile_number:", c0?.valid_mobile_number);
        const parsed = extractContact(c0);
        console.log("[SearchLeads Export] FIRST PARSED:", JSON.stringify(parsed));
      }

      for (const raw of results) {
        contacts.push(extractContact(raw));
        if (contacts.length >= desiredCount) break;
      }

      if (results.length < size) break;
      page++;
    }

    console.log(`[SearchLeads Export] Fetched ${contacts.length} contacts (requested ${desiredCount})`);

    // Build CSV and update campaign
    const csvData = contactsToCsv(contacts);
    const actualCredits = contacts.length * 2;
    const refund = creditsNeeded - actualCredits;

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "COMPLETED",
        leadsFound: contacts.length,
        creditsUsed: actualCredits,
        creditsRefunded: refund,
        searchleadsData: csvData,
      },
    });

    if (refund > 0) {
      await prisma.user.update({
        where: { id: session.id },
        data: { credits: { increment: refund } },
      });
    }

    return Response.json({
      campaign: { ...campaign, status: "COMPLETED", leadsFound: contacts.length },
      leadCount: contacts.length,
      creditsUsed: actualCredits,
      creditsRefunded: refund,
    });
  } catch (error: any) {
    console.error("[SearchLeads Export] Error during fetch:", error.message);

    // Refund all credits and mark as failed
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "FAILED", creditsUsed: 0, creditsRefunded: creditsNeeded },
    });
    await prisma.user.update({
      where: { id: session.id },
      data: { credits: { increment: creditsNeeded } },
    });

    // User-friendly message for SearchLeads credit issues
    const userMessage = error.statusCode === 402
      ? "Export temporarily unavailable, please try again later"
      : error.message || "Export failed";

    return Response.json(
      { error: userMessage, campaign },
      { status: 502 }
    );
  }
}
