import type { Metadata } from "next";
import localFont from "next/font/local";
import { site } from "@/config/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

// Fonts are stored in the repository (src/fonts, SIL Open Font License) so
// builds never depend on downloading them from Google.
const figtree = localFont({
  src: "../fonts/figtree-latin-wght-normal.woff2",
  variable: "--font-figtree",
  weight: "300 900",
  display: "swap",
});
const sourceSans = localFont({
  src: "../fonts/source-sans-3-latin-wght-normal.woff2",
  variable: "--font-source-sans",
  weight: "200 900",
  display: "swap",
});
const plexMono = localFont({
  src: [
    { path: "../fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  openGraph: { siteName: site.name, locale: "en_GB", type: "website" },
  alternates: { types: { "application/rss+xml": "/blog/rss.xml" } },
  title: {
    default: `${site.name}: find a vetted local home-improvement specialist`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${figtree.variable} ${sourceSans.variable} ${plexMono.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
