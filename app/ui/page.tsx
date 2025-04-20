'use client';

import {
  Wallet,
  Send,
  Plus,
  History,
  HomeIcon,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BottomNavProps {
  className?: string;
}

const BottomNav: React.FC<BottomNavProps> = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100">
      <div className="grid h-full grid-cols-3 px-6">
        <button className="flex flex-col items-center justify-center gap-1 text-indigo-600 transition-colors hover:text-indigo-500">
          <HomeIcon className="w-5 h-5" />
          <span className="text-xs font-medium">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-1 text-gray-500 transition-colors hover:text-indigo-500">
          <PieChart className="w-5 h-5" />
          <span className="text-xs font-medium">Stats</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-1 text-gray-500 transition-colors hover:text-indigo-500">
          <History className="w-5 h-5" />
          <span className="text-xs font-medium">History</span>
        </button>
      </div>
    </div>
  );
};

const TokenDashboard = () => {
  return (
    <div className="relative w-[380px] h-[820px] bg-gray-50 overflow-hidden">
      <div className="h-full pb-16 p-6 flex flex-col gap-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Token Dashboard</h1>
          <Wallet className="w-6 h-6 text-gray-900 transition-transform hover:scale-110 cursor-pointer" />
        </div>

        {/* Token Cards */}
        <div className="flex flex-col relative pt-4">
          <div className="relative w-full transition-all duration-300 ease-in-out hover:-translate-y-2 hover:rotate-1">
            <Card className="py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white transition-shadow duration-300 hover:shadow-xl">
              <CardContent className="px-6 py-2 space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-white/70">Token A</p>
                  <h2 className="text-2xl font-semibold">Token A</h2>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-bold tracking-tight">1,000.000000</p>
                  <p className="text-base text-white/70">6 decimals</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="relative w-full -mt-36 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:rotate-1">
            <Card className="py-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white transition-shadow duration-300 hover:shadow-xl">
              <CardContent className="px-6 py-2 space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-white/70">Token B</p>
                  <h2 className="text-2xl font-semibold">Token B</h2>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-bold tracking-tight">500.000000</p>
                  <p className="text-base text-white/70">6 decimals</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-24 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-indigo-50 active:scale-95"
          >
            <Plus className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span>Mint</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-24 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-indigo-50 active:scale-95"
          >
            <Send className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span>Transfer</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-24 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-indigo-50 active:scale-95"
          >
            <History className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span>Approve</span>
          </Button>
        </div>

        {/* Recent Transactions */}
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="transition-colors hover:bg-gray-50">
                  <TableCell>Transfer</TableCell>
                  <TableCell>100.000000</TableCell>
                  <TableCell className="text-green-500">Success</TableCell>
                </TableRow>
                <TableRow className="transition-colors hover:bg-gray-50">
                  <TableCell>Mint</TableCell>
                  <TableCell>50.000000</TableCell>
                  <TableCell className="text-green-500">Success</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

const TransactionHistory = () => {
  return (
    <div className="relative w-[380px] h-[820px] bg-gray-50 overflow-hidden">
      <div className="h-full pb-16 p-6 flex flex-col gap-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <History className="w-6 h-6 text-gray-900" />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            All
          </Button>
          <Button variant="outline" className="flex-1">
            Mint
          </Button>
          <Button variant="outline" className="flex-1">
            Transfer
          </Button>
          <Button variant="outline" className="flex-1">
            Approve
          </Button>
        </div>

        {/* Transaction Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Transfer</TableCell>
                  <TableCell>Token A</TableCell>
                  <TableCell>100.000000</TableCell>
                  <TableCell className="text-green-500">Success</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mint</TableCell>
                  <TableCell>Token B</TableCell>
                  <TableCell>50.000000</TableCell>
                  <TableCell className="text-green-500">Success</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Approve</TableCell>
                  <TableCell>Token A</TableCell>
                  <TableCell>200.000000</TableCell>
                  <TableCell className="text-yellow-500">Pending</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

const StatsPage = () => {
  return (
    <div className="relative w-[380px] h-[820px] bg-gray-50 overflow-hidden">
      <div className="h-full pb-16 p-6 flex flex-col gap-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
          <PieChart className="w-6 h-6 text-gray-900 transition-transform hover:scale-110 cursor-pointer" />
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <ArrowUpRight className="w-5 h-5 text-white/70" />
                <span className="text-sm text-white/70">Sent</span>
              </div>
              <p className="text-2xl font-bold">1,234.56</p>
              <p className="text-sm text-white/70">Last 30 days</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <ArrowDownRight className="w-5 h-5 text-white/70" />
                <span className="text-sm text-white/70">Received</span>
              </div>
              <p className="text-2xl font-bold">5,678.90</p>
              <p className="text-sm text-white/70">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-2">
              {[40, 25, 35, 30, 45, 35, 55, 25, 40, 30].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-indigo-100 rounded-t transition-all hover:bg-indigo-200 cursor-pointer group"
                >
                  <div
                    className="bg-indigo-500 rounded-t transition-all group-hover:bg-indigo-600"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>May 1</span>
              <span>May 10</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium">Transfer Sent</p>
                  <p className="text-sm text-gray-500">To: 0x1234...5678</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">-100.00</p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium">Token Minted</p>
                  <p className="text-sm text-gray-500">Token B</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">+50.00</p>
                <p className="text-sm text-gray-500">5 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

const TokenDetailsPage = () => {
  return (
    <div className="relative w-[380px] h-[820px] bg-gray-50 overflow-hidden">
      <div className="h-full pb-16 p-6 flex flex-col gap-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Token A Details</h1>
        </div>

        {/* Token Info Card */}
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-1">
              <p className="text-sm text-white/70">Current Balance</p>
              <p className="text-4xl font-bold">1,000.000000</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <p className="text-sm text-white/70">Contract Address</p>
                <p className="text-sm font-medium">0x1234...5678</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-white/70">Decimals</p>
                <p className="text-sm font-medium">6</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button className="h-auto py-4 bg-indigo-600 hover:bg-indigo-700">
            <div className="flex flex-col items-center gap-2">
              <Send className="w-5 h-5" />
              <span>Transfer</span>
            </div>
          </Button>
          <Button variant="outline" className="h-auto py-4">
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>History</span>
            </div>
          </Button>
        </div>

        {/* Token Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <div className="space-y-2">
            {[1, 2, 3].map((_, i) => (
              <Card key={i} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Send className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">Transfer</p>
                        <p className="text-sm text-gray-500">To: 0x9876...4321</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex gap-4">
        <TokenDashboard />
        <TransactionHistory />
        <StatsPage />
        <TokenDetailsPage />
      </div>
    </div>
  );
}
