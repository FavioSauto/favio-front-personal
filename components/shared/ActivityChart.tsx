'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface DataPoint {
  date: string;
  value: number;
}

interface ChartOptions {
  grid?: {
    strokeDashArray?: number;
    color?: string;
  };
  fill?: {
    gradient?: {
      opacityFrom?: number;
      opacityTo?: number;
    };
  };
  colors?: string[];
}

interface ActivityChartProps {
  data: DataPoint[];
  title: string;
  className?: string;
  options?: ChartOptions;
}

export function ActivityChart({ data, title, className, options }: ActivityChartProps) {
  const strokeColor = options?.colors?.[0] ?? '#8884d8';
  const fillColor = options?.colors?.[0] ?? '#8884d8';
  const gridColor = options?.grid?.color ?? '#e5e7eb';
  const gridDash = options?.grid?.strokeDashArray ?? 3;

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-6">
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray={`${gridDash} ${gridDash}`} stroke={gridColor} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
            axisLine={false}
            tickLine={false}
            dx={-10}
          />
          <Tooltip
            formatter={(value: number) => [`$${value}`, 'Value']}
            labelFormatter={(label) => label}
            contentStyle={{
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity={options?.fill?.gradient?.opacityFrom ?? 0.3} />
              <stop offset="100%" stopColor={fillColor} stopOpacity={options?.fill?.gradient?.opacityTo ?? 0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2} fill="url(#colorGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
