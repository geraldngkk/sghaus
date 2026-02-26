import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SGHaus — Know What Your HDB Flat Is Really Worth",
  description:
    "Data-backed pricing for HDB sellers. Your floor price, target, and opening ask — powered by real transaction data.",
};

export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
