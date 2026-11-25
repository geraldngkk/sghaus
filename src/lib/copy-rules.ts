// Brand copy rules for user-facing text: no em dashes, no double hyphen used as a dash,
// and never a named data source. Comments are stripped first because they aren't copy.

export const BANNED_SOURCE_PATTERNS: RegExp[] = [
  /data\.gov/i,
  /\bHDB data\b/i,
  /\bURA\b/,
  /\bOneMap\b/i,
  /official [a-z ]*records/i,
  /government data/i,
];

export function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
}

export interface CopyProblem {
  line: number;
  rule: string;
  text: string;
}

export function findCopyProblems(source: string, extraBanned: RegExp[] = []): CopyProblem[] {
  const problems: CopyProblem[] = [];
  const lines = stripComments(source).split("\n");
  lines.forEach((text, i) => {
    if (text.includes("—") || text.includes("&mdash;")) {
      problems.push({ line: i + 1, rule: "em dash", text: text.trim() });
    }
    if (/\s--\s/.test(text)) {
      problems.push({ line: i + 1, rule: "double hyphen used as a dash", text: text.trim() });
    }
    for (const pattern of [...BANNED_SOURCE_PATTERNS, ...extraBanned]) {
      if (pattern.test(text)) {
        problems.push({ line: i + 1, rule: `names a data source (${pattern})`, text: text.trim() });
      }
    }
  });
  return problems;
}
