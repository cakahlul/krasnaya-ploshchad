'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import '@krasnaya/beras-ui/styles.css';
import {
  CheckboxField,
  Combobox,
  DateField,
  DateRangeField,
  FieldGroup,
  FilterBar,
  MonthField,
  MultiSelect,
  SearchCombobox,
  SegmentedControl,
  SelectField,
  SwitchField,
  TextAreaField,
  TextField,
} from '@krasnaya/beras-ui';
import type {
  ChangeMeta,
  OpenChangeMeta,
} from '@krasnaya/beras-ui/types';
import {
  FORM_CASE_IDS,
  formFixtures,
} from '../../fixtures/forms';
import type { FormCaseId } from '../../fixtures/forms';

interface CatalogCaseManifestEntry {
  id: `${string}/${string}/${string}`;
  fixtureId: `fixture:${string}`;
}

interface CatalogRuntimeCase {
  id: CatalogCaseManifestEntry['id'];
  fixtureId: CatalogCaseManifestEntry['fixtureId'];
  render: () => ReactNode;
}

const presets = [
  { value: 'this-month', label: 'This month' },
  { value: 'previous-month', label: 'Previous month' },
] as const;

const segmentOptions = [
  { value: 'summary', label: 'Summary' },
  { value: 'details', label: 'Details' },
  { value: 'archived', label: 'Archived', disabled: true },
] as const;

