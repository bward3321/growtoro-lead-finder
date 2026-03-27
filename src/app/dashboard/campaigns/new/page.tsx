"use client";

import { useState, useEffect, useRef, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  InstagramLogo,
  TwitterLogo,
  YouTubeLogo,
  FacebookLogo,
  LinkedInLogo,
  TikTokLogo,
  GoogleMapsLogo,
  B2BContactsLogo,
} from "@/components/PlatformLogos";

const PLATFORMS: { id: string; name: string; Logo: ComponentType<{ className?: string }> }[] = [
  { id: "instagram", name: "Instagram", Logo: InstagramLogo },
  { id: "twitter", name: "X / Twitter", Logo: TwitterLogo },
  { id: "youtube", name: "YouTube", Logo: YouTubeLogo },
  { id: "facebook", name: "Facebook", Logo: FacebookLogo },
  { id: "linkedin", name: "LinkedIn", Logo: LinkedInLogo },
  { id: "tiktok", name: "TikTok", Logo: TikTokLogo },
  { id: "googlemaps", name: "Google Maps", Logo: GoogleMapsLogo },
  { id: "b2bcontacts", name: "B2B Contacts", Logo: B2BContactsLogo },
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
  { id: 77, code: "AL", name: "Alabama" }, { id: 61, code: "AK", name: "Alaska" },
  { id: 46, code: "AZ", name: "Arizona" }, { id: 49, code: "AR", name: "Arkansas" },
  { id: 43, code: "CA", name: "California" }, { id: 52, code: "CO", name: "Colorado" },
  { id: 87, code: "CT", name: "Connecticut" }, { id: 79, code: "DE", name: "Delaware" },
  { id: 90, code: "DC", name: "District of Columbia" }, { id: 57, code: "FL", name: "Florida" },
  { id: 42, code: "GA", name: "Georgia" }, { id: 88, code: "HI", name: "Hawaii" },
  { id: 76, code: "ID", name: "Idaho" }, { id: 47, code: "IL", name: "Illinois" },
  { id: 51, code: "IN", name: "Indiana" }, { id: 71, code: "IA", name: "Iowa" },
  { id: 65, code: "KS", name: "Kansas" }, { id: 58, code: "KY", name: "Kentucky" },
  { id: 44, code: "LA", name: "Louisiana" }, { id: 78, code: "ME", name: "Maine" },
  { id: 74, code: "MD", name: "Maryland" }, { id: 70, code: "MA", name: "Massachusetts" },
  { id: 59, code: "MI", name: "Michigan" }, { id: 55, code: "MN", name: "Minnesota" },
  { id: 72, code: "MS", name: "Mississippi" }, { id: 64, code: "MO", name: "Missouri" },
  { id: 85, code: "MT", name: "Montana" }, { id: 75, code: "NE", name: "Nebraska" },
  { id: 81, code: "NV", name: "Nevada" }, { id: 84, code: "NH", name: "New Hampshire" },
  { id: 54, code: "NJ", name: "New Jersey" }, { id: 69, code: "NM", name: "New Mexico" },
  { id: 53, code: "NY", name: "New York" }, { id: 50, code: "NC", name: "North Carolina" },
  { id: 83, code: "ND", name: "North Dakota" }, { id: 45, code: "OH", name: "Ohio" },
  { id: 68, code: "OK", name: "Oklahoma" }, { id: 80, code: "OR", name: "Oregon" },
  { id: 67, code: "PA", name: "Pennsylvania" }, { id: 89, code: "RI", name: "Rhode Island" },
  { id: 62, code: "SC", name: "South Carolina" }, { id: 82, code: "SD", name: "South Dakota" },
  { id: 41, code: "TN", name: "Tennessee" }, { id: 40, code: "TX", name: "Texas" },
  { id: 60, code: "UT", name: "Utah" }, { id: 86, code: "VT", name: "Vermont" },
  { id: 48, code: "VA", name: "Virginia" }, { id: 63, code: "WA", name: "Washington" },
  { id: 73, code: "WV", name: "West Virginia" }, { id: 56, code: "WI", name: "Wisconsin" },
  { id: 66, code: "WY", name: "Wyoming" },
];

