import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const API_KEY = process.env.SEARCHLEADS_API_KEY;
  const url = "https://pro.searchleads.co/functions/v1/people-search";
  const body = {
    filters: {
      "contact.experience.latest.title": ["CEO"],
      "account.industry": ["software development"],
    },
    page: 0,
    size: 1,
  };

  console.log("[TestSearchLeads] URL:", url);
  console.log("[TestSearchLeads] API Key:", API_KEY ? `${API_KEY.slice(0, 8)}... (${API_KEY.length} chars)` : "MISSING");
  console.log("[TestSearchLeads] Body:", JSON.stringify(body));

  try {
    const res = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "x-searchleads-api-key": API_KEY || "",
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

    console.log("[TestSearchLeads] Status:", res.status);
    console.log("[TestSearchLeads] Response:", JSON.stringify(data).slice(0, 2000));

    return Response.json({
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: data,
      requestBody: body,
      apiKeyPresent: !!API_KEY,
      apiKeyLength: API_KEY?.length || 0,
    });
  } catch (error: any) {
    console.error("[TestSearchLeads] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
