const SEARCHLEADS_BASE_URL = "https://pro.searchleads.co/functions/v1";
const API_KEY = process.env.SEARCHLEADS_API_KEY!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function searchleadsFetch(path: string, body: unknown): Promise<any> {
  const url = `${SEARCHLEADS_BASE_URL}${path}`;
  console.log(`[SearchLeads] POST ${url}`);
  console.log(`[SearchLeads] Headers: x-searchleads-api-key=${API_KEY ? API_KEY.slice(0, 8) + "..." : "MISSING"}`);
  console.log(`[SearchLeads] Body:`, JSON.stringify(body));

  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "x-searchleads-api-key": API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "GrowtorLeadFinder/1.0",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  console.log(`[SearchLeads] POST ${url} → ${res.status}`, JSON.stringify(data).slice(0, 1000));

  if (!res.ok) {
    const parsed = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
    const msg = parsed?.message || parsed?.error || parsed?.detail || text;

    // Handle rate limiting with Retry-After
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const err = new Error(`Rate limited. Retry after ${retryAfter || "60"} seconds`);
      (err as any).statusCode = 429;
      (err as any).retryAfter = parseInt(retryAfter || "60", 10);
      throw err;
    }

    const ERROR_MESSAGES: Record<number, string> = {
      400: "Invalid search filters",
      401: "Service temporarily unavailable",
      403: "This filter is not available",
      422: "B2B search service temporarily at capacity, try again later",
    };

    const err = new Error(ERROR_MESSAGES[res.status] || `SearchLeads API error ${res.status}: ${msg}`);
    (err as any).statusCode = res.status;
    (err as any).searchleadsResponse = data;
    throw err;
  }

  return data;
}

