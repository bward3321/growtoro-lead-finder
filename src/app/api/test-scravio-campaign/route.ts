export const dynamic = "force-dynamic";

const SCRAVIO_BASE_URL = "https://api.scravio.com/api";
const API_KEY = process.env.SCRAVIO_API_KEY!;

const HEADERS = {
  "X-API-Key": API_KEY,
  "Content-Type": "application/json",
  "Accept": "application/json",
  "User-Agent": "GrowtorLeadFinder/1.0",
};

async function tryCreate(label: string, payload: Record<string, unknown>) {
  try {
    const res = await fetch(`${SCRAVIO_BASE_URL}/campaigns`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = text; }

    return { label, requestBody: payload, status: res.status, responseBody: body };
  } catch (error) {
    return { label, requestBody: payload, status: "FETCH_ERROR", responseBody: String(error) };
  }
}

export async function GET() {
  const attempts = await Promise.all([
    tryCreate("Attempt 1: keywords as array", {
      type: "INSTAGRAM_KEYWORD_SEARCH",
      keywords: ["fitness coach"],
      maxEmailsToFind: 10,
      country: "US",
    }),
    tryCreate("Attempt 2: keywords as string", {
      type: "INSTAGRAM_KEYWORD_SEARCH",
      keywords: "fitness coach",
      maxEmailsToFind: 10,
      country: "US",
    }),
    tryCreate("Attempt 3: with language", {
      type: "INSTAGRAM_KEYWORD_SEARCH",
      keywords: ["fitness coach"],
      maxEmailsToFind: 10,
      country: "US",
      language: "en",
    }),
    tryCreate("Attempt 4: minimal", {
      type: "INSTAGRAM_KEYWORD_SEARCH",
      keywords: ["fitness coach"],
      maxEmailsToFind: 10,
    }),
    tryCreate("Attempt 5: emailsToFind instead", {
      type: "INSTAGRAM_KEYWORD_SEARCH",
      keywords: ["fitness coach"],
      emailsToFind: 10,
      country: "US",
    }),
  ]);

  return Response.json({ attempts });
}
