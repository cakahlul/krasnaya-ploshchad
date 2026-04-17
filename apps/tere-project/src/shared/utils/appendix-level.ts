export type AppendixWeightPoint = 'Very Low' | 'Low' | 'Medium' | 'High';

export function parseAppendixWeightPoints(appendixText: string): AppendixWeightPoint | null {
  const match = appendixText.match(/-(Very Low|Low|Medium|High)$/);
  return match ? (match[1] as AppendixWeightPoint) : null;
}

/**
 * Checks whether a customfield_11543 option value is a meeting ticket.
 * Meeting format: "ALL-Meeting {n}-No Complexity-{n}SP"
 * Example: "ALL-Meeting 1-No Complexity-1SP"
 */
export function isMeetingAppendixValue(appendixText: string): boolean {
  return appendixText.startsWith('ALL-Meeting');
}

/**
 * Extracts the SP value from a meeting appendix string.
 * Example: "ALL-Meeting 2-No Complexity-2SP" → 2
 * Returns null if the format is not a valid meeting value.
 */
export function parseMeetingSP(appendixText: string): number | null {
  if (!isMeetingAppendixValue(appendixText)) return null;
  const match = appendixText.match(/-(\d+)SP$/);
  return match ? parseInt(match[1], 10) : null;
}
