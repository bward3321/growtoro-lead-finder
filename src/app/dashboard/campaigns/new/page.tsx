"use client";

import { useState, useEffect, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  InstagramLogo,
  TwitterLogo,
  YouTubeLogo,
  FacebookLogo,
  LinkedInLogo,
  TikTokLogo,
  GoogleMapsLogo,
} from "@/components/PlatformLogos";

const PLATFORMS: { id: string; name: string; Logo: ComponentType<{ className?: string }> }[] = [
  { id: "instagram", name: "Instagram", Logo: InstagramLogo },
  { id: "twitter", name: "X / Twitter", Logo: TwitterLogo },
  { id: "youtube", name: "YouTube", Logo: YouTubeLogo },
  { id: "facebook", name: "Facebook", Logo: FacebookLogo },
  { id: "linkedin", name: "LinkedIn", Logo: LinkedInLogo },
  { id: "tiktok", name: "TikTok", Logo: TikTokLogo },
  { id: "googlemaps", name: "Google Maps", Logo: GoogleMapsLogo },
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

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

interface Category {
  id: number;
  name: string;
  gcid: string;
}

interface PreviewItem {
  name: string;
  email: string[];
  phone: string[] | string;
  city: string;
  country: string;
  level2_location: string;
  categories?: string[];
  [key: string]: unknown;
}

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

  // Google Maps specific state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [gmCountry, setGmCountry] = useState("US");
  const [gmSelectedStates, setGmSelectedStates] = useState<{ code: string; name: string }[]>([]);
  const [gmStateSearch, setGmStateSearch] = useState("");
  const [gmStateFreeText, setGmStateFreeText] = useState("");
  const [previewData, setPreviewData] = useState<{
    preview: PreviewItem[];
    totalCount: number;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Fetch categories when Google Maps is selected
  useEffect(() => {
    if (platform === "googlemaps" && categories.length === 0) {
      setCategoriesLoading(true);
      fetch("/api/spherescout/categories")
        .then((r) => r.json())
        .then((data) => {
          setCategories(data.categories || []);
        })
        .catch(() => {})
        .finally(() => setCategoriesLoading(false));
    }
  }, [platform, categories.length]);

  const filteredCategories = categorySearch
    ? categories
        .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
        .sort((a, b) => {
          const search = categorySearch.toLowerCase();
          const aStarts = a.name.toLowerCase().startsWith(search);
          const bStarts = b.name.toLowerCase().startsWith(search);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          // Within same group, check if any word starts with the search
          const aWordStart = a.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(search));
          const bWordStart = b.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(search));
          if (aWordStart && !bWordStart) return -1;
          if (!aWordStart && bWordStart) return 1;
          return a.name.localeCompare(b.name);
        })
    : [];

  function selectPlatform(id: string) {
    setPlatform(id);
    setMethod(null);
    setPreviewData(null);
    setSelectedCategory(null);
    setCategorySearch("");
    setGmCountry("US");
    setGmSelectedStates([]);
    setGmStateSearch("");
    setGmStateFreeText("");
    setError("");
    if (id === "googlemaps") {
      // Skip method selection, go straight to configure
      setStep(3);
    } else {
      setStep(2);
    }
  }

  function selectMethod(m: (typeof PLATFORM_METHODS)["instagram"][0]) {
    setMethod(m);
    setScrapeName(`${platform} - ${m.label}`);
    setStep(3);
  }

  async function handlePreview() {
    if (!selectedCategory) return;
    setPreviewLoading(true);
    setError("");
    setPreviewData(null);
    try {
      const params = new URLSearchParams({
        category: String(selectedCategory.id),
        countries: gmCountry,
      });
      const stateValue = gmCountry === "US"
        ? gmSelectedStates.map((s) => s.code).join(",")
        : gmStateFreeText;
      if (stateValue) params.set("level2_locations", stateValue);

      const res = await fetch(`/api/spherescout/preview?${params}`);
      const data = await res.json();
      console.log("[GoogleMaps Preview] Full API response:", JSON.stringify(data));
      console.log("[GoogleMaps Preview] totalCount:", data.totalCount, "type:", typeof data.totalCount);
      console.log("[GoogleMaps Preview] preview length:", data.preview?.length);
      if (!res.ok) {
        setError(data.error || "Preview failed");
        return;
      }
      // Read totalCount — handle both camelCase and snake_case
      const totalCount = data.totalCount ?? data.total_count ?? data.count ?? (data.preview?.length || 0);
      const preview = data.preview || data.results || [];
      console.log("[GoogleMaps Preview] Setting state:", { totalCount, previewLength: preview.length });
      setPreviewData({ preview, totalCount });
    } catch {
      setError("Failed to load preview");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleGoogleMapsExport() {
    if (!selectedCategory || !previewData) return;
    setExportLoading(true);
    setError("");
    try {
      const res = await fetch("/api/spherescout/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory.id,
          categoryName: selectedCategory.name,
          countries: gmCountry,
          level2_locations: (gmCountry === "US"
            ? gmSelectedStates.map((s) => s.code).join(",")
            : gmStateFreeText) || undefined,
          totalCount: previewData.totalCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Export failed");
        return;
      }
      router.push(`/dashboard/campaigns/${data.campaign.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setExportLoading(false);
    }
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

  const isGoogleMaps = platform === "googlemaps";
  const stepLabels = isGoogleMaps
    ? { 1: "Platform", 2: "Platform", 3: "Configure" }
    : { 1: "Platform", 2: "Method", 3: "Configure" };
  const totalSteps = isGoogleMaps ? [1, 3] : [1, 2, 3];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">New Scrape</h1>
        <p className="text-base text-gray-300 mt-1">Set up a new lead scrape</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {totalSteps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold ${
                step >= s
                  ? "bg-accent text-white"
                  : "bg-card border border-card-border text-gray-400"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-base ${step >= s ? "text-white" : "text-gray-400"}`}>
              {stepLabels[s as keyof typeof stepLabels]}
            </span>
            {i < totalSteps.length - 1 && <div className="w-12 h-px bg-card-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Platform */}
      {step === 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPlatform(p.id)}
              className={`flex flex-col items-center gap-4 px-10 py-8 min-w-[160px] rounded-2xl border text-center transition-all hover:border-accent/50 hover:bg-accent/5 ${
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

      {/* Step 2: Extraction Method (not shown for Google Maps) */}
      {step === 2 && platform && !isGoogleMaps && (
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

      {/* Step 3: Configure — Google Maps */}
      {step === 3 && isGoogleMaps && (
        <div className="space-y-6">
          <button
            onClick={() => { setStep(1); setPreviewData(null); }}
            className="text-base text-gray-300 hover:text-white transition-colors"
          >
            &larr; Back to platforms
          </button>

          {error && (
            <div className="p-4 text-base text-danger bg-danger/10 border border-danger/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-5 bg-card border border-card-border rounded-xl p-8">
            {/* Business Category */}
            <div>
              <label className="block text-base font-medium text-white mb-2">
                Business Category
              </label>
              {categoriesLoading ? (
                <div className="text-gray-400 text-sm py-3">Loading categories...</div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={selectedCategory ? selectedCategory.name : categorySearch}
                    onFocus={() => {
                      if (selectedCategory) {
                        setCategorySearch("");
                        setSelectedCategory(null);
                      }
                    }}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setSelectedCategory(null);
                      setPreviewData(null);
                    }}
                    placeholder="Search categories (e.g. Restaurant, Plumber, Dentist)"
                    className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  {categorySearch && !selectedCategory && filteredCategories.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-card-border rounded-lg max-h-60 overflow-y-auto shadow-xl">
                      {filteredCategories.slice(0, 20).map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setCategorySearch("");
                            setPreviewData(null);
                          }}
                          className="w-full text-left px-5 py-3 text-base text-white hover:bg-accent/10 transition-colors border-b border-card-border last:border-0"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Country */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-white mb-2">Country</label>
                <select
                  value={gmCountry}
                  onChange={(e) => { setGmCountry(e.target.value); setGmSelectedStates([]); setGmStateSearch(""); setGmStateFreeText(""); setPreviewData(null); }}
                  className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {COUNTRIES.filter(Boolean).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-base font-medium text-white mb-2">
                  State/Region <span className="text-gray-400 text-sm">(optional)</span>
                </label>
                {gmCountry === "US" ? (
                  <div>
                    {/* Selected state chips */}
                    {gmSelectedStates.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {gmSelectedStates.map((st) => (
                          <span
                            key={st.code}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-accent/15 text-accent border border-accent/30 rounded-full"
                          >
                            {st.name} ({st.code})
                            <button
                              onClick={() => {
                                setGmSelectedStates((prev) => prev.filter((s) => s.code !== st.code));
                                setPreviewData(null);
                              }}
                              className="hover:text-white transition-colors"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Search input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={gmStateSearch}
                        onChange={(e) => setGmStateSearch(e.target.value)}
                        placeholder="Search states (e.g. New York, California)"
                        className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                      {gmStateSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-card border border-card-border rounded-lg max-h-60 overflow-y-auto shadow-xl">
                          {US_STATES
                            .filter(
                              (st) =>
                                !gmSelectedStates.some((s) => s.code === st.code) &&
                                (st.name.toLowerCase().includes(gmStateSearch.toLowerCase()) ||
                                  st.code.toLowerCase().includes(gmStateSearch.toLowerCase()))
                            )
                            .slice(0, 15)
                            .map((st) => (
                              <button
                                key={st.code}
                                onClick={() => {
                                  setGmSelectedStates((prev) => [...prev, st]);
                                  setGmStateSearch("");
                                  setPreviewData(null);
                                }}
                                className="w-full text-left px-5 py-3 text-base text-white hover:bg-accent/10 transition-colors border-b border-card-border last:border-0"
                              >
                                {st.name} <span className="text-gray-400">({st.code})</span>
                              </button>
                            ))}
                          {US_STATES.filter(
                            (st) =>
                              !gmSelectedStates.some((s) => s.code === st.code) &&
                              (st.name.toLowerCase().includes(gmStateSearch.toLowerCase()) ||
                                st.code.toLowerCase().includes(gmStateSearch.toLowerCase()))
                          ).length === 0 && (
                            <div className="px-5 py-3 text-sm text-gray-400">No states found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={gmStateFreeText}
                    onChange={(e) => { setGmStateFreeText(e.target.value); setPreviewData(null); }}
                    placeholder="e.g. NSW, ON, Bavaria"
                    className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                )}
              </div>
            </div>

            {/* Preview Button */}
            <button
              onClick={handlePreview}
              disabled={!selectedCategory || previewLoading}
              className="w-full py-4 bg-card border border-accent/30 text-accent text-lg font-semibold rounded-lg hover:bg-accent/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {previewLoading ? "Loading Preview..." : "Preview Results"}
            </button>

            {/* Preview Results */}
            {previewData && (
              <div className="space-y-4">
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                  <p className="text-lg font-semibold text-white">
                    {previewData.totalCount.toLocaleString()} leads available
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    Cost: {previewData.totalCount.toLocaleString()} credits (1 credit per lead)
                  </p>
                </div>

                {previewData.preview.length > 0 && (
                  <div className="bg-background border border-card-border rounded-lg overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-card-border text-left text-sm text-gray-400 uppercase tracking-wider">
                          <th className="px-4 py-2">Business Name</th>
                          <th className="px-4 py-2">City</th>
                          <th className="px-4 py-2">State</th>
                          <th className="px-4 py-2">Email</th>
                          <th className="px-4 py-2">Phone</th>
                          <th className="px-4 py-2">Categories</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.preview.slice(0, 10).map((item, i) => {
                          const hasEmail = Array.isArray(item.email) ? item.email.length > 0 : !!item.email;
                          const hasPhone = Array.isArray(item.phone) ? item.phone.length > 0 : !!item.phone;
                          return (
                            <tr
                              key={i}
                              className="border-b border-card-border last:border-0"
                            >
                              <td className="px-4 py-2 text-sm text-white">{item.name || "-"}</td>
                              <td className="px-4 py-2 text-sm text-gray-300">{item.city || "-"}</td>
                              <td className="px-4 py-2 text-sm text-gray-300">{item.level2_location || "-"}</td>
                              <td className="px-4 py-2 text-sm text-gray-300">
                                {hasEmail ? (
                                  <span className="text-success">Has email</span>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-300">
                                {hasPhone ? (
                                  <span className="text-success">Has phone</span>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-300 max-w-[200px] truncate">
                                {item.categories?.join(", ") || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Export Button */}
                <button
                  onClick={handleGoogleMapsExport}
                  disabled={exportLoading || previewData.totalCount === 0}
                  className="w-full py-4 bg-gradient-to-r from-accent to-accent-cyan text-white text-lg font-semibold rounded-lg hover:from-accent/90 hover:to-accent-cyan/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportLoading
                    ? "Exporting..."
                    : `Export ${previewData.totalCount.toLocaleString()} Leads (${previewData.totalCount.toLocaleString()} credits)`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Configure — Social Media */}
      {step === 3 && method && !isGoogleMaps && (
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
