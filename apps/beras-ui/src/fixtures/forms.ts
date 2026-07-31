import type {
  AsyncViewState,
  BerasOption,
  DateRangeValue,
} from '@krasnaya/beras-ui/types';

export const FORM_CASE_IDS = [
  'form/combobox/empty',
  'form/combobox/populated',
  'form/combobox/search',
  'form/combobox/selection',
  'form/combobox/clear',
  'form/combobox/disabled',
  'form/combobox/long-options',
  'form/sprint-combobox/empty',
  'form/sprint-combobox/populated',
  'form/sprint-combobox/search',
  'form/sprint-combobox/selection',
  'form/sprint-combobox/disabled',
  'form/sprint-combobox/long-options',
  'form/sprint-multiselect/empty',
  'form/sprint-multiselect/populated',
  'form/sprint-multiselect/search',
  'form/sprint-multiselect/partial',
  'form/sprint-multiselect/all',
  'form/sprint-multiselect/draft',
  'form/sprint-multiselect/disabled',
  'form/sprint-multiselect/long-options',
  'form/team-multiselect/empty',
  'form/team-multiselect/populated',
  'form/team-multiselect/search',
  'form/team-multiselect/partial',
  'form/team-multiselect/all',
  'form/team-multiselect/draft',
  'form/team-multiselect/disabled',
  'form/team-multiselect/long-options',
  'form/epic-multiselect/loading',
  'form/epic-multiselect/empty',
  'form/epic-multiselect/error',
  'form/epic-multiselect/populated',
  'form/epic-multiselect/search',
  'form/epic-multiselect/partial',
  'form/epic-multiselect/draft',
  'form/epic-multiselect/long-options',
  'form/team-select/empty',
  'form/team-select/populated',
  'form/team-select/selection',
  'form/team-select/disabled',
  'form/team-select/long-options',
  'form/project-combobox/loading',
  'form/project-combobox/empty',
  'form/project-combobox/error',
  'form/project-combobox/populated',
  'form/project-combobox/search',
  'form/project-combobox/selection',
  'form/epic-search/idle',
  'form/epic-search/loading',
  'form/epic-search/empty',
  'form/epic-search/error',
  'form/epic-search/populated',
  'form/epic-search/long-options',
  'form/global-search/idle',
  'form/global-search/loading',
  'form/global-search/empty',
  'form/global-search/error',
  'form/global-search/populated',
  'form/global-search/detail-open',
  'form/global-search/long-content',
  'form/date-range-field/empty',
  'form/date-range-field/populated',
  'form/date-range-field/preset',
  'form/date-range-field/custom',
  'form/date-range-field/validation',
  'form/date-range-field/disabled',
  'form/date-range-field/narrow',
  'form/month-field/empty',
  'form/month-field/populated',
  'form/month-field/disabled',
  'form/month-field/validation',
  'form/report-filter-bar/default',
  'form/report-filter-bar/partial',
  'form/report-filter-bar/complete',
  'form/report-filter-bar/disabled',
  'form/report-filter-bar/narrow',
  'form/report-filter-bar/overflow',
  'form/tree-controls/default',
  'form/tree-controls/populated',
  'form/tree-controls/disabled',
  'form/tree-controls/narrow',
  'form/json-import/empty',
  'form/json-import/validation',
  'form/json-import/ready',
  'form/json-import/pending',
  'form/json-import/success',
  'form/json-import/failure',
  'form/segmented-control/default',
  'form/segmented-control/selection',
  'form/segmented-control/disabled',
  'form/text-field/default',
  'form/text-field/error',
  'form/text-field/disabled',
  'form/text-area-field/default',
  'form/text-area-field/error',
  'form/text-area-field/disabled',
  'form/switch-field/default',
  'form/switch-field/disabled',
  'form/checkbox-field/default',
  'form/checkbox-field/disabled',
  'form/date-field/default',
  'form/date-field/validation',
  'form/date-field/disabled',
  'form/field-group/default',
] as const;

