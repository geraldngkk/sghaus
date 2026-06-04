"use client";

import { useState, useTransition, useEffect } from "react";
import type { AnalysisResult, PropertyInput } from "@/types";
import type { DataSourceInfo } from "@/types/fallback";
import { HDB_TOWNS, FLAT_TYPES, STOREY_RANGES, SQM_TO_SQFT } from "@/lib/constants";
import { analyzeProperty } from "@/actions/analyze";
import { getStreetNames } from "@/actions/streets";
import { getBlocks, getBlockDetails } from "@/actions/block-info";
import RenovationForm from "@/components/renovation-form";
import type { RenovationAnswer } from "@/lib/renovation";

interface PropertyFormProps {
  onResult: (result: AnalysisResult) => void;
  onError: (error: string) => void;
  onAnalyzing?: () => void;
  /** Controls copy tone in renovation form: "buy" for buyers, "sell" for sellers */
  mode?: "buy" | "sell";
}

const fieldBase =
  "w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-charcoal transition-colors duration-150 hover:border-slate/40 focus:border-forest focus:ring-2 focus:ring-forest/20 focus:outline-none disabled:bg-fog disabled:text-slate disabled:hover:border-border";
const selectClasses = fieldBase;
const inputClasses = `${fieldBase} placeholder:text-slate/60`;
const labelClasses = "block text-sm font-medium text-charcoal mb-1.5";

