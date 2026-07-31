export interface ProductivitySummaryLegacyRequest {
  kind: "legacy";
  month: number;
  year: number;
  months: [string];
}

export interface ProductivitySummaryRangeRequest {
  kind: "range";
  startMonth: string;
  endMonth: string;
  months: string[];
}

export type ProductivitySummaryRequest =
  | ProductivitySummaryLegacyRequest
  | ProductivitySummaryRangeRequest;

export type ProductivitySummaryRangeParseResult =
  | { ok: true; value: ProductivitySummaryRequest }
  | { ok: false; message: string };

interface RawRequestParams {
  get(name: string): string | null;
}

const MONTH_PATTERN = /^([1-9]\d{3})-(0[1-9]|1[0-2])$/;
const EARLIEST_MONTH = '2025-01';

function parseMonth(value: string): [number, number] | null {
  const match = MONTH_PATTERN.exec(value);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

function formatMonth(year: number, month: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

function enumerateMonths(startMonth: string, endMonth: string): string[] {
  const [startYear, startMonthNumber] = parseMonth(startMonth)!;
  const [endYear, endMonthNumber] = parseMonth(endMonth)!;
  const startIndex = startYear * 12 + startMonthNumber - 1;
  const endIndex = endYear * 12 + endMonthNumber - 1;
  const months: string[] = [];

  for (let index = startIndex; index <= endIndex; index += 1) {
    months.push(formatMonth(Math.floor(index / 12), (index % 12) + 1));
  }

  return months;
}

export function parseProductivitySummaryRange(
  params: RawRequestParams,
): ProductivitySummaryRangeParseResult {
  const month = params.get("month");
  const year = params.get("year");
  const startMonth = params.get("startMonth");
  const endMonth = params.get("endMonth");
  const hasLegacy = month !== null || year !== null;
  const hasCanonical = startMonth !== null || endMonth !== null;

  if (hasLegacy && hasCanonical) {
    return {
      ok: false,
      message: "legacy and canonical range parameters cannot be mixed",
    };
  }

  if (hasCanonical) {
    if (!startMonth || !endMonth)
      return { ok: false, message: "startMonth and endMonth are required" };
    if (!parseMonth(startMonth) || !parseMonth(endMonth)) {
      return { ok: false, message: "startMonth and endMonth must use YYYY-MM" };
    }
    if (startMonth < EARLIEST_MONTH || endMonth < EARLIEST_MONTH)
      return { ok: false, message: "date range cannot start before January 2025" };

    const months = enumerateMonths(startMonth, endMonth);
    if (months.length === 0)
      return { ok: false, message: "startMonth must not be after endMonth" };
    if (months.length > 24)
      return { ok: false, message: "range must not exceed 24 months" };
    return { ok: true, value: { kind: "range", startMonth, endMonth, months } };
  }

  if (!month || !year)
    return { ok: false, message: "month and year are required" };
  if (!/^\d+$/.test(month) || Number(month) < 1 || Number(month) > 12) {
    return { ok: false, message: "month must be an integer from 1 to 12" };
  }
  if (!/^\d{4}$/.test(year) || Number(year) === 0) {
    return { ok: false, message: "year must be a four-digit integer" };
  }

  const parsedMonth = Number(month);
  const parsedYear = Number(year);
  if (parsedYear < 2025)
    return { ok: false, message: "date range cannot start before January 2025" };
  return {
    ok: true,
    value: {
      kind: "legacy",
      month: parsedMonth,
      year: parsedYear,
      months: [formatMonth(parsedYear, parsedMonth)],
    },
  };
}
