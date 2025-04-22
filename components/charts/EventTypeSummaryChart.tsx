'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TokenEvent } from '@/stores/slices/historySlice';

interface EventTypeSummaryChartProps {
  events: TokenEvent[];
}

interface ChartData {
  name: 'Mint' | 'Transfer' | 'Approve';
  count: number;
}

export default function EventTypeSummaryChart({ events }: EventTypeSummaryChartProps) {
  const processData = (eventsData: TokenEvent[]): ChartData[] => {
    const counts = {
      Mint: 0,
      Transfer: 0,
      Approve: 0,
    };

    eventsData.forEach((event) => {
      if (event.type in counts) {
        counts[event.type as keyof typeof counts]++;
      }
    });

    return [
      { name: 'Mint', count: counts.Mint },
      { name: 'Transfer', count: counts.Transfer },
      { name: 'Approve', count: counts.Approve },
    ];
  };

  const chartData = processData(events);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 0, // Adjusted left margin for YAxis labels
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8884d8" name="Event Count" />
      </BarChart>
    </ResponsiveContainer>
  );
}
