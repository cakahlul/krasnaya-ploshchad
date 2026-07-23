'use client';

import type { ChangeEvent } from 'react';

import type {
  CheckboxFieldProps,
  SelectFieldProps,
  SwitchFieldProps,
  TextAreaFieldProps,
  TextFieldProps,
} from '../../public/types';
import {
  describedBy,
  FieldLabel,
  FieldMessages,
  fieldState,
  rootClass,
  useFieldIds,
  useInputInteraction,
} from './shared';

export function TextField({
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
  type = 'text',
  placeholder,
  onValueChange,
}: TextFieldProps) {
  const ids = useFieldIds(name);
  const interaction = useInputInteraction();
  return (
    <div
      id={id}
      className={rootClass('beras-text-field', className)}
      data-beras-state={fieldState({ disabled, error, readOnly })}
    >
      <FieldLabel controlId={ids.controlId} label={label} required={required} />
      <input
        id={ids.controlId}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-describedby={describedBy(helperText, error, ids.helperId, ids.errorId)}
        aria-invalid={error ? true : undefined}
        onKeyDown={interaction.onKeyDown}
        onPointerDown={interaction.onPointerDown}
        onChange={(event) => onValueChange(event.currentTarget.value, interaction.meta())}
      />
      <FieldMessages {...ids} helperText={helperText} error={error} />
    </div>
  );
}
export function TextAreaField({
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
  rows = 4,
  placeholder,
  onValueChange,
}: TextAreaFieldProps) {
  const ids = useFieldIds(name);
  const interaction = useInputInteraction();
  return (
    <div
      id={id}
      className={rootClass('beras-text-area-field', className)}
      data-beras-state={fieldState({ disabled, error, readOnly })}
    >
      <FieldLabel controlId={ids.controlId} label={label} required={required} />
      <textarea
        id={ids.controlId}
        name={name}
        value={value}
        rows={rows}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-describedby={describedBy(helperText, error, ids.helperId, ids.errorId)}
        aria-invalid={error ? true : undefined}
        onKeyDown={interaction.onKeyDown}
        onPointerDown={interaction.onPointerDown}
        onChange={(event) => onValueChange(event.currentTarget.value, interaction.meta())}
      />
      <FieldMessages {...ids} helperText={helperText} error={error} />
    </div>
  );
}

function BooleanField({
  root,
  role,
  props,
}: {
  root: 'beras-switch-field' | 'beras-checkbox-field';
  role?: 'switch';
  props: SwitchFieldProps;
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
    onValueChange,
  } = props;
  const ids = useFieldIds(name);
  const interaction = useInputInteraction();
  return (
    <div
      id={id}
      className={rootClass(root, className)}
      data-beras-state={fieldState({ disabled, error, readOnly })}
    >
      <input
        id={ids.controlId}
        name={name}
        type="checkbox"
        role={role}
        checked={value}
        required={required}
        disabled={disabled}
        aria-readonly={readOnly || undefined}
        aria-describedby={describedBy(helperText, error, ids.helperId, ids.errorId)}
        aria-invalid={error ? true : undefined}
        onKeyDown={interaction.onKeyDown}
        onPointerDown={interaction.onPointerDown}
        onChange={(event) => {
          if (!readOnly) onValueChange(event.currentTarget.checked, interaction.meta());
        }}
      />
      <FieldLabel controlId={ids.controlId} label={label} required={required} />
      <FieldMessages {...ids} helperText={helperText} error={error} />
    </div>
  );
}

export function SwitchField(props: SwitchFieldProps) {
  return <BooleanField root="beras-switch-field" role="switch" props={props} />;
}

export function CheckboxField(props: CheckboxFieldProps) {
  return <BooleanField root="beras-checkbox-field" props={props} />;
}

export function SelectField<Value extends string = string>({
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
  options,
  placeholder = 'Select an option',
  onValueChange,
}: SelectFieldProps<Value>) {
  const ids = useFieldIds(name);
  const interaction = useInputInteraction();
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!readOnly) onValueChange(event.currentTarget.value as Value | '', interaction.meta());
  };
  return (
    <div
      id={id}
      className={rootClass('beras-select-field', className)}
      data-beras-state={fieldState({ disabled, error, readOnly })}
    >
      <FieldLabel controlId={ids.controlId} label={label} required={required} />
      <select
        id={ids.controlId}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        aria-readonly={readOnly || undefined}
        aria-describedby={describedBy(helperText, error, ids.helperId, ids.errorId)}
        aria-invalid={error ? true : undefined}
        onKeyDown={interaction.onKeyDown}
        onPointerDown={interaction.onPointerDown}
        onChange={handleChange}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessages {...ids} helperText={helperText} error={error} />
    </div>
  );
}
