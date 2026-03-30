export type AppendixWeightPoint = 'Very Low' | 'Low' | 'Medium' | 'High';

export function parseAppendixWeightPoints(appendixText: string): AppendixWeightPoint | null {
  const match = appendixText.match(/-(Very Low|Low|Medium|High)$/);
  return match ? (match[1] as AppendixWeightPoint) : null;
}
