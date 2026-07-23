'use client';

import { useEffect, useId, useRef } from 'react';
import type { MouseEvent } from 'react';

import type {
  DrawerProps,
  OpenChangeMeta,
  PopoverProps,
} from '../../public/types';
import { BaseModal } from './modal';
import {
  interactionSource,
  pointerInteractionSource,
  shouldHandlePopoverEscape,
  shouldRestorePopoverFocus,
} from './logic';

export function Drawer({
  closeOnBackdrop = true,
  placement = 'start',
  ...props
}: DrawerProps) {
  return (
    <BaseModal
      rootClass="beras-drawer beras-dialog"
      closeOnBackdrop={closeOnBackdrop}
      dataVariant={placement}
      {...props}
    />
  );
}

export function Popover({
  children,
  className,
  id,
  label,
  onOpenChange,
  open,
  trigger,
}: PopoverProps) {
  const generatedId = useId();
  const panelId = `${generatedId}-panel`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(open);
  const requestedCloseRef = useRef<OpenChangeMeta | undefined>(undefined);

  useEffect(() => {
    const requestedClose = requestedCloseRef.current;
    if (
      wasOpenRef.current &&
      !open &&
      shouldRestorePopoverFocus(requestedClose?.reason, requestedClose?.source)
    ) {
      triggerRef.current?.focus();
    }
    if (!wasOpenRef.current && open) requestedCloseRef.current = undefined;
    if (!open) requestedCloseRef.current = undefined;
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        const meta: OpenChangeMeta = {
          source: pointerInteractionSource(event),
          reason: 'outside',
        };
        requestedCloseRef.current = meta;
        onOpenChange(false, meta);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      const root = rootRef.current;
      if (!root) return;
      const targetInside = event.target instanceof Node && root.contains(event.target);
      const focusInside =
        document.activeElement instanceof Node && root.contains(document.activeElement);
      if (!shouldHandlePopoverEscape(event.key, targetInside, focusInside)) return;
      event.preventDefault();
      const meta: OpenChangeMeta = {
        source: interactionSource(event),
        reason: 'escape',
      };
      requestedCloseRef.current = meta;
      onOpenChange(false, meta);
    }

    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onOpenChange, open]);

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const meta: OpenChangeMeta = {
      source: interactionSource(event),
      reason: 'action',
    };
    requestedCloseRef.current = open ? meta : undefined;
    onOpenChange(!open, meta);
  }

  return (
    <div
      ref={rootRef}
      id={id}
      className={`beras-popover${className ? ` ${className}` : ''}`}
      data-beras-state={open ? 'open' : 'closed'}
    >
      <button
        ref={triggerRef}
        className="beras-popover__trigger"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        {trigger}
      </button>
      {open ? (
        <div
          id={panelId}
          className="beras-popover__panel"
          role="region"
          aria-label={label}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
