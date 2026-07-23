export interface FormOption<Value extends string = string> {
  value: Value;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SingleSelectionControls<Value extends string> {
  open: boolean;
  query: string;
  value: Value | '';
}

export interface MultiSelectionControls<Value extends string> {
  open: boolean;
  query: string;
  value: readonly Value[];
}

export interface FormActionState {
  disabled?: boolean;
  readOnly?: boolean;
  actionDisabled?: boolean;
  pending?: boolean;
}

export type ActiveMovement = 'next' | 'previous' | 'first' | 'last';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

function parseIsoDate(value: string): [year: number, month: number, day: number] | undefined {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return undefined;
  const parts = match.slice(1).map(Number) as [number, number, number];
  const [year, month, day] = parts;
  if (year < 1 || month < 1 || month > 12 || day < 1) return undefined;

  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? parts
    : undefined;
}

function parseIsoMonth(value: string): [year: number, month: number] | undefined {
  const match = ISO_MONTH_PATTERN.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return year >= 1 && month >= 1 && month <= 12 ? [year, month] : undefined;
}

export function filterOptions<Value extends string>(
  options: readonly FormOption<Value>[],
  query: string,
): readonly FormOption<Value>[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return options;
  return options.filter((option) =>
    `${option.label} ${option.description ?? ''}`.toLocaleLowerCase().includes(normalized),
  );
}

export function singleSelectionSessionTransition<Value extends string>(
  previous: SingleSelectionControls<Value>,
  next: SingleSelectionControls<Value>,
  options: readonly FormOption<Value>[],
): { search: string; active: Value | undefined } | undefined {
  if (
    previous.open === next.open &&
    previous.query === next.query &&
    previous.value === next.value
  ) {
    return undefined;
  }
  if (!next.open) return { search: next.query, active: undefined };

  const visibleOptions = filterOptions(options, next.query);
  const selected = visibleOptions.find(
    (option) => option.value === next.value && !option.disabled,
  );
  return {
    search: next.query,
    active: selected?.value ?? moveActiveOption(visibleOptions, undefined, 'first'),
  };
}

export function multiSelectionSessionTransition<Value extends string>(
  previous: MultiSelectionControls<Value>,
  next: MultiSelectionControls<Value>,
  options: readonly FormOption<Value>[],
  staged: boolean,
):
  | { search: string; active: Value | undefined; draft: readonly Value[] | null }
  | undefined {
  const sameValue =
    previous.value.length === next.value.length &&
    previous.value.every((value, index) => value === next.value[index]);
  if (
    previous.open === next.open &&
    previous.query === next.query &&
    sameValue
  ) {
    return undefined;
  }
  if (!next.open) {
    return { search: next.query, active: undefined, draft: null };
  }

  return {
    search: next.query,
    active: moveActiveOption(filterOptions(options, next.query), undefined, 'first'),
    draft: staged ? next.value : null,
  };
}

export function moveActiveOption<Value extends string>(
  options: readonly FormOption<Value>[],
  currentValue: Value | undefined,
  movement: ActiveMovement,
): Value | undefined {
  const enabled = options.filter((option) => !option.disabled);
  if (enabled.length === 0) return undefined;
  if (movement === 'first') return enabled[0].value;
  if (movement === 'last') return enabled.at(-1)?.value;

  const currentIndex = enabled.findIndex((option) => option.value === currentValue);
  if (currentIndex < 0) {
    return movement === 'previous' ? enabled.at(-1)?.value : enabled[0].value;
  }
  const offset = movement === 'next' ? 1 : -1;
  return enabled[Math.max(0, Math.min(enabled.length - 1, currentIndex + offset))].value;
}

export function toggleSelection<Value extends string>(
  selected: readonly Value[],
  value: Value,
): readonly Value[] {
  return selected.includes(value)
    ? selected.filter((selectedValue) => selectedValue !== value)
    : [...selected, value];
}

export function selectionTransition<Value extends string>(
  nextValue: readonly Value[],
  staged: boolean,
):
  | { draft: readonly Value[]; commit?: never }
  | { draft: null; commit: readonly Value[] } {
  return staged ? { draft: nextValue } : { draft: null, commit: nextValue };
}

export function commitStagedSelection<Value extends string>(
  controlledValue: readonly Value[],
  draft: readonly Value[] | null,
): readonly Value[] {
  return draft ?? controlledValue;
}

export function movementForKey(key: string): ActiveMovement | undefined {
  if (key === 'ArrowDown') return 'next';
  if (key === 'ArrowUp') return 'previous';
  if (key === 'Home') return 'first';
  if (key === 'End') return 'last';
  return undefined;
}

export function sourceFromClickDetail(detail: number): 'keyboard' | 'pointer' {
  return detail === 0 ? 'keyboard' : 'pointer';
}

export function selectionValidityMessage(
  label: string,
  error: string | undefined,
  required: boolean | undefined,
  selectedCount: number,
): string {
  return error ?? (required && selectedCount === 0 ? `${label} is required.` : '');
}

export function formActionDisabled(state: FormActionState): boolean {
  return Boolean(
    state.disabled ||
      state.readOnly ||
      state.actionDisabled ||
      state.pending,
  );
}

export function runFormAction(
  state: FormActionState,
  callback: () => void,
): boolean {
  if (formActionDisabled(state)) return false;
  callback();
  return true;
}

export function validateIsoDate(value: string, min?: string, max?: string): string | undefined {
  if (!value) return undefined;
  if (!parseIsoDate(value)) return 'Enter a valid date in YYYY-MM-DD format.';
  if (min && parseIsoDate(min) && value < min) return `Date must be on or after ${min}.`;
  if (max && parseIsoDate(max) && value > max) return `Date must be on or before ${max}.`;
  return undefined;
}

export function validateIsoMonth(value: string, min?: string, max?: string): string | undefined {
  if (!value) return undefined;
  if (!parseIsoMonth(value)) return 'Enter a valid month in YYYY-MM format.';
  if (min && parseIsoMonth(min) && value < min) return `Month must be on or after ${min}.`;
  if (max && parseIsoMonth(max) && value > max) return `Month must be on or before ${max}.`;
  return undefined;
}

export function validateDateRange(value: {
  start: string;
  end: string;
}): string | undefined {
  const startError = validateIsoDate(value.start);
  if (startError) return `Start date: ${startError}`;
  const endError = validateIsoDate(value.end);
  if (endError) return `End date: ${endError}`;
  if (value.start && value.end && value.start > value.end) {
    return 'Start date must not be after end date.';
  }
  return undefined;
}

export function formatIsoDate(value: string, locale?: string): string {
  const parts = parseIsoDate(value);
  if (!parts) return '';
  const [year, month, day] = parts;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date);
}

export function formatIsoMonth(value: string, locale?: string): string {
  const parts = parseIsoMonth(value);
  if (!parts) return '';
  const [year, month] = parts;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
