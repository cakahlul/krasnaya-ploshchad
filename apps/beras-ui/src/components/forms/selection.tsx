'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';

import type {
  AsyncViewState,
  BerasOption,
  ComboboxProps,
  MultiSelectProps,
  SearchComboboxProps,
} from '../../public/types';
import {
  commitStagedSelection,
  filterOptions,
  formActionDisabled,
  movementForKey,
  moveActiveOption,
  multiSelectionSessionTransition,
  runFormAction,
  selectionTransition,
  selectionValidityMessage,
  singleSelectionSessionTransition,
  toggleSelection,
} from './logic';
import {
  clickMeta,
  describedBy,
  FieldLabel,
  FieldMessages,
  fieldState,
  openMeta,
  rootClass,
  useFieldIds,
  useInputInteraction,
} from './shared';

const EMPTY_OPTIONS: readonly never[] = [];

function asyncMessage<Value extends string>(
  state: Exclude<AsyncViewState<readonly BerasOption<Value>[]>, { status: 'ready' }>,
): ReactNode {
  if (state.status === 'loading') {
    return (
      <div
        role="option"
        aria-selected="false"
        aria-disabled="true"
        aria-live="polite"
      >
        {state.label ?? 'Loading options…'}
      </div>
    );
  }
  return (
    <div
      role="option"
      aria-selected="false"
      aria-disabled="true"
      aria-live={state.status === 'error' ? 'assertive' : 'polite'}
    >
      <strong>{state.title}</strong>
      {state.description ? <small>{state.description}</small> : null}
    </div>
  );
}

function optionId(popupId: string, index: number): string {
  return `${popupId}-option-${index}`;
}

