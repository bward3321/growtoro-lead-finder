const SPHERESCOUT_BASE_URL = "https://api.spherescout.io";
const API_KEY = process.env.SPHERESCOUT_API_KEY!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function spherescoutFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${SPHERESCOUT_BASE_URL}${path}`;
  const method = options.method || "GET";

  const authHeader = `Token ${API_KEY}`;
  console.log(`[SphereScout] ${method} ${url}`);
  console.log(`[SphereScout] Auth: "${authHeader.slice(0, 14)}...${authHeader.slice(-8)}" (key length: ${API_KEY?.length})`);
  if (options.body) console.log(`[SphereScout] Body:`, options.body);

  const res = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      Authorization: `Token ${API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "GrowtorLeadFinder/1.0",
      ...options.headers,
    },
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  console.log(`[SphereScout] ${method} ${url} → ${res.status}`, JSON.stringify(data));

  if (!res.ok) {
    const parsed = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
    const msg = parsed?.message || parsed?.error || parsed?.detail || text;
    const err = new Error(`SphereScout API error ${res.status}: ${msg}`);
    (err as any).statusCode = res.status;
    (err as any).spherescoutResponse = data;
    throw err;
  }

  return data;
}

export interface SphereScoutCategory {
  id: number;
  name: string;
  gcid: string;
}

export interface SphereScoutPreviewItem {
  name: string;
  email: string[];
  phone: string[];
  city: string;
  country: string;
  level2_location: string;
}

export interface SphereScoutPreviewResult {
  preview: SphereScoutPreviewItem[];
  totalCount: number;
  cities: string[];
  zipCodes: string[];
  categories: unknown[];
}

export async function getCategories(): Promise<SphereScoutCategory[]> {
  return spherescoutFetch("/api/categories/");
}

export async function getCompanies(params: {
  category: number;
  countries: string;
  level2_locations?: string;
}): Promise<SphereScoutPreviewResult> {
  // Build query string manually — SphereScout expects array-style params
  const parts: string[] = [];
  parts.push(`category=${encodeURIComponent(String(params.category))}`);
  // countries can be comma-separated or single
  const countryCodes = params.countries.split(",").map((c) => c.trim()).filter(Boolean);
  for (const c of countryCodes) {
    parts.push(`countries=${encodeURIComponent(c)}`);
  }
  if (params.level2_locations) {
    const locations = params.level2_locations.split(",").map((l) => l.trim()).filter(Boolean);
    for (const l of locations) {
      parts.push(`level2_locations=${encodeURIComponent(l)}`);
    }
  }
  const queryString = parts.join("&");
  console.log(`[SphereScout] getCompanies query: ${queryString}`);
  return spherescoutFetch(`/api/companies/?${queryString}`);
}

export async function downloadCsv(params: {
  category: number;
  countries: string;
  level2_locations?: string;
}): Promise<{ status: string; search_id: string; lead_count: number }> {
  const parts: string[] = [];
  parts.push(`category=${encodeURIComponent(String(params.category))}`);
  const countryCodes = params.countries.split(",").map((c) => c.trim()).filter(Boolean);
  for (const c of countryCodes) {
    parts.push(`countries=${encodeURIComponent(c)}`);
  }
  if (params.level2_locations) {
    const locations = params.level2_locations.split(",").map((l) => l.trim()).filter(Boolean);
    for (const l of locations) {
      parts.push(`level2_locations=${encodeURIComponent(l)}`);
    }
  }
  parts.push("export_format=csv");
  return spherescoutFetch(`/api/download-csv/?${parts.join("&")}`, {
    method: "POST",
  });
}

export async function getDownloadStatus(
  searchId: string
): Promise<{ status: string; [key: string]: unknown }> {
  return spherescoutFetch(`/api/download-status/${searchId}/`);
}

export async function getDownloadUrl(
  searchId: string
): Promise<{ url: string; [key: string]: unknown }> {
  return spherescoutFetch(`/api/download-completed-csv/${searchId}/`);
}
