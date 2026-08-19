import type { CallerIdentity } from '@server/auth/with-auth-or-api-key';
import type { ProductivitySummaryResponseDto } from './productivity-summary.service';
import { parseProductivitySummaryRange } from './productivity-summary-range';
import {
  generateProductivitySummaryRange,
  type MetricBasis,
  type RangeAggregationPorts,
  type ReportingGroup,
} from './productivity-summary-range.service';
import { metadataProvenance, monthProvenance } from './productivity-summary-provenance';

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
export const NDJSON_MEDIA_TYPE = 'application/x-ndjson';
const BASIS_CONFLICT = 'metricBasis WP is unavailable for archive or mixed ranges';

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

  const input = {
    months: parsed.value.months,
    selectedGroups: options.groups,
    metricBasis: options.metricBasis,
  };

  if (req.headers.get('accept')?.includes(NDJSON_MEDIA_TYPE)) {
    return streamCanonical(input, options.metricBasis, caller, dependencies);
  }

  const data = await generateProductivitySummaryRange(input, dependencies.rangePorts);
  if (options.metricBasis === 'WP' && data.metricBasis === 'SP') {
    return Response.json({ message: BASIS_CONFLICT }, { status: 400 });
  }
  return Response.json(canonicalForCaller(data, caller));
}

type CanonicalRange = Awaited<ReturnType<typeof generateProductivitySummaryRange>>;

function canonicalForCaller(data: CanonicalRange, caller?: SummaryCaller) {
  const withProvenance = {
    ...data,
    provenance: metadataProvenance(data.sourceMetadata),
    coverage: {
      ...data.coverage,
      months: data.coverage.months.map(month => ({ ...month, ...monthProvenance(month) })),
    },
    chart: data.chart.map(point => ({ ...point, ...monthProvenance(point) })),
    details: data.details.map(member => ({
      ...member,
      monthly: member.monthly.map(month => ({ ...month, ...monthProvenance(month) })),
    })),
  };
  if (caller?.isLead) return withProvenance;
  const { chart: _chart, ...memberData } = withProvenance;
  return {
    ...memberData,
    provenance: metadataProvenance(data.sourceMetadata),
    details: caller?.fullName
      ? withProvenance.details.filter(item => item.name === caller.fullName)
      : [],
  };
}

/**
 * Same URL and same params as the JSON response — only clients that ask for NDJSON get the stream,
 * so legacy callers and the MCP tool are untouched. Months are published as they resolve so an
 * archive-heavy range paints long before a live month finishes.
 */
function streamCanonical(
  input: Parameters<typeof generateProductivitySummaryRange>[0],
  requestedBasis: MetricBasis,
  caller: SummaryCaller | undefined,
  dependencies: ProductivitySummaryHttpDependencies,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const data = await generateProductivitySummaryRange(input, dependencies.rangePorts, (event) => {
          // A non-Lead caller never receives the chart, so they get progress without values.
          if (!caller?.isLead) {
            send(event.type === 'month'
              ? { ...event, ...monthProvenance(event) }
              : {
                type: 'month',
                completed: event.completed,
                total: event.total,
                month: event.point.month,
                source: event.point.source,
                ...monthProvenance(event.point),
              });
            return;
          }
          // The request is about to fail the basis check; publishing SP points under a WP request
          // would put two units on one axis before the error lands.
          if (requestedBasis === 'WP' && event.type === 'point' && event.point.metricBasis === 'SP') return;
          send(event.type === 'point'
            ? { ...event, point: { ...event.point, ...monthProvenance(event.point) } }
            : { ...event, ...monthProvenance(event) });
        });
        send(requestedBasis === 'WP' && data.metricBasis === 'SP'
          ? { type: 'error', status: 400, message: BASIS_CONFLICT }
          : { type: 'complete', data: canonicalForCaller(data, caller) });
      } catch (error) {
        console.error('productivity summary stream failed:', error);
        send({ type: 'error', status: 500, message: 'Unable to build the productivity summary.' });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      'content-type': `${NDJSON_MEDIA_TYPE}; charset=utf-8`,
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
    },
  });
}