function FormCase({ caseId }: { caseId: FormCaseId }) {
  const fixture = formFixtures[`fixture:${caseId}`];
  const [textValue, setTextValue] = useState(fixture.textValue);
  const [checked, setChecked] = useState(fixture.checked);
  const [singleValue, setSingleValue] = useState(fixture.singleValue);
  const [multiValue, setMultiValue] = useState(fixture.multiValue);
  const [dateValue, setDateValue] = useState(fixture.dateValue);
  const [monthValue, setMonthValue] = useState(fixture.monthValue);
  const [rangeValue, setRangeValue] = useState(fixture.rangeValue);
  const [open, setOpen] = useState(fixture.open);
  const [segmentValue, setSegmentValue] = useState<
    (typeof segmentOptions)[number]['value']
  >(
    fixture.variant === 'selection' ? 'details' : 'summary',
  );
  const [lastEvent, setLastEvent] = useState('No interaction yet.');

  const recordValue = (nextValue: unknown, meta: ChangeMeta) => {
    setLastEvent(`${meta.source}: ${JSON.stringify(nextValue)}`);
  };
  const handleOpen = (nextOpen: boolean, meta: OpenChangeMeta) => {
    setOpen(nextOpen);
    setLastEvent(`${meta.source}: ${nextOpen ? 'open' : 'closed'} (${meta.reason})`);
  };
  const handleAction = (actionId: string, meta: ChangeMeta) => {
    setLastEvent(`${meta.source}: action ${actionId}`);
  };
  const commonField = {
    helperText: fixture.helperText,
    disabled: fixture.disabled,
    error: fixture.error,
  };

  let content: ReactNode;
  switch (fixture.slug) {
    case 'combobox':
    case 'sprint-combobox':
    case 'project-combobox':
      content = (
        <Combobox
          {...commonField}
          name={fixture.slug}
          label={fixture.label}
          value={singleValue}
          options={fixture.options}
          open={open}
          query={fixture.query}
          onOpenChange={handleOpen}
          onValueChange={(nextValue, meta) => {
            setSingleValue(nextValue);
            recordValue(nextValue, meta);
          }}
        />
      );
      break;
    case 'epic-search':
    case 'global-search':
      content = (
        <>
          <SearchCombobox
            {...commonField}
            name={fixture.slug}
            label={fixture.label}
            value={singleValue}
            options={fixture.options}
            open={open}
            query={fixture.query}
            onOpenChange={handleOpen}
            onValueChange={(nextValue, meta) => {
              setSingleValue(nextValue);
              recordValue(nextValue, meta);
            }}
          />
          {fixture.variant === 'detail-open' ? (
            <article aria-label="Selected search result detail">
              <h3>BERAS-106 · Form selection and date controls</h3>
              <p>
                Controlled detail content remains separate from search and navigation
                behavior.
              </p>
            </article>
          ) : null}
        </>
      );
      break;
    case 'sprint-multiselect':
    case 'team-multiselect':
    case 'epic-multiselect':
      content = (
        <MultiSelect
          {...commonField}
          name={fixture.slug}
          label={fixture.label}
          value={multiValue}
          options={fixture.options}
          open={open}
          query={fixture.query}
          staged={fixture.staged}
          actions={
            fixture.staged
              ? [
                  { id: 'cancel', label: 'Cancel' },
                  { id: 'apply', label: 'Apply' },
                ]
              : undefined
          }
          onOpenChange={handleOpen}
          onAction={handleAction}
          onValueChange={(nextValue, meta) => {
            setMultiValue(nextValue);
            recordValue(nextValue, meta);
          }}
        />
      );
      break;
    case 'team-select':
      content = (
        <SelectField
          {...commonField}
          name="team"
          label={fixture.label}
          value={singleValue}
          options={fixture.options.status === 'ready' ? fixture.options.data : []}
          onValueChange={(nextValue, meta) => {
            setSingleValue(nextValue);
            recordValue(nextValue, meta);
          }}
        />
      );
      break;
    case 'date-range-field':
      content = (
        <DateRangeField
          {...commonField}
          name="date-range"
          label={fixture.label}
          value={rangeValue}
          presets={fixture.variant === 'preset' ? presets : undefined}
          onAction={handleAction}
          onValueChange={(nextValue, meta) => {
            setRangeValue(nextValue);
            recordValue(nextValue, meta);
          }}
        />
      );
      break;
    case 'month-field':
      content = (
        <MonthField
          {...commonField}
          name="month"
          label={fixture.label}
          value={monthValue}
          min="2026-01"
          max="2026-12"
          onValueChange={(nextValue, meta) => {
            setMonthValue(nextValue);
            recordValue(nextValue, meta);
          }}
        />
      );
      break;
    case 'report-filter-bar':
      content = (
        <FilterBar
          label={fixture.label}
          actions={[
            { id: 'clear', label: 'Clear', disabled: fixture.disabled },
            { id: 'apply', label: 'Apply', disabled: fixture.disabled },
          ]}
          onAction={handleAction}
        >
          <DateRangeField
            name="report-range"
            label="Report range"
            value={rangeValue}
            disabled={fixture.disabled}
            onValueChange={(nextValue, meta) => {
              setRangeValue(nextValue);
              recordValue(nextValue, meta);
            }}
          />
          <SelectField
            name="report-team"
            label="Team"
            value={singleValue}
            options={fixture.options.status === 'ready' ? fixture.options.data : []}
            disabled={fixture.disabled}
            onValueChange={(nextValue, meta) => {
              setSingleValue(nextValue);
              recordValue(nextValue, meta);
            }}
          />
        </FilterBar>
      );
      break;
    case 'tree-controls':
      content = (
        <FilterBar label={fixture.label}>
          <TextField
            name="tree-query"
            label="Search descendants"
            value={textValue}
            disabled={fixture.disabled}
            onValueChange={(nextValue, meta) => {
              setTextValue(nextValue);
              recordValue(nextValue, meta);
            }}
          />
          <SelectField
            name="tree-filter"
            label="Filter"
            value={singleValue}
            options={fixture.options.status === 'ready' ? fixture.options.data : []}
            disabled={fixture.disabled}
            onValueChange={(nextValue, meta) => {
              setSingleValue(nextValue);
              recordValue(nextValue, meta);
            }}
          />
        </FilterBar>
      );
      break;
    case 'json-import': {
      const pending = fixture.variant === 'pending';
      content = (
        <FilterBar
          label={fixture.label}
          actions={[{ id: 'import', label: 'Import JSON', pending }]}
          onAction={handleAction}
        >
          <TextAreaField
            name="json"
            label="Holiday records JSON"
            value={textValue}
            rows={8}
            helperText="Parsing and domain validation remain outside Beras."
            error={fixture.error}
            disabled={pending}
            onValueChange={(nextValue, meta) => {
              setTextValue(nextValue);
              recordValue(nextValue, meta);
            }}
          />
          {fixture.statusMessage ? (
            <p role={fixture.variant === 'failure' ? 'alert' : 'status'}>
              {fixture.statusMessage}
            </p>
          ) : null}
        </FilterBar>
      );
      break;
    }
    case 'segmented-control':
      content = (
        <SegmentedControl
          label={fixture.label}
          value={segmentValue}
          options={segmentOptions}
          disabled={fixture.disabled}
          onValueChange={(nextValue, meta) => {
            setSegmentValue(nextValue);
            recordValue(nextValue, meta);
          }}
        />
      );
      break;
    case 'text-field':
      content = (
        <TextField
          {...commonField}
          name="text"
          label={fixture.label}
          value={textValue}
          onValueChange={(nextValue, meta) => {
            setTextValue(nextValue);
            recordValue(nextValue, meta);
          }}
        />
      );
      break;
    case 'text-area-field':
      content = (
        <TextAreaField
          {...commonField}
          name="notes"
          label={fixture.label}
          value={textValue}
          onValueChange={(nextValue, meta) => {
            setTextValue(nextValue);
            recordValue(nextValue, meta);
          }}
        />
      );
      break;
    case 'switch-field':
      content = (
        <SwitchField
          {...commonField}
          name="notifications"
          label={fixture.label}
          value={checked}
          onValueChange={(nextValue, meta) => {
            setChecked(nextValue);
            recordValue(nextValue, meta);
          }}
        />
      );
      break;
    case 'checkbox-field':
      content = (
        <CheckboxField
          {...commonField}
          name="agreement"
          label={fixture.label}
          value={checked}
          onValueChange={(nextValue, meta) => {
            setChecked(nextValue);
            recordValue(nextValue, meta);
          }}
        />
      );
      break;
    case 'date-field':
      content = (
        <DateField
          {...commonField}
          name="date"
          label={fixture.label}
          value={dateValue}
          min="2026-01-01"
          max="2026-12-31"
          onValueChange={(nextValue, meta) => {
            setDateValue(nextValue);
            recordValue(nextValue, meta);
          }}
        />
      );
      break;
    case 'field-group':
      content = (
        <FieldGroup legend={fixture.label}>
          <TextField
            name="group-name"
            label="Name"
            value={textValue}
            onValueChange={(nextValue, meta) => {
              setTextValue(nextValue);
              recordValue(nextValue, meta);
            }}
          />
          <CheckboxField
            name="group-active"
            label="Active"
            value={checked}
            onValueChange={(nextValue, meta) => {
              setChecked(nextValue);
              recordValue(nextValue, meta);
            }}
          />
        </FieldGroup>
      );
      break;
    default:
      content = null;
  }

  return (
    <section
      data-beras-root
      className="beras-card"
      aria-label={`${fixture.label} ${fixture.variant} case`}
      data-case-variant={fixture.variant}
    >
      {content}
      <output aria-live="polite">Last event: {lastEvent}</output>
    </section>
  );
}

export const formCases: readonly CatalogRuntimeCase[] = FORM_CASE_IDS.map((id) => ({
  id,
  fixtureId: `fixture:${id}`,
  render: () => <FormCase caseId={id} />,
}));