const B2B_INDUSTRIES = [
  "software development", "technology, information and internet", "financial services",
  "marketing", "advertising", "real estate", "construction", "health care",
  "hospitals and health care", "manufacturing", "retail", "e-commerce", "consulting",
  "business consulting and services", "insurance", "banking", "education",
  "staffing and recruiting", "food and beverage", "automotive", "hospitality",
  "telecommunications", "transportation", "logistics", "energy", "legal services",
  "accounting", "architecture", "biotechnology", "pharmaceutical", "entertainment",
  "media production", "design services", "professional services", "non-profit organizations",
  "government administration", "fitness", "wellness and fitness services", "restaurants",
  "human resources", "events services", "sports", "music", "photography", "cosmetics",
  "fashion", "consumer goods", "agriculture", "mining", "utilities", "aerospace",
  "venture capital", "investment management", "saas", "artificial intelligence (ai)",
  "machine learning", "cyber security", "cloud computing", "mobile apps", "analytics",
  "digital marketing", "seo", "social media", "content marketing", "sales", "recruiting",
  "project management", "property management", "interior design", "environmental services",
  "renewable energy", "solar", "fintech", "blockchain", "cryptocurrency", "robotics",
  "gaming", "video games", "film", "television", "publishing", "journalism",
];

const B2B_SENIORITY = [
  { value: "owner", label: "Owner" },
  { value: "founder", label: "Founder" },
  { value: "c_suite", label: "C-Suite" },
  { value: "vp", label: "VP" },
  { value: "director", label: "Director" },
  { value: "manager", label: "Manager" },
  { value: "senior", label: "Senior" },
  { value: "entry", label: "Entry" },
];

