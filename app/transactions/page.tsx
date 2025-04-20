'use client';

import { useState } from 'react';
import { FilterBar } from '@/components/reusable/filter-bar';
import { TransactionTable } from '@/components/reusable/transaction-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sample data for the transaction history
const sampleTransactions = [
  {
    id: '1',
    type: 'send' as const,
    amount: '4928 DAI',
    from: '0x123...abc',
    to: '0x456...def',
    timestamp: '2 hours ago',
    status: 'completed' as const,
  },
  {
    id: '2',
    type: 'receive' as const,
    amount: '120 DAI',
    from: '0x789...ghi',
    to: '0x123...abc',
    timestamp: '5 hours ago',
    status: 'completed' as const,
  },
  {
    id: '3',
    type: 'mint' as const,
    amount: '100 USDC',
    from: '0x000...000',
    to: '0x123...abc',
    timestamp: '1 day ago',
    status: 'completed' as const,
  },
  {
    id: '4',
    type: 'burn' as const,
    amount: '50 USDC',
    from: '0x123...abc',
    to: '0x000...000',
    timestamp: '2 days ago',
    status: 'completed' as const,
  },
  {
    id: '5',
    type: 'send' as const,
    amount: '8000 USDC',
    from: '0x123...abc',
    to: '0x789...ghi',
    timestamp: '3 days ago',
    status: 'pending' as const,
  },
];

export default function TransactionHistoryPage() {
  const [searchValue, setSearchValue] = useState('');
  const [typeValue, setTypeValue] = useState('all');
  const [statusValue, setStatusValue] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  // Filter transactions based on search, type, status, and tab
  const filteredTransactions = sampleTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.from.toLowerCase().includes(searchValue.toLowerCase()) ||
      transaction.to.toLowerCase().includes(searchValue.toLowerCase());
    const matchesType = typeValue === 'all' || transaction.type === typeValue;
    const matchesStatus = statusValue === 'all' || transaction.status === statusValue;
    const matchesTab = activeTab === 'all' || transaction.type === activeTab;

    return matchesSearch && matchesType && matchesStatus && matchesTab;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Transaction History</h1>
      </div>

      <div className="mb-8">
        <FilterBar
          searchValue={searchValue}
          typeValue={typeValue}
          statusValue={statusValue}
          onSearch={setSearchValue}
          onTypeChange={setTypeValue}
          onStatusChange={setStatusValue}
        />
      </div>

      <div className="mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="send">Send</TabsTrigger>
            <TabsTrigger value="receive">Receive</TabsTrigger>
            <TabsTrigger value="mint">Mint</TabsTrigger>
            <TabsTrigger value="burn">Burn</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable transactions={filteredTransactions} />
        </CardContent>
      </Card>
    </div>
  );
}
