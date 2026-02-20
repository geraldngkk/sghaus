"use client";

import { useState } from "react";
import {
  RENOVATION_QUESTIONS,
  type RenovationAnswer,
} from "@/lib/renovation";

interface RenovationFormProps {
  onComplete: (answers: RenovationAnswer[]) => void;
  onSkip: () => void;
}

export default function RenovationForm({ onComplete, onSkip }: RenovationFormProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(false);

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
    onComplete(result);
  }

  if (!expanded) {
    return (
      <div className="rounded-xl border border-border bg-fog/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-charcoal">
              Flat condition assessment
            </h4>
            <p className="mt-0.5 text-xs text-slate">
              Optional — 8 quick questions to adjust your offer for renovation needs
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-lg border border-forest/20 px-3 py-1.5 text-xs font-semibold text-forest transition-colors hover:bg-mist/30"
          >
            Add Assessment
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
            Rate each area based on what you observed during viewing
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
          disabled={!allAnswered}
          className="rounded-[10px] bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply Condition Assessment
        </button>
        {!allAnswered && (
          <span className="text-xs text-slate">
            Answer all {totalCount} questions to continue
          </span>
        )}
      </div>
    </div>
  );
}
