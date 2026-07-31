'use client';

import type {
  AccessStateProps,
  ActionHandler,
  CalloutProps,
  MaintenanceStateProps,
  RetryHandler,
  StateViewProps,
} from '../../public/types';
import { Button } from '../primitives/index';
import { Spinner } from './loading';

const rootClass = (base: string, className?: string) =>
  `${base}${className ? ` ${className}` : ''}`;

export function resolveStateActionHandler(
  onRetry?: RetryHandler,
  onAction?: ActionHandler,
): ActionHandler | undefined {
  if (onRetry) return () => onRetry();
  return onAction;
}

export function StateView({
  action,
  className,
  id,
  onAction,
  onRetry,
  state,
}: StateViewProps) {
  const loading = state.status === 'loading';
  const error = state.status === 'error';
  const actionHandler = resolveStateActionHandler(onRetry, onAction);
  const interactiveAction = actionHandler ? action : undefined;

  return (
    <section
      id={id}
      className={rootClass('beras-state-view', className)}
      role={loading ? undefined : error ? 'alert' : 'status'}
      aria-busy={loading || interactiveAction?.pending || undefined}
      data-beras-state={state.status}
      data-beras-tone={error ? 'danger' : loading ? 'info' : 'neutral'}
    >
      {loading ? (
        <Spinner label={state.label ?? 'Loading'} />
      ) : (
        <>
          <h2>{state.title}</h2>
          {state.description ? <p>{state.description}</p> : null}
        </>
      )}
      {interactiveAction ? (
        <Button
          actionId={interactiveAction.id}
          disabled={interactiveAction.disabled}
          pending={interactiveAction.pending}
          tone={error ? 'danger' : 'brand'}
          variant="soft"
          onAction={actionHandler}
        >
          {interactiveAction.label}
        </Button>
      ) : null}
    </section>
  );
}

export function Callout({
  action,
  children,
  className,
  id,
  onAction,
  title,
  tone = 'info',
}: CalloutProps) {
  const interactiveAction = onAction ? action : undefined;

  return (
    <aside
      id={id}
      className={rootClass('beras-callout', className)}
      role="note"
      data-beras-tone={tone}
      data-beras-variant="soft"
      data-beras-state={interactiveAction?.pending ? 'pending' : 'default'}
    >
      <strong>{title}</strong>
      {children ? <div>{children}</div> : null}
      {interactiveAction ? (
        <Button
          actionId={interactiveAction.id}
          disabled={interactiveAction.disabled}
          pending={interactiveAction.pending}
          tone={tone}
          variant="outline"
          onAction={onAction}
        >
          {interactiveAction.label}
        </Button>
      ) : null}
    </aside>
  );
}

export function MaintenanceState({
  className,
  description,
  id,
  onRetry,
  pending = false,
  title,
}: MaintenanceStateProps) {
  const retryAction: ActionHandler | undefined = onRetry ? () => onRetry() : undefined;

  return (
    <section
      id={id}
      className={rootClass('beras-maintenance-state', className)}
      role="status"
      aria-busy={pending || undefined}
      data-beras-state={pending ? 'pending' : 'default'}
      data-beras-tone="warning"
    >
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {onRetry ? (
        <Button
          actionId="retry"
          pending={pending}
          tone="warning"
          variant="soft"
          onAction={retryAction}
        >
          {pending ? 'Retrying' : 'Retry'}
        </Button>
      ) : null}
    </section>
  );
}

export function AccessState({
  action,
  className,
  description,
  id,
  onAction,
  status,
  title,
}: AccessStateProps) {
  const loading = status === 'loading';
  const tone = status === 'denied' ? 'danger' : status === 'not-registered' ? 'info' : 'neutral';
  const interactiveAction = onAction ? action : undefined;

  return (
    <section
      id={id}
      className={rootClass('beras-access-state', className)}
      role={loading ? undefined : status === 'denied' ? 'alert' : 'status'}
      aria-busy={loading || interactiveAction?.pending || undefined}
      data-beras-state={status}
      data-beras-tone={tone}
    >
      {loading ? <Spinner label={title} /> : <h2>{title}</h2>}
      {description ? <p>{description}</p> : null}
      {!loading && interactiveAction ? (
        <Button
          actionId={interactiveAction.id}
          disabled={interactiveAction.disabled}
          pending={interactiveAction.pending}
          tone={tone}
          variant="soft"
          onAction={onAction}
        >
          {interactiveAction.label}
        </Button>
      ) : null}
    </section>
  );
}
