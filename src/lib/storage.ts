import type { AnalysisResult } from "@/types";

/** A saved analysis with metadata */
export interface SavedAnalysis {
  id: string;
  label: string;
  savedAt: string; // ISO string
  input: AnalysisResult["input"];
  result: AnalysisResult;
}

const STORAGE_KEY = "sghaus_saved_analyses";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Get all saved analyses, newest first */
export function getSavedAnalyses(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAnalysis[];
    return parsed.sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  } catch {
    return [];
  }
}

/** Save an analysis. Returns the new SavedAnalysis. */
export function saveAnalysis(
  result: AnalysisResult,
  label?: string
): SavedAnalysis {
  const existing = getSavedAnalyses();
  const defaultLabel = `${result.input.flatType} — ${result.input.streetName}, ${result.input.town}`;
  const saved: SavedAnalysis = {
    id: generateId(),
    label: label || defaultLabel,
    savedAt: new Date().toISOString(),
    input: result.input,
    result,
  };
  existing.unshift(saved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return saved;
}

/** Delete a saved analysis by ID */
export function deleteAnalysis(id: string): void {
  const existing = getSavedAnalyses();
  const filtered = existing.filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/** Get a single saved analysis by ID */
export function getAnalysis(id: string): SavedAnalysis | undefined {
  return getSavedAnalyses().find((a) => a.id === id);
}

/** Update the label of a saved analysis */
export function updateLabel(id: string, newLabel: string): void {
  const existing = getSavedAnalyses();
  const item = existing.find((a) => a.id === id);
  if (item) {
    item.label = newLabel;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }
}
