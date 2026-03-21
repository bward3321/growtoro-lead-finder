import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Growtoro Lead Finder",
  description: "Self-serve social media lead scraping tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
