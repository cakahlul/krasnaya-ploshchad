'use client';

import { useState, useMemo } from 'react';
import { Card, Segmented, DatePicker, Row, Col } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import type { Bug } from '../types/bug-monitoring.types';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface BugTrendChartProps {
  bugs: Bug[];
  showActiveOnly: boolean;
}

type TimeRange = 'week' | 'month' | 'year' | 'custom';

export default function BugTrendChart({ bugs, showActiveOnly }: BugTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [customDateRange, setCustomDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  // Group bugs by time period
  const trendData = useMemo(() => {
    // ... (logic remains same)
    const now = new Date();
    
    // Determine the date range
    let startDate: Date;
    let endDate: Date = now;
    let dateFormat: (date: Date) => string;
    let periodGenerator: (start: Date, i: number) => Date;
    let periodsCount: number;

    if (timeRange === 'custom' && customDateRange) {
      startDate = customDateRange[0].toDate();
      endDate = customDateRange[1].toDate();
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 31) {
        dateFormat = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
        periodGenerator = (s, i) => { const d = new Date(s); d.setDate(d.getDate() + i); return d; };
        periodsCount = daysDiff + 1;
      } else if (daysDiff <= 365) {
        dateFormat = (d) => `${d.getMonth() + 1}/${d.getDate()}`; // Weekly-ish resolution
        periodGenerator = (s, i) => { const d = new Date(s); d.setDate(d.getDate() + i * 7); return d; };
        periodsCount = Math.ceil(daysDiff / 7);
      } else {
        dateFormat = (d) => `${d.getMonth() + 1}/${d.getFullYear()}`;
        periodGenerator = (s, i) => { const d = new Date(s); d.setMonth(d.getMonth() + i); return d; };
        periodsCount = Math.ceil(daysDiff / 30);
      }
    } else if (timeRange === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      dateFormat = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
      periodGenerator = (s, i) => { const d = new Date(s); d.setDate(d.getDate() + i); return d; };
      periodsCount = 7;
    } else if (timeRange === 'month') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      dateFormat = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
      periodGenerator = (s, i) => { const d = new Date(s); d.setDate(d.getDate() + i); return d; };
      periodsCount = 30;
    } else { // Year
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 11);
      dateFormat = (d) => `${d.getMonth() + 1}/${d.getFullYear()}`;
      periodGenerator = (s, i) => { const d = new Date(s); d.setMonth(d.getMonth() + i); return d; };
      periodsCount = 12;
    }

    // Generate chart data
    const data = [];
    for (let i = 0; i < periodsCount; i++) {
        const currentDate = periodGenerator(startDate, i);
        // Ensure we don't go past today if not custom
        if (timeRange !== 'custom' && currentDate > now) break;

        const dateStr = dateFormat(currentDate);
        
        // Calculate Cumulative Counts up to this date
        // Active = Created <= Date AND (Not Done OR Updated > Date)
        // Closed = Done AND Updated <= Date
        
        // Use end of the day for comparison to include bugs from that day
        const comparisonDate = new Date(currentDate);
        comparisonDate.setHours(23, 59, 59, 999);

        let activeCount = 0;
        let closedCount = 0;

        bugs.forEach(bug => {
            const createdDate = new Date(bug.created);
            const updatedDate = new Date(bug.updated);
            
            if (bug.status === 'Done') {
                if (updatedDate <= comparisonDate) {
                    closedCount++;
                } else if (createdDate <= comparisonDate) {
                    // It was created before this date, but closed AFTER this date, so it was active
                    activeCount++;
                }
            } else {
                // Not done, just check creation
                if (createdDate <= comparisonDate) {
                    activeCount++;
                }
            }
        });

        data.push({
            date: dateStr,
            fullDate: currentDate,
            active: activeCount,
            closed: closedCount
        });
    }
    return data;

  }, [bugs, timeRange, customDateRange]);

  const handleTimeRangeChange = (value: TimeRange) => {
    setTimeRange(value);
    if (value !== 'custom') {
      setCustomDateRange(null);
    }
  };

  const currentActive = trendData.length > 0 ? trendData[trendData.length - 1].active : 0;
  const currentClosed = trendData.length > 0 ? trendData[trendData.length - 1].closed : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <Card
        title={
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-lg font-bold text-gray-800">📈 {showActiveOnly ? 'Active Bugs Trend' : 'Bug Trends'}</span>
              <p className="text-xs text-gray-500 font-normal mt-1">
                {showActiveOnly ? 'Cumulative Active bugs over time' : 'Cumulative Active vs Closed bugs over time'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Segmented
                size="small"
                options={[
                  { label: 'Week', value: 'week' },
                  { label: 'Month', value: 'month' },
                  { label: 'Year', value: 'year' },
                  { label: 'Custom', value: 'custom' },
                ]}
                value={timeRange}
                onChange={handleTimeRangeChange}
              />
              {timeRange === 'custom' && (
                <RangePicker
                  size="small"
                  value={customDateRange}
                  onChange={(dates) => {
                    if (dates) {
                        setCustomDateRange(dates as [Dayjs, Dayjs]);
                        setTimeRange('custom');
                    }
                  }}
                  format="MMM D, YYYY"
                />
              )}
            </div>
          </div>
        }
        className="shadow-md hover:shadow-lg transition-shadow duration-300"
      >
        <div className="flex gap-6 mb-4">
            <div>
                <p className="text-sm text-gray-500">Current Active</p>
                <p className="text-2xl font-bold text-red-500">{currentActive}</p>
            </div>
            {!showActiveOnly && (
            <div>
                <p className="text-sm text-gray-500">Total Closed</p>
                <p className="text-2xl font-bold text-green-500">{currentClosed}</p>
            </div>
            )}
        </div>

        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#6B7280' }} 
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis 
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Area 
                        type="monotone" 
                        dataKey="active" 
                        name="Active Bugs"
                        stroke="#EF4444" 
                        fillOpacity={1} 
                        fill="url(#colorActive)" 
                        strokeWidth={2}
                    />
                    {!showActiveOnly && (
                    <Area 
                        type="monotone" 
                        dataKey="closed" 
                        name="Closed Bugs"
                        stroke="#10B981" 
                        fillOpacity={1} 
                        fill="url(#colorClosed)" 
                        strokeWidth={2}
                    />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
