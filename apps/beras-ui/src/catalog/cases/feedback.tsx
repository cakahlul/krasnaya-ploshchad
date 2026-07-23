'use client';

import { useState, type ReactNode } from 'react';
import '@krasnaya/beras-ui/styles.css';
import {
  AccessState,
  Callout,
  LoadingIllustration,
  LoadingOverlay,
  MaintenanceState,
  PageSkeleton,
  Skeleton,
  Spinner,
  StateView,
  Toast,
  ToastViewport,
} from '@krasnaya/beras-ui/components';
import type { ActionHandler, RetryHandler } from '@krasnaya/beras-ui/types';
import {
  FEEDBACK_CASE_IDS,
  feedbackFixtures,
  type FeedbackCaseId,
} from '../../fixtures/feedback';

interface CatalogCaseManifestEntry {
  id: `${string}/${string}/${string}`;
  fixtureId: `fixture:${string}`;
}

interface CatalogRuntimeCase {
  id: CatalogCaseManifestEntry['id'];
  fixtureId: CatalogCaseManifestEntry['fixtureId'];
  render: () => ReactNode;
}

export function resolveFeedbackStateHandlers(
  caseId: FeedbackCaseId,
  onRetry: RetryHandler,
  onAction: ActionHandler,
): { onRetry?: RetryHandler; onAction?: ActionHandler } {
  return caseId === 'feedback/state-view/retry' ? { onRetry } : { onAction };
}

function FeedbackCase({ caseId }: { caseId: FeedbackCaseId }) {
  const fixture = feedbackFixtures[`fixture:${caseId}`];
  const toastCase = fixture.kind === 'toast' || fixture.kind === 'export-toast';
  const [lastEvent, setLastEvent] = useState('No interaction yet.');
  const [visible, setVisible] = useState(true);

  const onAction: ActionHandler = (actionId, meta) => {
    if (actionId.startsWith('dismiss:')) setVisible(false);
    setLastEvent(`${meta.source}: action ${actionId}`);
  };
  const onRetry = () => {
    setLastEvent('Retry requested.');
  };

  let content: ReactNode;
  switch (fixture.kind) {
    case 'loading-overlay':
      content = (
        <>
          <LoadingOverlay
            open
            label={fixture.label}
            stage={fixture.stage}
            progress={fixture.progress}
            seed={fixture.seed}
          />
          {fixture.variant === 'data' ? (
            <LoadingIllustration
              label={`${fixture.label} — standalone illustration`}
              stage={fixture.stage}
              progress={fixture.progress}
              seed={fixture.seed}
            />
          ) : null}
        </>
      );
      break;
    case 'page-skeleton':
      content = (
        <>
          <PageSkeleton label={fixture.label} dense={fixture.dense} />
          <Skeleton label="Loading a supporting content row" />
        </>
      );
      break;
    case 'spinner':
      content = <Spinner label={fixture.label} size={fixture.size} />;
      break;
    case 'maintenance-state':
      content = (
        <MaintenanceState
          title={fixture.title}
          description={fixture.description}
          pending={fixture.pending}
          onRetry={onRetry}
        />
      );
      break;
    case 'access-state':
      content = (
        <AccessState
          status={fixture.status}
          title={fixture.title}
          description={fixture.description}
          action={fixture.action}
          onAction={onAction}
        />
      );
      break;
    case 'state-view':
      content = (
        <>
          <StateView
            state={fixture.state}
            action={fixture.action}
            {...resolveFeedbackStateHandlers(caseId, onRetry, onAction)}
          />
          {fixture.callout ? (
            <Callout
              title={fixture.callout.title}
              action={fixture.callout.action}
              onAction={onAction}
            >
              {fixture.callout.description}
            </Callout>
          ) : null}
        </>
      );
      break;
    case 'toast':
      content = visible ? (
        <Toast toast={fixture.toast} onAction={onAction} />
      ) : (
        <p role="status">Notification dismissed.</p>
      );
      break;
    case 'export-toast':
      content = (
        <>
          <ToastViewport
            label={fixture.viewportLabel}
            toasts={visible ? [fixture.toast] : []}
            onAction={onAction}
          />
          {!visible ? <p role="status">Notification dismissed.</p> : null}
        </>
      );
      break;
  }

  return (
    <section
      data-beras-root
      className="beras-card"
      aria-label={`${fixture.slug} ${fixture.variant} case`}
      data-beras-motion={fixture.reducedMotion ? 'reduced' : 'standard'}
      data-beras-viewport={fixture.narrow ? 'narrow' : 'responsive'}
    >
      {content}
      {fixture.reducedMotion ? (
        <p>Motion is non-essential; emulate reduced motion to verify animations stop.</p>
      ) : null}
      {toastCase ? (
        <p>Last event: {lastEvent}</p>
      ) : (
        <output aria-live="polite">Last event: {lastEvent}</output>
      )}
    </section>
  );
}

export const feedbackCases: readonly CatalogRuntimeCase[] = FEEDBACK_CASE_IDS.map((id) => ({
  id,
  fixtureId: `fixture:${id}`,
  render: () => <FeedbackCase caseId={id} />,
}));
