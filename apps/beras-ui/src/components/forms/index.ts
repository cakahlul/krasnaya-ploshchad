import type { ComponentType } from 'react';
import type * as T from '../../public/types';

// BU-P1-06: replace this contract stub before the final gate.
function stub<Props>(name: string): ComponentType<Props> {
  const Component: ComponentType<Props> = () => { throw new Error(`${name} requires BU-P1-06`); };
  Component.displayName = `${name}ContractStub`;
  return Component;
}

export const TextField = stub<T.TextFieldProps>('TextField');
export const TextAreaField = stub<T.TextAreaFieldProps>('TextAreaField');
export const SwitchField = stub<T.SwitchFieldProps>('SwitchField');
export const CheckboxField = stub<T.CheckboxFieldProps>('CheckboxField');

export function SelectField<Value extends string = string>(props: T.SelectFieldProps<Value>): never {
  void props;
  throw new Error('SelectField requires BU-P1-06');
}

export function Combobox<Value extends string = string>(props: T.ComboboxProps<Value>): never {
  void props;
  throw new Error('Combobox requires BU-P1-06');
}

export function SearchCombobox<Value extends string = string>(
  props: T.SearchComboboxProps<Value>,
): never {
  void props;
  throw new Error('SearchCombobox requires BU-P1-06');
}

export function MultiSelect<Value extends string = string>(props: T.MultiSelectProps<Value>): never {
  void props;
  throw new Error('MultiSelect requires BU-P1-06');
}

export const DateField = stub<T.DateFieldProps>('DateField');
export const MonthField = stub<T.MonthFieldProps>('MonthField');
export const DateRangeField = stub<T.DateRangeFieldProps>('DateRangeField');
export const FieldGroup = stub<T.FieldGroupProps>('FieldGroup');
export const FilterBar = stub<T.FilterBarProps>('FilterBar');

export function SegmentedControl<Value extends string = string>(
  props: T.SegmentedControlProps<Value>,
): never {
  void props;
  throw new Error('SegmentedControl requires BU-P1-06');
}
