'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TokenEvent } from '@/stores/slices/historySlice';

interface TokenDistributionChartProps {
  events: TokenEvent[];
}

interface ChartData {
  name: 'DAI' | 'USDC';
  value: number;
}

const COLORS = { DAI: '#FFBB28', USDC: '#0088FE' }; // Yellow for DAI, Blue for USDC

export default function TokenDistributionChart({ events }: TokenDistributionChartProps) {
  const processData = (eventsData: TokenEvent[]): ChartData[] => {
    const counts = {
      DAI: 0,
      USDC: 0,
    };

    eventsData.forEach((event) => {
      if (event.token === 'DAI') {
        counts.DAI++;
      } else if (event.token === 'USDC') {
        counts.USDC++;
      }
    });

    // Explicitly type the array before filtering
    const processed: ChartData[] = [
      { name: 'DAI', value: counts.DAI },
      { name: 'USDC', value: counts.USDC },
    ];
    return processed.filter((data) => data.value > 0);
  };

  const chartData = processData(events);

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">No data for this chart.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          // label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
