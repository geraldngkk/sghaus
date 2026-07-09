import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HDB Price Checker: What to Offer on a Resale Flat | SGHaus",
  description:
    "Free HDB price checker and resale offer calculator. Get your opening bid, target price, and hard ceiling from real resale transactions, so you negotiate from data, not the asking price.",
  alternates: { canonical: "/buy" },
  openGraph: {
    title: "HDB Price Checker: What to Offer on a Resale Flat | SGHaus",
    description:
      "Check what a resale flat is worth and get your opening bid, target price, and hard ceiling from real resale transactions.",
    url: "https://sghaus.com/buy",
  },
};

export default function BuyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
