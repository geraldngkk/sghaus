import type { ChecklistItem } from "@/types";

const assessmentConfig = {
  positive: {
    icon: "\u2713",
    iconBg: "bg-forest/10 text-forest",
    bg: "bg-mist/20",
    border: "border-meadow/30",
  },
  neutral: {
    icon: "\u2013",
    iconBg: "bg-amber-light text-amber-ink",
    bg: "bg-amber-light/40",
    border: "border-amber/30",
  },
  negative: {
    icon: "\u2717",
    iconBg: "bg-error/10 text-error",
    bg: "bg-error/5",
    border: "border-error/20",
  },
};

interface DecisionChecklistProps {
  checklist: ChecklistItem[];
}

export default function DecisionChecklist({ checklist }: DecisionChecklistProps) {
  const positiveCount = checklist.filter((c) => c.assessment === "positive").length;
  const negativeCount = checklist.filter((c) => c.assessment === "negative").length;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h3 className="font-display text-xl text-charcoal">Decision Checklist</h3>
      <p className="mt-1 text-sm text-slate">
        {positiveCount} positive, {checklist.length - positiveCount - negativeCount} neutral,{" "}
        {negativeCount} negative
      </p>

      <div className="mt-5 space-y-2.5">
        {checklist.map((item, i) => {
          const config = assessmentConfig[item.assessment];
          return (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl border ${config.border} ${config.bg} px-4 py-3`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${config.iconBg}`}
              >
                {config.icon}
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate">
                  {item.category}
                </span>
                <p className="text-sm font-medium text-charcoal">{item.question}</p>
                <p className="mt-0.5 text-xs text-slate leading-relaxed">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
