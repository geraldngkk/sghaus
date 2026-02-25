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
  title: "SGHaus — Know What to Offer Before You Walk In",
  description:
    "This is probably the biggest purchase of your life. Don't wing it. Real HDB transaction data powers your opening bid, target price, and hard ceiling.",
  metadataBase: new URL("https://sghaus.com"),
  openGraph: {
    title: "SGHaus — Know What to Offer Before You Walk In",
    description:
      "Real HDB transaction data. Your opening bid, your target price, and the number you should never go past.",
    siteName: "SGHaus",
    type: "website",
    url: "https://sghaus.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "SGHaus — Know What to Offer Before You Walk In",
    description:
      "Real HDB transaction data. Your opening bid, your target price, and the number you should never go past.",
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
