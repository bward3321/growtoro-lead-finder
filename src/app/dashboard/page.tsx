"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Scrape {
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
  const [scrapes, setScrapes] = useState<Scrape[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/scravio/campaigns").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([scrapeData, userData]) => {
      setScrapes(scrapeData.campaigns || []);
      setUser(userData.user);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-300 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-base text-gray-300 mt-1">Manage your lead scrapes</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="px-6 py-3 bg-gradient-to-r from-accent to-accent-cyan text-white text-base font-semibold rounded-lg hover:from-accent/90 hover:to-accent-cyan/90 transition-all"
        >
          + New Scrape
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 bg-card border border-card-border rounded-xl">
          <p className="text-base text-gray-300">Credit Balance</p>
          <p className="text-4xl font-bold text-accent-cyan mt-1">
            {user?.credits?.toLocaleString() ?? 0}
          </p>
          <Link href="/dashboard/pricing" className="text-sm text-accent mt-2 inline-block hover:underline">
            Buy more credits
          </Link>
        </div>
        <div className="p-6 bg-card border border-card-border rounded-xl">
          <p className="text-base text-gray-300">Active Scrapes</p>
          <p className="text-4xl font-bold text-white mt-1">
            {scrapes.filter((c) => c.status === "RUNNING").length}
          </p>
        </div>
        <div className="p-6 bg-card border border-card-border rounded-xl">
          <p className="text-base text-gray-300">Total Leads Found</p>
          <p className="text-4xl font-bold text-white mt-1">
            {scrapes.reduce((sum, c) => sum + c.leadsFound, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Scrapes</h2>
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
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border text-left text-sm text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Scrape</th>
                  <th className="px-5 py-3">Platform</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Leads</th>
                  <th className="px-5 py-3">Target</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {scrapes.map((scrape) => (
                  <tr
                    key={scrape.id}
                    className="border-b border-card-border last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/campaigns/${scrape.id}`}
                        className="text-base font-medium text-white hover:text-accent transition-colors"
                      >
                        {scrape.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-base text-gray-300 capitalize">
                      {scrape.platform}
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
                    <td className="px-5 py-4 text-base text-white">
                      {scrape.leadsFound.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-base text-gray-300">
                      {scrape.targetCount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-base text-gray-300">
                      {new Date(scrape.createdAt).toLocaleDateString()}
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
