// ✅ Dashboard page completed
'use client';

import { useState } from 'react';
import { ActivityChart } from '@/components/reusable/activity-chart';
import { QuickActionButton } from '@/components/reusable/quick-action-button';
import { TransactionTable } from '@/components/reusable/transaction-table';
import { TokenCard } from '@/components/reusable/token-card';
import { PlusCircle, Send, Clock } from 'lucide-react';

// Sample data for the dashboard
const sampleTransactions = [
  {
    id: '1',
    type: 'send' as const,
    token: 'DAI' as const,
    amount: '100.000000',
    from: '0x123...abc',
    to: '0x456...def',
    timestamp: '2 hours ago',
    status: 'completed' as const,
  },
  {
    id: '2',
    type: 'receive' as const,
    token: 'USDC' as const,
    amount: '50.000000',
    from: '0x789...ghi',
    to: '0x123...abc',
    timestamp: '5 hours ago',
    status: 'completed' as const,
  },
];

const sampleChartData = [
  { date: 'Mar 31', value: 1000 },
  { date: 'Apr 1', value: 1200 },
  { date: 'Apr 2', value: 900 },
  { date: 'Apr 3', value: 1500 },
  { date: 'Apr 4', value: 1300 },
];

export default function DashboardPage() {
  const [selectedToken, setSelectedToken] = useState<'DAI' | 'USDC'>('DAI');

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TokenCard
          token="DAI"
          balance="1,000.000000"
          value="$1,000.00"
          className="bg-[#7C3AED] text-white rounded-2xl shadow-lg p-4"
        />
        <TokenCard
          token="USDC"
          balance="500.000000"
          value="$500.00"
          className="bg-[#10B981] text-white rounded-2xl shadow-lg p-4"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            <QuickActionButton
              icon={PlusCircle}
              label="Mint"
              onClick={() => console.log('Mint clicked')}
              className="bg-black aspect-square text-white hover:bg-gray-900 rounded-2xl p-4"
            />
            <QuickActionButton
              icon={Send}
              label="Transfer"
              onClick={() => console.log('Transfer clicked')}
              className="bg-black aspect-square text-white hover:bg-gray-900 rounded-2xl p-4"
            />
            <QuickActionButton
              icon={Clock}
              label="Approve"
              onClick={() => console.log('Approve clicked')}
              className="bg-black aspect-square text-white hover:bg-gray-900 rounded-2xl p-4"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Activity Chart</h2>
          <div className="bg-white rounded-2xl p-6">
            <ActivityChart
              data={sampleChartData}
              title="24h Trading Volume"
              className="h-[300px]"
              options={{
                grid: {
                  strokeDashArray: 5,
                  color: '#e5e7eb',
                },
                fill: {
                  gradient: {
                    opacityFrom: 0.2,
                    opacityTo: 0.05,
                  },
                },
                colors: ['#7C3AED'],
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedToken === 'DAI' ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedToken('DAI')}
            >
              DAI
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedToken === 'USDC' ? 'bg-[#10B981] text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedToken('USDC')}
            >
              USDC
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl overflow-hidden">
          <TransactionTable transactions={sampleTransactions} />
        </div>
      </div>
    </div>
  );
}
