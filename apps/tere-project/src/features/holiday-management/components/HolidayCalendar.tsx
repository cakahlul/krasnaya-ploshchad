import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useHolidays } from '../hooks/useHolidayQueries';
import HolidayFormModal from './HolidayFormModal';
import { Tooltip } from 'antd';
import { useThemeColors } from '@src/hooks/useTheme';

dayjs.extend(isBetween);

export default function HolidayCalendar() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [direction, setDirection] = useState(0);

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragCurrent, setDragCurrent] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null);
  const [existingHolidaysForRange, setExistingHolidaysForRange] = useState<any[]>([]);

  const { data: holidays, isLoading } = useHolidays();
  const T = useThemeColors();

  const handleNextMonth = () => {
    setDirection(1);
    setCurrentDate(currentDate.add(1, 'month'));
  };

  const handlePrevMonth = () => {
    setDirection(-1);
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const getDaysInMonth = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const days = [];

    // Prefix empty slots for start of month
    for (let i = 0; i < startOfMonth.day(); i++) {
      days.push(null);
    }

    // Days in current month
    for (let i = 1; i <= endOfMonth.date(); i++) {
      days.push(currentDate.date(i));
    }

    return days;
  };

  const holidayMap = useMemo(() => {
    const map = new Map<string, any[]>();
    if (holidays) {
      holidays.forEach(h => {
        const dateStr = dayjs(h.holiday_date).format('YYYY-MM-DD');
        const existing = map.get(dateStr) || [];
        existing.push(h);
        map.set(dateStr, existing);
      });
    }
    return map;
  }, [holidays]);

  // --- Drag Logic ---
  const handleMouseDown = (dateStr: string) => {
    setIsDragging(true);
    setDragStart(dateStr);
    setDragCurrent(dateStr);
  };

  const handleMouseEnter = (dateStr: string) => {
    if (isDragging) {
      setDragCurrent(dateStr);
    }
  };

  const handleMouseUp = (dateStr: string) => {
    if (!isDragging || !dragStart) return;

    let start = dayjs(dragStart);
    let end = dayjs(dateStr);

    if (start.isAfter(end)) {
      const temp = start;
      start = end;
      end = temp;
    }

    const startStr = start.format('YYYY-MM-DD');
    const endStr = end.format('YYYY-MM-DD');
    setSelectedRange({
      start: startStr,
      end: endStr,
    });

    // Gather all existing holidays in this range
    const existingInSelection = [];
    let cur = start;
    while (cur.isBefore(end) || cur.isSame(end, 'day')) {
      const hdys = holidayMap.get(cur.format('YYYY-MM-DD')) || [];
      existingInSelection.push(...hdys);
      cur = cur.add(1, 'day');
    }
    setExistingHolidaysForRange(existingInSelection);

    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
    setIsModalOpen(true);
  };

  const isDateSelected = (dateStr: string) => {
    if (!isDragging || !dragStart || !dragCurrent) return false;
    let start = dayjs(dragStart);
    let current = dayjs(dragCurrent);
    if (start.isAfter(current)) {
      const temp = start;
      start = current;
      current = temp;
    }
    const d = dayjs(dateStr);
    return d.isBetween(start, current, 'day', '[]');
  };

  // Variants for month transition
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Derived colors
  const accentTint = `${T.accent}15`;
  const weekendBg = T.isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb';
  const hoverBorder = `${T.accent}60`;
  const selectedBg = `${T.accent}18`;
  const selectedBorder = `${T.accent}80`;
  const holidayBg = T.isDark ? 'rgba(239,68,68,0.08)' : 'rgba(254,242,242,0.5)';
  const holidayBorder = T.isDark ? 'rgba(239,68,68,0.25)' : '#fecaca';

  return (
    <div
      style={{
        background: T.cardBg,
        border: `1px solid ${T.cardBrd}`,
        borderRadius: 14,
      }}
      className="p-8 transition-shadow hover:shadow-md"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div
            style={{ background: accentTint, color: T.accent, borderRadius: 10 }}
            className="p-3"
          >
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: T.titleCol, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>
              Holiday Calendar
            </h2>
            <p style={{ color: T.subCol, margin: '2px 0 0', fontSize: 12.5, fontFamily: "'Space Grotesk',sans-serif" }}>
              Click and drag dates to schedule new holidays.
            </p>
          </div>
        </div>

        <div
          style={{ background: T.iconBg, border: `1px solid ${T.cardBrd}`, borderRadius: 9999 }}
          className="flex items-center gap-2 p-1.5"
        >
          <button
            onClick={handlePrevMonth}
            style={{ color: T.iconStr }}
            className="p-2 rounded-full transition-colors hover:opacity-70"
          >
            <ChevronLeft size={20} />
          </button>
          <span
            style={{
              color: T.titleCol,
              background: T.cardBg,
              borderRadius: 9999,
              fontFamily: "'Space Grotesk',sans-serif",
            }}
            className="min-w-[140px] text-center font-bold px-4 py-1.5 text-sm tracking-wide uppercase"
          >
            {currentDate.format('MMMM YYYY')}
          </span>
          <button
            onClick={handleNextMonth}
            style={{ color: T.iconStr }}
            className="p-2 rounded-full transition-colors hover:opacity-70"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="w-full relative overflow-hidden" style={{ minHeight: 600 }}>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(d => (
            <div
              key={d}
              style={{ color: T.subCol, fontFamily: "'Space Grotesk',sans-serif" }}
              className="text-center font-bold text-xs tracking-wider uppercase py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="animate-spin mb-4" style={{ color: T.accent }} size={32} />
            <span style={{ color: T.subCol, fontFamily: "'Space Grotesk',sans-serif" }} className="font-medium">
              Loading holidays...
            </span>
          </div>
        ) : (
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentDate.format('YYYY-MM')}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4 relative"
            >
              {days.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="min-h-[100px]" />;

                const dateStr = date.format('YYYY-MM-DD');
                const isToday = date.isSame(dayjs(), 'day');
                const dayHolidays = holidayMap.get(dateStr) || [];
                const isSelected = isDateSelected(dateStr);
                const isWeekend = date.day() === 0 || date.day() === 6;
                const hasHoliday = dayHolidays.length > 0;

                const cellBg = isSelected
                  ? selectedBg
                  : hasHoliday
                    ? holidayBg
                    : isWeekend
                      ? weekendBg
                      : T.cardBg;

                const cellBorder = isSelected
                  ? selectedBorder
                  : hasHoliday
                    ? holidayBorder
                    : T.cardBrd;

                return (
                  <motion.div
                    key={dateStr}
                    onMouseDown={() => handleMouseDown(dateStr)}
                    onMouseEnter={() => handleMouseEnter(dateStr)}
                    onMouseUp={() => handleMouseUp(dateStr)}
                    whileHover={{ scale: 1.02, zIndex: 10 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: cellBg,
                      border: `1px solid ${cellBorder}`,
                      borderRadius: 12,
                      userSelect: 'none',
                    }}
                    className="relative group min-h-[100px] p-2 transition-all duration-200 cursor-pointer overflow-hidden"
                  >
                    <div
                      style={{
                        background: isToday ? T.accent : 'transparent',
                        color: isToday ? '#fff' : hasHoliday ? '#dc2626' : T.rowCol,
                        boxShadow: isToday ? `0 2px 8px ${T.accent}40` : 'none',
                        fontFamily: "'Space Grotesk',sans-serif",
                      }}
                      className="flex justify-center items-center w-8 h-8 rounded-full text-sm font-semibold mb-2"
                    >
                      {date.date()}
                    </div>

                    {hasHoliday && (
                      <div className="flex flex-col justify-start gap-1 overflow-hidden h-[calc(100%-40px)]">
                        {dayHolidays.slice(0, 2).map((holiday) => (
                          <Tooltip key={holiday.id} title={holiday.holiday_name} mouseEnterDelay={0.5}>
                            <p className="text-xs font-bold text-red-600 truncate px-1" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                              {holiday.holiday_name}
                            </p>
                          </Tooltip>
                        ))}
                        {dayHolidays.length > 2 && (
                          <p className="text-[10px] font-semibold text-red-500 px-1 mt-auto" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                            +{dayHolidays.length - 2} more
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {isModalOpen && selectedRange && (
        <HolidayFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedRange={selectedRange}
          existingHolidays={existingHolidaysForRange}
        />
      )}
    </div>
  );
}
