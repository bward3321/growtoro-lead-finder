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

  // Log full response envelope on first call to check for export-related metadata
  if (page === 0) {
    console.log("[SearchLeads Export] RAW RESPONSE TOP KEYS:", JSON.stringify(Object.keys(data)));
    const inner = data?.results || data;
    if (inner && typeof inner === "object") {
      console.log("[SearchLeads Export] INNER RESPONSE KEYS:", JSON.stringify(Object.keys(inner)));
    }
    // Check if there are export-specific fields at the response level
    console.log("[SearchLeads Export] data.export_url:", data?.export_url);
    console.log("[SearchLeads Export] data.export_id:", data?.export_id);
    console.log("[SearchLeads Export] data.credits_per_contact:", data?.credits_per_contact);
    console.log("[SearchLeads Export] FULL RESPONSE (first 2000 chars):", JSON.stringify(data).substring(0, 2000));
  }

  const inner = data?.results || data;
  return inner?.content || data?.content || [];
}

function extractContact(item: any): searchleads.SearchLeadsContact {
  // Safely stringify — returns "" for null, undefined, or any object/array
  function str(val: unknown): string {
    if (val == null) return "";
    if (typeof val === "object") return "";
    return String(val);
  }

  const profile = item?.profile || {};
  const company = item?.company || {};
  const link = item?.link || {};
  const loc = item?.location || {};
  const companyLink = company.link || {};
  const companyStaff = company.staff || {};
  const positionGroups = item?.position_groups || [];
  const currentPosition = positionGroups[0] || {};
  const currentCompanyFromPosition = currentPosition.company || {};

  // location is a top-level object with a "default" field
  let location = "";
  if (typeof loc === "string") {
    location = loc;
  } else {
    location = str(loc.default) || [str(loc.city), str(loc.state), str(loc.country)].filter(Boolean).join(", ");
  }

  return {
    fullName: str(profile.full_name) || [str(profile.first_name), str(profile.last_name)].filter(Boolean).join(" "),
    email: str(profile.email) || str(item?.email),
    phone: str(profile.phone) || str(item?.phone),
    jobTitle: str(profile.title) || str(profile.headline),
    company: str(currentCompanyFromPosition.name) || str(company.name) || str(company.summary),
    industry: str(item?.industry) || (Array.isArray(company.industries) ? str(company.industries[0]) : ""),
    location,
    linkedinUrl: str(link.linkedin),
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

      // Log first contact's COMPLETE raw structure for debugging email/phone paths
      if (page === 0 && results.length > 0) {
        const c0 = results[0];
        console.log("[SearchLeads Export] FULL CONTACT OBJECT KEYS:", JSON.stringify(Object.keys(c0)));
        console.log("[SearchLeads Export] FULL CONTACT:", JSON.stringify(c0).substring(0, 3000));

        // Check every possible email path
        console.log("[SearchLeads Export] profile.email:", c0?.profile?.email);
        console.log("[SearchLeads Export] profile.work_email:", c0?.profile?.work_email);
        console.log("[SearchLeads Export] profile.personal_emails:", c0?.profile?.personal_emails);
        console.log("[SearchLeads Export] profile.emails:", c0?.profile?.emails);
        console.log("[SearchLeads Export] email:", c0?.email);
        console.log("[SearchLeads Export] emails:", c0?.emails);
        console.log("[SearchLeads Export] contact_info:", c0?.contact_info);

        // Check every possible phone path
        console.log("[SearchLeads Export] phone_numbers:", c0?.phone_numbers);
        console.log("[SearchLeads Export] profile.phone:", c0?.profile?.phone);
        console.log("[SearchLeads Export] profile.phone_numbers:", c0?.profile?.phone_numbers);
        console.log("[SearchLeads Export] phones:", c0?.phones);
        console.log("[SearchLeads Export] mobile_phone:", c0?.mobile_phone);
        console.log("[SearchLeads Export] direct_phone:", c0?.direct_phone);

        // Check for export/credit-gating indicators
        console.log("[SearchLeads Export] exportable:", c0?.exportable);
        console.log("[SearchLeads Export] has_email:", c0?.has_email);
        console.log("[SearchLeads Export] email_available:", c0?.email_available);
        console.log("[SearchLeads Export] is_email_verified:", c0?.is_email_verified);
        console.log("[SearchLeads Export] email_status:", c0?.email_status);

        if (c0?.profile) console.log("[SearchLeads Export] PROFILE KEYS:", JSON.stringify(Object.keys(c0.profile)));
        if (c0?.company) console.log("[SearchLeads Export] COMPANY KEYS:", JSON.stringify(Object.keys(c0.company)));

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

    return Response.json(
      { error: error.message || "Export failed", campaign },
      { status: 502 }
    );
  }
}
