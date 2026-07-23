import type { ActionHandler, InteractionSource } from '../../public/types';

export interface ActionLatch {
  actionId: string;
  emitted: boolean;
  pending: boolean;
}

interface ActionActivationEvent extends Pick<MouseEvent, 'detail' | 'isTrusted'> {
  preventDefault: () => void;
}

export function createActionLatch(actionId: string, pending: boolean): ActionLatch {
  return { actionId, emitted: false, pending };
}

export function syncActionLatch(
  latch: ActionLatch,
  actionId: string,
  pending: boolean,
): void {
  if (latch.actionId !== actionId || (latch.pending && !pending)) latch.emitted = false;
  latch.actionId = actionId;
  latch.pending = pending;
}

function claimAction(
  latch: ActionLatch,
  actionId: string,
  disabled: boolean,
  pending: boolean,
): boolean {
  syncActionLatch(latch, actionId, pending);
  if (disabled || pending || latch.emitted) return false;
  latch.emitted = true;
  return true;
}

export function releaseAction(latch: ActionLatch, actionId: string): void {
  if (latch.actionId === actionId && !latch.pending) latch.emitted = false;
}

export function interactionSource(
  event: Pick<MouseEvent, 'detail' | 'isTrusted'>,
): InteractionSource {
  if (!event.isTrusted) return 'programmatic';
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

export function handleActionActivation(
  latch: ActionLatch,
  actionId: string,
  disabled: boolean,
  pending: boolean,
  event: ActionActivationEvent,
  onAction?: ActionHandler,
): boolean {
  if (!onAction) return true;
  if (!claimAction(latch, actionId, disabled, pending)) {
    event.preventDefault();
    return false;
  }
  onAction(actionId, { source: interactionSource(event) });
  return true;
}
