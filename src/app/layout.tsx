import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
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
      <body className={`${dmSerif.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
