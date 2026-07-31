import { getAuth } from 'firebase/auth';

export const NDJSON_MEDIA_TYPE = 'application/x-ndjson';

export type SummaryChartPoint = {
  month: string;
  source: string;
  metricBasis: 'SP' | 'WP';
  activeMembers: number | null;
  productivityMetric: number | null;
  productivityPercent: number | null;
  spTotal: number | null;
  spTarget: number | null;
  bugsRaised: number | null;
  bugsTotal: number | null;
  bugsDone: number | null;
};

export type SummaryStreamEvent =
  | { type: 'point'; completed: number; total: number; point: SummaryChartPoint }
  | { type: 'month'; completed: number; total: number; month: string; source: string }
  | { type: 'complete'; data: unknown }
  | { type: 'error'; status: number; message: string };

/**
 * Splits an NDJSON body into whole lines, holding back the trailing partial line until the chunk
 * that completes it arrives. A chunk boundary can land mid-object, so parsing per chunk would
 * throw on perfectly valid output.
 */
export function createNdjsonParser(onEvent: (event: SummaryStreamEvent) => void) {
  let buffer = '';
  return {
    push(chunk: string) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.trim()) onEvent(JSON.parse(line) as SummaryStreamEvent);
      }
    },
    flush() {
      if (buffer.trim()) onEvent(JSON.parse(buffer) as SummaryStreamEvent);
      buffer = '';
    },
  };
}

export async function streamProductivitySummary(
  params: Record<string, string>,
  onEvent: (event: SummaryStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = await getAuth().currentUser?.getIdToken();
  const response = await fetch(`/api/report/productivity-summary?${new URLSearchParams(params)}`, {
    headers: {
      accept: NDJSON_MEDIA_TYPE,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });

  if (!response.ok) {
    const message = await response.json().catch(() => null);
    onEvent({
      type: 'error',
      status: response.status,
      message: message?.message ?? 'Unable to load productivity data. Please try again.',
    });
    return;
  }

  if (!response.body) throw new Error('Streaming is unavailable in this browser.');

  const parser = createNdjsonParser(onEvent);
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(value);
  }
  parser.flush();
}
