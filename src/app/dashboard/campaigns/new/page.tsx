"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📸" },
  { id: "twitter", name: "X / Twitter", icon: "𝕏" },
  { id: "youtube", name: "YouTube", icon: "▶️" },
  { id: "facebook", name: "Facebook", icon: "📘" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
];

const PLATFORM_METHODS: Record<
  string,
  { label: string; type: string; inputs: string[] }[]
> = {
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

const COUNTRIES = [
  "", "US", "GB", "CA", "AU", "DE", "FR", "ES", "IT", "NL", "BR", "IN", "JP", "KR", "MX", "AR",
  "CL", "CO", "PE", "SE", "NO", "DK", "FI", "PL", "TR", "SA", "AE", "EG", "NG", "ZA", "KE",
];

const LANGUAGES = [
  "", "en", "es", "fr", "de", "it", "pt", "nl", "ja", "ko", "zh", "ar", "hi", "tr", "pl", "sv", "da", "no", "fi",
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState("");
  const [method, setMethod] = useState<(typeof PLATFORM_METHODS)["instagram"][0] | null>(null);

  const [campaignName, setCampaignName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [username, setUsername] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [targetCount, setTargetCount] = useState(100);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function selectPlatform(id: string) {
    setPlatform(id);
    setMethod(null);
    setStep(2);
  }

  function selectMethod(m: (typeof PLATFORM_METHODS)["instagram"][0]) {
    setMethod(m);
    setCampaignName(`${platform} - ${m.label}`);
    setStep(3);
  }

  async function launchCampaign() {
    if (!method) return;
    setError("");
    setLoading(true);

    const config: Record<string, string> = {};
    if (method.inputs.includes("keywords")) config.keywords = keywords;
    if (method.inputs.includes("hashtag")) config.hashtag = hashtag;
    if (method.inputs.includes("username")) config.username = username;
    if (method.inputs.includes("post_url")) config.post_url = postUrl;
    if (method.inputs.includes("country") && country) config.country = country;
    if (method.inputs.includes("language") && language) config.language = language;

    try {
      const res = await fetch("/api/scravio/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          platform,
          extractionType: method.type,
          targetCount,
          config,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create campaign");
        return;
      }

      router.push(`/dashboard/campaigns/${data.campaign.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">New Campaign</h1>
        <p className="text-sm text-muted mt-1">Set up a new lead scraping campaign</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= s
                  ? "bg-accent text-white"
                  : "bg-card border border-card-border text-muted"
              }`}
            >
              {s}
            </div>
            <span className={`text-sm ${step >= s ? "text-foreground" : "text-muted"}`}>
              {s === 1 ? "Platform" : s === 2 ? "Method" : "Configure"}
            </span>
            {s < 3 && <div className="w-12 h-px bg-card-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Platform */}
      {step === 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPlatform(p.id)}
              className={`p-6 rounded-xl border text-center transition-all hover:border-accent/50 hover:bg-accent/5 ${
                platform === p.id
                  ? "border-accent bg-accent/10"
                  : "border-card-border bg-card"
              }`}
            >
              <span className="text-3xl block mb-2">{p.icon}</span>
              <span className="font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Extraction Method */}
      {step === 2 && platform && (
        <div className="space-y-4">
          <button
            onClick={() => setStep(1)}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            &larr; Back to platforms
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLATFORM_METHODS[platform]?.map((m) => (
              <button
                key={m.type}
                onClick={() => selectMethod(m)}
                className="p-5 rounded-xl border border-card-border bg-card text-left transition-all hover:border-accent/50 hover:bg-accent/5"
              >
                <p className="font-medium">{m.label}</p>
                <p className="text-xs text-muted mt-1">
                  {m.inputs.includes("keywords") && "Search by keywords"}
                  {m.inputs.includes("hashtag") && "Scrape hashtag followers"}
                  {m.inputs.includes("username") && "Extract from user profile"}
                  {m.inputs.includes("post_url") && "Extract from specific post"}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Configure */}
      {step === 3 && method && (
        <div className="space-y-6">
          <button
            onClick={() => setStep(2)}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            &larr; Back to methods
          </button>

          {error && (
            <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-5 bg-card border border-card-border rounded-xl p-6">
            <div>
              <label className="block text-sm font-medium mb-1.5">Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>

            {method.inputs.includes("keywords") && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Keywords</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. fitness coach, personal trainer"
                  className="w-full px-4 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            )}

            {method.inputs.includes("hashtag") && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Hashtag</label>
                <input
                  type="text"
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                  placeholder="e.g. #fitnesscoach"
                  className="w-full px-4 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            )}

            {method.inputs.includes("username") && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Target Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. garyvee"
                  className="w-full px-4 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            )}

            {method.inputs.includes("post_url") && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Post URL</label>
                <input
                  type="url"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="Paste the full post URL"
                  className="w-full px-4 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            )}

            {method.inputs.includes("country") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">Any country</option>
                    {COUNTRIES.filter(Boolean).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">Any language</option>
                    {LANGUAGES.filter(Boolean).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Target Email Count
              </label>
              <input
                type="number"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value) || 0)}
                min={10}
                max={50000}
                className="w-full px-4 py-2.5 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <p className="text-xs text-muted mt-2">
                Estimated credit cost:{" "}
                <span className="text-accent-cyan font-semibold">
                  {targetCount.toLocaleString()} credits
                </span>
              </p>
            </div>

            <button
              onClick={launchCampaign}
              disabled={loading}
              className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Launching..." : "Launch Campaign"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
