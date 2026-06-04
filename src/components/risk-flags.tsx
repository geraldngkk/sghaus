import type { RiskFlag } from "@/types";

const severityConfig = {
  critical: {
    bg: "bg-error/5",
    border: "border-error/20",
    badge: "bg-error text-white",
  },
  high: {
    bg: "bg-amber-light",
    border: "border-amber/40",
    badge: "bg-amber text-forest-deep",
  },
  medium: {
    bg: "bg-warning/5",
    border: "border-warning/25",
    badge: "bg-warning text-forest-deep",
  },
  low: {
    bg: "bg-fog",
    border: "border-border",
    badge: "bg-slate text-white",
  },
};

interface RiskFlagsDisplayProps {
  risks: RiskFlag[];
}

export default function RiskFlagsDisplay({ risks }: RiskFlagsDisplayProps) {
  if (risks.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h3 className="font-display text-xl text-charcoal">Risk Flags</h3>
        <div className="mt-4 rounded-xl border border-meadow/20 bg-mist/30 p-4">
          <p className="text-sm text-forest">No significant risks identified.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h3 className="font-display text-xl text-charcoal">Risk Flags</h3>
      <div className="mt-4 space-y-3">
        {risks.map((risk) => {
          const config = severityConfig[risk.severity];
          return (
            <div
              key={risk.id}
              className={`rounded-xl border ${config.border} ${config.bg} p-4`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badge}`}
                >
                  {risk.severity}
                </span>
                <h4 className="text-sm font-semibold text-charcoal">{risk.title}</h4>
              </div>
              <p className="mt-1.5 text-sm text-slate">{risk.description}</p>
              <p className="mt-2 text-xs text-slate/70 leading-relaxed">{risk.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