export type FormCaseId = (typeof FORM_CASE_IDS)[number];

export interface FormCaseFixture {
  id: FormCaseId;
  slug: string;
  variant: string;
  label: string;
  helperText: string;
  disabled: boolean;
  error?: string;
  open: boolean;
  query: string;
  options: AsyncViewState<readonly BerasOption[]>;
  singleValue: string;
  multiValue: readonly string[];
  staged: boolean;
  textValue: string;
  checked: boolean;
  dateValue: string;
  monthValue: string;
  rangeValue: DateRangeValue;
  statusMessage?: string;
}

const teamOptions: readonly BerasOption[] = [
  { value: 'platform', label: 'Platform Engineering', description: 'Core product platform' },
  { value: 'payments', label: 'Payments', description: 'Money movement' },
  { value: 'risk', label: 'Risk and Compliance', description: 'Controls and assurance' },
  { value: 'retired', label: 'Retired team', description: 'Unavailable', disabled: true },
];

const sprintOptions: readonly BerasOption[] = [
  {
    value: 'sprint-42',
    label: 'Sprint 42 · 1–14 July 2026',
    description: 'Active sprint',
  },
  {
    value: 'sprint-43',
    label: 'Sprint 43 · 15–28 July 2026',
    description: 'Planned sprint',
  },
  {
    value: 'sprint-archive',
    label: 'Sprint archive',
    description: 'Unavailable',
    disabled: true,
  },
];

const epicOptions: readonly BerasOption[] = [
  {
    value: 'BERAS-101',
    label: 'BERAS-101 · Accessible form controls',
    description: 'In progress · Platform',
  },
  {
    value: 'BERAS-118',
    label: 'BERAS-118 · Catalog evidence',
    description: 'To do · Quality',
  },
  {
    value: 'BERAS-099',
    label: 'BERAS-099 · Retired experiment',
    description: 'Unavailable',
    disabled: true,
  },
];

const projectOptions: readonly BerasOption[] = [
  { value: 'beras', label: 'Beras UI', description: 'Design system package' },
  { value: 'tere', label: 'Tere', description: 'Internal engineering dashboard' },
  { value: 'archive', label: 'Archived project', disabled: true },
];

const searchOptions: readonly BerasOption[] = [
  {
    value: 'BERAS-106',
    label: 'BERAS-106 · Form selection and date controls',
    description: 'Platform · In progress',
  },
  {
    value: 'BERAS-117',
    label: 'BERAS-117 · Responsive evidence integration',
    description: 'Quality · To do',
  },
  {
    value: 'BERAS-090',
    label: 'BERAS-090 · Closed migration spike',
    description: 'Unavailable',
    disabled: true,
  },
];

const longOptions: readonly BerasOption[] = [
  {
    value: 'long-platform',
    label:
      'Platform Engineering — shared runtime, developer experience, accessibility, observability, and release enablement',
    description:
      'Long accessible label remains complete even when the visual presentation must truncate.',
  },
  {
    value: 'long-payments',
    label:
      'Payments Operations — domestic transfers, international settlements, reconciliation, and exception handling',
    description: 'Second long option for narrow and overflow verification.',
  },
  { value: 'long-disabled', label: 'Long unavailable option', disabled: true },
];

function optionsFor(slug: string, variant: string): readonly BerasOption[] {
  if (variant === 'long-options' || variant === 'long-content' || variant === 'overflow') {
    return longOptions;
  }
  if (slug.includes('sprint')) return sprintOptions;
  if (slug.includes('epic')) return epicOptions;
  if (slug.includes('project')) return projectOptions;
  if (slug.includes('global-search')) return searchOptions;
  return teamOptions;
}

