"use client";

import { useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  InstagramLogo,
  TwitterLogo,
  YouTubeLogo,
  FacebookLogo,
  LinkedInLogo,
  TikTokLogo,
} from "@/components/PlatformLogos";

const PLATFORMS: { id: string; name: string; Logo: ComponentType<{ className?: string }> }[] = [
  { id: "instagram", name: "Instagram", Logo: InstagramLogo },
  { id: "twitter", name: "X / Twitter", Logo: TwitterLogo },
  { id: "youtube", name: "YouTube", Logo: YouTubeLogo },
  { id: "facebook", name: "Facebook", Logo: FacebookLogo },
  { id: "linkedin", name: "LinkedIn", Logo: LinkedInLogo },
  { id: "tiktok", name: "TikTok", Logo: TikTokLogo },
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

export default function NewScrapePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState("");
  const [method, setMethod] = useState<(typeof PLATFORM_METHODS)["instagram"][0] | null>(null);

  const [scrapeName, setScrapeName] = useState("");
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
    setScrapeName(`${platform} - ${m.label}`);
    setStep(3);
  }

  async function launchScrape() {
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
          name: scrapeName,
          platform,
          extractionType: method.type,
          targetCount,
          config,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create scrape");
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">New Scrape</h1>
        <p className="text-base text-gray-300 mt-1">Set up a new lead scrape</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold ${
                step >= s
                  ? "bg-accent text-white"
                  : "bg-card border border-card-border text-gray-400"
              }`}
            >
              {s}
            </div>
            <span className={`text-base ${step >= s ? "text-white" : "text-gray-400"}`}>
              {s === 1 ? "Platform" : s === 2 ? "Method" : "Configure"}
            </span>
            {s < 3 && <div className="w-12 h-px bg-card-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Platform */}
      {step === 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPlatform(p.id)}
              className={`flex flex-col items-center gap-4 p-8 rounded-2xl border text-center transition-all hover:border-accent/50 hover:bg-accent/5 ${
                platform === p.id
                  ? "border-accent bg-accent/10"
                  : "border-card-border bg-card"
              }`}
            >
              <p.Logo className="w-16 h-16" />
              <span className="text-lg font-semibold text-white">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Extraction Method */}
      {step === 2 && platform && (
        <div className="space-y-4">
          <button
            onClick={() => setStep(1)}
            className="text-base text-gray-300 hover:text-white transition-colors"
          >
            &larr; Back to platforms
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLATFORM_METHODS[platform]?.map((m) => (
              <button
                key={m.type}
                onClick={() => selectMethod(m)}
                className="p-7 rounded-xl border border-card-border bg-card text-left transition-all hover:border-accent/50 hover:bg-accent/5"
              >
                <p className="text-lg font-semibold text-white">{m.label}</p>
                <p className="text-base text-gray-300 mt-2">
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
            className="text-base text-gray-300 hover:text-white transition-colors"
          >
            &larr; Back to methods
          </button>

          {error && (
            <div className="p-4 text-base text-danger bg-danger/10 border border-danger/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-5 bg-card border border-card-border rounded-xl p-8">
            <div>
              <label className="block text-base font-medium text-white mb-2">Scrape Name</label>
              <input
                type="text"
                value={scrapeName}
                onChange={(e) => setScrapeName(e.target.value)}
                className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>

            {method.inputs.includes("keywords") && (
              <div>
                <label className="block text-base font-medium text-white mb-2">Keywords</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. fitness coach, personal trainer"
                  className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            )}

            {method.inputs.includes("hashtag") && (
              <div>
                <label className="block text-base font-medium text-white mb-2">Hashtag</label>
                <input
                  type="text"
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                  placeholder="e.g. #fitnesscoach"
                  className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            )}

            {method.inputs.includes("username") && (
              <div>
                <label className="block text-base font-medium text-white mb-2">Target Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. garyvee"
                  className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            )}

            {method.inputs.includes("post_url") && (
              <div>
                <label className="block text-base font-medium text-white mb-2">Post URL</label>
                <input
                  type="url"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="Paste the full post URL"
                  className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            )}

            {method.inputs.includes("country") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-medium text-white mb-2">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">Any country</option>
                    {COUNTRIES.filter(Boolean).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-medium text-white mb-2">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-accent/50"
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
              <label className="block text-base font-medium text-white mb-2">
                Target Email Count
              </label>
              <input
                type="number"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value) || 0)}
                min={10}
                max={50000}
                className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <p className="text-sm text-gray-300 mt-2">
                Estimated credit cost:{" "}
                <span className="text-accent-cyan font-semibold">
                  {targetCount.toLocaleString()} credits
                </span>
              </p>
            </div>

            <button
              onClick={launchScrape}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-accent to-accent-cyan text-white text-lg font-semibold rounded-lg hover:from-accent/90 hover:to-accent-cyan/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Launching..." : "Launch Scrape"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
