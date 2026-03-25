"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Scrape {
  id: string;
  name: string;
  platform: string;
  extractionType: string;
  status: string;
  targetCount: number;
  leadsFound: number;
  creditsUsed: number;
  creditsRefunded: number;
  config: string;
  createdAt: string;
  source?: string;
  spherescoutSearchId?: string;
}

interface Lead {
  username?: string;
  name?: string;
  email?: string;
  follower_count?: number;
  bio?: string;
  [key: string]: unknown;
}

export default function ScrapeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("success");
  const [showSuccess, setShowSuccess] = useState(!!successMessage);
  const [scrape, setScrape] = useState<Scrape | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [ssProgress, setSsProgress] = useState(0);
  const pollCountRef = useRef(0);

  const fetchScrape = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const res = await fetch(`/api/scravio/campaigns/${id}`);
      const data = await res.json();
      const campaign = data.campaign;
      setScrape(campaign);

      // Update SphereScout progress based on actual status
      if (campaign?.source === "spherescout") {
        const ssStatus = (data.spherescoutStatus || "").toUpperCase();
        if (campaign.status === "COMPLETED") {
          setSsProgress(100);
        } else if (campaign.status === "FAILED") {
          setSsProgress(0);
        } else if (ssStatus === "PENDING") {
          setSsProgress(10);
        } else if (ssStatus === "PROCESSING") {
          // Increment between 30-70% to show movement
          setSsProgress((prev) => {
            if (prev >= 70) return 70;
            if (prev < 30) return 30;
            return Math.min(70, prev + 10);
          });
        } else {
          setSsProgress((prev) => (prev < 10 ? 5 : prev));
        }
      }

      // Only fetch leads for Scravio campaigns (SphereScout is CSV-only)
      if (
        campaign?.source !== "spherescout" &&
        (campaign?.status === "COMPLETED" || campaign?.leadsFound > 0)
      ) {
        const leadsRes = await fetch(`/api/scravio/campaigns/${id}/leads`);
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads || leadsData.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch scrape:", err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchScrape();
  }, [fetchScrape]);

  // Auto-poll: 5s for SphereScout processing, 15s for Scravio
  useEffect(() => {
    if (!scrape || ["COMPLETED", "FAILED", "STOPPED"].includes(scrape.status)) return;

    const interval = scrape.source === "spherescout" ? 5000 : 15000;
    const timer = setInterval(() => {
      pollCountRef.current++;
      fetchScrape(true);
    }, interval);

    return () => clearInterval(timer);
  }, [scrape?.status, scrape?.source, fetchScrape]);

  async function handleStop() {
    setStopping(true);
    try {
      await fetch(`/api/scravio/campaigns/${id}/stop`, { method: "POST" });
      await fetchScrape();
    } finally {
      setStopping(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      if (scrape?.source === "spherescout" && scrape.spherescoutSearchId) {
        // Get download URL, then proxy through our route for custom filename
        const res = await fetch(
          `/api/spherescout/download?searchId=${scrape.spherescoutSearchId}`
        );
        const data = await res.json();
        if (!res.ok || !data.downloadUrl) {
          alert(data.error || "Download not ready yet — try again in a moment.");
          return;
        }
        // Download through proxy to rename the file
        const categoryName = getCategoryName();
        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `growtoro_leads_${categoryName}_${dateStr}.csv`;
        const proxyUrl = `/api/spherescout/download-proxy?url=${encodeURIComponent(data.downloadUrl)}&filename=${encodeURIComponent(filename)}`;
        window.open(proxyUrl, "_blank");
      } else {
        const res = await fetch("/api/scravio/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId: id }),
        });
        const data = await res.json();
        if (!res.ok || !data.downloadUrl) {
          alert(data.error || "Download not ready yet — try again in a moment.");
          return;
        }
        // Download through proxy to rename the file
        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `growtoro_leads_${scrape?.platform || "export"}_${dateStr}.csv`;
        const proxyUrl = `/api/spherescout/download-proxy?url=${encodeURIComponent(data.downloadUrl)}&filename=${encodeURIComponent(filename)}`;
        window.open(proxyUrl, "_blank");
      }
    } catch {
      alert("Failed to prepare download — check your connection and try again.");
    } finally {
      setExporting(false);
    }
  }

  function getCategoryName(): string {
    if (!scrape?.config) return "export";
    try {
      const config = JSON.parse(scrape.config);
      return (config.categoryName || "export").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    } catch {
      return "export";
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this scrape?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/scravio/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
      }
    } finally {
      setDeleting(false);
    }
  }

  function downloadCSV() {
    if (leads.length === 0) return;
    const headers = ["username", "name", "email", "follower_count", "bio"];
    const csv = [
      headers.join(","),
      ...leads.map((l) =>
        headers.map((h) => `"${String(l[h] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `growtoro_leads_${scrape?.platform || "export"}_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusColor: Record<string, string> = {
    RUNNING: "text-accent-cyan bg-accent-cyan/10",
    PROCESSING: "text-purple-400 bg-purple-400/10",
    COMPLETED: "text-success bg-success/10",
    STOPPED: "text-gray-400 bg-gray-400/10",
    PENDING: "text-yellow-400 bg-yellow-400/10",
    QUEUED: "text-orange-400 bg-orange-400/10",
    FAILED: "text-danger bg-danger/10",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-300 text-lg">Loading scrape...</div>
      </div>
    );
  }

  if (!scrape) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-300 text-lg">Scrape not found</p>
      </div>
    );
  }

  const isSphereScout = scrape.source === "spherescout";
  const progress = isSphereScout
    ? ssProgress
    : scrape.targetCount > 0
      ? Math.min(100, Math.round((scrape.leadsFound / scrape.targetCount) * 100))
      : 0;

  const creditsReserved = scrape.creditsUsed + (scrape.creditsRefunded || 0);
  const isTerminal = ["COMPLETED", "FAILED", "STOPPED"].includes(scrape.status);

  return (
    <div className="space-y-8">
      {showSuccess && successMessage && (
        <div className="flex items-center justify-between px-5 py-3 bg-success/10 border border-success/30 rounded-lg">
          <p className="text-success text-base">{successMessage}</p>
          <button onClick={() => setShowSuccess(false)} className="text-success/60 hover:text-success ml-4">
            &times;
          </button>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{scrape.name}</h1>
          <p className="text-base text-gray-300 mt-1">
            {scrape.platform} &middot; {scrape.extractionType}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {scrape.status === "RUNNING" && (
            <button
              onClick={handleStop}
              disabled={stopping}
              className="px-6 py-3 text-base border border-danger/30 text-danger rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50"
            >
              {stopping ? "Stopping..." : "Stop Scrape"}
            </button>
          )}
          {isTerminal && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 py-3 text-base border border-danger/30 text-danger rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
          <button
            onClick={() => fetchScrape()}
            className="px-6 py-3 text-base border border-card-border text-gray-200 rounded-lg hover:bg-card transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-card border border-card-border rounded-xl">
          <p className="text-sm text-gray-300">Status</p>
          <span
            className={`inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full ${
              statusColor[scrape.status] || "text-gray-400 bg-gray-400/10"
            }`}
          >
            {scrape.status}
          </span>
        </div>
        <div className="p-5 bg-card border border-card-border rounded-xl">
          <p className="text-sm text-gray-300">{isSphereScout ? "Leads Found" : "Emails Found"}</p>
          {scrape.status === "PROCESSING" ? (
            <p className="text-lg font-medium text-purple-400 mt-2">Processing...</p>
          ) : (
            <p className="text-4xl font-bold text-white mt-1">{scrape.leadsFound.toLocaleString()}</p>
          )}
        </div>
        <div className="p-5 bg-card border border-card-border rounded-xl">
          <p className="text-sm text-gray-300">Target</p>
          <p className="text-4xl font-bold text-white mt-1">{scrape.targetCount.toLocaleString()}</p>
        </div>
        <div className="p-5 bg-card border border-card-border rounded-xl">
          <p className="text-sm text-gray-300">Credits Used</p>
          <p className="text-4xl font-bold text-white mt-1">{scrape.creditsUsed.toLocaleString()}</p>
        </div>
      </div>

      {/* Credit accounting */}
      {isTerminal && (
        <div className="p-5 bg-card border border-card-border rounded-xl">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Credit Accounting</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Reserved</p>
              <p className="text-xl font-bold text-white mt-1">{creditsReserved.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Used</p>
              <p className="text-xl font-bold text-accent-cyan mt-1">{scrape.creditsUsed.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Refunded</p>
              <p className={`text-xl font-bold mt-1 ${scrape.creditsRefunded > 0 ? "text-success" : "text-gray-500"}`}>
                {(scrape.creditsRefunded || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-base mb-2">
          <span className="text-gray-300">Progress</span>
          <span className="font-medium text-white">{progress}%</span>
        </div>
        <div className="h-3 bg-card border border-card-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-cyan rounded-full"
            style={{ width: `${progress}%`, transition: "width 0.5s ease" }}
          />
        </div>
      </div>

      {/* SphereScout download section */}
      {scrape.source === "spherescout" && scrape.status === "COMPLETED" && (
        <div className="p-6 bg-card border border-card-border rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Download Leads</h2>
              <p className="text-sm text-gray-300 mt-1">
                {scrape.leadsFound.toLocaleString()} leads available as CSV
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-6 py-3 text-base bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {exporting ? "Preparing..." : "Download CSV"}
            </button>
          </div>
        </div>
      )}

      {/* SphereScout failed */}
      {scrape.source === "spherescout" && scrape.status === "FAILED" && (
        <div className="p-6 bg-card border border-danger/30 rounded-xl">
          <p className="text-danger text-base">
            Export failed. Your credits have been refunded.
          </p>
        </div>
      )}

      {/* Leads table (Scravio only) */}
      {leads.length > 0 && scrape.source !== "spherescout" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Leads ({leads.length})</h2>
            <div className="flex gap-3">
              <button
                onClick={downloadCSV}
                className="px-6 py-3 text-base bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Download CSV
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-6 py-3 text-base border border-card-border text-gray-200 rounded-lg hover:bg-card transition-colors disabled:opacity-50"
              >
                {exporting ? "Exporting..." : "Export via Scravio"}
              </button>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border text-left text-sm text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Followers</th>
                  <th className="px-5 py-3">Bio</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr
                    key={i}
                    className="border-b border-card-border last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 text-base text-white">{lead.username || "-"}</td>
                    <td className="px-5 py-3 text-base text-gray-200">{lead.name || "-"}</td>
                    <td className="px-5 py-3 text-base text-accent">
                      {lead.email || "-"}
                    </td>
                    <td className="px-5 py-3 text-base text-white">
                      {lead.follower_count?.toLocaleString() || "-"}
                    </td>
                    <td className="px-5 py-3 text-base text-gray-300 max-w-xs truncate">
                      {lead.bio || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
