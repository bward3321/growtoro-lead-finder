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

export async function getCategories(): Promise<SphereScoutCategory[]> {
  return spherescoutFetch("/api/categories/");
}

export async function downloadCsv(params: {
  category: number;
  countries: string;
  level1_locations?: number[];
}): Promise<{ status: string; search_id: string; lead_count: number }> {
  let url = `/api/download-csv/?category=${params.category}&countries=${encodeURIComponent(params.countries)}`;
  if (params.level1_locations?.length) {
    for (const id of params.level1_locations) {
      url += `&level1_locations=${id}`;
    }
  }
  url += "&export_format=csv";
  console.log(`[SphereScout] downloadCsv URL: ${url}`);
  return spherescoutFetch(url, { method: "POST" });
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
