import type { ComponentType } from 'react';
import type * as T from '../../public/types';

// BU-P1-10: replace this contract stub before the final gate.
function stub<Props>(name: string): ComponentType<Props> {
  const Component: ComponentType<Props> = () => { throw new Error(`${name} requires BU-P1-10`); };
  Component.displayName = `${name}ContractStub`;
  return Component;
}

export const Legend = stub<T.LegendProps>('Legend');
export const DonutChart = stub<T.DonutChartProps>('DonutChart');
export const BarChart = stub<T.BarChartProps>('BarChart');
export const AreaChart = stub<T.AreaChartProps>('AreaChart');
export const LineChart = stub<T.LineChartProps>('LineChart');
export const BugTrendPanel = stub<T.BugTrendPanelProps>('BugTrendPanel');
export const SprintTrendPanel = stub<T.SprintTrendPanelProps>('SprintTrendPanel');
