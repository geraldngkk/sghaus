"use client";

import { useState } from "react";
import type { TieredComparable } from "@/types";
import { SQM_TO_SQFT } from "@/lib/constants";

interface ComparableTableProps {
  tier1: TieredComparable[];
  tier2: TieredComparable[];
  tier3: TieredComparable[];
}

type SortKey = "month" | "block" | "streetName" | "storeyRange" | "floorAreaSqft" | "resalePrice" | "pricePsf" | "adjustedPricePsf";
type SortDir = "asc" | "desc";

function formatPrice(value: number): string {
  return `$${value.toLocaleString("en-SG")}`;
}

export default function ComparableTable({
  tier1,
  tier2,
  tier3,
}: ComparableTableProps) {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [sortKey, setSortKey] = useState<SortKey>("month");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const comps = activeTab === 1 ? tier1 : activeTab === 2 ? tier2 : tier3;

  const sorted = [...comps].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const tierLabels = [
    { tier: 1 as const, label: `Tier 1 (${tier1.length})`, desc: "Same street" },
    { tier: 2 as const, label: `Tier 2 (${tier2.length})`, desc: "Same area" },
    { tier: 3 as const, label: `Tier 3 (${tier3.length})`, desc: "Town-wide" },
  ];

  const columns: { key: SortKey; label: string; align?: "right" }[] = [
    { key: "month", label: "Month" },
    { key: "block", label: "Block" },
    { key: "streetName", label: "Street" },
    { key: "storeyRange", label: "Storey" },
    { key: "floorAreaSqft", label: "Area (sq ft)", align: "right" },
    { key: "resalePrice", label: "Price", align: "right" },
    { key: "pricePsf", label: "PSF", align: "right" },
    { key: "adjustedPricePsf", label: "Adj PSF", align: "right" },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-zinc-900">Comparable Sales</h2>

      {/* Tier tabs */}
      <div className="mt-3 flex gap-1 border-b border-zinc-200">
        {tierLabels.map(({ tier, label, desc }) => (
          <button
            key={tier}
            onClick={() => setActiveTab(tier)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tier
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
            title={desc}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto">
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            No comparable transactions in this tier.
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200">
                {columns.map(({ key, label, align }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`cursor-pointer px-2 py-2 font-medium text-zinc-500 hover:text-zinc-900 ${
                      align === "right" ? "text-right" : "text-left"
                    } ${sortKey === key ? "text-zinc-900" : ""}`}
                  >
                    {label}
                    {sortKey === key && (
                      <span className="ml-0.5">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 50).map((comp) => (
                <tr
                  key={comp.id}
                  className="border-b border-zinc-100 hover:bg-zinc-50"
                >
                  <td className="px-2 py-2 text-zinc-600">{comp.month}</td>
                  <td className="px-2 py-2 text-zinc-900">{comp.block}</td>
                  <td className="px-2 py-2 text-zinc-900 max-w-[140px] truncate">
                    {comp.streetName}
                  </td>
                  <td className="px-2 py-2 text-zinc-600">{comp.storeyRange}</td>
                  <td className="px-2 py-2 text-right text-zinc-600">
                    {Math.round(comp.floorAreaSqm * SQM_TO_SQFT)}
                  </td>
                  <td className="px-2 py-2 text-right font-medium text-zinc-900">
                    {formatPrice(comp.resalePrice)}
                  </td>
                  <td className="px-2 py-2 text-right text-zinc-600">
                    ${comp.pricePsf.toFixed(0)}
                  </td>
                  <td className="px-2 py-2 text-right font-medium text-blue-700">
                    ${comp.adjustedPricePsf.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {sorted.length > 50 && (
          <p className="mt-2 text-xs text-zinc-400 text-center">
            Showing 50 of {sorted.length} transactions
          </p>
        )}
      </div>
    </div>
  );
}
