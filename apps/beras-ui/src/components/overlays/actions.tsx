'use client';

import type { MouseEvent } from 'react';

import type { ActionHandler, ActionSpec } from '../../public/types';
import { canActivateAction, interactionSource } from './logic';

export function ActionButtons({
  actions,
  label = 'Actions',
  onAction,
}: {
  actions: readonly ActionSpec[];
  label?: string;
  onAction?: ActionHandler;
}) {
  function activate(action: ActionSpec, event: MouseEvent<HTMLButtonElement>) {
    if (!canActivateAction(action)) return;
    onAction?.(action.id, { source: interactionSource(event) });
  }

  return (
    <div role="group" aria-label={label}>
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={action.disabled || action.pending}
          aria-busy={action.pending || undefined}
          data-beras-state={
            action.pending ? 'pending' : action.disabled ? 'disabled' : 'default'
          }
          onClick={(event) => activate(action, event)}
        >
          {action.pending ? 'Working… ' : null}
          {action.label}
        </button>
      ))}
    </div>
  );
}