interface Category {
  id: number;
  name: string;
  gcid: string;
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
  const [gmSelectedStates, setGmSelectedStates] = useState<{ id: number; code: string; name: string }[]>([]);
  const [gmStateSearch, setGmStateSearch] = useState("");
  const [gmStateFreeText, setGmStateFreeText] = useState("");
  const [gmEmailOnly, setGmEmailOnly] = useState(false);
  const [gmPhoneOnly, setGmPhoneOnly] = useState(false);
  const [gmLeadCount, setGmLeadCount] = useState<number | null>(null);
  const [gmCountLoading, setGmCountLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // B2B Contacts specific state
  const [b2bJobTitles, setB2bJobTitles] = useState<string[]>([]);
  const [b2bJobTitleInput, setB2bJobTitleInput] = useState("");
  const [b2bIndustries, setB2bIndustries] = useState<string[]>([]);
  const [b2bIndustrySearch, setB2bIndustrySearch] = useState("");
  const [b2bLocations, setB2bLocations] = useState<string[]>([]);
  const [b2bLocationInput, setB2bLocationInput] = useState("");
  const [b2bSeniority, setB2bSeniority] = useState<string[]>([]);
  const [b2bTechnologies, setB2bTechnologies] = useState<string[]>([]);
  const [b2bTechInput, setB2bTechInput] = useState("");
  const [b2bKeyword, setB2bKeyword] = useState("");
  const [b2bEmpMin, setB2bEmpMin] = useState("");
  const [b2bEmpMax, setB2bEmpMax] = useState("");
  const [b2bLeadCount, setB2bLeadCount] = useState<number | null>(null);
  const [b2bCountLoading, setB2bCountLoading] = useState(false);
  const [b2bShowResults, setB2bShowResults] = useState(false);
  const [b2bDisplayCount, setB2bDisplayCount] = useState(0);
  const b2bCountUpRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setSelectedCategory(null);
    setCategorySearch("");
    setGmCountry("US");
    setGmSelectedStates([]);
    setGmStateSearch("");
    setGmStateFreeText("");
    setGmEmailOnly(false);
    setGmPhoneOnly(false);
    setGmLeadCount(null);
    setError("");
    // Reset B2B state
    setB2bJobTitles([]); setB2bJobTitleInput(""); setB2bIndustries([]);
    setB2bIndustrySearch(""); setB2bLocations([]); setB2bLocationInput("");
    setB2bSeniority([]); setB2bTechnologies([]); setB2bTechInput("");
    setB2bKeyword(""); setB2bEmpMin(""); setB2bEmpMax(""); setB2bLeadCount(null);

    if (id === "googlemaps" || id === "b2bcontacts") {
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

  async function handleCheckAvailability() {
    if (!selectedCategory) return;
    setGmCountLoading(true);
    setGmLeadCount(null);
    setError("");
    try {
      const params = new URLSearchParams({
        category: String(selectedCategory.id),
        countries: gmCountry,
      });
      if (gmEmailOnly) params.set("email", "true");
      if (gmPhoneOnly) params.set("phone", "true");
      for (const s of gmSelectedStates) {
        params.append("level1_locations", String(s.id));
      }

      const res = await fetch(`/api/spherescout/count?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to check availability");
        return;
      }
      setGmLeadCount(data.totalCount ?? 0);
    } catch {
      setError("Failed to check availability");
    } finally {
      setGmCountLoading(false);
    }
  }

  async function handleGoogleMapsExport() {
    if (!selectedCategory) return;
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
          emailOnly: gmEmailOnly,
          phoneOnly: gmPhoneOnly,
          level1_locations: gmSelectedStates.map((s) => s.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Export failed");
        return;
      }
      const count = data.leadCount || 0;
      router.push(
        `/dashboard/campaigns/${data.campaign.id}?success=${encodeURIComponent(`Export started! ${count.toLocaleString()} leads are being processed.`)}`
      );
    } catch (err: any) {
      setError(err?.message || "Export request failed — check your connection and try again");
    } finally {
      setExportLoading(false);
    }
  }

  function getB2bFilters() {
    const filters: Record<string, unknown> = {};
    if (b2bJobTitles.length) filters.jobTitles = b2bJobTitles;
    if (b2bIndustries.length) filters.industries = b2bIndustries;
    if (b2bLocations.length) filters.locations = b2bLocations;
    if (b2bSeniority.length) filters.seniority = b2bSeniority;
    if (b2bTechnologies.length) filters.technologies = b2bTechnologies;
    if (b2bEmpMin) filters.employeeSizeMin = parseInt(b2bEmpMin, 10);
    if (b2bEmpMax) filters.employeeSizeMax = parseInt(b2bEmpMax, 10);
    if (b2bKeyword) filters.keyword = b2bKeyword;
    return filters;
  }

  const b2bHasFilters = b2bJobTitles.length > 0 || b2bIndustries.length > 0 || b2bLocations.length > 0
    || b2bSeniority.length > 0 || b2bTechnologies.length > 0 || b2bKeyword.length > 0
    || b2bEmpMin.length > 0 || b2bEmpMax.length > 0;

  async function handleB2bCheckAvailability() {
    setB2bCountLoading(true);
    setB2bLeadCount(null);
    setB2bShowResults(false);
    setB2bDisplayCount(0);
    if (b2bCountUpRef.current) { clearInterval(b2bCountUpRef.current); b2bCountUpRef.current = null; }
    setError("");
    try {
      const res = await fetch("/api/searchleads/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: getB2bFilters() }),
      });
      const data = await res.json();
      if (data.error && !data.totalElements) {
        setError(typeof data.error === "string" ? data.error : "Failed to check availability");
        return;
      }
      const count = data.totalElements ?? 0;
      setB2bLeadCount(count);
      // Trigger slide-in animation
      requestAnimationFrame(() => setB2bShowResults(true));
      // Count-up animation over 500ms
      if (count > 0) {
        const duration = 500;
        const steps = 20;
        const stepTime = duration / steps;
        let step = 0;
        b2bCountUpRef.current = setInterval(() => {
          step++;
          const progress = step / steps;
          // Ease-out curve
          const eased = 1 - Math.pow(1 - progress, 3);
          setB2bDisplayCount(Math.round(eased * count));
          if (step >= steps) {
            if (b2bCountUpRef.current) clearInterval(b2bCountUpRef.current);
            setB2bDisplayCount(count);
          }
        }, stepTime);
      }
    } catch {
      setError("Failed to check availability");
    } finally {
      setB2bCountLoading(false);
    }
  }

  async function handleB2bExport() {
    if (b2bLeadCount === null || b2bLeadCount === 0) return;
    setExportLoading(true);
    setError("");
    try {
      const res = await fetch("/api/searchleads/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: getB2bFilters(),
          desiredCount: b2bLeadCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Export failed");
        return;
      }
      const count = data.leadCount || 0;
      router.push(
        `/dashboard/campaigns/${data.campaign.id}?success=${encodeURIComponent(`Export complete! ${count.toLocaleString()} B2B contacts ready to download.`)}`
      );
    } catch (err: any) {
      setError(err?.message || "Export failed");
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
  const isB2B = platform === "b2bcontacts";
  const skipMethodStep = isGoogleMaps || isB2B;
  const stepLabels = skipMethodStep
    ? { 1: "Platform", 2: "Platform", 3: "Configure" }
    : { 1: "Platform", 2: "Method", 3: "Configure" };
  const totalSteps = skipMethodStep ? [1, 3] : [1, 2, 3];

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
      {step === 2 && platform && !skipMethodStep && (
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
            onClick={() => setStep(1)}
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
                      setGmLeadCount(null);
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
                  onChange={(e) => { setGmCountry(e.target.value); setGmSelectedStates([]); setGmStateSearch(""); setGmStateFreeText(""); setGmLeadCount(null); }}
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
                                setGmLeadCount(null);
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
                                  setGmLeadCount(null);
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
                    onChange={(e) => { setGmStateFreeText(e.target.value); setGmLeadCount(null); }}
                    placeholder="e.g. NSW, ON, Bavaria"
                    className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                )}
              </div>
            </div>

            {/* Contact Filters */}
            <div className="space-y-4">
              <div>
                <label className="block text-base font-medium text-white mb-2">
                  Email Filter
                </label>
                <div className="inline-flex rounded-lg border border-card-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setGmEmailOnly(false); setGmLeadCount(null); }}
                    className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                      !gmEmailOnly
                        ? "bg-accent text-white"
                        : "bg-card text-gray-400 hover:text-white"
                    }`}
                  >
                    All Contacts
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGmEmailOnly(true); setGmLeadCount(null); }}
                    className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                      gmEmailOnly
                        ? "bg-accent text-white"
                        : "bg-card text-gray-400 hover:text-white"
                    }`}
                  >
                    With Emails Only
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-white mb-2">
                  Phone Filter
                </label>
                <div className="inline-flex rounded-lg border border-card-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setGmPhoneOnly(false); setGmLeadCount(null); }}
                    className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                      !gmPhoneOnly
                        ? "bg-accent text-white"
                        : "bg-card text-gray-400 hover:text-white"
                    }`}
                  >
                    All Contacts
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGmPhoneOnly(true); setGmLeadCount(null); }}
                    className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                      gmPhoneOnly
                        ? "bg-accent text-white"
                        : "bg-card text-gray-400 hover:text-white"
                    }`}
                  >
                    With Phone Only
                  </button>
                </div>
              </div>
            </div>

            {/* Check Availability */}
            <button
              onClick={handleCheckAvailability}
              disabled={!selectedCategory || gmCountLoading}
              className="w-full py-3.5 bg-card border border-accent/30 text-accent text-base font-semibold rounded-lg hover:bg-accent/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gmCountLoading ? "Checking..." : "Check Availability"}
            </button>

            {/* Lead Count Display */}
            {gmLeadCount !== null && gmLeadCount > 0 && (
              <div className="p-5 bg-success/5 border border-success/20 rounded-lg">
                <p className="text-3xl font-bold text-white">
                  {gmLeadCount.toLocaleString()}{" "}
                  <span className="text-lg font-medium text-success">business contacts available</span>
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  Cost: <span className="text-accent-cyan font-semibold">{gmLeadCount.toLocaleString()} credits</span> (1 credit per lead)
                </p>
                {gmEmailOnly && (
                  <p className="text-sm text-gray-400 mt-1">Filtered to contacts with emails only</p>
                )}
                {gmPhoneOnly && (
                  <p className="text-sm text-gray-400 mt-1">Filtered to contacts with phone numbers only</p>
                )}
              </div>
            )}

            {gmLeadCount !== null && gmLeadCount === 0 && (
              <div className="p-5 bg-danger/5 border border-danger/20 rounded-lg">
                <p className="text-base text-danger font-medium">
                  No leads found for this search.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Try a different category or remove state filters.
                </p>
              </div>
            )}

            {gmLeadCount === null && !gmCountLoading && (
              <p className="text-sm text-gray-400">
                Select a category and click Check Availability to see how many leads are available.
              </p>
            )}

            {/* Export Button */}
            <button
              onClick={handleGoogleMapsExport}
              disabled={!selectedCategory || exportLoading || gmLeadCount === null || gmLeadCount === 0}
              className="w-full py-4 bg-success text-white text-lg font-semibold rounded-lg hover:bg-success/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading
                ? "Exporting..."
                : gmLeadCount && gmLeadCount > 0
                  ? `Export ${gmLeadCount.toLocaleString()} Leads (${gmLeadCount.toLocaleString()} credits)`
                  : "Export Leads"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Configure — B2B Contacts */}
      {step === 3 && isB2B && (
        <div className="space-y-6">
          <button
            onClick={() => setStep(1)}
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
            {/* Job Title */}
            <div>
              <label className="block text-base font-medium text-white mb-2">
                Job Title
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {b2bJobTitles.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded-full">
                    {t}
                    <button onClick={() => { setB2bJobTitles((p) => p.filter((x) => x !== t)); setB2bLeadCount(null); }} className="hover:text-white">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={b2bJobTitleInput}
                onChange={(e) => setB2bJobTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && b2bJobTitleInput.trim()) {
                    e.preventDefault();
                    setB2bJobTitles((p) => [...p, b2bJobTitleInput.trim()]);
                    setB2bJobTitleInput("");
                    setB2bLeadCount(null);
                  }
                }}
                placeholder="Type a title (e.g. CEO, Marketing Director) and press Enter"
                className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-base font-medium text-white mb-2">
                Industry
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {b2bIndustries.map((ind) => (
                  <span key={ind} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded-full capitalize">
                    {ind}
                    <button onClick={() => { setB2bIndustries((p) => p.filter((x) => x !== ind)); setB2bLeadCount(null); }} className="hover:text-white">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={b2bIndustrySearch}
                  onChange={(e) => setB2bIndustrySearch(e.target.value)}
                  placeholder="Search industries (e.g. SaaS, Real Estate, Marketing)"
                  className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                {b2bIndustrySearch && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-card-border rounded-lg max-h-60 overflow-y-auto shadow-xl">
                    {B2B_INDUSTRIES
                      .filter((ind) =>
                        !b2bIndustries.includes(ind) &&
                        ind.toLowerCase().includes(b2bIndustrySearch.toLowerCase())
                      )
                      .slice(0, 15)
                      .map((ind) => (
                        <button
                          key={ind}
                          onClick={() => {
                            setB2bIndustries((p) => [...p, ind]);
                            setB2bIndustrySearch("");
                            setB2bLeadCount(null);
                          }}
                          className="w-full text-left px-5 py-3 text-base text-white hover:bg-indigo-500/10 transition-colors border-b border-card-border last:border-0 capitalize"
                        >
                          {ind}
                        </button>
                      ))}
                    {B2B_INDUSTRIES.filter((ind) =>
                      !b2bIndustries.includes(ind) &&
                      ind.toLowerCase().includes(b2bIndustrySearch.toLowerCase())
                    ).length === 0 && (
                      <div className="px-5 py-3 text-sm text-gray-400">No industries found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-base font-medium text-white mb-2">
                Location
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {b2bLocations.map((loc) => (
                  <span key={loc} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded-full">
                    {loc}
                    <button onClick={() => { setB2bLocations((p) => p.filter((x) => x !== loc)); setB2bLeadCount(null); }} className="hover:text-white">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={b2bLocationInput}
                onChange={(e) => setB2bLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && b2bLocationInput.trim()) {
                    e.preventDefault();
                    // Title-case each word: "united states" → "United States"
                    const titled = b2bLocationInput.trim().replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
                    setB2bLocations((p) => [...p, titled]);
                    setB2bLocationInput("");
                    setB2bLeadCount(null);
                  }
                }}
                placeholder="Type a location (e.g. United States, New York) and press Enter"
                className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-base font-medium text-white mb-2">
                Company Size <span className="text-gray-400 text-sm">(employees)</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={b2bEmpMin}
                  onChange={(e) => { setB2bEmpMin(e.target.value); setB2bLeadCount(null); }}
                  placeholder="Min (e.g. 10)"
                  className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <input
                  type="number"
                  value={b2bEmpMax}
                  onChange={(e) => { setB2bEmpMax(e.target.value); setB2bLeadCount(null); }}
                  placeholder="Max (e.g. 500)"
                  className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            {/* Seniority */}
            <div>
              <label className="block text-base font-medium text-white mb-2">
                Seniority Level
              </label>
              <div className="flex flex-wrap gap-2">
                {B2B_SENIORITY.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => {
                      setB2bSeniority((prev) =>
                        prev.includes(s.value) ? prev.filter((x) => x !== s.value) : [...prev, s.value]
                      );
                      setB2bLeadCount(null);
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                      b2bSeniority.includes(s.value)
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                        : "bg-card text-gray-400 border-card-border hover:text-white hover:border-gray-500"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Technologies */}
            <div>
              <label className="block text-base font-medium text-white mb-2">
                Technologies <span className="text-gray-400 text-sm">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {b2bTechnologies.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded-full">
                    {t}
                    <button onClick={() => { setB2bTechnologies((p) => p.filter((x) => x !== t)); setB2bLeadCount(null); }} className="hover:text-white">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={b2bTechInput}
                onChange={(e) => setB2bTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && b2bTechInput.trim()) {
                    e.preventDefault();
                    setB2bTechnologies((p) => [...p, b2bTechInput.trim()]);
                    setB2bTechInput("");
                    setB2bLeadCount(null);
                  }
                }}
                placeholder="Type a technology (e.g. Salesforce, Hubspot) and press Enter"
                className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Keyword */}
            <div>
              <label className="block text-base font-medium text-white mb-2">
                Keyword Search <span className="text-gray-400 text-sm">(optional)</span>
              </label>
              <input
                type="text"
                value={b2bKeyword}
                onChange={(e) => { setB2bKeyword(e.target.value); setB2bLeadCount(null); }}
                placeholder="Free-text keyword search across profiles"
                className="w-full px-5 py-3 bg-background border border-card-border rounded-lg text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Check Availability */}
            <div className="space-y-3">
              <button
                onClick={handleB2bCheckAvailability}
                disabled={!b2bHasFilters || b2bCountLoading}
                className={`relative w-full py-3.5 border border-indigo-500/30 text-base font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${
                  b2bCountLoading
                    ? "bg-indigo-500/10 text-indigo-300"
                    : "bg-card text-indigo-400 hover:bg-indigo-500/10"
                }`}
              >
                {b2bCountLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent animate-[shimmer_1.5s_infinite]" />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {b2bCountLoading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {b2bCountLoading ? "Searching 500M+ contacts..." : "Check Availability"}
                </span>
              </button>

              {/* Indeterminate progress bar while loading */}
              {b2bCountLoading && (
                <div className="h-1 w-full bg-indigo-500/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" />
                </div>
              )}
            </div>

            {/* Lead Count Display */}
            {b2bLeadCount !== null && b2bLeadCount > 0 && (
              <div
                className={`p-5 bg-success/5 border border-success/20 rounded-lg transition-all duration-500 ${
                  b2bShowResults ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                }`}
              >
                <p className="text-3xl font-bold text-white">
                  {b2bDisplayCount.toLocaleString()}{" "}
                  <span className="text-lg font-medium text-success">contacts available</span>
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  Cost: <span className="text-indigo-400 font-semibold">{(b2bLeadCount * 2).toLocaleString()} credits</span> (2 credits per contact)
                </p>
              </div>
            )}

            {b2bLeadCount !== null && b2bLeadCount === 0 && (
              <div
                className={`p-5 bg-danger/5 border border-danger/20 rounded-lg transition-all duration-500 ${
                  b2bShowResults ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                }`}
              >
                <p className="text-base text-danger font-medium">No contacts found for these filters.</p>
                <p className="text-sm text-gray-400 mt-1">Try broadening your search criteria.</p>
              </div>
            )}

            {b2bLeadCount === null && !b2bCountLoading && (
              <p className="text-sm text-gray-400">
                Fill in at least one filter and click Check Availability to see matching contacts.
              </p>
            )}

            {/* Export Button */}
            <button
              onClick={handleB2bExport}
              disabled={!b2bHasFilters || exportLoading || b2bCountLoading || b2bLeadCount === null || b2bLeadCount === 0}
              className={`w-full py-4 text-white text-lg font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                b2bLeadCount && b2bLeadCount > 0 && !b2bCountLoading
                  ? "bg-indigo-600 hover:bg-indigo-500"
                  : "bg-gray-600"
              }`}
            >
              {exportLoading
                ? "Exporting..."
                : b2bLeadCount && b2bLeadCount > 0
                  ? `Export ${b2bLeadCount.toLocaleString()} Contacts (${(b2bLeadCount * 2).toLocaleString()} credits)`
                  : "Export Contacts"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Configure — Social Media */}
      {step === 3 && method && !skipMethodStep && (
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
