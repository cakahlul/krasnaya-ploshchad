'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { cn } from '@src/lib/utils';

interface PieChartProps {
  data: {
    name: string;
    value: number;
  }[];
  className?: string;
}

// Visually distinct, accessible colors
const COLORS = [
  '#2563eb', // blue-600
  '#ef4444', // red-500
  '#f59e42', // orange-400
  '#10b981', // emerald-500
  '#a21caf', // purple-800
  '#eab308', // yellow-400
  '#0ea5e9', // sky-500
  '#f472b6', // pink-400
];

export default function PieChart({ data, className }: PieChartProps) {
  return (
    <div
      className={cn(
        'w-full h-full flex flex-col items-center gap-4',
        className,
      )}
    >
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(1)}%)`
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background, #fff))',
                border: '1px solid hsl(var(--border, #e5e7eb))',
                borderRadius: 'var(--radius, 0.5rem)',
                color: 'hsl(var(--foreground, #1e293b))',
                fontSize: '0.95rem',
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              formatter={(value: string) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
