import type { ComponentType } from 'react';
import type * as T from '../../public/types';

// BU-P1-07: replace this contract stub before the final gate.
function stub<Props>(name: string): ComponentType<Props> {
  const Component: ComponentType<Props> = () => { throw new Error(`${name} requires BU-P1-07`); };
  Component.displayName = `${name}ContractStub`;
  return Component;
}

export const Dialog = stub<T.DialogProps>('Dialog');
export const ConfirmDialog = stub<T.ConfirmDialogProps>('ConfirmDialog');
export const LegalContentDialog = stub<T.LegalContentDialogProps>('LegalContentDialog');
export const Drawer = stub<T.DrawerProps>('Drawer');
export const Popover = stub<T.PopoverProps>('Popover');
export const MemberTasksDialog = stub<T.MemberTasksDialogProps>('MemberTasksDialog');
export const MemberFormDialog = stub<T.MemberFormDialogProps>('MemberFormDialog');
export const LeaveFormDialog = stub<T.LeaveFormDialogProps>('LeaveFormDialog');
export const HolidayFormDialog = stub<T.HolidayFormDialogProps>('HolidayFormDialog');
export const ConfigFormDialog = stub<T.ConfigFormDialogProps>('ConfigFormDialog');
export const TicketDetailDialog = stub<T.TicketDetailDialogProps>('TicketDetailDialog');
export const ApiKeyTable = stub<T.ApiKeyTableProps>('ApiKeyTable');
export const JsonImportPanel = stub<T.JsonImportPanelProps>('JsonImportPanel');
