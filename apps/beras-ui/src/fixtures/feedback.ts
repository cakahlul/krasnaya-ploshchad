import type {
  AccessStateProps,
  ActionSpec,
  LoadingStage,
  StateViewProps,
  ToastSpec,
} from '@krasnaya/beras-ui/types';
import type { BerasSize } from '@krasnaya/beras-ui/foundations';

export const FEEDBACK_CASE_IDS = [
  'feedback/loading-overlay/waiting',
  'feedback/loading-overlay/data',
  'feedback/loading-overlay/progress',
  'feedback/loading-overlay/reduced-motion',
  'feedback/page-skeleton/default',
  'feedback/page-skeleton/dense',
  'feedback/page-skeleton/reduced-motion',
  'feedback/spinner/default',
  'feedback/spinner/labelled',
  'feedback/spinner/reduced-motion',
  'feedback/maintenance-state/default',
  'feedback/maintenance-state/retry-pending',
  'feedback/maintenance-state/narrow',
  'feedback/access-state/loading',
  'feedback/access-state/denied',
  'feedback/access-state/not-registered',
  'feedback/state-view/loading',
  'feedback/state-view/empty',
  'feedback/state-view/error',
  'feedback/state-view/retry',
  'feedback/state-view/coming-soon',
  'feedback/toast/success',
  'feedback/toast/error',
  'feedback/toast/long-content',
  'feedback/toast/reduced-motion',
  'feedback/export-toast/success',
  'feedback/export-toast/error',
  'feedback/export-toast/long-content',
  'feedback/export-toast/reduced-motion',
  'feedback/export-toast/narrow',
] as const;

export type FeedbackCaseId = (typeof FEEDBACK_CASE_IDS)[number];

interface FixtureBase {
  id: FeedbackCaseId;
  slug: string;
  variant: string;
  reducedMotion: boolean;
  narrow: boolean;
}

export interface LoadingOverlayFixture extends FixtureBase {
  kind: 'loading-overlay';
  label: string;
  stage: LoadingStage;
  progress?: number;
  seed: string;
}

export interface PageSkeletonFixture extends FixtureBase {
  kind: 'page-skeleton';
  label: string;
  dense: boolean;
}

export interface SpinnerFixture extends FixtureBase {
  kind: 'spinner';
  label?: string;
  size: BerasSize;
}

export interface MaintenanceFixture extends FixtureBase {
  kind: 'maintenance-state';
  title: string;
  description: string;
  pending: boolean;
}

export interface AccessFixture extends FixtureBase {
  kind: 'access-state';
  status: AccessStateProps['status'];
  title: string;
  description: string;
  action?: ActionSpec;
}

export interface StateViewFixture extends FixtureBase {
  kind: 'state-view';
  state: StateViewProps['state'];
  action?: ActionSpec;
  callout?: {
    title: string;
    description: string;
    action: ActionSpec;
  };
}

export interface ToastFixture extends FixtureBase {
  kind: 'toast' | 'export-toast';
  viewportLabel: string;
  toast: ToastSpec;
}

export type FeedbackCaseFixture =
  | LoadingOverlayFixture
  | PageSkeletonFixture
  | SpinnerFixture
  | MaintenanceFixture
  | AccessFixture
  | StateViewFixture
  | ToastFixture;

