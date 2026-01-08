export type AppendixWeightPoint = 'Very Low' | 'Low' | 'Medium' | 'High';

export function parseAppendixWeightPoints(
  appendixText: string,
): AppendixWeightPoint | null {
  const weightPattern = /-(Very Low|Low|Medium|High)$/;
  const match = appendixText.match(weightPattern);

  if (match) {
    return match[1] as AppendixWeightPoint;
  }

  return null;
}
