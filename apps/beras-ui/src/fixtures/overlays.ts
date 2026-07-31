import type {
  ActionSpec,
  AsyncViewState,
  DisplayItem,
  FormValue,
} from '@krasnaya/beras-ui/types';

export const OVERLAY_CASE_IDS = [
  'overlay/legal-dialog/terms',
  'overlay/legal-dialog/privacy',
  'overlay/legal-dialog/overflow',
  'overlay/legal-dialog/narrow',
  'overlay/member-tasks/loading',
  'overlay/member-tasks/empty',
  'overlay/member-tasks/error',
  'overlay/member-tasks/populated',
  'overlay/member-tasks/expanded',
  'overlay/member-tasks/long-content',
  'overlay/member-form/create',
  'overlay/member-form/edit',
  'overlay/member-form/validation',
  'overlay/member-form/lead',
  'overlay/member-form/pending',
  'overlay/member-form/error',
  'overlay/member-form/narrow',
  'overlay/leave-form/create',
  'overlay/leave-form/edit',
  'overlay/leave-form/read-only',
  'overlay/leave-form/validation',
  'overlay/leave-form/multiple-ranges',
  'overlay/leave-form/confirm',
  'overlay/leave-form/pending',
  'overlay/leave-form/error',
  'overlay/leave-form/narrow',
  'overlay/holiday-form/create',
  'overlay/holiday-form/edit',
  'overlay/holiday-form/validation',
  'overlay/holiday-form/existing',
  'overlay/holiday-form/confirm',
  'overlay/holiday-form/pending',
  'overlay/holiday-form/error',
  'overlay/holiday-form/narrow',
  'overlay/dialog/default',
  'overlay/dialog/overflow',
  'overlay/dialog/narrow',
  'overlay/confirm-dialog/default',
  'overlay/confirm-dialog/pending',
  'overlay/drawer/closed',
  'overlay/drawer/open',
  'overlay/drawer/narrow',
  'overlay/popover/closed',
  'overlay/popover/open',
  'overlay/popover/long-content',
  'overlay/config-form/default',
  'overlay/config-form/validation',
  'overlay/config-form/pending',
  'overlay/ticket-detail/default',
  'overlay/ticket-detail/long-content',
  'overlay/api-key-table/loading',
  'overlay/api-key-table/empty',
  'overlay/api-key-table/error',
  'overlay/api-key-table/populated',
  'overlay/json-import/default',
  'overlay/json-import/validation',
  'overlay/json-import/pending',
  'form/json-import/empty',
  'form/json-import/validation',
  'form/json-import/ready',
  'form/json-import/pending',
  'form/json-import/success',
  'form/json-import/failure',
] as const;

export type OverlayCaseId = (typeof OVERLAY_CASE_IDS)[number];

export interface OverlayFixture {
  id: OverlayCaseId;
  slug: string;
  variant: string;
  title: string;
  description: string;
  open: boolean;
  closeOnBackdrop: boolean;
  document: 'terms' | 'privacy';
  content: string;
  state: AsyncViewState<readonly DisplayItem[]>;
  value: FormValue;
  actions: readonly ActionSpec[];
  item: DisplayItem;
  jsonValue: string;
  helperText?: string;
  error?: string;
}

const longContent = [
  'This deterministic content is intentionally long enough to exercise internal scrolling.',
  'Keyboard users must still reach every control while the footer remains available.',
  'No raw HTML, remote request, or business mutation is needed for this use case.',
].join(' '.repeat(2)).repeat(8);

function stateFor(variant: string): AsyncViewState<readonly DisplayItem[]> {
  if (variant === 'loading') return { status: 'loading', label: 'Loading fixed fixture data…' };
  if (variant === 'empty') {
    return {
      status: 'empty',
      title: 'Nothing here yet',
      description: 'The consumer can offer its own next action.',
    };
  }
  if (variant === 'error') {
    return {
      status: 'error',
      title: 'Fixture could not be shown',
      description: 'Retry and mutation behavior stay in the consumer.',
    };
  }
  return {
    status: 'ready',
    data: [
      {
        id: 'BERAS-107',
        label: 'BERAS-107 · Native overlay mechanics',
        value: variant === 'expanded' ? 'expanded' : 'In progress',
        description: variant === 'long-content' ? longContent : 'Focus, close, and overflow contract.',
      },
      {
        id: 'BERAS-115',
        label: 'BERAS-115 · Catalog documentation',
        value: 'Ready',
        description: 'Fixed local fixture.',
      },
    ],
  };
}

