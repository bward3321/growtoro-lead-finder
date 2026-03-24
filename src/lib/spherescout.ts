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
  phone: string[] | string;
  city: string;
  country: string;
  level2_location: string;
  address: string;
  website: string;
  instagram: string;
  facebook: string;
  categories: string[];
  rating: number;
  review_count: number;
  latitude: number;
  longitude: number;
  zipcode: string;
  collected_at: string;
  place_id: string;
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
  // Simple query string format — proven to work via test route
  const query = new URLSearchParams();
  query.set("category", String(params.category));
  query.set("countries", params.countries);
  if (params.level2_locations) {
    query.set("level2_locations", params.level2_locations);
  }
  const qs = query.toString();
  console.log(`[SphereScout] getCompanies query: ${qs}`);
  return spherescoutFetch(`/api/companies/?${qs}`);
}

export async function downloadCsv(params: {
  category: number;
  countries: string;
  level2_locations?: string;
}): Promise<{ status: string; search_id: string; lead_count: number }> {
  const query = new URLSearchParams();
  query.set("category", String(params.category));
  query.set("countries", params.countries);
  if (params.level2_locations) {
    query.set("level2_locations", params.level2_locations);
  }
  query.set("export_format", "csv");
  return spherescoutFetch(`/api/download-csv/?${query.toString()}`, {
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
