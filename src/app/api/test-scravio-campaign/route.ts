export const dynamic = "force-dynamic";

const SCRAVIO_BASE_URL = "https://api.scravio.com/api";
const API_KEY = process.env.SCRAVIO_API_KEY!;

const HEADERS = {
  "X-API-Key": API_KEY,
  "Content-Type": "application/json",
  "Accept": "application/json",
  "User-Agent": "GrowtorLeadFinder/1.0",
};

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test 1: Create a small test campaign
  try {
    const payload = {
      type: "INSTAGRAM_KEYWORD_SEARCH",
      keywords: ["fitness coach"],
      maxEmailsToFind: 10,
      country: "US",
    };

    const createRes = await fetch(`${SCRAVIO_BASE_URL}/campaigns`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(payload),
    });

    const createHeaders: Record<string, string> = {};
    createRes.headers.forEach((v, k) => { createHeaders[k] = v; });

    const createBody = await createRes.text();
    let createParsed: unknown;
    try { createParsed = JSON.parse(createBody); } catch { createParsed = createBody; }

    results.createCampaign = {
      requestBody: payload,
      responseStatus: createRes.status,
      responseHeaders: createHeaders,
      responseBody: createParsed,
    };
  } catch (error) {
    results.createCampaign = { error: String(error) };
  }

  // Test 2: List all campaigns with statuses and errors
  try {
    const listRes = await fetch(`${SCRAVIO_BASE_URL}/campaigns`, {
      method: "GET",
      headers: HEADERS,
    });

    const listHeaders: Record<string, string> = {};
    listRes.headers.forEach((v, k) => { listHeaders[k] = v; });

    const listBody = await listRes.text();
    let listParsed: unknown;
    try { listParsed = JSON.parse(listBody); } catch { listParsed = listBody; }

    // Extract just statuses and errors from campaigns
    let campaignSummaries: unknown = listParsed;
    if (listParsed && typeof listParsed === "object") {
      const obj = listParsed as Record<string, unknown>;
      const campaigns = (obj.campaigns || obj.data || (Array.isArray(obj) ? obj : null)) as Record<string, unknown>[] | null;
      if (Array.isArray(campaigns)) {
        campaignSummaries = campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          status: c.status,
          state: c.state,
          error: c.error,
          failReason: c.failReason,
          fail_reason: c.fail_reason,
          errorMessage: c.errorMessage,
          error_message: c.error_message,
          leadsFound: c.leads_count || c.leadsFound,
          maxEmailsToFind: c.maxEmailsToFind,
          createdAt: c.created_at || c.createdAt,
        }));
      }
    }

    results.listCampaigns = {
      responseStatus: listRes.status,
      responseHeaders: listHeaders,
      campaigns: campaignSummaries,
    };
  } catch (error) {
    results.listCampaigns = { error: String(error) };
  }

  return Response.json(results, {
    headers: { "Content-Type": "application/json" },
  });
}
