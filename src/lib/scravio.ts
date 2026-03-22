const SCRAVIO_BASE_URL = "https://api.scravio.com/api";
const API_KEY = process.env.SCRAVIO_API_KEY!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scravioFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${SCRAVIO_BASE_URL}${path}`;
  const method = options.method || "GET";

  console.log(`[Scravio] ${method} ${url}`, options.body ? JSON.parse(options.body as string) : "");

  const res = await fetch(url, {
    ...options,
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
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

  console.log(`[Scravio] ${method} ${url} → ${res.status}`, JSON.stringify(data, null, 2));

  if (!res.ok) {
    throw new Error(`Scravio API error ${res.status}: ${text}`);
  }

  return data;
}

// Map our internal field names to what Scravio's API actually expects
function buildScravioPayload(data: {
  type: string;
  name: string;
  target_count: number;
  keywords?: string;
  hashtag?: string;
  username?: string;
  post_url?: string;
  country?: string;
  language?: string;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    type: data.type,
    name: data.name,
    maxEmailsToFind: data.target_count,
  };

  // Username-based campaigns use targetUsername
  if (data.username) {
    payload.targetUsername = data.username.replace(/^@/, "");
  }

  // Hashtag campaigns
  if (data.hashtag) {
    payload.targetHashtag = data.hashtag.replace(/^#/, "");
  }

  // Keyword campaigns
  if (data.keywords) {
    payload.keywords = data.keywords;
  }

  // Post URL campaigns
  if (data.post_url) {
    payload.targetPostUrl = data.post_url;
  }

  // Optional filters
  if (data.country) payload.country = data.country;
  if (data.language) payload.language = data.language;

  return payload;
}

export async function createCampaign(data: {
  type: string;
  name: string;
  target_count: number;
  keywords?: string;
  hashtag?: string;
  username?: string;
  post_url?: string;
  country?: string;
  language?: string;
}) {
  const payload = buildScravioPayload(data);
  return scravioFetch("/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listCampaigns() {
  return scravioFetch("/campaigns");
}

export async function listActiveCampaigns() {
  return scravioFetch("/campaigns?status=scraping");
}

export async function getCampaign(id: string) {
  return scravioFetch(`/campaigns/${id}`);
}

export async function getCampaignLeads(id: string, page = 1, perPage = 50) {
  return scravioFetch(`/campaigns/${id}/leads?page=${page}&per_page=${perPage}`);
}

export async function stopCampaign(id: string) {
  return scravioFetch(`/campaigns/${id}/stop`, { method: "POST" });
}

export async function createExport(id: string) {
  return scravioFetch(`/campaigns/${id}/exports`, { method: "POST" });
}

export async function getExportUrl(campaignId: string, exportId: string) {
  return scravioFetch(`/campaigns/${campaignId}/exports/${exportId}`);
}

export async function createListExport(campaignId: string) {
  return scravioFetch(`/campaigns/${campaignId}/list-exports`, {
    method: "POST",
    body: JSON.stringify({ emailOnly: true, fileFormat: "csv" }),
  });
}

export async function getListExportDownload(campaignId: string, exportId: string) {
  return scravioFetch(`/campaigns/${campaignId}/list-exports/${exportId}/download`);
}

export async function getAuthMe() {
  return scravioFetch("/auth/me");
}

export const PLATFORM_METHODS: Record<string, { label: string; type: string; inputs: string[] }[]> = {
  instagram: [
    { label: "Keyword Search", type: "INSTAGRAM_KEYWORD_SEARCH", inputs: ["keywords", "country", "language"] },
    { label: "Hashtag", type: "INSTAGRAM_HASHTAG", inputs: ["hashtag", "country", "language"] },
    { label: "Followers", type: "INSTAGRAM_USER_FOLLOWERS", inputs: ["username"] },
    { label: "Following", type: "INSTAGRAM_USER_FOLLOWING", inputs: ["username"] },
    { label: "Post Likers", type: "INSTAGRAM_POST_LIKERS", inputs: ["post_url"] },
    { label: "Post Commenters", type: "INSTAGRAM_POST_COMMENTERS", inputs: ["post_url"] },
  ],
  twitter: [
    { label: "Keyword Search", type: "X_KEYWORD_SEARCH", inputs: ["keywords", "country", "language"] },
    { label: "Followers", type: "X_FOLLOWERS", inputs: ["username"] },
    { label: "Following", type: "X_FOLLOWING", inputs: ["username"] },
    { label: "Retweeters", type: "X_RETWEETS", inputs: ["post_url"] },
    { label: "Repliers", type: "X_REPLIERS", inputs: ["post_url"] },
  ],
  youtube: [
    { label: "Keyword Search", type: "YOUTUBE_KEYWORD_SEARCH", inputs: ["keywords", "country", "language"] },
  ],
  facebook: [
    { label: "Keyword Search", type: "FACEBOOK_KEYWORD_SEARCH", inputs: ["keywords", "country", "language"] },
  ],
  linkedin: [
    { label: "Keyword Search", type: "LINKEDIN_KEYWORD_SEARCH", inputs: ["keywords", "country", "language"] },
  ],
  tiktok: [
    { label: "Keyword Search", type: "TIKTOK_KEYWORD_SEARCH", inputs: ["keywords", "country", "language"] },
  ],
};

export const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📸" },
  { id: "twitter", name: "X / Twitter", icon: "𝕏" },
  { id: "youtube", name: "YouTube", icon: "▶️" },
  { id: "facebook", name: "Facebook", icon: "📘" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
];
