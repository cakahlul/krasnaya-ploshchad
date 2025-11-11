'use client';
import { DatePicker } from 'antd';
import { useTalentLeaveStore } from '../store/talentLeaveStore';
import dayjs, { type Dayjs } from 'dayjs';
import { CalendarOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

export function DateRangePicker() {
  const { dateRangeStart, dateRangeEnd, setDateRange } = useTalentLeaveStore();

  const handleChange = (dates: null | (Dayjs | null)[]) => {
    if (dates && dates[0] && dates[1]) {
      const start = dates[0].toDate();
      const end = dates[1].toDate();

      // Set to start of day for start date
      start.setHours(0, 0, 0, 0);

      // Set to end of day for end date
      end.setHours(23, 59, 59, 999);

      setDateRange(start, end);
    }
  };

  return (
    <RangePicker
      value={[dayjs(dateRangeStart), dayjs(dateRangeEnd)]}
      onChange={handleChange}
      format="DD/MM/YYYY"
      placeholder={['Start Date', 'End Date']}
      suffixIcon={<CalendarOutlined className="text-indigo-600" />}
      className="shadow-sm hover:shadow-md transition-shadow duration-200"
      size="large"
      style={{
        borderRadius: '8px',
        borderColor: '#e0e7ff',
      }}
    />
  );
}
