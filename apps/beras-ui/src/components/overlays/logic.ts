import type {
  ActionSpec,
  InteractionSource,
  OpenChangeMeta,
  OpenChangeReason,
} from '../../public/types';

export interface FocusTarget {
  focus(): void;
  isConnected?: boolean;
}

export interface DialogTarget {
  open: boolean;
  showModal(): void;
  close(): void;
  contains(target: unknown): boolean;
  querySelector(selector: string): FocusTarget | null;
}

export interface InteractionEventLike {
  detail?: number;
  isTrusted: boolean;
}

export interface Point {
  clientX: number;
  clientY: number;
}

export interface RectBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const FOCUSABLE_SELECTOR = [
  '[autofocus]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function interactionSource(event: InteractionEventLike): InteractionSource {
  if (!event.isTrusted) return 'programmatic';
  return (event.detail ?? 0) === 0 ? 'keyboard' : 'pointer';
}

export function pointerInteractionSource(
  event: Pick<InteractionEventLike, 'isTrusted'>,
): InteractionSource {
  return event.isTrusted ? 'pointer' : 'programmatic';
}

export function openChangeMeta(
  source: InteractionSource,
  reason: OpenChangeReason,
): OpenChangeMeta {
  return { source, reason };
}

export function canActivateAction(action: ActionSpec): boolean {
  return !action.disabled && !action.pending;
}

export function shouldCloseBackdrop(
  point: Point,
  bounds: RectBounds,
  closeOnBackdrop: boolean,
): boolean {
  if (!closeOnBackdrop) return false;
  return (
    point.clientX < bounds.left ||
    point.clientX > bounds.right ||
    point.clientY < bounds.top ||
    point.clientY > bounds.bottom
  );
}

export function syncDialogState(dialog: Pick<DialogTarget, 'open' | 'showModal' | 'close'>, open: boolean) {
  if (open && !dialog.open) dialog.showModal();
  if (!open && dialog.open) dialog.close();
}

export function focusInitialControl(
  dialog: Pick<DialogTarget, 'contains' | 'querySelector'>,
  explicitTarget?: FocusTarget | null,
) {
  const target =
    explicitTarget && dialog.contains(explicitTarget)
      ? explicitTarget
      : dialog.querySelector(FOCUSABLE_SELECTOR);
  target?.focus();
}

export function restoreFocus(target?: FocusTarget | null) {
  if (target?.isConnected !== false) target?.focus();
}

export function closeDialogAndRestore(
  dialog: Pick<DialogTarget, 'open' | 'showModal' | 'close'>,
  invoker?: FocusTarget | null,
) {
  syncDialogState(dialog, false);
  restoreFocus(invoker);
}

export function shouldHandlePopoverEscape(
  key: string,
  targetInside: boolean,
  focusInside: boolean,
): boolean {
  return key === 'Escape' && (targetInside || focusInside);
}

export function shouldRestorePopoverFocus(
  reason: OpenChangeReason | undefined,
  source: InteractionSource | undefined,
): boolean {
  if (reason === 'escape') return source === 'keyboard';
  if (reason === 'action') return source === 'keyboard' || source === 'pointer';
  return false;
}
