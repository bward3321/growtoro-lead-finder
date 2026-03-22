"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  InstagramLogo,
  TwitterLogo,
  YouTubeLogo,
  FacebookLogo,
  LinkedInLogo,
  TikTokLogo,
} from "@/components/PlatformLogos";
import type { ComponentType } from "react";

interface Scrape {
  id: string;
  name: string;
  platform: string;
  extractionType: string;
  status: string;
  targetCount: number;
  leadsFound: number;
  config: string;
  createdAt: string;
  scravioCampaignId?: string;
}

const PLATFORM_LOGOS: Record<string, ComponentType<{ className?: string }>> = {
  instagram: InstagramLogo,
  twitter: TwitterLogo,
  youtube: YouTubeLogo,
  facebook: FacebookLogo,
  linkedin: LinkedInLogo,
  tiktok: TikTokLogo,
};

const METHOD_LABELS: Record<string, string> = {
  INSTAGRAM_KEYWORD_SEARCH: "Keyword Search",
  INSTAGRAM_HASHTAG: "Hashtag",
  INSTAGRAM_USER_FOLLOWERS: "Followers",
  INSTAGRAM_USER_FOLLOWING: "Following",
  INSTAGRAM_POST_LIKERS: "Post Likers",
  INSTAGRAM_POST_COMMENTERS: "Post Commenters",
  X_KEYWORD_SEARCH: "Keyword Search",
  X_FOLLOWERS: "Followers",
  X_FOLLOWING: "Following",
  X_RETWEETS: "Retweeters",
  X_REPLIERS: "Repliers",
  YOUTUBE_KEYWORD_SEARCH: "Keyword Search",
  FACEBOOK_KEYWORD_SEARCH: "Keyword Search",
  LINKEDIN_KEYWORD_SEARCH: "Keyword Search",
  TIKTOK_KEYWORD_SEARCH: "Keyword Search",
};

function getSearchTarget(scrape: Scrape): string {
  try {
    const config = JSON.parse(scrape.config);
    return config.keywords || config.hashtag || config.username || config.post_url || "-";
  } catch {
    return "-";
  }
}

function DownloadButton({ scrape }: { scrape: Scrape }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch("/api/scravio/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: scrape.id }),
      });
      const data = await res.json();
      if (!data.exportId) return;

      const scravioCampaignId = data.scravioCampaignId;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const pollRes = await fetch(
          `/api/scravio/export/${data.exportId}/download?campaignId=${scravioCampaignId}`
        );
        const pollData = await pollRes.json();
        if (pollData.downloadUrl) {
          window.open(pollData.downloadUrl, "_blank");
          return;
        }
        if (pollData.status === "failed" || pollData.status === "error") return;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Preparing...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
          </svg>
          Download CSV
        </>
      )}
    </button>
  );
}

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const [scrapes, setScrapes] = useState<Scrape[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/scravio/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setScrapes(data.campaigns || []);
        setLoading(false);
      });
  }, []);

  const statusColor: Record<string, string> = {
    RUNNING: "text-accent-cyan bg-accent-cyan/10",
    COMPLETED: "text-success bg-success/10",
    STOPPED: "text-gray-400 bg-gray-400/10",
    PENDING: "text-yellow-400 bg-yellow-400/10",
    FAILED: "text-danger bg-danger/10",
  };

  const totalPages = Math.ceil(scrapes.length / PAGE_SIZE);
  const paginated = scrapes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-300 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Scrape History</h1>
        <p className="text-base text-gray-300 mt-1">
          All past scrapes ({scrapes.length} total)
        </p>
      </div>

      {scrapes.length === 0 ? (
        <div className="text-center py-16 bg-card border border-card-border rounded-xl">
          <p className="text-gray-300 text-lg">No scrapes yet</p>
          <Link
            href="/dashboard/campaigns/new"
            className="inline-block mt-3 text-base text-accent hover:underline"
          >
            Create your first scrape
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border text-left text-sm text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Platform</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Target / Keywords</th>
                  <th className="px-5 py-3">Emails Found</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((scrape) => {
                  const Logo = PLATFORM_LOGOS[scrape.platform];
                  const progress =
                    scrape.targetCount > 0
                      ? Math.min(100, Math.round((scrape.leadsFound / scrape.targetCount) * 100))
                      : 0;

                  return (
                    <tr
                      key={scrape.id}
                      className="border-b border-card-border last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-4 text-base text-gray-300 whitespace-nowrap">
                        {new Date(scrape.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/campaigns/${scrape.id}`}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          {Logo && <Logo className="w-6 h-6" />}
                          <span className="text-base font-medium text-white capitalize">
                            {scrape.platform}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-base text-gray-300">
                        {METHOD_LABELS[scrape.extractionType] || scrape.extractionType}
                      </td>
                      <td className="px-5 py-4 text-base text-gray-300 max-w-[250px] truncate">
                        {getSearchTarget(scrape)}
                      </td>
                      <td className="px-5 py-4 text-base text-white font-medium">
                        {scrape.leadsFound.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                            statusColor[scrape.status] || "text-gray-400 bg-gray-400/10"
                          }`}
                        >
                          {scrape.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {scrape.status === "RUNNING" || scrape.status === "PENDING" ? (
                          <div className="w-28">
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-2 bg-card border border-card-border rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-accent to-accent-cyan rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        ) : scrape.status === "FAILED" ? (
                          <span className="text-sm font-medium text-danger">Failed</span>
                        ) : scrape.status === "COMPLETED" && scrape.leadsFound > 0 ? (
                          <DownloadButton scrape={scrape} />
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-card border border-card-border rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    p === page
                      ? "bg-accent text-white"
                      : "text-gray-300 bg-card border border-card-border hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-card border border-card-border rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
