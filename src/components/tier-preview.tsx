type Tone = "muted" | "primary" | "warm";

interface Tier {
  label: string;
  desc: string;
  tone: Tone;
}

const toneStyles: Record<Tone, { card: string; dot: string }> = {
  muted: { card: "border-white/12 bg-white/[0.04]", dot: "bg-mist/50" },
  primary: { card: "border-meadow/40 bg-meadow/[0.10]", dot: "bg-meadow" },
  warm: { card: "border-amber/45 bg-amber/[0.10]", dot: "bg-amber" },
};

// On-dark preview of the three-number output, shown on the buy/sell entry heroes.
// Sets the expectation before the form: this tool returns three decisive numbers.
export default function TierPreview({ tiers }: { tiers: Tier[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {tiers.map((t) => {
        const s = toneStyles[t.tone];
        return (
          <div key={t.label} className={`rounded-2xl border ${s.card} px-4 py-4`}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
              <span className="text-sm font-semibold text-white">{t.label}</span>
            </div>
            <p className="mt-1.5 text-sm leading-snug text-mist/70">{t.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
