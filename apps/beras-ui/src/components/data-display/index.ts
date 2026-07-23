import type { ComponentType } from 'react';
import type * as T from '../../public/types';

// BU-P1-09: replace this contract stub before the final gate.
function stub<Props>(name: string): ComponentType<Props> {
  const Component: ComponentType<Props> = () => { throw new Error(`${name} requires BU-P1-09`); };
  Component.displayName = `${name}ContractStub`;
  return Component;
}

export function DataTable<Row>(props: T.DataTableProps<Row>): never {
  void props;
  throw new Error('DataTable requires BU-P1-09');
}

export const AuditLogPanel = stub<T.AuditLogPanelProps>('AuditLogPanel');
export const ActivityList = stub<T.ActivityListProps>('ActivityList');
export const TaskList = stub<T.TaskListProps>('TaskList');
export const IssueList = stub<T.IssueListProps>('IssueList');
export const HolidayList = stub<T.HolidayListProps>('HolidayList');
export const LeaveList = stub<T.LeaveListProps>('LeaveList');
export const TeamMetricsTable = stub<T.TeamMetricsTableProps>('TeamMetricsTable');
export const DefinitionList = stub<T.DefinitionListProps>('DefinitionList');
export const InstructionSteps = stub<T.InstructionStepsProps>('InstructionSteps');