function actionsFor(variant: string): readonly ActionSpec[] {
  if (variant === 'read-only') {
    return [
      { id: 'cancel', label: 'Close', disabled: true },
      { id: 'save', label: 'Save', disabled: true },
    ];
  }
  return [
    { id: 'cancel', label: 'Cancel' },
    { id: 'save', label: 'Save', pending: variant === 'pending' },
  ];
}

function jsonActionsFor(variant: string): readonly ActionSpec[] {
  if (variant === 'success') {
    return [{ id: 'reset', label: 'Import another file' }];
  }
  if (variant === 'failure') {
    return [{ id: 'retry', label: 'Try again' }];
  }
  return [
    {
      id: variant === 'ready' || variant === 'pending' ? 'import' : 'validate',
      label: variant === 'ready' || variant === 'pending' ? 'Import records' : 'Validate JSON',
      disabled: variant === 'empty',
      pending: variant === 'pending',
    },
  ];
}

function formValueFor(slug: string, variant: string): FormValue {
  const issue: FormValue =
    variant === 'validation'
      ? { validationMessage: 'Complete the required fields.' }
      : variant === 'error'
        ? { error: 'The consumer reported a submission error.' }
        : {};
  if (slug === 'member-form') {
    return {
      name: variant === 'create' ? '' : 'Nadya Pratama',
      email: 'nadya@example.test',
      lead: variant === 'lead',
      teams: ['Platform', 'Quality'],
      ...issue,
    };
  }
  if (slug === 'leave-form') {
    return {
      member: 'Nadya Pratama',
      period: { start: '2026-08-03', end: '2026-08-05' },
      ranges:
        variant === 'multiple-ranges'
          ? ['2026-08-03–2026-08-05', '2026-09-14–2026-09-15']
          : ['2026-08-03–2026-08-05'],
      status: variant === 'read-only' ? 'Approved' : 'Draft',
      ...issue,
    };
  }
  if (slug === 'holiday-form') {
    return {
      name: variant === 'create' ? '' : 'Independence Day',
      date: '2026-08-17',
      existing: variant === 'existing',
      ...issue,
    };
  }
  return {
    key: 'reportingWindow',
    value: '2026-Q3',
    enabled: true,
    ...issue,
  };
}

function createFixture(id: OverlayCaseId): OverlayFixture {
  const [, slug, variant] = id.split('/') as [string, string, string];
  const isJson = slug === 'json-import';
  const content = ['overflow', 'long-content', 'narrow'].includes(variant)
    ? longContent
    : 'Presentational content supplied by the consumer as safe React text.';
  return {
    id,
    slug,
    variant,
    title: slug.replaceAll('-', ' '),
    description: `${variant.replaceAll('-', ' ')} state`,
    open: !(
      (slug === 'drawer' || slug === 'popover') &&
      variant === 'closed'
    ),
    closeOnBackdrop: slug === 'drawer',
    document: variant === 'privacy' ? 'privacy' : 'terms',
    content,
    state: stateFor(variant),
    value: formValueFor(slug, variant),
    actions: isJson ? jsonActionsFor(variant) : actionsFor(variant),
    item: {
      id: 'BERAS-107',
      label: 'BERAS-107 · Native overlay mechanics',
      value: 'In progress',
      description: 'Assigned to the component library.',
    },
    jsonValue:
      variant === 'empty'
        ? ''
        : '[\n  { "date": "2026-08-17", "name": "Independence Day" }\n]',
    helperText: !isJson
      ? undefined
      : variant === 'ready'
        ? 'Ready: 1 record awaits consumer validation.'
        : variant === 'success'
          ? 'Success: consumer accepted 1 holiday record.'
          : variant === 'pending'
            ? 'Importing: consumer action is pending.'
            : variant === 'empty'
              ? 'Paste a JSON array to begin.'
              : 'Supply JSON; parsing remains a consumer concern.',
    error:
      !isJson
        ? undefined
        : variant === 'validation'
          ? 'JSON syntax is incomplete near record 1.'
          : variant === 'failure'
            ? 'Consumer rejected 1 holiday record.'
            : undefined,
  };
}

export const overlayFixtures = Object.fromEntries(
  OVERLAY_CASE_IDS.map((id) => [`fixture:${id}`, createFixture(id)]),
) as Record<`fixture:${OverlayCaseId}`, OverlayFixture>;
