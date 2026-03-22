import * as scravio from "@/lib/scravio";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test 1: Verify API key with GET /auth/me
  try {
    results.authMe = await scravio.getAuthMe();
  } catch (error) {
    results.authMe = { error: String(error) };
  }

  // Test 2: List recent campaigns
  try {
    const data = await scravio.listCampaigns() as { campaigns?: unknown[]; data?: unknown[] };
    const campaigns = data.campaigns || data.data || data;
    results.campaigns = {
      count: Array.isArray(campaigns) ? campaigns.length : "unknown",
      recent: Array.isArray(campaigns) ? campaigns.slice(0, 3) : campaigns,
    };
  } catch (error) {
    results.campaigns = { error: String(error) };
  }

  // Test 3: List active (scraping) campaigns
  try {
    const data = await scravio.listActiveCampaigns() as { campaigns?: unknown[]; data?: unknown[] };
    const active = data.campaigns || data.data || data;
    results.activeCampaigns = {
      count: Array.isArray(active) ? active.length : "unknown",
      data: active,
    };
  } catch (error) {
    results.activeCampaigns = { error: String(error) };
  }

  return Response.json(results, {
    headers: { "Content-Type": "application/json" },
  });
}
