import Link from "next/link";
import Image from "next/image";

export const revalidate = 3600;
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

const platforms = [
  { name: "Instagram", Logo: InstagramLogo, hoverBorder: "hover:border-[#E1306C]/50", hoverGlow: "hover:shadow-[0_0_25px_-5px_rgba(225,48,108,0.3)]" },
  { name: "X / Twitter", Logo: TwitterLogo, hoverBorder: "hover:border-[#ffffff]/30", hoverGlow: "hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.15)]" },
  { name: "YouTube", Logo: YouTubeLogo, hoverBorder: "hover:border-[#FF0000]/40", hoverGlow: "hover:shadow-[0_0_25px_-5px_rgba(255,0,0,0.25)]" },
  { name: "Facebook", Logo: FacebookLogo, hoverBorder: "hover:border-[#1877F2]/50", hoverGlow: "hover:shadow-[0_0_25px_-5px_rgba(24,119,242,0.3)]" },
  { name: "LinkedIn", Logo: LinkedInLogo, hoverBorder: "hover:border-[#0A66C2]/50", hoverGlow: "hover:shadow-[0_0_25px_-5px_rgba(10,102,194,0.3)]" },
  { name: "TikTok", Logo: TikTokLogo, hoverBorder: "hover:border-[#FE2C55]/40", hoverGlow: "hover:shadow-[0_0_25px_-5px_rgba(254,44,85,0.25)]" },
  { name: "Google Maps", Logo: GoogleMapsLogo, hoverBorder: "hover:border-[#34A853]/50", hoverGlow: "hover:shadow-[0_0_25px_-5px_rgba(52,168,83,0.3)]" },
  { name: "B2B Contacts", Logo: B2BContactsLogo, hoverBorder: "hover:border-[#6366F1]/50", hoverGlow: "hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.3)]" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-card-border">
        <Link href="/">
          <Image src="/logo.png" alt="Growtoro Lead Finder" width={129} height={32} priority />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 text-sm font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <div className="max-w-5xl text-center space-y-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Find leads from{" "}
            <span className="gradient-shimmer">
              social media, maps &amp; B2B databases
            </span>
          </h1>
          <p className="text-lg text-white">
            Extract verified emails, B2B contacts, and business data from 8 platforms. Pay per lead, no subscriptions.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/signup"
              className="btn-shine px-12 py-5 text-xl font-bold text-white rounded-xl bg-gradient-to-r from-accent to-accent-cyan hover:from-accent/90 hover:to-accent-cyan/90 transition-all"
            >
              Sign up free
            </Link>
            <span className="text-base text-gray-400">
              No credit card required. Get 100 free credits instantly.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 max-w-5xl mx-auto">
            {platforms.map((p) => (
              <div
                key={p.name}
                className={`platform-card flex flex-col items-center justify-center gap-5 px-10 py-8 min-w-[160px] rounded-2xl border border-card-border bg-card transition-all duration-300 ${p.hoverBorder} ${p.hoverGlow}`}
              >
                <p.Logo className="w-20 h-20" />
                <span className="text-lg font-semibold text-white/80">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-gray-500 border-t border-card-border">
        Growtoro Lead Finder
      </footer>
    </div>
  );
}
