"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  extractionType: string;
  status: string;
  targetCount: number;
  leadsFound: number;
  createdAt: string;
}

interface UserData {
  credits: number;
}

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/scravio/campaigns").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([campData, userData]) => {
      setCampaigns(campData.campaigns || []);
      setUser(userData.user);
      setLoading(false);
    });
  }, []);

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
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted mt-1">Manage your lead scraping campaigns</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="px-5 py-2.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors"
        >
          + New Campaign
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-card border border-card-border rounded-xl">
          <p className="text-sm text-muted">Credit Balance</p>
          <p className="text-3xl font-bold text-accent-cyan mt-1">
            {user?.credits?.toLocaleString() ?? 0}
          </p>
          <Link href="/dashboard/pricing" className="text-xs text-accent mt-2 inline-block hover:underline">
            Buy more credits
          </Link>
        </div>
        <div className="p-5 bg-card border border-card-border rounded-xl">
          <p className="text-sm text-muted">Active Campaigns</p>
          <p className="text-3xl font-bold mt-1">
            {campaigns.filter((c) => c.status === "RUNNING").length}
          </p>
        </div>
        <div className="p-5 bg-card border border-card-border rounded-xl">
          <p className="text-sm text-muted">Total Leads Found</p>
          <p className="text-3xl font-bold mt-1">
            {campaigns.reduce((sum, c) => sum + c.leadsFound, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Campaigns</h2>
        {campaigns.length === 0 ? (
          <div className="text-center py-16 bg-card border border-card-border rounded-xl">
            <p className="text-muted">No campaigns yet</p>
            <Link
              href="/dashboard/campaigns/new"
              className="inline-block mt-3 text-sm text-accent hover:underline"
            >
              Create your first campaign
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border text-left text-xs text-muted uppercase tracking-wider">
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Platform</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Leads</th>
                  <th className="px-5 py-3">Target</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-card-border last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/campaigns/${campaign.id}`}
                        className="font-medium hover:text-accent transition-colors"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted capitalize">
                      {campaign.platform}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          statusColor[campaign.status] || "text-muted bg-muted/10"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {campaign.leadsFound.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">
                      {campaign.targetCount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