function createFixture(id: FeedbackCaseId): FeedbackCaseFixture {
  const [, slug, variant] = id.split('/');
  const shared = {
    id,
    slug,
    variant,
    reducedMotion: variant === 'reduced-motion',
    narrow: variant === 'narrow',
  };

  switch (slug) {
    case 'loading-overlay': {
      const stage: LoadingStage =
        variant === 'data' ? 'data' : variant === 'progress' ? 'progress' : 'waiting';
      return {
        ...shared,
        kind: 'loading-overlay',
        label:
          stage === 'waiting'
            ? 'Waiting for report configuration'
            : stage === 'data'
              ? 'Preparing report data'
              : 'Exporting report',
        stage,
        progress: stage === 'progress' ? 72 : undefined,
        seed: `feedback-${variant}`,
      };
    }
    case 'page-skeleton':
      return {
        ...shared,
        kind: 'page-skeleton',
        label: variant === 'dense' ? 'Loading dense dashboard' : 'Loading dashboard',
        dense: variant === 'dense',
      };
    case 'spinner':
      return {
        ...shared,
        kind: 'spinner',
        label:
          variant === 'default'
            ? undefined
            : variant === 'labelled'
              ? 'Loading sprint data'
              : 'Loading with reduced motion',
        size: variant === 'labelled' ? 'lg' : 'md',
      };
    case 'maintenance-state':
      return {
        ...shared,
        kind: 'maintenance-state',
        title: 'Scheduled maintenance',
        description:
          variant === 'narrow'
            ? 'The workspace is temporarily unavailable. Retry when maintenance finishes.'
            : 'The workspace will return after the scheduled maintenance window.',
        pending: variant === 'retry-pending',
      };
    case 'access-state': {
      const status = variant as AccessStateProps['status'];
      return {
        ...shared,
        kind: 'access-state',
        status,
        title:
          status === 'loading'
            ? 'Checking workspace access'
            : status === 'denied'
              ? 'Access denied'
              : 'Account is not registered',
        description:
          status === 'loading'
            ? 'Access status is being resolved.'
            : status === 'denied'
              ? 'Ask a workspace administrator for access.'
              : 'Register this account before opening the workspace.',
        action:
          status === 'loading'
            ? undefined
            : {
                id: status === 'denied' ? 'request-access' : 'register-account',
                label: status === 'denied' ? 'Request access' : 'Register account',
              },
      };
    }
    case 'state-view': {
      const state: StateViewProps['state'] =
        variant === 'loading'
          ? { status: 'loading', label: 'Loading team members' }
          : variant === 'empty'
            ? {
                status: 'empty',
                title: 'No team members',
                description: 'Invite a member to start collaborating.',
              }
            : variant === 'coming-soon'
              ? {
                  status: 'empty',
                  title: 'Feature coming soon',
                  description: 'This view is documented before business integration.',
                }
              : {
                  status: 'error',
                  title: 'Team members unavailable',
                  description: 'The deterministic fixture represents a failed request.',
                };
      return {
        ...shared,
        kind: 'state-view',
        state,
        action:
          variant === 'retry'
            ? { id: 'load-members-again', label: 'Retry' }
            : variant === 'empty'
              ? { id: 'invite-member', label: 'Invite member' }
              : undefined,
        callout:
          variant === 'coming-soon'
            ? {
                title: 'Stay informed',
                description: 'Business notification orchestration remains in the consumer.',
                action: { id: 'notify-me', label: 'Notify me' },
              }
            : undefined,
      };
    }
    case 'toast':
    case 'export-toast': {
      const isError = variant === 'error';
      const isLong = variant === 'long-content';
      const exportToast = slug === 'export-toast';
      return {
        ...shared,
        kind: exportToast ? 'export-toast' : 'toast',
        viewportLabel: exportToast ? 'Export notifications' : 'Notifications',
        toast: {
          id: `${slug}-${variant}`,
          title: isError
            ? exportToast
              ? 'Export failed'
              : 'Update failed'
            : exportToast
              ? 'Export complete'
              : 'Changes saved',
          description: isLong
            ? 'The report includes a long deterministic description that must wrap without hiding the close control or the complete accessible message.'
            : isError
              ? 'Nothing changed. Retry when ready.'
              : exportToast
                ? 'The spreadsheet is ready to download.'
                : 'The latest changes are now visible.',
          tone: isError ? 'danger' : variant === 'reduced-motion' ? 'info' : 'success',
          urgent: isError,
          action: isError
            ? { id: exportToast ? 'retry-export' : 'retry-update', label: 'Retry' }
            : exportToast
              ? { id: 'download-export', label: 'Download' }
              : undefined,
        },
      };
    }
    default:
      throw new Error(`Unsupported feedback fixture: ${id}`);
  }
}

export const feedbackFixtures = Object.freeze(
  Object.fromEntries(
    FEEDBACK_CASE_IDS.map((id) => [`fixture:${id}`, createFixture(id)]),
  ),
) as Readonly<Record<`fixture:${FeedbackCaseId}`, FeedbackCaseFixture>>;
