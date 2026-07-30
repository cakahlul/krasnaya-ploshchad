import type { CallerIdentity } from '@server/auth/with-auth-or-api-key';
import type { ProductivitySummaryResponseDto } from './productivity-summary.service';
import { parseProductivitySummaryRange } from './productivity-summary-range';
import {
  generateProductivitySummaryRange,
  type MetricBasis,
  type RangeAggregationPorts,
  type ReportingGroup,
} from './productivity-summary-range.service';

type LegacyGenerator = (
  month: number,
  year: number,
  teams?: string[],
) => Promise<ProductivitySummaryResponseDto>;

export interface ProductivitySummaryHttpDependencies {
  generateLegacy: LegacyGenerator;
  rangePorts: RangeAggregationPorts;
}

type SummaryCaller = Pick<CallerIdentity, 'isLead' | 'fullName'>;
const GROUPS: readonly ReportingGroup[] = ['Loan', 'Transaction', 'User', 'Ungrouped'];

function legacyForCaller(data: ProductivitySummaryResponseDto, caller?: SummaryCaller) {
  if (!caller || caller.isLead || !caller.fullName) return data;
  return { ...data, details: data.details.filter(item => item.name === caller.fullName) };
}

function canonicalGroups(value: string | null): ReportingGroup[] | null {
  if (!value) return [...GROUPS];
  const groups = [...new Set(value.split(',').map(item => item.trim()).filter(Boolean))];
  return groups.length > 0 && groups.every((group): group is ReportingGroup => GROUPS.includes(group as ReportingGroup))
    ? groups
    : null;
}

export function parseCanonicalProductivitySummaryOptions(params: URLSearchParams):
  | { ok: true; groups: ReportingGroup[]; metricBasis: MetricBasis }
  | { ok: false; message: string } {
  const groups = canonicalGroups(params.get('groups'));
  if (!groups) return { ok: false, message: 'groups must contain only Loan, Transaction, User, or Ungrouped' };
  const metricBasis = params.get('metricBasis') ?? 'WP';
  if (metricBasis !== 'SP' && metricBasis !== 'WP') {
    return { ok: false, message: 'metricBasis must be SP or WP' };
  }
  return { ok: true, groups, metricBasis };
}

export async function handleProductivitySummaryGet(
  req: Request,
  caller: SummaryCaller | undefined,
  dependencies: ProductivitySummaryHttpDependencies,
): Promise<Response> {
  const start = Date.now();
  try {
    return await handleProductivitySummaryGetInner(req, caller, dependencies);
  } finally {
    console.log(`[telemetry] productivity-summary-http request durationMs=${Date.now() - start}`);
  }
}

async function handleProductivitySummaryGetInner(
  req: Request,
  caller: SummaryCaller | undefined,
  dependencies: ProductivitySummaryHttpDependencies,
): Promise<Response> {
  const params = new URL(req.url).searchParams;
  const parsed = parseProductivitySummaryRange(params);
  if (!parsed.ok) return Response.json({ message: parsed.message }, { status: 400 });

  if (parsed.value.kind === 'legacy') {
    const teams = params.get('teams')?.split(',').map(item => item.trim()).filter(Boolean);
    const data = await dependencies.generateLegacy(parsed.value.month, parsed.value.year, teams?.length ? teams : undefined);
    return Response.json(legacyForCaller(data, caller));
  }

  if (params.has('teams')) {
    return Response.json({ message: 'teams cannot be used with canonical range parameters' }, { status: 400 });
  }
  const options = parseCanonicalProductivitySummaryOptions(params);
  if (!options.ok) return Response.json({ message: options.message }, { status: 400 });

  const data = await generateProductivitySummaryRange({
    months: parsed.value.months,
    selectedGroups: options.groups,
    metricBasis: options.metricBasis,
  }, dependencies.rangePorts);
  if (options.metricBasis === 'WP' && data.metricBasis === 'SP') {
    return Response.json({ message: 'metricBasis WP is unavailable for archive or mixed ranges' }, { status: 400 });
  }
  if (caller?.isLead) return Response.json(data);
  const { chart: _chart, ...memberData } = data;
  return Response.json({
    ...memberData,
    details: caller?.fullName
      ? data.details.filter(item => item.name === caller.fullName)
      : [],
  });
}
