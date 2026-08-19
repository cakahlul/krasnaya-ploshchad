import { timingSafeEqual } from 'node:crypto';
import type { CaptureWindow, CaptureSummary, DeveloperCaptureService } from './report-capture';

const DAY = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BODY_BYTES = 8 * 1024;

export async function handleDeveloperCapturePost(
  req: Request,
  service: Pick<DeveloperCaptureService, 'capture'>,
  actor = 'System',
): Promise<Response> {
  try {
    const window = await parseWindow(req);
    if (!window) return Response.json({ message: 'Invalid capture window' }, { status: 400 });
    const summary: CaptureSummary = await service.capture(window, actor);
    return Response.json(summary);
  } catch {
    return Response.json({ message: 'Unable to capture report data' }, { status: 500 });
  }
}

export async function handleScheduledCaptureGet(
  req: Request,
  service: Pick<DeveloperCaptureService, 'capture'>,
  now = new Date(),
  cronSecret = process.env.CRON_SECRET,
): Promise<Response> {
  if (!isAuthorizedCron(req, cronSecret)) return Response.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    return Response.json(await service.capture(scheduledCaptureWindow(now), 'System'));
  } catch {
    return Response.json({ message: 'Unable to capture report data' }, { status: 500 });
  }
}

async function parseWindow(req: Request): Promise<CaptureWindow | null> {
  const mediaType = req.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (mediaType !== 'application/json') return null;
  const length = req.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) return null;
  let body: unknown;
  try {
    const raw = await readBoundedBody(req);
    if (raw === null) return null;
    body = JSON.parse(raw);
  } catch { return null; }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { startDate, endDate } = body as Record<string, unknown>;
  if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) return null;
  const span = Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`);
  return span / DAY <= 366 ? { startDate, endDate } : null;
}

async function readBoundedBody(req: Request): Promise<string | null> {
  const reader = req.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(next.value);
    }
  } catch {
    return null;
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isAuthorizedCron(req: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const authorization = req.headers.get('authorization');
  if (!authorization) return false;
  const received = Buffer.from(authorization);
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function scheduledCaptureWindow(now: Date): CaptureWindow {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find(part => part.type === 'year')?.value);
  const month = Number(parts.find(part => part.type === 'month')?.value);
  const previousYear = month === 1 ? year - 1 : year;
  const previousMonth = month === 1 ? 12 : month - 1;
  return {
    startDate: `${previousYear}-${String(previousMonth).padStart(2, '0')}-01`,
    endDate: `${year}-${String(month).padStart(2, '0')}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`,
  };
}
