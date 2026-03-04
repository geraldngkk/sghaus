import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SGHaus - Know What to Offer Before You Walk In",
  description:
    "Real transaction data. Your opening bid, your target price, and the number you should never go past.",
};

export default function BuyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