export default function PropertyForm({ onResult, onError, onAnalyzing, mode = "buy" }: PropertyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [town, setTown] = useState("");
  const [flatType, setFlatType] = useState("");
  const [streetName, setStreetName] = useState("");
  const [block, setBlock] = useState("");
  const [storeyRange, setStoreyRange] = useState("");
  const [floorAreaSqft, setFloorAreaSqft] = useState("");
  const [areaAutoFilled, setAreaAutoFilled] = useState(false);
  const [renovationAnswers, setRenovationAnswers] = useState<RenovationAnswer[] | null>(null);

  // Street dropdown
  const [availableStreets, setAvailableStreets] = useState<string[]>([]);
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [streetError, setStreetError] = useState<string | null>(null);
  const [streetDataSource, setStreetDataSource] = useState<DataSourceInfo | undefined>();

  // Block dropdown
  const [availableBlocks, setAvailableBlocks] = useState<string[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // Storey range filtering
  const [availableStoreys, setAvailableStoreys] = useState<string[]>([]);
  const [loadingBlockDetails, setLoadingBlockDetails] = useState(false);

  // Fetch streets when town + flatType change
  useEffect(() => {
    if (!town || !flatType) {
      setAvailableStreets([]);
      setStreetName("");
      setBlock("");
      setAvailableBlocks([]);
      setAvailableStoreys([]);
      return;
    }

    setLoadingStreets(true);
    setStreetName("");
    setBlock("");
    setAvailableBlocks([]);
    setAvailableStoreys([]);
    setStreetError(null);
    setStreetDataSource(undefined);
    getStreetNames(town, flatType)
      .then((result) => {
        setAvailableStreets(result.streets);
        setStreetError(result.error ?? null);
        setStreetDataSource(result.dataSource);
      })
      .catch(() => {
        setAvailableStreets([]);
        setStreetError("Could not load streets. Please try again.");
      })
      .finally(() => setLoadingStreets(false));
  }, [town, flatType]);

  // Fetch blocks when street changes
  useEffect(() => {
    if (!town || !flatType || !streetName) {
      setAvailableBlocks([]);
      setBlock("");
      return;
    }

    // Only fetch if streetName is a valid selection (exists in available streets)
    const upperStreet = streetName.toUpperCase();
    if (!availableStreets.some((s) => s.toUpperCase() === upperStreet)) {
      return;
    }

    setLoadingBlocks(true);
    setBlock("");
    setStoreyRange("");
    setAvailableStoreys([]);
    getBlocks(town, flatType, upperStreet)
      .then((blocks) => setAvailableBlocks(blocks))
      .catch(() => setAvailableBlocks([]))
      .finally(() => setLoadingBlocks(false));

    // Also fetch street-level storey ranges (before block is chosen)
    setLoadingBlockDetails(true);
    getBlockDetails(town, flatType, upperStreet)
      .then((info) => {
        if (info.storeyRanges.length > 0) {
          setAvailableStoreys(info.storeyRanges);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBlockDetails(false));
  }, [town, flatType, streetName, availableStreets]);

  // Fetch block details when block changes — refine storey ranges + auto-fill area
  useEffect(() => {
    if (!town || !flatType || !streetName || !block) return;

    const upperStreet = streetName.toUpperCase();
    setLoadingBlockDetails(true);
    setStoreyRange("");

    getBlockDetails(town, flatType, upperStreet, block)
      .then((info) => {
        if (info.storeyRanges.length > 0) {
          setAvailableStoreys(info.storeyRanges);
        }
        if (info.floorAreaSqm && !floorAreaSqft) {
          // Convert sqm from API to sq ft for display
          setFloorAreaSqft(String(Math.round(info.floorAreaSqm * SQM_TO_SQFT)));
          setAreaAutoFilled(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBlockDetails(false));
  }, [town, flatType, streetName, block]); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine which storey ranges to show
  const storeyOptions =
    availableStoreys.length > 0
      ? STOREY_RANGES.filter((s) => availableStoreys.includes(s))
      : STOREY_RANGES;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Convert sq ft input back to sqm for backend
    const areaSqft = parseFloat(floorAreaSqft);
    const areaSqm = areaSqft / SQM_TO_SQFT;

    const input: PropertyInput = {
      town,
      flatType,
      streetName: streetName.toUpperCase(),
      block,
      storeyRange,
      floorAreaSqm: Math.round(areaSqm * 10) / 10, // 1 decimal place
      leaseCommenceDate: 0, // resolved by backend
    };

    onAnalyzing?.();
    startTransition(async () => {
      try {
        const result = await analyzeProperty(
          input,
          renovationAnswers ?? undefined,
        );
        onResult(result);
      } catch (err) {
        onError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    });
  }

  const isFormValid =
    town && flatType && streetName && block && storeyRange && floorAreaSqft;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Town */}
        <div>
          <label htmlFor="town" className={labelClasses}>Town</label>
          <select
            id="town"
            value={town}
            onChange={(e) => setTown(e.target.value)}
            className={selectClasses}
            required
          >
            <option value="">Select a town</option>
            {HDB_TOWNS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Flat Type */}
        <div>
          <label htmlFor="flatType" className={labelClasses}>Flat Type</label>
          <select
            id="flatType"
            value={flatType}
            onChange={(e) => setFlatType(e.target.value)}
            className={selectClasses}
            required
          >
            <option value="">Select flat type</option>
            {FLAT_TYPES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Street Name */}
      <div>
        <label htmlFor="streetName" className={labelClasses}>Street Name</label>
        <select
          id="streetName"
          value={streetName}
          onChange={(e) => setStreetName(e.target.value)}
          className={selectClasses}
          disabled={!town || !flatType || loadingStreets}
          required
        >
          <option value="">
            {!town || !flatType
              ? "Select town and flat type first"
              : loadingStreets
                ? "Loading streets..."
                : availableStreets.length === 0
                  ? "No streets found"
                  : `Select street (${availableStreets.length})`}
          </option>
          {availableStreets.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {streetError && (
          <p className="mt-1.5 text-xs text-red-600">{streetError}</p>
        )}
        {streetDataSource?.type === "fallback" && availableStreets.length > 0 && (
          <p className="mt-1.5 text-xs text-amber-600">
            Using cached data from{" "}
            {new Date(streetDataSource.asOf).toLocaleDateString("en-SG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {" "}(live data temporarily unavailable)
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Block — always dropdown */}
        <div>
          <label htmlFor="block" className={labelClasses}>Block</label>
          <select
            id="block"
            value={block}
            onChange={(e) => {
              setBlock(e.target.value);
              setAreaAutoFilled(false);
            }}
            className={selectClasses}
            disabled={!streetName || loadingBlocks || availableBlocks.length === 0}
            required
          >
            <option value="">
              {!streetName
                ? "Select street first"
                : loadingBlocks
                  ? "Loading..."
                  : availableBlocks.length === 0
                    ? "No blocks found"
                    : "Select block"}
            </option>
            {availableBlocks.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Storey Range */}
        <div>
          <label htmlFor="storeyRange" className={labelClasses}>
            Storey Range
            {loadingBlockDetails && (
              <span className="ml-1.5 text-xs font-normal text-slate">loading...</span>
            )}
          </label>
          <select
            id="storeyRange"
            value={storeyRange}
            onChange={(e) => setStoreyRange(e.target.value)}
            className={selectClasses}
            required
          >
            <option value="">
              {availableStoreys.length > 0
                ? `Select storey (${storeyOptions.length} available)`
                : "Select storey"}
            </option>
            {storeyOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Floor Area — sq ft */}
        <div>
          <label htmlFor="floorAreaSqft" className={labelClasses}>
            Floor Area (sq ft)
            {areaAutoFilled && (
              <span className="ml-1.5 text-xs font-normal text-forest">auto-filled</span>
            )}
          </label>
          <input
            id="floorAreaSqft"
            type="number"
            value={floorAreaSqft}
            onChange={(e) => {
              setFloorAreaSqft(e.target.value);
              setAreaAutoFilled(false);
            }}
            placeholder="e.g. 1001"
            min={200}
            max={3300}
            step={1}
            className={inputClasses}
            required
          />
        </div>
      </div>

      {/* Renovation Assessment (optional) */}
      <RenovationForm
        onComplete={(answers) => setRenovationAnswers(answers)}
        onSkip={() => setRenovationAnswers(null)}
        mode={mode}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={!isFormValid || isPending}
        className="w-full rounded-xl bg-forest px-4 py-4 text-[15px] font-semibold text-white transition-all duration-200 ease-out hover:bg-forest-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Analysing transactions...
          </span>
        ) : (
          mode === "sell" ? "Calculate Pricing Range" : "Calculate Offer Range"
        )}
      </button>
    </form>
  );
}
