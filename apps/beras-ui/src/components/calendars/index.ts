import type { ComponentType } from 'react';
import type * as T from '../../public/types';

// BU-P1-11: replace this contract stub before the final gate.
function stub<Props>(name: string): ComponentType<Props> {
  const Component: ComponentType<Props> = () => { throw new Error(`${name} requires BU-P1-11`); };
  Component.displayName = `${name}ContractStub`;
  return Component;
}

export const MonthCalendar = stub<T.MonthCalendarProps>('MonthCalendar');
export const HolidayCalendar = stub<T.HolidayCalendarProps>('HolidayCalendar');
export const LeaveScheduleGrid = stub<T.LeaveScheduleGridProps>('LeaveScheduleGrid');
