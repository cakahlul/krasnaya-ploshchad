import { resolveReportSource, type ReportSourceAttempt } from '@server/modules/report-source-resolver/report-source-resolver';
import type { ReportingGroup } from './productivity-summary-range.service';

export interface ProductivityMember {
  id: string;
  name: string;
  group: ReportingGroup;
  board: string;
  boards?: string[];
  spTotal: number | null;
  wpTotal: number | null;
  workingDays: number | null;
}

export interface ProductivityPeriod {
  periodEndDate: string;
  members: readonly ProductivityMember[];
}

export interface ProductivityMonthResult {
  source: 'archive' | 'snapshot' | 'jira' | 'partial' | 'unavailable';
  month: string;
  periods: number;
  members: ProductivityMember[];
  attempts?: readonly ReportSourceAttempt[];
}

export function aggregateProductivityMonth(month: string, periods: readonly ProductivityPeriod[]): ProductivityMonthResult {
  const owned = periods.filter(period => validDate(period.periodEndDate) && period.periodEndDate.slice(0, 7) === month);
  const members = new Map<string, ProductivityMember>();
  for (const period of owned) for (const item of period.members) {
    const current = members.get(item.id);
    if (!current) {
      members.set(item.id, { ...item, boards: [...(item.boards ?? [item.board])] });
      continue;
    }
    for (const board of item.boards ?? [item.board]) if (!current.boards!.includes(board)) current.boards!.push(board);
    current.spTotal = current.spTotal === null || item.spTotal === null ? null : current.spTotal + item.spTotal;
    current.wpTotal = current.wpTotal === null || item.wpTotal === null ? null : current.wpTotal + item.wpTotal;
    current.workingDays = current.workingDays === null || item.workingDays === null
      ? current.workingDays ?? item.workingDays
      : Math.max(current.workingDays, item.workingDays);
  }
  return { source: 'snapshot', month, periods: owned.length, members: [...members.values()] };
}

function validMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

export async function resolveProductivityMonth(
  month: string,
  ports: {
    archive?: () => Promise<{ periods: readonly ProductivityPeriod[]; coverage: { expected: number; covered: number; cutoff: boolean } }>;
    snapshot: () => Promise<{ periods: readonly ProductivityPeriod[]; coverage: { expected: number; covered: number; cutoff: boolean } }>;
    jira(): Promise<readonly ProductivityMember[]>;
  },
): Promise<ProductivityMonthResult> {
  const unit = { kind: 'productivity-month', month } as const;
  const attempts: ReportSourceAttempt[] = [];
  const resolveStored = async (source: 'archive' | 'snapshot', load: () => ReturnType<NonNullable<typeof ports.snapshot>>) => {
    const result = await resolveReportSource(unit, [{ source, resolve: async () => {
      if (!validMonth(month)) return { source, detail: 'INVALID_MONTH' };
      const stored = await load();
      const periods = stored.periods.filter(period => validDate(period.periodEndDate));
      const owned = periods.filter(period => period.periodEndDate.slice(0, 7) === month);
      return owned.length === 0
        ? { source, coverage: stored.coverage, detail: 'NO_COMPLETE_PERIODS_FOR_MONTH' }
        : { source, coverage: stored.coverage, value: owned };
    } }]);
    attempts.push(...result.attempts);
    return result;
  };
  if (ports.archive) {
    const archive = await resolveStored('archive', ports.archive);
    if (archive.source === 'archive') return { ...aggregateProductivityMonth(month, archive.value as ProductivityPeriod[]), source: 'archive', attempts };
  }
  const stored = await resolveStored('snapshot', ports.snapshot);
  if (stored.source === 'snapshot') return { ...aggregateProductivityMonth(month, stored.value as ProductivityPeriod[]), attempts };
  const live = await resolveReportSource(unit, [{
    source: 'jira',
    resolve: async () => ({ source: 'jira', coverage: { expected: 1, covered: 1, cutoff: false }, value: await ports.jira() }),
  }]);
  attempts.push(...live.attempts);
  if (live.source === 'jira') return { source: 'jira', month, periods: 0, members: live.value as ProductivityMember[], attempts };
  return { source: live.source === 'archive' || live.source === 'mixed' ? 'unavailable' : live.source, month, periods: 0, members: [], attempts };
}
