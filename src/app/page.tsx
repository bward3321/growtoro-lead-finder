import Link from "next/link";
import {
  InstagramLogo,
  TwitterLogo,
  YouTubeLogo,
  FacebookLogo,
  LinkedInLogo,
  TikTokLogo,
} from "@/components/PlatformLogos";

const platforms = [
  { name: "Instagram", Logo: InstagramLogo },
  { name: "X / Twitter", Logo: TwitterLogo },
  { name: "YouTube", Logo: YouTubeLogo },
  { name: "Facebook", Logo: FacebookLogo },
  { name: "LinkedIn", Logo: LinkedInLogo },
  { name: "TikTok", Logo: TikTokLogo },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-card-border">
        <div className="text-xl font-bold tracking-tight">
          <span className="text-accent">Growtoro</span> Lead Finder
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 text-sm font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <div className="max-w-4xl text-center space-y-10">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            Extract{" "}
            <span className="bg-gradient-to-r from-accent to-accent-cyan bg-clip-text text-transparent">
              qualified leads
            </span>{" "}
            from social media
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Scrape emails, profiles, and contact data from Instagram, Twitter, YouTube,
            Facebook, LinkedIn, and TikTok. Pay per lead, no subscriptions.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/signup"
              className="px-10 py-3.5 text-base font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Sign up free
            </Link>
            <span className="text-xs text-muted">
              No credit card required. Only pay when you buy credits.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 pt-4 max-w-5xl mx-auto">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="flex flex-col items-center justify-center gap-5 p-10 rounded-2xl border border-card-border bg-card hover:border-accent/30 hover:bg-accent/[0.03] transition-all"
              >
                <p.Logo className="w-14 h-14" />
                <span className="text-base font-semibold text-foreground/80">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-muted border-t border-card-border">
        Growtoro Lead Finder
      </footer>
    </div>
  );
}
