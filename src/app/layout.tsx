import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Serif_Devanagari } from "next/font/google";
import { siteUrl } from "@/lib/env";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const deva = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600"],
  variable: "--font-deva",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Karmic Ascension – Vedic Astrology™",
    template: "%s | Karmic Ascension – Vedic Astrology™",
  },
  description:
    "Book Vedic astrology consultation to know your pending karma for material and spiritual transformation.",
  applicationName: "Karmic Ascension",
  openGraph: {
    type: "website",
    siteName: "Karmic Ascension – Vedic Astrology™",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#fbf7ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} ${deva.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
