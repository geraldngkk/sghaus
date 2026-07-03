import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Price Your Singapore House for Sale | SGHaus",
  description:
    "Free HDB resale pricing tool for sellers. Get your floor price, target, and opening ask from real resale transactions, plus your net proceeds after costs.",
  alternates: { canonical: "/sell" },
  openGraph: {
    title: "How to Price Your Singapore House for Sale | SGHaus",
    description:
      "Get your floor price, target, and opening ask from real resale transactions, plus net proceeds after costs.",
    url: "https://sghaus.com/sell",
  },
};

export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
