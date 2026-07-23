'use client';

import type {
  FieldGroupProps,
  FilterBarProps,
  SegmentedControlProps,
} from '../../public/types';
import {
  clickMeta,
  rootClass,
  useFieldIds,
  useInputInteraction,
} from './shared';

export function FieldGroup({ id, className, legend, children }: FieldGroupProps) {
  return (
    <fieldset id={id} className={rootClass('beras-field-group', className)}>
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}

export function FilterBar({
  id,
  className,
  label,
  children,
  actions = [],
  onAction,
}: FilterBarProps) {
  return (
    <section
      id={id}
      className={rootClass('beras-filter-bar', className)}
      aria-label={label}
    >
      <div>{children}</div>
      {actions.length ? (
        <div role="group" aria-label={`${label} actions`}>
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={action.disabled || action.pending}
              aria-busy={action.pending || undefined}
              onClick={(event) => onAction?.(action.id, clickMeta(event))}
            >
              {action.pending ? `${action.label}…` : action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function SegmentedControl<Value extends string = string>({
  id,
  className,
  label,
  value,
  options,
  disabled,
  onValueChange,
}: SegmentedControlProps<Value>) {
  const ids = useFieldIds('segmented-control');
  const interaction = useInputInteraction();

  return (
    <fieldset
      id={id}
      className={rootClass('beras-segmented-control', className)}
      disabled={disabled}
      data-beras-state={disabled ? 'disabled' : 'default'}
    >
      <legend>{label}</legend>
      {options.map((option, index) => {
        const optionId = `${ids.controlId}-${index}`;
        return (
          <label key={option.value} htmlFor={optionId}>
            <input
              id={optionId}
              name={ids.controlId}
              type="radio"
              value={option.value}
              checked={option.value === value}
              disabled={option.disabled}
              onKeyDown={interaction.onKeyDown}
              onPointerDown={interaction.onPointerDown}
              onChange={(event) => {
                if (event.currentTarget.checked) {
                  onValueChange(option.value, interaction.meta());
                }
              }}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
