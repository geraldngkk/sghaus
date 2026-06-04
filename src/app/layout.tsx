import type { Metadata } from "next";
import { DM_Serif_Display, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSerif.variable} ${hanken.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
