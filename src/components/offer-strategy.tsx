import type { OfferStrategy } from "@/types";
import CountUp from "@/components/count-up";

function formatPsf(value: number): string {
  if (value === 0) return "--";
  return `$${value.toFixed(0)} psf`;
}

interface OfferCardProps {
  label: string;
  sublabel: string;
  price: number;
  psf: number;
  rationale: string;
  variant: "low" | "mid" | "max";
}

function OfferCard({ label, sublabel, price, psf, rationale, variant }: OfferCardProps) {
  const styles = {
    low: {
      card: "border-border bg-white",
      price: "text-charcoal",
      tag: "bg-mist text-forest",
      accent: "bg-border",
    },
    mid: {
      card: "border-forest/30 bg-forest/[0.03] ring-1 ring-forest/10",
      price: "text-forest",
      tag: "bg-forest text-white",
      accent: "bg-forest",
    },
    max: {
      card: "border-amber/40 bg-amber-light/20",
      price: "text-charcoal",
      tag: "bg-amber text-forest-deep",
      accent: "bg-amber",
    },
  };
  const s = styles[variant];
  const isMid = variant === "mid";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 ${s.card} p-6 transition-shadow duration-200 hover:shadow-[var(--shadow-sm)] sm:p-7 ${
        isMid ? "sm:scale-[1.02] sm:shadow-[var(--shadow-sm)]" : ""
      }`}
    >
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 h-1 w-full ${s.accent}`} />

      <div className="flex items-center gap-2">
        <span
          className={`inline-block rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${s.tag}`}
        >
          {label}
        </span>
        {isMid && (
          <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest">
            Recommended
          </span>
        )}
      </div>

      {/* THE NUMBER:heavy grotesque, tabular, counts into place */}
      <div className="mt-4">
        <div
          className={`price-display leading-none ${s.price} ${
            isMid
              ? "text-[2.75rem] font-bold sm:text-[3.5rem]"
              : "text-[2.25rem] sm:text-[2.75rem]"
          }`}
        >
          {price > 0 ? <CountUp value={price} prefix="$" /> : "--"}
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-slate tabular-nums">
          <span className="font-medium">{formatPsf(psf)}</span>
          <span className="text-border">&middot;</span>
          <span>{sublabel}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-border/60 pt-4">
        <p className="text-sm text-slate leading-relaxed">{rationale}</p>
      </div>
    </div>
  );
}

interface OfferStrategyDisplayProps {
  offer: OfferStrategy;
  compCount: number;
  town: string;
}

export default function OfferStrategyDisplay({
  offer,
  compCount,
  town,
}: OfferStrategyDisplayProps) {
  return (
    <div>
      <div className="flex items-end justify-between">
        <h2 className="font-display text-2xl text-charcoal sm:text-[2rem]">
          Here&apos;s what you should offer
        </h2>
        <p className="hidden text-sm text-slate sm:block">
          Based on <span className="font-medium text-charcoal">{compCount}</span>{" "}
          comparable sales in{" "}
          <span className="font-medium text-charcoal">{town}</span>
        </p>
      </div>
      <p className="mt-1 text-sm text-slate sm:hidden">
        Based on {compCount} comparable sales in {town}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <OfferCard
          label="Opening Bid"
          sublabel="Start here"
          price={offer.low}
          psf={offer.lowPsf}
          rationale={offer.lowRationale}
          variant="low"
        />
        <OfferCard
          label="Target Price"
          sublabel="Aim for this"
          price={offer.mid}
          psf={offer.midPsf}
          rationale={offer.midRationale}
          variant="mid"
        />
        <OfferCard
          label="Hard Ceiling"
          sublabel="Walk away above"
          price={offer.max}
          psf={offer.maxPsf}
          rationale={offer.maxRationale}
          variant="max"
        />
      </div>

      {offer.walkAwayTriggers.length > 0 && (
        <div className="mt-6 rounded-xl border border-error/20 bg-error/5 p-4">
          <h3 className="text-sm font-semibold text-error">
            Walk-Away Triggers
          </h3>
          <ul className="mt-2 space-y-1.5">
            {offer.walkAwayTriggers.map((trigger, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-charcoal"
              >
                <span className="mt-0.5 shrink-0 text-xs text-error">&bull;</span>
                <span>{trigger}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
