'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import '@krasnaya/beras-ui/styles.css';
import {
  ApiKeyTable,
  ConfigFormDialog,
  ConfirmDialog,
  Dialog,
  Drawer,
  HolidayFormDialog,
  JsonImportPanel,
  LeaveFormDialog,
  LegalContentDialog,
  MemberFormDialog,
  MemberTasksDialog,
  Popover,
  TicketDetailDialog,
} from '@krasnaya/beras-ui/components';
import type {
  ActionHandler,
  FormValue,
  OpenChangeHandler,
  ValueChangeHandler,
} from '@krasnaya/beras-ui/types';
import {
  OVERLAY_CASE_IDS,
  overlayFixtures,
} from '../../fixtures/overlays';
import type { OverlayCaseId } from '../../fixtures/overlays';

interface CatalogRuntimeCase {
  id: `${string}/${string}/${string}`;
  fixtureId: `fixture:${string}`;
  render: () => ReactNode;
}

function OverlayPreview({ caseId }: { caseId: OverlayCaseId }) {
  const fixture = overlayFixtures[`fixture:${caseId}`];
  const [open, setOpen] = useState(fixture.open);
  const [formValue, setFormValue] = useState<FormValue>(fixture.value);
  const [jsonValue, setJsonValue] = useState(fixture.jsonValue);
  const [lastEvent, setLastEvent] = useState('No interaction yet.');
  const handleOpen: OpenChangeHandler = (nextOpen, meta) => {
    setOpen(nextOpen);
    setLastEvent(`${meta.source}: ${nextOpen ? 'open' : 'closed'} (${meta.reason})`);
  };
  const handleAction: ActionHandler = (actionId, meta) => {
    setLastEvent(`${meta.source}: action ${actionId}`);
  };
  const handleFormValue: ValueChangeHandler<FormValue> = (nextValue, meta) => {
    setFormValue(nextValue);
    setLastEvent(`${meta.source}: form value changed`);
  };
  const handleJsonValue: ValueChangeHandler<string> = (nextValue, meta) => {
    setJsonValue(nextValue);
    setLastEvent(`${meta.source}: JSON value changed`);
  };
  const commonDialog = {
    open,
    title: fixture.title,
    description: fixture.description,
    onOpenChange: handleOpen,
  };

  let component: ReactNode;
  switch (fixture.slug) {
    case 'legal-dialog':
      component = (
        <LegalContentDialog
          {...commonDialog}
          document={fixture.document}
          content={<p>{fixture.content}</p>}
        />
      );
      break;
    case 'member-tasks':
      component = (
        <MemberTasksDialog
          {...commonDialog}
          state={fixture.state}
          actions={fixture.actions}
          onAction={handleAction}
        />
      );
      break;
    case 'member-form':
      component = (
        <MemberFormDialog
          {...commonDialog}
          value={formValue}
          actions={fixture.actions}
          onValueChange={handleFormValue}
          onAction={handleAction}
        />
      );
      break;
    case 'leave-form':
      component = (
        <LeaveFormDialog
          {...commonDialog}
          value={formValue}
          actions={fixture.actions}
          onValueChange={handleFormValue}
          onAction={handleAction}
        />
      );
      break;
    case 'holiday-form':
      component = (
        <HolidayFormDialog
          {...commonDialog}
          value={formValue}
          actions={fixture.actions}
          onValueChange={handleFormValue}
          onAction={handleAction}
        />
      );
      break;
    case 'config-form':
      component = (
        <ConfigFormDialog
          {...commonDialog}
          value={formValue}
          actions={fixture.actions}
          onValueChange={handleFormValue}
          onAction={handleAction}
        />
      );
      break;
    case 'dialog':
      component = (
        <Dialog {...commonDialog} closeOnBackdrop={fixture.closeOnBackdrop}>
          <p>{fixture.content}</p>
        </Dialog>
      );
      break;
    case 'confirm-dialog':
      component = (
        <ConfirmDialog
          {...commonDialog}
          message="Confirm this deterministic catalog action?"
          cancelAction={fixture.actions[0]}
          confirmAction={fixture.actions[1]}
          onAction={handleAction}
        />
      );
      break;
    case 'drawer':
      component = (
        <Drawer
          {...commonDialog}
          closeOnBackdrop={fixture.closeOnBackdrop}
          placement="start"
        >
          <p>{fixture.content}</p>
        </Drawer>
      );
      break;
    case 'popover':
      component = (
        <Popover
          open={open}
          label={fixture.title}
          trigger="Toggle details"
          onOpenChange={handleOpen}
        >
          <p>{fixture.content}</p>
        </Popover>
      );
      break;
    case 'ticket-detail':
      component = (
        <TicketDetailDialog
          {...commonDialog}
          item={fixture.item}
          content={fixture.content}
          actions={fixture.actions}
          onAction={handleAction}
        />
      );
      break;
    case 'api-key-table':
      component = (
        <ApiKeyTable
          state={fixture.state}
          actions={fixture.actions}
          onAction={handleAction}
        />
      );
      break;
    case 'json-import':
      component = (
        <JsonImportPanel
          label={fixture.title}
          value={jsonValue}
          helperText={fixture.helperText}
          error={fixture.error}
          actions={fixture.actions}
          onValueChange={handleJsonValue}
          onAction={handleAction}
        />
      );
      break;
    default:
      component = null;
  }

  return (
    <section data-beras-root aria-label={`${fixture.title}: ${fixture.variant}`}>
      <button type="button" onClick={() => setOpen(true)}>
        Open example
      </button>
      {component}
      <output aria-live="polite">{lastEvent}</output>
    </section>
  );
}

export const overlayCases: readonly CatalogRuntimeCase[] = OVERLAY_CASE_IDS.map((id) => ({
  id,
  fixtureId: `fixture:${id}`,
  render: () => <OverlayPreview caseId={id} />,
}));
