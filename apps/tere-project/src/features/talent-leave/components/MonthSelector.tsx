'use client';
import { DatePicker } from 'antd';
import { useTalentLeaveStore } from '../store/talentLeaveStore';
import dayjs, { Dayjs } from 'dayjs';

export function MonthSelector() {
  const selectedMonthStart = useTalentLeaveStore(
    (state) => state.selectedMonthStart
  );
  const setSelectedMonthStart = useTalentLeaveStore(
    (state) => state.setSelectedMonthStart
  );

  const handleChange = (date: Dayjs | null) => {
    if (date) {
      // Convert to first day of selected month
      const firstDayOfMonth = date.startOf('month').toDate();
      setSelectedMonthStart(firstDayOfMonth);
    }
  };

  return (
    <DatePicker
      picker="month"
      value={dayjs(selectedMonthStart)}
      onChange={handleChange}
      format="MMMM YYYY"
      placeholder="Select month"
    />
  );
}