function SingleCombobox<Value extends string>({
  props,
  root,
}: {
  props: ComboboxProps<Value>;
  root: 'beras-combobox' | 'beras-search-combobox';
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
    options,
    open,
    query = '',
    placeholder = 'Search options',
    onValueChange,
    onOpenChange,
  } = props;
  const ids = useFieldIds(name);
  const popupId = `${ids.controlId}-listbox`;
  const interaction = useInputInteraction();
  const inputRef = useRef<HTMLInputElement>(null);
  const previousSingleControls = useRef({ open, query, value });
  const [search, setSearch] = useState(query);
  const [requestedActive, setRequestedActive] = useState<Value>();
  const readyOptions = options.status === 'ready' ? options.data : EMPTY_OPTIONS;
  const visibleOptions = filterOptions(readyOptions, search);
  const selectedOption = readyOptions.find((option) => option.value === value);
  const activeValue =
    visibleOptions.some((option) => option.value === requestedActive && !option.disabled)
      ? requestedActive
      : visibleOptions.some((option) => option.value === value && !option.disabled)
        ? value || undefined
        : moveActiveOption(visibleOptions, undefined, 'first');
  const activeIndex = visibleOptions.findIndex((option) => option.value === activeValue);
  const validationError = error;
  const validityMessage = selectionValidityMessage(label, error, required, value ? 1 : 0);
  const displayValue = open ? search : (selectedOption?.label ?? '');

  useEffect(() => {
    const nextControls = { open, query, value };
    const transition = singleSelectionSessionTransition(
      previousSingleControls.current,
      nextControls,
      readyOptions,
    );
    previousSingleControls.current = nextControls;
    if (!transition) return;
    setSearch(transition.search);
    setRequestedActive(transition.active);
  }, [open, query, readyOptions, value]);

  useEffect(() => {
    inputRef.current?.setCustomValidity(validityMessage);
  }, [validityMessage]);

  const requestOpen = (
    nextOpen: boolean,
    source: 'keyboard' | 'pointer' | 'programmatic',
    reason: 'action' | 'escape' | 'programmatic' = 'action',
  ) => {
    if (disabled || readOnly) return;
    if (nextOpen) {
      setSearch(query);
      setRequestedActive(
        value
          ? value
          : moveActiveOption(readyOptions, undefined, 'first'),
      );
    } else {
      setSearch(query);
      setRequestedActive(undefined);
    }
    onOpenChange(nextOpen, openMeta(source, reason));
  };

  const selectOption = (option: BerasOption<Value>, source: 'keyboard' | 'pointer') => {
    if (disabled || readOnly || option.disabled) return;
    onValueChange(option.value, { source });
    setSearch(query);
    setRequestedActive(option.value);
    onOpenChange(false, openMeta(source, 'action'));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    interaction.onKeyDown(event);
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      requestOpen(false, 'keyboard', 'escape');
      return;
    }
    const movement = movementForKey(event.key);
    if (movement) {
      event.preventDefault();
      if (!open) {
        requestOpen(true, 'keyboard');
        setRequestedActive(
          movement === 'previous' || movement === 'last'
            ? moveActiveOption(visibleOptions, undefined, 'last')
            : value || moveActiveOption(visibleOptions, undefined, 'first'),
        );
        return;
      }
      setRequestedActive(moveActiveOption(visibleOptions, activeValue, movement));
      return;
    }
    if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault();
      selectOption(visibleOptions[activeIndex], 'keyboard');
    }
  };

  const handleQuery = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.currentTarget.value;
    const meta = interaction.meta();
    setSearch(nextQuery);
    const filtered = filterOptions(readyOptions, nextQuery);
    setRequestedActive(moveActiveOption(filtered, undefined, 'first'));
    if (!open) onOpenChange(true, openMeta(meta.source, 'action'));
  };

  return (
    <div
      id={id}
      className={rootClass(root, className)}
      data-beras-state={
        options.status === 'ready'
          ? fieldState({ disabled, error: validationError, readOnly })
          : options.status
      }
      aria-busy={options.status === 'loading' || undefined}
    >
      <FieldLabel controlId={ids.controlId} label={label} required={required} />
      <input
        type="hidden"
        name={name}
        value={value}
        disabled={disabled}
      />
      <input
        ref={inputRef}
        id={ids.controlId}
        type="search"
        role="combobox"
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete="off"
        aria-required={required || undefined}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={popupId}
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(popupId, activeIndex) : undefined
        }
        aria-describedby={describedBy(
          helperText,
          validationError,
          ids.helperId,
          ids.errorId,
        )}
        aria-invalid={validityMessage ? true : undefined}
        onPointerDown={interaction.onPointerDown}
        onClick={(event) => {
          if (!open) requestOpen(true, clickMeta(event).source, 'action');
        }}
        onKeyDown={handleKeyDown}
        onChange={handleQuery}
      />
      {(value || search) && !disabled && !readOnly ? (
        <button
          type="button"
          aria-label={`Clear ${label}`}
          onClick={(event) => {
            const meta = clickMeta(event);
            setSearch('');
            setRequestedActive(moveActiveOption(readyOptions, undefined, 'first'));
            if (value) onValueChange('', meta);
          }}
        >
          Clear
        </button>
      ) : null}
      {open ? (
        <div
          id={popupId}
          role="listbox"
          aria-label={`${label} options`}
          aria-busy={options.status === 'loading' || undefined}
        >
          {options.status !== 'ready' ? (
            asyncMessage(options)
          ) : visibleOptions.length === 0 ? (
            <div role="option" aria-selected="false" aria-disabled="true">
              No matching options.
            </div>
          ) : (
            visibleOptions.map((option, index) => (
              <div
                id={optionId(popupId, index)}
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled || undefined}
                onPointerMove={() => {
                  if (!option.disabled) setRequestedActive(option.value);
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option, 'pointer')}
              >
                <span>{option.label}</span>
                {option.description ? <small>{option.description}</small> : null}
              </div>
            ))
          )}
        </div>
      ) : null}
      <FieldMessages
        {...ids}
        helperText={helperText}
        error={validationError}
      />
    </div>
  );
}

export function Combobox<Value extends string = string>(props: ComboboxProps<Value>) {
  return <SingleCombobox props={props} root="beras-combobox" />;
}

export function SearchCombobox<Value extends string = string>(
  props: SearchComboboxProps<Value>,
) {
  return <SingleCombobox props={props} root="beras-search-combobox" />;
}

