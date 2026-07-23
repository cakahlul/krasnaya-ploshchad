'use client';

import { useEffect, useId, useRef } from 'react';
import type {
  MouseEvent,
  SyntheticEvent,
} from 'react';

import type {
  ConfirmDialogProps,
  DialogProps,
  InteractionSource,
  LegalContentDialogProps,
} from '../../public/types';
import { ActionButtons } from './actions';
import {
  closeDialogAndRestore,
  focusInitialControl,
  interactionSource,
  openChangeMeta,
  shouldCloseBackdrop,
  syncDialogState,
} from './logic';

interface BaseModalProps extends DialogProps {
  dataVariant?: string;
  rootClass: string;
  showClose?: boolean;
}

export function BaseModal({
  children,
  className,
  closeOnBackdrop = false,
  dataVariant,
  description,
  footer,
  id,
  initialFocusRef,
  onOpenChange,
  open,
  rootClass,
  showClose = true,
  title,
}: BaseModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const invokerRef = useRef<HTMLElement | null>(null);
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = `${generatedId}-description`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      invokerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      syncDialogState(dialog, true);
      focusInitialControl(dialog, initialFocusRef?.current);
      return;
    }

    if (!open && (dialog.open || invokerRef.current)) {
      closeDialogAndRestore(dialog, invokerRef.current);
      invokerRef.current = null;
    }
  }, [initialFocusRef, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (!dialog) return;
      closeDialogAndRestore(dialog, invokerRef.current);
      invokerRef.current = null;
    };
  }, []);

  function requestClose(
    source: InteractionSource,
    reason: 'action' | 'backdrop' | 'escape',
  ) {
    onOpenChange(false, openChangeMeta(source, reason));
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    requestClose(interactionSource(event.nativeEvent), 'escape');
  }

  function handleBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (
      shouldCloseBackdrop(
        { clientX: event.clientX, clientY: event.clientY },
        event.currentTarget.getBoundingClientRect(),
        closeOnBackdrop,
      )
    ) {
      requestClose(interactionSource(event), 'backdrop');
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id={id}
      className={`${rootClass}${className ? ` ${className}` : ''}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-modal="true"
      data-beras-state={open ? 'open' : 'closed'}
      data-beras-variant={dataVariant}
      onCancel={handleCancel}
      onClick={handleBackdrop}
    >
      <header className="beras-dialog__header">
        <h2 id={titleId}>{title}</h2>
        {description ? <p id={descriptionId}>{description}</p> : null}
      </header>
      <div className="beras-dialog__body">{children}</div>
      {footer || showClose ? (
        <footer className="beras-dialog__footer">
          {footer}
          {showClose ? (
            <button
              type="button"
              onClick={(event) => requestClose(interactionSource(event), 'action')}
            >
              Close
            </button>
          ) : null}
        </footer>
      ) : null}
    </dialog>
  );
}

export function Dialog(props: DialogProps) {
  return <BaseModal rootClass="beras-dialog" {...props} />;
}

export function ConfirmDialog({
  cancelAction,
  confirmAction,
  message,
  onAction,
  onOpenChange,
  ...props
}: ConfirmDialogProps) {
  const actions = [cancelAction, confirmAction] as const;
  const handleAction: typeof onAction = (actionId, meta) => {
    onAction(actionId, meta);
    onOpenChange(false, { ...meta, reason: 'action' });
  };
  return (
    <BaseModal
      rootClass="beras-confirm-dialog beras-dialog"
      {...props}
      onOpenChange={onOpenChange}
      showClose={false}
      footer={
        <ActionButtons
          actions={actions}
          label="Confirmation actions"
          onAction={handleAction}
        />
      }
    >
      <p>{message}</p>
    </BaseModal>
  );
}

export function LegalContentDialog({
  content,
  document: documentType,
  ...props
}: LegalContentDialogProps) {
  return (
    <BaseModal
      rootClass="beras-legal-content-dialog beras-dialog"
      dataVariant={documentType}
      {...props}
    >
      <article>{content}</article>
    </BaseModal>
  );
}
