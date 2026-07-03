import type { Metadata } from "next";
import { DM_Serif_Display, Hanken_Grotesk } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { JsonLd } from "@/components/json-ld";
import "./globals.css";

const organizationJsonLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SGHaus",
  url: "https://sghaus.com",
  description:
    "SGHaus turns thousands of recent resale transactions into three offer prices, so buyers and sellers know exactly what a flat is worth.",
  logo: "https://sghaus.com/logo-square.svg",
};

const websiteJsonLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SGHaus",
  url: "https://sghaus.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://sghaus.com/buy?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

// Display serif:the brand's emotional voice (wordmark + hero headline only)
const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

// Workhorse grotesque:body, UI, and all numbers. Carries the data-authoritative weight.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SGHaus - Know Exactly What Your Flat Is Worth",
  description:
    "This is probably the biggest decision of your life. Don't wing it. Data-backed offer strategies for buyers and pricing tools for sellers.",
  metadataBase: new URL("https://sghaus.com"),
  alternates: { canonical: "/" },
  verification: {
    google: "RCPkgKDYMwoJdgoccgWv2n3vChbpoz1cDxStMj7lSOQ",
  },
  openGraph: {
    title: "SGHaus - Know Exactly What Your Flat Is Worth",
    description:
      "Data-backed offer strategies for buyers and pricing tools for sellers.",
    siteName: "SGHaus",
    type: "website",
    url: "https://sghaus.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "SGHaus - Know Exactly What Your Flat Is Worth",
    description:
      "Data-backed offer strategies for buyers and pricing tools for sellers.",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/logo-square.svg",
  },
};

const gaId = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSerif.variable} ${hanken.variable} antialiased`}>
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        {children}
      </body>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}
