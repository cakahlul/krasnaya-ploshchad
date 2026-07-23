'use client';

import { useId, useRef } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';

import type {
  ChangeMeta,
  FieldProps,
  InteractionSource,
  OpenChangeMeta,
} from '../../public/types';
import { sourceFromClickDetail } from './logic';

export function rootClass(name: string, className?: string): string {
  return className ? `${name} ${className}` : name;
}

export function fieldState({
  disabled,
  error,
  readOnly,
}: Pick<FieldProps, 'disabled' | 'error' | 'readOnly'>): string {
  if (disabled) return 'disabled';
  if (error) return 'error';
  if (readOnly) return 'read-only';
  return 'default';
}

export function useFieldIds(name: string): {
  controlId: string;
  helperId: string;
  errorId: string;
} {
  const generatedId = useId();
  const prefix = `beras-${name}-${generatedId}`;
  return {
    controlId: `${prefix}-control`,
    helperId: `${prefix}-helper`,
    errorId: `${prefix}-error`,
  };
}

export function describedBy(
  helperText: string | undefined,
  error: string | undefined,
  helperId: string,
  errorId: string,
): string | undefined {
  const ids = [helperText && helperId, error && errorId].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

export function FieldLabel({
  controlId,
  label,
  required,
}: {
  controlId: string;
  label: string;
  required?: boolean;
}): ReactNode {
  return (
    <label htmlFor={controlId}>
      {label}
      {required ? <span aria-hidden="true"> *</span> : null}
    </label>
  );
}

export function FieldMessages({
  error,
  errorId,
  helperId,
  helperText,
}: {
  error?: string;
  errorId: string;
  helperId: string;
  helperText?: string;
}): ReactNode {
  return (
    <>
      {helperText ? <small id={helperId}>{helperText}</small> : null}
      {error ? (
        <small id={errorId} role="alert">
          {error}
        </small>
      ) : null}
    </>
  );
}

export function useInputInteraction(): {
  onKeyDown: (event: KeyboardEvent) => void;
  onPointerDown: (event: PointerEvent) => void;
  meta: () => ChangeMeta;
} {
  const source = useRef<InteractionSource>('programmatic');
  return {
    onKeyDown: () => {
      source.current = 'keyboard';
    },
    onPointerDown: () => {
      source.current = 'pointer';
    },
    meta: () => {
      const meta = { source: source.current };
      source.current = 'programmatic';
      return meta;
    },
  };
}

export function clickMeta(
  event: MouseEvent,
): ChangeMeta & { source: 'keyboard' | 'pointer' } {
  return { source: sourceFromClickDetail(event.detail) };
}

export function openMeta(
  source: InteractionSource,
  reason: OpenChangeMeta['reason'],
): OpenChangeMeta {
  return { source, reason };
}
