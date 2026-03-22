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
    tryCreate("Keyword search (nested inputs/limits)", {
      type: "INSTAGRAM_KEYWORD_SEARCH",
      inputs: {
        keywords: ["fitness coach"],
        country: "us",
        language: "en",
      },
      limits: {
        maxEmails: 10,
      },
    }),
    tryCreate("Profile followers (nested inputs/limits)", {
      type: "INSTAGRAM_USER_FOLLOWERS",
      inputs: {
        targetUser: "instagram",
      },
      limits: {
        maxProfilesToScan: 10,
      },
    }),
    tryCreate("Hashtag (nested inputs/limits)", {
      type: "INSTAGRAM_HASHTAG",
      inputs: {
        hashtags: ["fitness"],
      },
      limits: {
        maxProfilesToScan: 10,
      },
    }),
  ]);

  return Response.json({ attempts });
}
