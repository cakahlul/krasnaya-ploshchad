'use client';

import type { ToastProps, ToastViewportProps } from '../../public/types';
import { Button, CloseIcon, IconButton } from '../primitives/index';

const rootClass = (base: string, className?: string) =>
  `${base}${className ? ` ${className}` : ''}`;

export function Toast({
  className,
  id,
  onAction,
  toast,
}: ToastProps) {
  const urgentError = toast.tone === 'danger' && toast.urgent === true;
  const interactiveAction = onAction ? toast.action : undefined;

  return (
    <article
      id={id}
      className={rootClass('beras-toast', className)}
      role={urgentError ? 'alert' : 'status'}
      aria-atomic="true"
      data-beras-tone={toast.tone}
      data-beras-state={interactiveAction?.pending ? 'pending' : 'default'}
      data-beras-variant={urgentError ? 'urgent' : 'default'}
    >
      <div>
        <strong>{toast.title}</strong>
        {toast.description ? <p>{toast.description}</p> : null}
      </div>
      {interactiveAction ? (
        <Button
          actionId={interactiveAction.id}
          disabled={interactiveAction.disabled}
          pending={interactiveAction.pending}
          tone={toast.tone}
          variant="outline"
          size="sm"
          onAction={onAction}
        >
          {interactiveAction.label}
        </Button>
      ) : null}
      {onAction ? (
        <IconButton
          actionId={`dismiss:${toast.id}`}
          icon={<CloseIcon />}
          label={`Dismiss notification: ${toast.title}`}
          variant="ghost"
          tone="neutral"
          size="sm"
          onAction={onAction}
        />
      ) : null}
    </article>
  );
}

export function ToastViewport({
  className,
  id,
  label = 'Notifications',
  onAction,
  toasts,
}: ToastViewportProps) {
  return (
    <section
      id={id}
      className={rootClass('beras-toast-viewport', className)}
      aria-label={label}
      data-beras-state={toasts.length === 0 ? 'empty' : 'populated'}
    >
      <ol>
        {toasts.map((toast) => (
          <li key={toast.id}>
            <Toast toast={toast} onAction={onAction} />
          </li>
        ))}
      </ol>
    </section>
  );
}
