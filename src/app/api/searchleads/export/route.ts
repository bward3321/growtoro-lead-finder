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

async function fetchPage(filters: Record<string, unknown>, keyword: string, page: number, size: number) {
  const requestBody: Record<string, unknown> = { filters, page, size };
  if (keyword && keyword.trim()) {
    requestBody.textFilters = { "contact.keyword": keyword.trim() };
  }

  const res = await fetch(`${SEARCHLEADS_BASE_URL}/people-search`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "x-searchleads-api-key": API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "GrowtorLeadFinder/1.0",
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SearchLeads API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const inner = data?.results || data;
  return inner?.content || data?.content || [];
}

function extractContact(item: any): searchleads.SearchLeadsContact {
  // Safely stringify any value — if it's an object, return empty string
  function str(val: unknown): string {
    if (val == null) return "";
    if (typeof val === "object") return "";
    return String(val);
  }

  const profile = item?.profile || {};
  const company = item?.company || {};
  const positions = profile.profile_positions || profile.position_groups || [];
  const currentPosition = positions[0] || {};
  const currentCompany = currentPosition.company || {};

  const firstName = str(profile.first_name);
  const lastName = str(profile.last_name);

  let location = "";
  if (typeof profile.location === "string") {
    location = profile.location;
  } else if (profile.location?.default) {
    location = str(profile.location.default);
  } else {
    location = [str(profile.city), str(profile.state), str(profile.country)].filter(Boolean).join(", ");
  }

  return {
    fullName: str(profile.full_name) || [firstName, lastName].filter(Boolean).join(" ") || str(item?.name),
    email: str(profile.work_email) || str(profile.email) || str(item?.email),
    phone: str(Array.isArray(profile.phone_numbers) ? profile.phone_numbers[0] : null) || str(profile.phone) || str(item?.phone),
    jobTitle: str(profile.title) || str(profile.headline) || str(currentPosition.title) || str(item?.title),
    company: str(currentCompany.name) || str(profile.company_name) || str(profile.position_company) || str(company.name) || str(item?.companyName),
    industry: str(company.industry) || str(profile.industry),
    location,
    linkedinUrl: str(profile.linkedin) || str(profile.link?.linkedin) || (item?.identifier ? `https://linkedin.com/in/${item.identifier}` : ""),
    companyWebsite: str(company.domain) || str(currentCompany.url) || str(company.website) || str(company.link?.website),
    companySize: str(company.staff?.total || company.employees || ""),
    seniority: str(profile.seniority),
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

  // B2B contacts cost 2 credits each
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

  // Return campaign immediately so frontend can redirect
  // Then fetch contacts and update campaign
  const campaignId = campaign.id;

  // Do the actual fetching (synchronous in this request — user already sees PROCESSING page)
  try {
    const contacts: searchleads.SearchLeadsContact[] = [];
    const pageSize = 100;
    let page = 0;

    while (contacts.length < desiredCount) {
      const remaining = desiredCount - contacts.length;
      const size = Math.min(pageSize, remaining);
      const results = await fetchPage(slFilters, keyword, page, size);

      if (!Array.isArray(results) || results.length === 0) break;

      // Log first contact's raw structure
      if (page === 0) {
        console.log("[SearchLeads Export] FIRST RAW CONTACT:", JSON.stringify(results[0]).slice(0, 3000));
        console.log("[SearchLeads Export] TOP KEYS:", Object.keys(results[0]));
        if (results[0]?.profile) console.log("[SearchLeads Export] PROFILE KEYS:", Object.keys(results[0].profile));
        if (results[0]?.company) console.log("[SearchLeads Export] COMPANY KEYS:", Object.keys(results[0].company));
        const parsed = extractContact(results[0]);
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

    return Response.json(
      { error: error.message || "Export failed", campaign },
      { status: 502 }
    );
  }
}
