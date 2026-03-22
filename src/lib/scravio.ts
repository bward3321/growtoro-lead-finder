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
      "Accept": "application/json",
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

  console.log(`[Scravio] ${method} ${url} → ${res.status}`, JSON.stringify(data, null, 2));

  if (!res.ok) {
    throw new Error(`Scravio API error ${res.status}: ${text}`);
  }

  return data;
}

const KEYWORD_TYPES = new Set([
  "INSTAGRAM_KEYWORD_SEARCH",
  "X_KEYWORD_SEARCH",
  "YOUTUBE_KEYWORD_SEARCH",
  "FACEBOOK_KEYWORD_SEARCH",
  "LINKEDIN_KEYWORD_SEARCH",
  "TIKTOK_KEYWORD_SEARCH",
]);

const PROFILE_TYPES = new Set([
  "INSTAGRAM_USER_FOLLOWERS",
  "INSTAGRAM_USER_FOLLOWING",
  "X_FOLLOWERS",
  "X_FOLLOWING",
]);

const HASHTAG_TYPES = new Set([
  "INSTAGRAM_HASHTAG",
]);

const POST_TYPES = new Set([
  "INSTAGRAM_POST_LIKERS",
  "INSTAGRAM_POST_COMMENTERS",
  "X_RETWEETS",
  "X_REPLIERS",
]);

// Map our internal field names to Scravio's nested inputs/limits format
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
  const type = data.type;

  if (KEYWORD_TYPES.has(type)) {
    return {
      type,
      inputs: {
        keywords: Array.isArray(data.keywords) ? data.keywords : [data.keywords || ""],
        country: (data.country || "us").toLowerCase(),
        language: data.language || "en",
      },
      limits: {
        maxEmails: data.target_count,
      },
    };
  }

  if (PROFILE_TYPES.has(type)) {
    return {
      type,
      inputs: {
        targetUser: (data.username || "").replace(/^@/, ""),
      },
      limits: {
        maxProfilesToScan: data.target_count,
      },
    };
  }

  if (HASHTAG_TYPES.has(type)) {
    const raw = data.hashtag || "";
    const tags = raw.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean);
    return {
      type,
      inputs: {
        hashtags: tags.length > 0 ? tags : [raw.replace(/^#/, "")],
      },
      limits: {
        maxProfilesToScan: data.target_count,
      },
    };
  }

  if (POST_TYPES.has(type)) {
    return {
      type,
      inputs: {
        mediaUrl: data.post_url || "",
      },
      limits: {
        maxProfilesToScan: data.target_count,
      },
    };
  }

  // Fallback for unknown types
  return {
    type,
    inputs: {
      keywords: data.keywords ? [data.keywords] : [],
      country: (data.country || "us").toLowerCase(),
      language: data.language || "en",
    },
    limits: {
      maxEmails: data.target_count,
    },
  };
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