async function fetchWithRetry(path: string, body: unknown, maxRetries = 3): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await searchleadsFetch(path, body);
    } catch (error: any) {
      if (error.statusCode === 429 && attempt < maxRetries) {
        const wait = (error.retryAfter || 60) * 1000;
        console.log(`[SearchLeads] Rate limited, waiting ${wait}ms before retry ${attempt + 1}`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (error.statusCode === 500 && attempt < maxRetries) {
        const wait = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`[SearchLeads] Server error, retrying in ${wait}ms (attempt ${attempt + 1})`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw error;
    }
  }
}

export interface SearchLeadsFilters {
  jobTitles?: string[];
  industries?: string[];
  locations?: string[];
  seniority?: string[];
  technologies?: string[];
  employeeSizeMin?: number;
  employeeSizeMax?: number;
  keyword?: string;
}

function buildRequestBody(filters: SearchLeadsFilters, page: number, size: number) {
  // Only include filters that have actual values — never send empty arrays
  const filterObj: Record<string, unknown> = {};

  if (filters.jobTitles && filters.jobTitles.length > 0) {
    // Job titles: send as-is (mixed case is fine)
    filterObj["contact.experience.latest.title"] = filters.jobTitles;
  }
  if (filters.industries && filters.industries.length > 0) {
    // Industries: MUST be lowercase to match SearchLeads catalog
    filterObj["account.industry"] = filters.industries.map((i) => i.toLowerCase());
  }
  if (filters.locations && filters.locations.length > 0) {
    // Locations: send as-is (proper casing like "United States")
    filterObj["contact.location"] = filters.locations;
  }
  if (filters.seniority && filters.seniority.length > 0) {
    // Seniority: must be lowercase enum values
    filterObj["contact.seniority"] = filters.seniority.map((s) => s.toLowerCase());
  }
  if (filters.technologies && filters.technologies.length > 0) {
    filterObj["account.technology"] = filters.technologies;
  }
  if (filters.employeeSizeMin != null || filters.employeeSizeMax != null) {
    const sizeFilter: Record<string, number> = {};
    if (filters.employeeSizeMin != null && filters.employeeSizeMin > 0) {
      sizeFilter.min = Math.floor(filters.employeeSizeMin);
    }
    if (filters.employeeSizeMax != null && filters.employeeSizeMax > 0) {
      sizeFilter.max = Math.floor(filters.employeeSizeMax);
    }
    if (Object.keys(sizeFilter).length > 0) {
      filterObj["account.employeeSize"] = sizeFilter;
    }
  }

  const body: Record<string, unknown> = { filters: filterObj, page, size };

  if (filters.keyword && filters.keyword.trim()) {
    body.textFilters = { "contact.keyword": filters.keyword.trim() };
  }

  return body;
}

/**
 * Get count of matching contacts. Uses size=1 to minimize credit usage
 * (SearchLeads charges 1 credit per prospect RETURNED, so size=1 = 1 credit).
 */
export async function getCount(filters: SearchLeadsFilters): Promise<{ totalElements: number }> {
  const body = buildRequestBody(filters, 0, 1);
  const data = await fetchWithRetry("/people-search", body);
  // SearchLeads nests data under data.results
  const inner = data?.results || data;
  return {
    totalElements: inner?.totalElements ?? inner?.total_elements ?? data?.totalElements ?? 0,
  };
}

export interface SearchLeadsContact {
  fullName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  location?: string;
  linkedinUrl?: string;
  companyWebsite?: string;
  companySize?: string;
  seniority?: string;
}

function parseContact(item: any): SearchLeadsContact {
  const profile = item?.profile || item || {};
  const company = item?.company || {};
  const positions = profile.profile_positions || profile.position_groups || [];
  const currentPosition = positions[0] || {};
  const currentCompany = currentPosition.company || {};

  const firstName = profile.first_name || "";
  const lastName = profile.last_name || "";

  return {
    fullName: profile.full_name || [firstName, lastName].filter(Boolean).join(" ") || item?.name || "",
    email: profile.work_email || profile.email || item?.email || "",
    phone: (Array.isArray(profile.phone_numbers) ? profile.phone_numbers[0] : null) || profile.phone || item?.phone || "",
    jobTitle: profile.title || profile.headline || currentPosition.title || item?.title || "",
    company: currentCompany.name || profile.company_name || profile.position_company || company.name || item?.companyName || "",
    industry: company.industry || profile.industry || "",
    location: (typeof profile.location === "string" ? profile.location : profile.location?.default) || [profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "",
    linkedinUrl: profile.linkedin || profile.link?.linkedin || (item?.identifier ? `https://linkedin.com/in/${item.identifier}` : "") || "",
    companyWebsite: company.domain || currentCompany.url || company.website || company.link?.website || "",
    companySize: String(company.staff?.total || company.employees || ""),
    seniority: profile.seniority || "",
  };
}

/**
 * Fetch contacts in paginated batches (max 100 per page).
 * Returns parsed contacts array up to the desired count.
 */
export async function fetchContacts(
  filters: SearchLeadsFilters,
  desiredCount: number
): Promise<SearchLeadsContact[]> {
  const contacts: SearchLeadsContact[] = [];
  const pageSize = 100;
  let page = 0;

  while (contacts.length < desiredCount) {
    const remaining = desiredCount - contacts.length;
    const size = Math.min(pageSize, remaining);
    const body = buildRequestBody(filters, page, size);
    const data = await fetchWithRetry("/people-search", body);

    // SearchLeads nests content under data.results.content
    const inner = data?.results || data;
    const results = inner?.content || data?.content || data?.data || [];
    if (!Array.isArray(results) || results.length === 0) break;

    // Log first contact's raw structure to Vercel logs for debugging field paths
    if (page === 0 && results.length > 0) {
      console.log("[SearchLeads] First raw contact:", JSON.stringify(results[0]).slice(0, 3000));
      const parsed = parseContact(results[0]);
      console.log("[SearchLeads] First parsed contact:", JSON.stringify(parsed));
    }

    for (const raw of results) {
      contacts.push(parseContact(raw));
      if (contacts.length >= desiredCount) break;
    }

    // No more pages available
    if (results.length < size) break;
    page++;
  }

  return contacts;
}

/**
 * Convert contacts array to CSV string.
 */
export function contactsToCsv(contacts: SearchLeadsContact[]): string {
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
