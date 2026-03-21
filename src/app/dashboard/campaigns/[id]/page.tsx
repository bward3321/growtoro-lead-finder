"use client";

import { useEffect, useState, use } from "react";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  extractionType: string;
  status: string;
  targetCount: number;
  leadsFound: number;
  creditsUsed: number;
  config: string;
  createdAt: string;
}

interface Lead {
  username?: string;
  name?: string;
  email?: string;
  follower_count?: number;
  bio?: string;
  [key: string]: unknown;
}

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  async function fetchCampaign() {
    setLoading(true);
    try {
      const res = await fetch(`/api/scravio/campaigns/${id}`);
      const data = await res.json();
      setCampaign(data.campaign);

      if (data.campaign?.status === "COMPLETED" || data.campaign?.leadsFound > 0) {
        const leadsRes = await fetch(`/api/scravio/campaigns/${id}/leads`);
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads || leadsData.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch campaign:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    setStopping(true);
    try {
      await fetch(`/api/scravio/campaigns/${id}/stop`, { method: "POST" });
      await fetchCampaign();
    } finally {
      setStopping(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/scravio/campaigns/${id}/export`, { method: "POST" });
      const data = await res.json();
      if (data.download_url || data.url) {
        window.open(data.download_url || data.url, "_blank");
      }
    } finally {
      setExporting(false);
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
    a.download = `${campaign?.name || "leads"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusColor: Record<string, string> = {
    RUNNING: "text-accent-cyan bg-accent-cyan/10",
    COMPLETED: "text-success bg-success/10",
    STOPPED: "text-muted bg-muted/10",
    PENDING: "text-yellow-400 bg-yellow-400/10",
    FAILED: "text-danger bg-danger/10",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-muted">Campaign not found</p>
      </div>
    );
  }

  const progress =
    campaign.targetCount > 0
      ? Math.min(100, Math.round((campaign.leadsFound / campaign.targetCount) * 100))
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-sm text-muted mt-1">
            {campaign.platform} &middot; {campaign.extractionType}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {campaign.status === "RUNNING" && (
            <button
              onClick={handleStop}
              disabled={stopping}
              className="px-4 py-2 text-sm border border-danger/30 text-danger rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50"
            >
              {stopping ? "Stopping..." : "Stop Campaign"}
            </button>
          )}
          <button
            onClick={() => fetchCampaign()}
            className="px-4 py-2 text-sm border border-card-border rounded-lg hover:bg-card transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-card-border rounded-xl">
          <p className="text-xs text-muted">Status</p>
          <span
            className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${
              statusColor[campaign.status] || "text-muted bg-muted/10"
            }`}
          >
            {campaign.status}
          </span>
        </div>
        <div className="p-4 bg-card border border-card-border rounded-xl">
          <p className="text-xs text-muted">Leads Found</p>
          <p className="text-xl font-bold mt-1">{campaign.leadsFound.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-card border border-card-border rounded-xl">
          <p className="text-xs text-muted">Target</p>
          <p className="text-xl font-bold mt-1">{campaign.targetCount.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-card border border-card-border rounded-xl">
          <p className="text-xs text-muted">Credits Used</p>
          <p className="text-xl font-bold mt-1">{campaign.creditsUsed.toLocaleString()}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 bg-card border border-card-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-cyan rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Leads table */}
      {leads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Leads ({leads.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={downloadCSV}
                className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Download CSV
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 text-sm border border-card-border rounded-lg hover:bg-card transition-colors disabled:opacity-50"
              >
                {exporting ? "Exporting..." : "Export via Scravio"}
              </button>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border text-left text-xs text-muted uppercase tracking-wider">
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
                    <td className="px-5 py-3 text-sm">{lead.username || "-"}</td>
                    <td className="px-5 py-3 text-sm">{lead.name || "-"}</td>
                    <td className="px-5 py-3 text-sm text-accent">
                      {lead.email || "-"}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {lead.follower_count?.toLocaleString() || "-"}
                    </td>
                    <td className="px-5 py-3 text-sm text-muted max-w-xs truncate">
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
