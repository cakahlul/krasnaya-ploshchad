'use client';

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

import type { ButtonProps, IconButtonProps } from '../../public/types';
import {
  createActionLatch,
  handleActionActivation,
  releaseAction,
  syncActionLatch,
} from './action-logic';
import { LoadingIcon } from './icons';

interface ActionButtonProps extends Omit<ButtonProps, 'children'> {
  accessibleLabel?: string;
  children: ReactNode;
  rootClass: 'beras-button' | 'beras-icon-button';
}

function ActionButton({
  accessibleLabel,
  actionId,
  children,
  className,
  disabled = false,
  id,
  onAction,
  pending = false,
  rootClass,
  size = 'md',
  tone = 'brand',
  type = 'button',
  variant = 'solid',
}: ActionButtonProps) {
  const latch = useRef(createActionLatch(actionId, pending));

  useEffect(() => {
    syncActionLatch(latch.current, actionId, pending);
  }, [actionId, pending]);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (
      handleActionActivation(
        latch.current,
        actionId,
        disabled,
        pending,
        event,
        onAction,
      )
    ) {
      queueMicrotask(() => releaseAction(latch.current, actionId));
    }
  }

  return (
    <button
      id={id}
      className={`${rootClass}${className ? ` ${className}` : ''}`}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      aria-label={accessibleLabel}
      data-beras-state={pending ? 'pending' : disabled ? 'disabled' : 'default'}
      data-beras-variant={variant}
      data-beras-tone={tone}
      data-beras-size={size}
      onClick={onAction ? handleClick : undefined}
    >
      {pending ? <LoadingIcon size={16} /> : null}
      {children}
    </button>
  );
}

export function Button(props: ButtonProps) {
  return <ActionButton rootClass="beras-button" {...props} />;
}

export function IconButton({ icon, label, ...props }: IconButtonProps) {
  return (
    <ActionButton rootClass="beras-icon-button" accessibleLabel={label} {...props}>
      {icon}
    </ActionButton>
  );
}
