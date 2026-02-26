"use client";

import { useState } from "react";
import {
  RENOVATION_QUESTIONS,
  type RenovationAnswer,
} from "@/lib/renovation";

interface RenovationFormProps {
  onComplete: (answers: RenovationAnswer[]) => void;
  onSkip: () => void;
  /** Controls copy tone: buyer sees "offer" language, seller sees "pricing" language */
  mode?: "buy" | "sell";
}

export default function RenovationForm({ onComplete, onSkip, mode = "buy" }: RenovationFormProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(false);
  const [applied, setApplied] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const totalCount = RENOVATION_QUESTIONS.length;
  const allAnswered = answeredCount === totalCount;

  function selectOption(questionId: string, optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function handleSubmit() {
    const result: RenovationAnswer[] = RENOVATION_QUESTIONS.map((q) => {
      const idx = answers[q.id] ?? 0;
      const option = q.options[idx];
      return {
        questionId: q.id,
        selectedScore: option.score,
        selectedCostLow: option.costImpact.low,
        selectedCostHigh: option.costImpact.high,
      };
    });
    setApplied(true);
    onComplete(result);
  }

  if (!expanded) {
    return (
      <div className="group rounded-xl border border-forest/15 bg-gradient-to-r from-mist/20 to-fog/40 p-4 transition-all hover:border-forest/25 hover:from-mist/30">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-charcoal">
              {mode === "sell"
                ? "Your pricing could be off by $10,000+"
                : "Your offer could be off by $10,000+"}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-slate">
              {mode === "sell"
                ? "Right now, your numbers assume average condition. A 2-minute self-assessment adjusts your pricing based on your flat's actual state."
                : "Right now, your numbers assume average condition. A 2-minute check based on what you saw during viewing adjusts your offer for renovation reality."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="shrink-0 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-forest/90 hover:shadow-md"
          >
            {mode === "sell" ? "Refine Pricing" : "Refine Offer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-charcoal">
            Flat condition ({answeredCount}/{totalCount})
          </h4>
          <p className="mt-0.5 text-xs text-slate">
            {mode === "sell"
              ? "Rate each area honestly to get the most accurate pricing"
              : "Rate each area based on what you observed during viewing"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            onSkip();
          }}
          className="text-xs text-slate hover:text-charcoal"
        >
          Skip
        </button>
      </div>

      <div className="mt-4 space-y-5">
        {RENOVATION_QUESTIONS.map((q) => {
          const selectedIdx = answers[q.id];
          return (
            <div key={q.id}>
              <p className="text-sm font-medium text-charcoal">{q.question}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {q.options.map((opt, idx) => {
                  const isSelected = selectedIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectOption(q.id, idx)}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                        isSelected
                          ? "border-forest bg-mist/40 text-forest font-medium"
                          : "border-border bg-white text-slate hover:border-slate hover:text-charcoal"
                      }`}
                    >
                      <span className="block font-medium">{opt.label}</span>
                      <span className="mt-0.5 block text-[10px] leading-tight opacity-70">
                        {opt.description.length > 60
                          ? opt.description.slice(0, 57) + "..."
                          : opt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || applied}
          className={`rounded-[10px] px-5 py-2.5 text-sm font-semibold transition-colors ${
            applied
              ? "bg-slate/30 text-slate cursor-not-allowed"
              : "bg-forest text-white hover:bg-forest/90 disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {applied ? "Assessment Applied" : "Apply Condition Assessment"}
        </button>
        {applied ? (
          <span className="text-xs font-medium text-emerald-600">
            {mode === "sell"
              ? "Condition factored into your pricing"
              : "Condition factored into your offer prices"}
          </span>
        ) : !allAnswered ? (
          <span className="text-xs text-slate">
            Answer all {totalCount} questions to continue
          </span>
        ) : null}
      </div>
    </div>
  );
}