export function MultiSelect<Value extends string = string>({
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
  open,
  query = '',
  staged = false,
  actions = [],
  onValueChange,
  onOpenChange,
  onAction,
}: MultiSelectProps<Value>) {
  const ids = useFieldIds(name);
  const popupId = `${ids.controlId}-listbox`;
  const interaction = useInputInteraction();
  const inputRef = useRef<HTMLInputElement>(null);
  const previousMultiControls = useRef({ open, query, value });
  const [search, setSearch] = useState(query);
  const [requestedActive, setRequestedActive] = useState<Value>();
  const [draft, setDraft] = useState<readonly Value[] | null>(null);
  const readyOptions = options.status === 'ready' ? options.data : EMPTY_OPTIONS;
  const visibleOptions = filterOptions(readyOptions, search);
  const selected = staged && open ? (draft ?? value) : value;
  const selectedOptions = readyOptions.filter((option) => selected.includes(option.value));
  const activeValue =
    visibleOptions.some((option) => option.value === requestedActive && !option.disabled)
      ? requestedActive
      : moveActiveOption(visibleOptions, undefined, 'first');
  const activeIndex = visibleOptions.findIndex((option) => option.value === activeValue);
  const displayValue = open
    ? search
    : selectedOptions.length
      ? selectedOptions.map((option) => option.label).join(', ')
      : '';
  const applyAction = actions.find((action) => action.id === 'apply');
  const cancelAction = actions.find((action) => action.id === 'cancel');
  const extraActions = actions.filter(
    (action) => action.id !== 'apply' && action.id !== 'cancel',
  );
  const validityMessage = selectionValidityMessage(
    label,
    error,
    required,
    value.length,
  );
  const applyActionState = {
    disabled,
    readOnly,
    actionDisabled: applyAction?.disabled,
    pending: applyAction?.pending,
  };
  const cancelActionState = {
    disabled,
    readOnly,
    actionDisabled: cancelAction?.disabled,
    pending: cancelAction?.pending,
  };

  useEffect(() => {
    const nextControls = { open, query, value };
    const transition = multiSelectionSessionTransition(
      previousMultiControls.current,
      nextControls,
      readyOptions,
      staged,
    );
    previousMultiControls.current = nextControls;
    if (!transition) return;
    setSearch(transition.search);
    setRequestedActive(transition.active);
    setDraft(transition.draft);
  }, [open, query, readyOptions, staged, value]);

  useEffect(() => {
    inputRef.current?.setCustomValidity(validityMessage);
  }, [validityMessage]);

  const requestOpen = (
    nextOpen: boolean,
    source: 'keyboard' | 'pointer' | 'programmatic',
    reason: 'action' | 'escape' | 'programmatic' = 'action',
  ) => {
    if (disabled || readOnly) return;
    if (nextOpen) {
      setDraft(staged ? value : null);
      setSearch(query);
      setRequestedActive(moveActiveOption(readyOptions, undefined, 'first'));
    } else {
      setDraft(null);
      setSearch(query);
      setRequestedActive(undefined);
    }
    onOpenChange(nextOpen, openMeta(source, reason));
  };

  const updateSelection = (
    nextValue: readonly Value[],
    source: 'keyboard' | 'pointer',
  ) => {
    const transition = selectionTransition(nextValue, staged);
    setDraft(transition.draft);
    if (transition.commit) onValueChange(transition.commit, { source });
  };

  const toggleOption = (option: BerasOption<Value>, source: 'keyboard' | 'pointer') => {
    if (disabled || readOnly || option.disabled) return;
    updateSelection(toggleSelection(selected, option.value), source);
  };

  const apply = (source: 'keyboard' | 'pointer') => {
    runFormAction(applyActionState, () => {
      onValueChange(commitStagedSelection(value, draft), { source });
      onAction?.('apply', { source });
      setDraft(null);
      setSearch(query);
      onOpenChange(false, openMeta(source, 'action'));
    });
  };

  const cancel = (source: 'keyboard' | 'pointer', escape = false) => {
    runFormAction(escape ? { disabled, readOnly } : cancelActionState, () => {
      setDraft(null);
      setSearch(query);
      onAction?.('cancel', { source });
      onOpenChange(false, openMeta(source, escape ? 'escape' : 'action'));
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    interaction.onKeyDown(event);
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      cancel('keyboard', true);
      return;
    }
    const movement = movementForKey(event.key);
    if (movement) {
      event.preventDefault();
      if (!open) {
        requestOpen(true, 'keyboard');
        setRequestedActive(
          movement === 'previous' || movement === 'last'
            ? moveActiveOption(visibleOptions, undefined, 'last')
            : moveActiveOption(visibleOptions, undefined, 'first'),
        );
        return;
      }
      setRequestedActive(moveActiveOption(visibleOptions, activeValue, movement));
      return;
    }
    const shouldToggle =
      open &&
      activeIndex >= 0 &&
      (event.key === 'Enter' || (event.key === ' ' && search.length === 0));
    if (shouldToggle) {
      event.preventDefault();
      toggleOption(visibleOptions[activeIndex], 'keyboard');
    }
  };

  const handleQuery = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.currentTarget.value;
    const meta = interaction.meta();
    setSearch(nextQuery);
    setRequestedActive(
      moveActiveOption(filterOptions(readyOptions, nextQuery), undefined, 'first'),
    );
    if (!open) {
      setDraft(staged ? value : null);
      onOpenChange(true, openMeta(meta.source, 'action'));
    }
  };

  const removeValue = (optionValue: Value, source: 'keyboard' | 'pointer') => {
    const nextValue = selected.filter((selectedValue) => selectedValue !== optionValue);
    if (staged && !open) {
      setDraft(nextValue);
      onOpenChange(true, openMeta(source, 'action'));
    } else {
      updateSelection(nextValue, source);
    }
  };

  return (
    <div
      id={id}
      className={rootClass('beras-multi-select', className)}
      data-beras-state={
        options.status === 'ready'
          ? fieldState({ disabled, error, readOnly })
          : options.status
      }
      aria-busy={options.status === 'loading' || undefined}
    >
      <FieldLabel controlId={ids.controlId} label={label} required={required} />
      {value.map((selectedValue, index) => (
        <input
          key={`${selectedValue}-${index}`}
          type="hidden"
          name={name}
          value={selectedValue}
          disabled={disabled}
        />
      ))}
      <input
        ref={inputRef}
        id={ids.controlId}
        type="search"
        role="combobox"
        value={displayValue}
        placeholder="Search options"
        disabled={disabled}
        readOnly={readOnly}
        autoComplete="off"
        aria-required={required || undefined}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={popupId}
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(popupId, activeIndex) : undefined
        }
        aria-describedby={describedBy(helperText, error, ids.helperId, ids.errorId)}
        aria-invalid={validityMessage ? true : undefined}
        onPointerDown={interaction.onPointerDown}
        onClick={(event) => {
          if (!open) requestOpen(true, clickMeta(event).source);
        }}
        onKeyDown={handleKeyDown}
        onChange={handleQuery}
      />
      {selectedOptions.length ? (
        <ul aria-label={`${label} selected values`}>
          {selectedOptions.map((option) => (
            <li key={option.value}>
              <span>{option.label}</span>
              <button
                type="button"
                aria-label={`Remove ${option.label}`}
                disabled={disabled || readOnly}
                onClick={(event) => removeValue(option.value, clickMeta(event).source)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open ? (
        <div
          id={popupId}
          role="listbox"
          aria-label={`${label} options`}
          aria-multiselectable="true"
          aria-busy={options.status === 'loading' || undefined}
        >
          {options.status !== 'ready' ? (
            asyncMessage(options)
          ) : visibleOptions.length === 0 ? (
            <div role="option" aria-selected="false" aria-disabled="true">
              No matching options.
            </div>
          ) : (
            visibleOptions.map((option, index) => (
              <div
                id={optionId(popupId, index)}
                key={option.value}
                role="option"
                aria-selected={selected.includes(option.value)}
                aria-disabled={option.disabled || undefined}
                onPointerMove={() => {
                  if (!option.disabled) setRequestedActive(option.value);
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleOption(option, 'pointer')}
              >
                <span aria-hidden="true">
                  {selected.includes(option.value) ? '✓ ' : ''}
                </span>
                <span>{option.label}</span>
                {option.description ? <small>{option.description}</small> : null}
              </div>
            ))
          )}
        </div>
      ) : null}
      {open && options.status === 'ready' ? (
        <div role="group" aria-label={`${label} selection actions`}>
          <button
            type="button"
            disabled={disabled || readOnly || readyOptions.every((option) => option.disabled)}
            onClick={(event) =>
              updateSelection(
                readyOptions
                  .filter((option) => !option.disabled)
                  .map((option) => option.value),
                clickMeta(event).source,
              )
            }
          >
            Select all
          </button>
          <button
            type="button"
            disabled={disabled || readOnly || selected.length === 0}
            onClick={(event) => updateSelection([], clickMeta(event).source)}
          >
            Clear
          </button>
          {extraActions.map((action) => {
            const actionState = {
              disabled,
              readOnly,
              actionDisabled: action.disabled,
              pending: action.pending,
            };
            return (
              <button
                key={action.id}
                type="button"
                disabled={formActionDisabled(actionState)}
                aria-busy={action.pending || undefined}
                onClick={(event) => {
                  runFormAction(actionState, () => {
                    onAction?.(action.id, clickMeta(event));
                  });
                }}
              >
                {action.pending ? `${action.label}…` : action.label}
              </button>
            );
          })}
          {staged ? (
            <>
              <button
                type="button"
                disabled={formActionDisabled(cancelActionState)}
                aria-busy={cancelAction?.pending || undefined}
                onClick={(event) => cancel(clickMeta(event).source)}
              >
                {cancelAction?.label ?? 'Cancel'}
              </button>
              <button
                type="button"
                disabled={formActionDisabled(applyActionState)}
                aria-busy={applyAction?.pending || undefined}
                onClick={(event) => apply(clickMeta(event).source)}
              >
                {applyAction?.label ?? 'Apply'}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
      <FieldMessages {...ids} helperText={helperText} error={error} />
    </div>
  );
}
