"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult } from "@/types";
import { getSavedAnalyses, deleteAnalysis, type SavedAnalysis } from "@/lib/storage";
import { SQM_TO_SQFT } from "@/lib/constants";

function formatPrice(value: number): string {
  return `$${value.toLocaleString("en-SG")}`;
}

interface SavedReportsProps {
  onLoad: (result: AnalysisResult) => void;
  onCompare: (ids: string[]) => void;
  refreshKey: number; // increment to refresh list
}

export default function SavedReports({ onLoad, onCompare, refreshKey }: SavedReportsProps) {
  const [reports, setReports] = useState<SavedAnalysis[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setReports(getSavedAnalyses());
  }, [refreshKey]);

  function handleDelete(id: string) {
    deleteAnalysis(id);
    setReports(getSavedAnalyses());
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setConfirmDelete(null);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h3 className="font-display text-xl text-charcoal">Saved Reports</h3>
        <p className="mt-3 text-sm text-slate">
          No saved reports yet. Run an analysis and save it to build your shortlist.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-charcoal">Saved Reports</h3>
          <p className="mt-1 text-sm text-slate">
            {reports.length} saved &middot; Select 2-3 to compare
          </p>
        </div>
        {selected.size >= 2 && (
          <button
            onClick={() => onCompare(Array.from(selected))}
            className="rounded-[10px] bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-forest/90"
          >
            Compare {selected.size} Properties
          </button>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {reports.map((report) => {
          const isSelected = selected.has(report.id);
          const offer = report.result.offer;
          const risks = report.result.risks;
          const criticalRisks = risks.filter(
            (r) => r.severity === "critical" || r.severity === "high"
          ).length;

          return (
            <div
              key={report.id}
              className={`relative rounded-xl border-2 p-4 transition-all ${
                isSelected
                  ? "border-forest bg-mist/20"
                  : "border-border bg-white hover:border-border hover:shadow-[var(--shadow-xs)]"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(report.id)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs transition-colors ${
                    isSelected
                      ? "border-forest bg-forest text-white"
                      : "border-border bg-white text-transparent hover:border-slate"
                  }`}
                  aria-label={isSelected ? "Deselect" : "Select for comparison"}
                >
                  {isSelected && "\u2713"}
                </button>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-charcoal">
                        {report.label}
                      </h4>
                      <p className="mt-0.5 text-xs text-slate">
                        {report.input.storeyRange} &middot;{" "}
                        {Math.round(report.input.floorAreaSqm * SQM_TO_SQFT)} sq ft &middot;{" "}
                        ~{99 - (new Date().getFullYear() - report.input.leaseCommenceDate)} yrs lease
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-slate/60">
                      {new Date(report.savedAt).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>

                  {/* Quick stats */}
                  <div className="mt-3 flex items-center gap-4">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate">
                        Target
                      </span>
                      <div className="font-display text-base text-forest">
                        {formatPrice(offer.mid)}
                      </div>
                    </div>
                    <div className="h-6 w-px bg-border" />
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate">
                        Range
                      </span>
                      <div className="text-sm text-charcoal">
                        {formatPrice(offer.low)} – {formatPrice(offer.max)}
                      </div>
                    </div>
                    {criticalRisks > 0 && (
                      <>
                        <div className="h-6 w-px bg-border" />
                        <span className="rounded-full bg-[#EF4444]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#EF4444]">
                          {criticalRisks} risk{criticalRisks > 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => onLoad(report.result)}
                      className="rounded-lg border border-forest/20 px-3 py-1.5 text-xs font-semibold text-forest transition-colors hover:bg-mist/30"
                    >
                      View Full Report
                    </button>
                    {confirmDelete === report.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="rounded-lg bg-[#EF4444]/10 px-3 py-1.5 text-xs font-semibold text-[#EF4444] transition-colors hover:bg-[#EF4444]/20"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-lg px-3 py-1.5 text-xs text-slate transition-colors hover:bg-fog"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(report.id)}
                        className="rounded-lg px-3 py-1.5 text-xs text-slate transition-colors hover:bg-fog hover:text-charcoal"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
