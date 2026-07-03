import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What to Offer on a Singapore House | SGHaus",
  description:
    "Free HDB resale offer calculator. Get your opening bid, target price, and hard ceiling from real resale transactions, so you negotiate from data, not the asking price.",
  alternates: { canonical: "/buy" },
  openGraph: {
    title: "What to Offer on a Singapore House | SGHaus",
    description:
      "Get your opening bid, target price, and hard ceiling from real resale transactions.",
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
