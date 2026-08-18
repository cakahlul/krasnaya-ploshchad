import { parseProductivitySummaryRange } from './productivity-summary-range';
import {
  generateProductivitySummaryRange,
  type RangeAggregationPorts,
} from './productivity-summary-range.service';
import { parseCanonicalProductivitySummaryOptions } from './productivity-summary-http';
import {
  exportProductivitySummaryRangeToSpreadsheet,
  exportProductivitySummaryToSpreadsheet,
  type ProductivitySummaryRangeResponse,
} from './productivity-summary.service';

interface ExportDependencies {
  rangePorts?: RangeAggregationPorts;
  generateRange?: typeof generateProductivitySummaryRange;
  exportLegacy?: typeof exportProductivitySummaryToSpreadsheet;
  exportRange?: (data: ProductivitySummaryRangeResponse, accessToken: string) => Promise<unknown>;
}

function csv(value: unknown): string[] | undefined {
  return typeof value === 'string' ? value.split(',').map(item => item.trim()).filter(Boolean) : undefined;
}

export async function handleProductivitySummaryExportPost(req: Request, deps: ExportDependencies = {}) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: 'invalid JSON body' }, { status: 400 });
  }

  const accessToken = typeof body.accessToken === 'string' ? body.accessToken : '';
  const hasLegacy = body.month != null || body.year != null;
  const hasCanonical = body.startMonth != null || body.endMonth != null;
  const params = new URLSearchParams();
  for (const field of ['month', 'year', 'startMonth', 'endMonth', 'groups', 'metricBasis'] as const)
    if (body[field] != null) params.set(field, String(body[field]));
  const parsed = parseProductivitySummaryRange(params);

  if (!accessToken)
    return Response.json({ message: hasCanonical ? 'startMonth, endMonth, and accessToken are required' : 'month, year, and accessToken are required' }, { status: 400 });
  if (!parsed.ok) return Response.json({ message: parsed.message }, { status: 400 });

  if (parsed.value.kind === 'legacy') {
    const teams = csv(body.teams);
    try {
      const result = await (deps.exportLegacy ?? exportProductivitySummaryToSpreadsheet)(parsed.value.month, parsed.value.year, accessToken, teams);
      return Response.json({ ...result, sourceMetadata: {
        source: 'jira', coverage: { status: 'complete', expected: 1, covered: 1 }, fallback: false,
        reason: null, warning: null, attemptedSources: [{ source: 'jira', detail: null }], snapshotTimestamp: null,
      } });
    } catch (error) {
      return Response.json({ message: error instanceof Error ? error.message : 'Export failed' }, { status: 500 });
    }
  }

  if (hasLegacy && hasCanonical)
    return Response.json({ message: 'legacy and canonical range parameters cannot be mixed' }, { status: 400 });
  if (body.teams != null)
    return Response.json({ message: 'teams cannot be used with canonical range parameters' }, { status: 400 });
  const options = parseCanonicalProductivitySummaryOptions(params);
  if (!options.ok) return Response.json({ message: options.message }, { status: 400 });
  if (!deps.rangePorts)
    return Response.json({ message: 'canonical productivity export is not configured' }, { status: 503 });

  try {
    const data = await (deps.generateRange ?? generateProductivitySummaryRange)({
      months: parsed.value.months,
      selectedGroups: options.groups,
      metricBasis: options.metricBasis,
    }, deps.rangePorts);
    if (options.metricBasis === 'WP' && data.metricBasis === 'SP')
      return Response.json({ message: 'metricBasis WP is unavailable for archive or mixed ranges' }, { status: 400 });
    return Response.json(await (deps.exportRange ?? exportProductivitySummaryRangeToSpreadsheet)(data, accessToken));
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : 'Export failed' }, { status: 500 });
  }
}
