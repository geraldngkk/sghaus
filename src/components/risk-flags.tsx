import type { RiskFlag } from "@/types";

const severityConfig = {
  critical: {
    bg: "bg-[#EF4444]/5",
    border: "border-[#EF4444]/20",
    badge: "bg-[#EF4444] text-white",
    text: "text-[#EF4444]",
  },
  high: {
    bg: "bg-amber-light",
    border: "border-amber/30",
    badge: "bg-amber text-white",
    text: "text-amber",
  },
  medium: {
    bg: "bg-[#F59E0B]/5",
    border: "border-[#F59E0B]/20",
    badge: "bg-[#F59E0B] text-white",
    text: "text-[#F59E0B]",
  },
  low: {
    bg: "bg-fog",
    border: "border-border",
    badge: "bg-slate text-white",
    text: "text-slate",
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
                <h4 className={`text-sm font-semibold ${config.text}`}>{risk.title}</h4>
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
