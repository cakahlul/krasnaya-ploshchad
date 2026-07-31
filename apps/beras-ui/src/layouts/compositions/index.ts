import type { ComponentType } from 'react';
import type * as T from '../../public/types';

// BU-P1-14: replace this contract stub before the final gate.
function stub<Props>(name: string): ComponentType<Props> {
  const Component: ComponentType<Props> = () => { throw new Error(`${name} requires BU-P1-14`); };
  Component.displayName = `${name}ContractStub`;
  return Component;
}

export const DashboardOverview = stub<T.DashboardOverviewProps>('DashboardOverview');
export const BugMonitoringView = stub<T.BugMonitoringViewProps>('BugMonitoringView');
export const ConfigurationView = stub<T.ConfigurationViewProps>('ConfigurationView');
export const McpConnectionView = stub<T.McpConnectionViewProps>('McpConnectionView');
export const ProductivitySummaryView = stub<T.ProductivitySummaryViewProps>('ProductivitySummaryView');
export const ReportsView = stub<T.ReportsViewProps>('ReportsView');
export const EpicExplorerView = stub<T.EpicExplorerViewProps>('EpicExplorerView');
export const HolidayManagementView = stub<T.HolidayManagementViewProps>('HolidayManagementView');
export const TalentLeaveView = stub<T.TalentLeaveViewProps>('TalentLeaveView');
export const TeamMembersView = stub<T.TeamMembersViewProps>('TeamMembersView');
