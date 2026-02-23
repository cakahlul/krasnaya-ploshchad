import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Trash2 } from 'lucide-react';
import { useHolidays } from '../hooks/useHolidayQueries';
import HolidayFormModal from './HolidayFormModal';
import { Tooltip, message } from 'antd';

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

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Holiday Calendar</h2>
            <p className="text-sm text-gray-500 mt-1">Click and drag dates to schedule new holidays.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50/80 p-1.5 rounded-full border border-gray-200">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-[140px] text-center font-bold text-gray-800 bg-white px-4 py-1.5 rounded-full shadow-sm text-sm tracking-wide uppercase">
            {currentDate.format('MMMM YYYY')}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="w-full relative overflow-hidden" style={{ minHeight: '600px' }}>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-center font-bold text-gray-400 text-xs tracking-wider uppercase py-2">
              {d}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="animate-spin text-purple-500 mb-4" size={32} />
            <span className="text-gray-500 font-medium">Loading holidays...</span>
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
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
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

                return (
                  <motion.div
                    key={dateStr}
                    onMouseDown={() => handleMouseDown(dateStr)}
                    onMouseEnter={() => handleMouseEnter(dateStr)}
                    onMouseUp={() => handleMouseUp(dateStr)}
                    whileHover={{ scale: 1.02, zIndex: 10 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative group min-h-[100px] p-2 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden
                      ${isSelected ? 'bg-purple-100 border-purple-400 shadow-inner' : isWeekend && dayHolidays.length === 0 ? 'bg-gray-50 border-gray-200' : 'bg-white hover:border-purple-300 hover:shadow-xl'}
                      ${dayHolidays.length > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}
                    `}
                    style={{ userSelect: 'none' }}
                  >
                    <div className={`
                      flex justify-center items-center w-8 h-8 rounded-full text-sm font-semibold mb-2
                      ${isToday ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'text-gray-700'}
                      ${dayHolidays.length > 0 && !isToday ? 'text-red-600' : ''}
                    `}>
                      {date.date()}
                    </div>
                    
                    {dayHolidays.length > 0 && (
                      <div className="flex flex-col justify-start gap-1 overflow-hidden h-[calc(100%-40px)]">
                        {dayHolidays.slice(0, 2).map((holiday) => (
                          <Tooltip key={holiday.id} title={holiday.holiday_name} mouseEnterDelay={0.5}>
                            <p className="text-xs font-bold text-red-600 truncate px-1">
                              {holiday.holiday_name}
                            </p>
                          </Tooltip>
                        ))}
                        {dayHolidays.length > 2 && (
                          <p className="text-[10px] font-semibold text-red-500 px-1 mt-auto">
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
