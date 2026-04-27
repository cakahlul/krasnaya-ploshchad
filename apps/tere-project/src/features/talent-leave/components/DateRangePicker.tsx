'use client';
import { DatePicker } from 'antd';
import { useTalentLeaveStore } from '../store/talentLeaveStore';
import dayjs, { type Dayjs } from 'dayjs';
import { CalendarOutlined } from '@ant-design/icons';
import { useThemeColors } from '@src/hooks/useTheme';

const { RangePicker } = DatePicker;

export function DateRangePicker() {
  const { dateRangeStart, dateRangeEnd, setDateRange } = useTalentLeaveStore();
  const { accent, cardBrd } = useThemeColors();

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
      suffixIcon={<CalendarOutlined style={{ color: accent }} />}
      size="large"
      style={{
        borderRadius: '8px',
        borderColor: cardBrd,
        boxShadow: 'none',
      }}
    />
  );
}
