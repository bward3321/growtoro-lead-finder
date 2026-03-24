export const dynamic = "force-dynamic";

import DashboardNav from "@/components/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">{children}</main>

      {/* Floating support button */}
      <a
        href="mailto:support@growtoro.com"
        className="group fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent-cyan shadow-lg shadow-accent/25 hover:scale-110 transition-transform duration-200"
        aria-label="Email support"
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        <span className="pointer-events-none absolute bottom-full mb-2 right-0 whitespace-nowrap rounded-lg bg-card border border-card-border px-3 py-1.5 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
          Need help?
        </span>
      </a>
    </div>
  );
}
