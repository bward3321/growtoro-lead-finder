"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

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
  const [scrape, setScrape] = useState<Scrape | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function fetchScrape() {
    setLoading(true);
    try {
      // Sync with Scravio first (the GET handler calls syncCampaignStatus)
      const res = await fetch(`/api/scravio/campaigns/${id}`);
      const data = await res.json();
      setScrape(data.campaign);

      // Only fetch leads for Scravio campaigns (SphereScout is CSV-only)
      if (
        data.campaign?.source !== "spherescout" &&
        (data.campaign?.status === "COMPLETED" || data.campaign?.leadsFound > 0)
      ) {
        const leadsRes = await fetch(`/api/scravio/campaigns/${id}/leads`);
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads || leadsData.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch scrape:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchScrape();
  }, [id]);

  // Auto-poll every 15 seconds while scrape is active
  useEffect(() => {
    if (!scrape || ["COMPLETED", "FAILED", "STOPPED"].includes(scrape.status)) return;

    const interval = setInterval(() => {
      fetchScrape();
    }, 15000);

    return () => clearInterval(interval);
  }, [scrape?.status, id]);

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
        // SphereScout download flow
        const statusRes = await fetch(
          `/api/spherescout/status?searchId=${scrape.spherescoutSearchId}`
        );
        const statusData = await statusRes.json();
        if ((statusData.status || "").toUpperCase() !== "COMPLETED") {
          alert("Export still processing, try again shortly");
          return;
        }
        const dlRes = await fetch(
          `/api/spherescout/download?searchId=${scrape.spherescoutSearchId}`
        );
        const dlData = await dlRes.json();
        if (dlData.downloadUrl) {
          window.open(dlData.downloadUrl, "_blank");
        }
      } else {
        const res = await fetch(`/api/scravio/campaigns/${id}/export`, { method: "POST" });
        const data = await res.json();
        if (data.download_url || data.url) {
          window.open(data.download_url || data.url, "_blank");
        }
      }
    } finally {
      setExporting(false);
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
    a.download = `${scrape?.name || "leads"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusColor: Record<string, string> = {
    RUNNING: "text-accent-cyan bg-accent-cyan/10",
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

  const progress =
    scrape.targetCount > 0
      ? Math.min(100, Math.round((scrape.leadsFound / scrape.targetCount) * 100))
      : 0;

  const creditsReserved = scrape.creditsUsed + (scrape.creditsRefunded || 0);
  const isTerminal = ["COMPLETED", "FAILED", "STOPPED"].includes(scrape.status);

  return (
    <div className="space-y-8">
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
          <p className="text-sm text-gray-300">Emails Found</p>
          <p className="text-4xl font-bold text-white mt-1">{scrape.leadsFound.toLocaleString()}</p>
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
            className="h-full bg-gradient-to-r from-accent to-accent-cyan rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
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