function asyncState(
  slug: string,
  variant: string,
): AsyncViewState<readonly BerasOption[]> {
  if (variant === 'loading') return { status: 'loading', label: 'Loading options…' };
  if (variant === 'empty') {
    return {
      status: 'empty',
      title: 'No options available',
      description: 'Try a different search or filter.',
    };
  }
  if (variant === 'error') {
    return {
      status: 'error',
      title: 'Options unavailable',
      description: 'The deterministic fixture represents a failed data source.',
    };
  }
  return { status: 'ready', data: optionsFor(slug, variant) };
}

function isOpenVariant(variant: string): boolean {
  return [
    'loading',
    'empty',
    'error',
    'populated',
    'search',
    'partial',
    'all',
    'draft',
    'long-options',
    'long-content',
  ].includes(variant);
}

function queryFor(slug: string, variant: string): string {
  if (variant !== 'search') return '';
  if (slug.includes('sprint')) return 'sprint';
  if (slug.includes('epic')) return 'BERAS';
  if (slug.includes('project')) return 'Beras';
  if (slug.includes('global')) return 'form';
  return 'platform';
}

function createFixture(id: FormCaseId): FormCaseFixture {
  const [, slug, variant] = id.split('/');
  const options = asyncState(slug, variant);
  const readyOptions = options.status === 'ready' ? options.data : [];
  const enabledValues = readyOptions
    .filter((option) => !option.disabled)
    .map((option) => option.value);
  const selectedSingle = [
    'populated',
    'selection',
    'clear',
    'detail-open',
    'complete',
  ].includes(variant)
    ? (enabledValues[0] ?? '')
    : '';
  const selectedMulti =
    variant === 'all'
      ? enabledValues
      : ['populated', 'partial', 'draft'].includes(variant)
        ? enabledValues.slice(0, variant === 'populated' ? 2 : 1)
        : [];
  const rangeValue =
    variant === 'empty' || (slug === 'report-filter-bar' && variant === 'default')
      ? { start: '', end: '' }
      : variant === 'validation'
        ? { start: '2026-07-31', end: '2026-07-01' }
        : slug === 'report-filter-bar' && variant === 'partial'
          ? { start: '2026-07-01', end: '' }
        : variant === 'custom'
          ? { start: '2026-07-08', end: '2026-07-19' }
          : { start: '2026-07-01', end: '2026-07-31' };
  const statusMessage =
    slug === 'json-import'
      ? {
          pending: 'Import pending. Repeated action is disabled.',
          success: '12 holiday records imported.',
          failure: 'Import failed. No records were changed.',
        }[variant]
      : undefined;

  return {
    id,
    slug,
    variant,
    label: slug
      .split('-')
      .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
      .join(' '),
    helperText:
      variant === 'long-content'
        ? 'Search results can contain long titles and descriptions without losing their accessible name.'
        : 'Controlled fixture; event metadata appears below after interaction.',
    disabled: variant === 'disabled',
    error:
      variant === 'validation' || variant === 'error'
        ? slug === 'json-import'
          ? 'JSON schema validation failed.'
          : slug === 'text-field' || slug === 'text-area-field'
            ? 'This value needs attention.'
            : undefined
        : undefined,
    open: isOpenVariant(variant),
    query: queryFor(slug, variant),
    options,
    singleValue: selectedSingle,
    multiValue: selectedMulti,
    staged: variant === 'draft',
    textValue:
      slug === 'tree-controls' && variant === 'populated'
        ? 'BERAS'
        : slug === 'json-import' && variant !== 'empty'
        ? '[{"date":"2026-08-17","name":"Independence Day"}]'
        : variant === 'default'
          ? 'Deterministic value'
          : '',
    checked: variant === 'default',
    dateValue: variant === 'validation' ? '2026-02-30' : '2026-07-23',
    monthValue:
      variant === 'empty' ? '' : variant === 'validation' ? '2026-13' : '2026-07',
    rangeValue,
    statusMessage,
  };
}

export const formFixtures = Object.freeze(
  Object.fromEntries(
    FORM_CASE_IDS.map((id) => [`fixture:${id}`, createFixture(id)]),
  ),
) as Readonly<Record<`fixture:${FormCaseId}`, FormCaseFixture>>;
