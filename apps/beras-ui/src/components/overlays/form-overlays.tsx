'use client';

import { useId } from 'react';
import type { ChangeEvent } from 'react';

import type {
  ConfigFormDialogProps,
  FormDialogProps,
  FormFieldValue,
  FormValue,
  HolidayFormDialogProps,
  JsonImportPanelProps,
  LeaveFormDialogProps,
  MemberFormDialogProps,
} from '../../public/types';
import { useInputInteraction } from '../forms/shared';
import { ActionButtons } from './actions';
import { BaseModal } from './modal';

function labelFor(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ');
}

function isDateRange(value: FormFieldValue): value is { start: string; end: string } {
  return typeof value === 'object' && !Array.isArray(value);
}

function FormFields({
  onValueChange,
  readOnly,
  value,
}: {
  onValueChange: FormDialogProps['onValueChange'];
  readOnly: boolean;
  value: FormValue;
}) {
  const interaction = useInputInteraction();
  const prefix = useId();
  const change = (key: string, nextValue: FormFieldValue) => {
    onValueChange({ ...value, [key]: nextValue }, interaction.meta());
  };

  return Object.entries(value).map(([key, fieldValue]) => {
    const controlId = `${prefix}-${key}`;
    if (key === 'error' || key === 'validationMessage') {
      return <p key={key} role="alert">{String(fieldValue)}</p>;
    }
    if (typeof fieldValue === 'boolean') {
      return (
        <label key={key} htmlFor={controlId}>
          <input
            id={controlId}
            type="checkbox"
            checked={fieldValue}
            disabled={readOnly}
            onKeyDown={interaction.onKeyDown}
            onPointerDown={interaction.onPointerDown}
            onChange={(event) => change(key, event.currentTarget.checked)}
          />
          {labelFor(key)}
        </label>
      );
    }
    if (isDateRange(fieldValue)) {
      return (
        <fieldset key={key} disabled={readOnly}>
          <legend>{labelFor(key)}</legend>
          <label>
            Start
            <input
              type="date"
              value={fieldValue.start}
              onKeyDown={interaction.onKeyDown}
              onPointerDown={interaction.onPointerDown}
              onChange={(event) => change(key, { ...fieldValue, start: event.currentTarget.value })}
            />
          </label>
          <label>
            End
            <input
              type="date"
              value={fieldValue.end}
              onKeyDown={interaction.onKeyDown}
              onPointerDown={interaction.onPointerDown}
              onChange={(event) => change(key, { ...fieldValue, end: event.currentTarget.value })}
            />
          </label>
        </fieldset>
      );
    }
    const textValue = Array.isArray(fieldValue) ? fieldValue.join(', ') : fieldValue;
    return (
      <label key={key} htmlFor={controlId}>
        {labelFor(key)}
        <input
          id={controlId}
          type={key.toLocaleLowerCase().includes('date') ? 'date' : 'text'}
          value={textValue}
          readOnly={readOnly}
          onKeyDown={interaction.onKeyDown}
          onPointerDown={interaction.onPointerDown}
          onChange={(event) =>
            change(
              key,
              Array.isArray(fieldValue)
                ? event.currentTarget.value.split(',').map((item) => item.trim()).filter(Boolean)
                : event.currentTarget.value,
            )
          }
        />
      </label>
    );
  });
}

function FormDialog({
  actions,
  onAction,
  onValueChange,
  rootClass,
  value,
  ...props
}: FormDialogProps & { rootClass: string }) {
  const readOnly = actions.length === 0 || actions.every((action) => action.disabled);
  return (
    <BaseModal
      rootClass={`${rootClass} beras-dialog`}
      {...props}
      footer={
        <ActionButtons actions={actions} label="Form actions" onAction={onAction} />
      }
    >
      <form onSubmit={(event) => event.preventDefault()}>
        <FormFields value={value} readOnly={readOnly} onValueChange={onValueChange} />
      </form>
    </BaseModal>
  );
}

export function MemberFormDialog(props: MemberFormDialogProps) {
  return <FormDialog rootClass="beras-member-form-dialog" {...props} />;
}

export function LeaveFormDialog(props: LeaveFormDialogProps) {
  return <FormDialog rootClass="beras-leave-form-dialog" {...props} />;
}

export function HolidayFormDialog(props: HolidayFormDialogProps) {
  return <FormDialog rootClass="beras-holiday-form-dialog" {...props} />;
}

export function ConfigFormDialog(props: ConfigFormDialogProps) {
  return <FormDialog rootClass="beras-config-form-dialog" {...props} />;
}

export function JsonImportPanel({
  actions,
  className,
  error,
  helperText,
  id,
  label,
  onAction,
  onValueChange,
  value,
}: JsonImportPanelProps) {
  const controlId = `${useId()}-input`;
  const interaction = useInputInteraction();
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onValueChange(event.currentTarget.value, interaction.meta());
  };
  return (
    <section
      id={id}
      className={`beras-json-import-panel${className ? ` ${className}` : ''}`}
      data-beras-state={
        error ? 'error' : actions.some((action) => action.pending) ? 'pending' : 'default'
      }
    >
      <label htmlFor={controlId}>{label}</label>
      <textarea
        id={controlId}
        className="beras-json-import-panel__input"
        value={value}
        rows={8}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${controlId}-error` : helperText ? `${controlId}-helper` : undefined}
        onKeyDown={interaction.onKeyDown}
        onPointerDown={interaction.onPointerDown}
        onChange={handleChange}
      />
      {helperText ? <small id={`${controlId}-helper`}>{helperText}</small> : null}
      {error ? <p id={`${controlId}-error`} role="alert">{error}</p> : null}
      <ActionButtons actions={actions} label="Import actions" onAction={onAction} />
    </section>
  );
}
