'use client';

import type { ChangeEvent } from 'react';

import type {
  DateFieldProps,
  DateRangeFieldProps,
  MonthFieldProps,
} from '../../public/types';
import {
  formActionDisabled,
  formatIsoDate,
  formatIsoMonth,
  runFormAction,
  validateDateRange,
  validateIsoDate,
  validateIsoMonth,
} from './logic';
import {
  clickMeta,
  describedBy,
  FieldLabel,
  FieldMessages,
  fieldState,
  rootClass,
  useFieldIds,
  useInputInteraction,
} from './shared';

function NativeDateField({
  props,
  root,
  type,
}: {
  props: DateFieldProps;
  root: 'beras-date-field' | 'beras-month-field';
  type: 'date' | 'month';
}) {
  const {
    id,
    className,
    name,
    label,
    helperText,
    error,
    required,
    disabled,
    readOnly,
    value,
    min,
    max,
    onValueChange,
  } = props;
  const ids = useFieldIds(name);
  const interaction = useInputInteraction();
  const validationError =
    error ??
    (type === 'date'
      ? validateIsoDate(value, min, max)
      : validateIsoMonth(value, min, max));
  const formatted =
    type === 'date' ? formatIsoDate(value) : formatIsoMonth(value);
  return (
    <div
      id={id}
      className={rootClass(root, className)}
      data-beras-state={fieldState({ disabled, error: validationError, readOnly })}
    >
      <FieldLabel controlId={ids.controlId} label={label} required={required} />
      <input
        id={ids.controlId}
        name={name}
        type={type}
        value={value}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-describedby={describedBy(
          helperText,
          validationError,
          ids.helperId,
          ids.errorId,
        )}
        aria-invalid={validationError ? true : undefined}
        onKeyDown={interaction.onKeyDown}
        onPointerDown={interaction.onPointerDown}
        onChange={(event) => onValueChange(event.currentTarget.value, interaction.meta())}
      />
      {formatted ? <output htmlFor={ids.controlId}>{formatted}</output> : null}
      <FieldMessages
        {...ids}
        helperText={helperText}
        error={validationError}
      />
    </div>
  );
}

export function DateField(props: DateFieldProps) {
  return <NativeDateField props={props} root="beras-date-field" type="date" />;
}

export function MonthField(props: MonthFieldProps) {
  return <NativeDateField props={props} root="beras-month-field" type="month" />;
}

export function DateRangeField({
  id,
  className,
  name,
  label,
  helperText,
  error,
  required,
  disabled,
  readOnly,
  value,
  presets = [],
  onValueChange,
  onAction,
}: DateRangeFieldProps) {
  const ids = useFieldIds(name);
  const startInteraction = useInputInteraction();
  const endInteraction = useInputInteraction();
  const validationError = error ?? validateDateRange(value);
  const formattedStart = formatIsoDate(value.start);
  const formattedEnd = formatIsoDate(value.end);
  const formattedRange = [formattedStart, formattedEnd].filter(Boolean).join(' – ');
  const cancelActionState = { disabled, readOnly };
  const applyActionState = {
    disabled,
    readOnly,
    actionDisabled:
      Boolean(validationError) ||
      Boolean(required && (!value.start || !value.end)),
  };
  const describedById = describedBy(
    helperText,
    validationError,
    ids.helperId,
    ids.errorId,
  );
  const setPart =
    (part: 'start' | 'end', interaction: ReturnType<typeof useInputInteraction>) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onValueChange({ ...value, [part]: event.currentTarget.value }, interaction.meta());
    };

  return (
    <fieldset
      id={id}
      className={rootClass('beras-date-range-field', className)}
      data-beras-state={fieldState({ disabled, error: validationError, readOnly })}
      disabled={disabled}
      aria-describedby={describedById}
      aria-invalid={validationError ? true : undefined}
      aria-readonly={readOnly || undefined}
    >
      <legend>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </legend>
      {presets.length ? (
        <div role="group" aria-label={`${label} presets`}>
          {presets.map((preset) => {
            const presetActionState = {
              disabled,
              readOnly,
              actionDisabled: preset.disabled,
            };
            return (
              <button
                key={preset.value}
                type="button"
                disabled={formActionDisabled(presetActionState)}
                onClick={(event) => {
                  runFormAction(presetActionState, () => {
                    onAction?.(preset.value, clickMeta(event));
                  });
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <label>
        Start date
        <input
          name={`${name}-start`}
          type="date"
          value={value.start}
          required={required}
          readOnly={readOnly}
          aria-describedby={describedById}
          aria-invalid={validationError ? true : undefined}
          onKeyDown={startInteraction.onKeyDown}
          onPointerDown={startInteraction.onPointerDown}
          onChange={setPart('start', startInteraction)}
        />
      </label>
      <label>
        End date
        <input
          name={`${name}-end`}
          type="date"
          value={value.end}
          required={required}
          readOnly={readOnly}
          aria-describedby={describedById}
          aria-invalid={validationError ? true : undefined}
          onKeyDown={endInteraction.onKeyDown}
          onPointerDown={endInteraction.onPointerDown}
          onChange={setPart('end', endInteraction)}
        />
      </label>
      {formattedRange ? <output>{formattedRange}</output> : null}
      <FieldMessages
        {...ids}
        helperText={helperText}
        error={validationError}
      />
      <div role="group" aria-label={`${label} actions`}>
        <button
          type="button"
          disabled={disabled || readOnly || (!value.start && !value.end)}
          onClick={(event) => {
            runFormAction(
              {
                disabled,
                readOnly,
                actionDisabled: !value.start && !value.end,
              },
              () => onValueChange({ start: '', end: '' }, clickMeta(event)),
            );
          }}
        >
          Clear
        </button>
        {onAction ? (
          <>
            <button
              type="button"
              disabled={formActionDisabled(cancelActionState)}
              onClick={(event) => {
                runFormAction(cancelActionState, () => {
                  onAction('cancel', clickMeta(event));
                });
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={formActionDisabled(applyActionState)}
              onClick={(event) => {
                runFormAction(applyActionState, () => {
                  onAction('apply', clickMeta(event));
                });
              }}
            >
              Apply
            </button>
          </>
        ) : null}
      </div>
    </fieldset>
  );
}
