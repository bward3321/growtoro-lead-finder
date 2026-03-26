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
  const filterObj: Record<string, unknown> = {};

  if (filters.jobTitles?.length) {
    filterObj["contact.experience.latest.title"] = filters.jobTitles;
  }
  if (filters.industries?.length) {
    // SearchLeads requires lowercase industry values
    filterObj["account.industry"] = filters.industries.map((i) => i.toLowerCase());
  }
  if (filters.locations?.length) {
    filterObj["contact.location"] = filters.locations;
  }
  if (filters.seniority?.length) {
    filterObj["contact.seniority"] = filters.seniority;
  }
  if (filters.technologies?.length) {
    filterObj["account.technology"] = filters.technologies;
  }
  if (filters.employeeSizeMin || filters.employeeSizeMax) {
    filterObj["account.employeeSize"] = {
      ...(filters.employeeSizeMin ? { min: filters.employeeSizeMin } : {}),
      ...(filters.employeeSizeMax ? { max: filters.employeeSizeMax } : {}),
    };
  }

  const body: Record<string, unknown> = { filters: filterObj, page, size };

  if (filters.keyword) {
    body.textFilters = { "contact.keyword": filters.keyword };
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
  return {
    totalElements: data.totalElements ?? data.total_elements ?? data.total ?? 0,
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

function parseContact(raw: any): SearchLeadsContact {
  return {
    fullName: raw.fullName || raw.full_name || raw.name || "",
    email: raw.email || raw.workEmail || raw.work_email || "",
    phone: raw.phone || raw.directPhone || raw.direct_phone || "",
    jobTitle: raw.title || raw.jobTitle || raw.job_title || "",
    company: raw.companyName || raw.company_name || raw.company || "",
    industry: raw.industry || "",
    location: raw.location || raw.city || "",
    linkedinUrl: raw.linkedinUrl || raw.linkedin_url || raw.linkedin || "",
    companyWebsite: raw.companyDomain || raw.company_domain || raw.website || "",
    companySize: raw.employeeCount || raw.employee_count || raw.companySize || "",
    seniority: raw.seniority || "",
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

    const results = data.content || data.results || data.data || [];
    if (!Array.isArray(results) || results.length === 0) break;

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
