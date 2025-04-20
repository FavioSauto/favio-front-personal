'use client';
import { useEffect } from 'react';
import { useOptimistic, useTransition } from 'react';
import { Wallet, Send, Plus, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { ActionButton, MintFormData, TransferFormData, ApproveFormData } from '@/components/shared/ActionButton';
import {
  useDaiBalances,
  useUsdcBalances,
  useBalanceActions,
  useEventsActions,
  useEvents,
} from '@/providers/stores/storeProvider';
import { useAccount } from 'wagmi';

const TokenDashboard = () => {
  const { address: walletAddress } = useAccount();
  const daiBalance = useDaiBalances();
  const usdcBalance = useUsdcBalances();
  const events = useEvents();
  const { fetchEvents } = useEventsActions();
  const { mintToken, transferToken, approveToken } = useBalanceActions();
  const { fetchTokenBalances } = useBalanceActions();

  // Add useTransition hook
  const [isPending, startOptimisticTransition] = useTransition();

  // Optimistic updates for USDC balance
  const [optimisticUsdcBalance, addOptimisticUsdcUpdate] = useOptimistic(
    { balance: usdcBalance.balance ?? 0 },
    (state, action) => {
      switch (action.type) {
        case 'mint':
          return { balance: state.balance + Number(action.amount) };
        case 'transfer':
          return { balance: state.balance - Number(action.amount) };
        default:
          return state;
      }
    }
  );

  // Optimistic updates for DAI balance
  const [optimisticDaiBalance, addOptimisticDaiUpdate] = useOptimistic(
    { balance: daiBalance.balance ?? 0 },
    (state, action) => {
      switch (action.type) {
        case 'mint':
          return { balance: state.balance + Number(action.amount) };
        case 'transfer':
          return { balance: state.balance - Number(action.amount) };
        default:
          return state;
      }
    }
  );

  // Optimistic updates for events
  const [optimisticEvents, addOptimisticEvent] = useOptimistic(events, (currentEvents, newEvent) => {
    return [
      {
        id: `optimistic-${Date.now()}`,
        transactionHash: 'pending',
        ...newEvent,
      },
      ...currentEvents,
    ];
  });

  useEffect(() => {
    fetchTokenBalances(walletAddress);
    fetchEvents(walletAddress);
  }, [fetchTokenBalances, walletAddress, fetchEvents]);

  async function handleMint(data: MintFormData) {
    // Wrap optimistic updates in startTransition
    startOptimisticTransition(() => {
      if (data.tokenType === 'USDC' || !data.tokenType) {
        addOptimisticUsdcUpdate({ type: 'mint', amount: data.amount });

        // Add optimistic event
        addOptimisticEvent({
          type: 'Mint',
          amount: data.amount,
          status: 'Pending',
        });
      } else if (data.tokenType === 'DAI') {
        addOptimisticDaiUpdate({ type: 'mint', amount: data.amount });

        // Add optimistic event
        addOptimisticEvent({
          type: 'Mint',
          amount: data.amount,
          status: 'Pending',
        });
      }
    });

    try {
      // Perform the actual transaction
      await mintToken(data.tokenType || 'USDC', data.amount);

      // After transaction is successful, fetch the real updated balances and events
      fetchTokenBalances(walletAddress);
      fetchEvents(walletAddress);
    } catch (error) {
      console.error('Mint failed:', error);
      // The state will automatically revert to the confirmed state
      // when fetchTokenBalances runs after this error
      fetchTokenBalances(walletAddress);
      fetchEvents(walletAddress);
    }
  }

  async function handleTransfer(data: TransferFormData) {
    // Wrap optimistic updates in startTransition
    startOptimisticTransition(() => {
      if (data.tokenType === 'USDC' || !data.tokenType) {
        addOptimisticUsdcUpdate({ type: 'transfer', amount: data.amount });

        // Add optimistic event
        addOptimisticEvent({
          type: 'Transfer',
          amount: data.amount,
          recipient: data.address,
          status: 'Pending',
        });
      } else if (data.tokenType === 'DAI') {
        addOptimisticDaiUpdate({ type: 'transfer', amount: data.amount });

        // Add optimistic event
        addOptimisticEvent({
          type: 'Transfer',
          amount: data.amount,
          recipient: data.address,
          status: 'Pending',
        });
      }
    });

    try {
      // Perform the actual transaction
      await transferToken(data.tokenType || 'USDC', data.address, data.amount);

      // After transaction is successful, fetch the real updated balances and events
      fetchTokenBalances(walletAddress);
      fetchEvents(walletAddress);
    } catch (error) {
      console.error('Transfer failed:', error);
      // The state will automatically revert to the confirmed state
      // when fetchTokenBalances runs after this error
      fetchTokenBalances(walletAddress);
      fetchEvents(walletAddress);
    }
  }

  async function handleApprove(data: ApproveFormData) {
    // Wrap optimistic updates in startTransition
    startOptimisticTransition(() => {
      // Add optimistic event for the approve action
      addOptimisticEvent({
        type: 'Approve',
        amount: data.allowance,
        spender: data.address,
        status: 'Pending',
      });
    });

    try {
      // Perform the actual transaction
      await approveToken(data.tokenType || 'USDC', data.address, data.allowance);

      // After transaction is successful, fetch the real updated events
      fetchEvents(walletAddress);
    } catch (error) {
      console.error('Approve failed:', error);
      fetchEvents(walletAddress);
    }
  }

  return (
    <>
      {/* Header */}
      <PageHeader title="Token Dashboard" icon={<Wallet className="w-6 h-6 text-gray-900" />} />

      {/* Token Cards */}
      <div className="flex flex-col md:flex-row md:gap-6 relative pt-4">
        <div className="relative w-full md:w-1/2 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:rotate-1">
          <Card className="py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white transition-shadow duration-300 hover:shadow-xl">
            <CardContent className="px-6 py-2 space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-white/70">DAI</p>
                <h2 className="text-2xl font-semibold">DAI</h2>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold tracking-tight">{optimisticDaiBalance.balance}</p>
                <p className="text-base text-white/70">18 decimals</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="relative w-full md:w-1/2 -mt-36 md:mt-0 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:rotate-1">
          <Card className="py-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white transition-shadow duration-300 hover:shadow-xl">
            <CardContent className="px-6 py-2 space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-white/70">USDC</p>
                <h2 className="text-2xl font-semibold">USDC</h2>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold tracking-tight">{optimisticUsdcBalance.balance}</p>
                <p className="text-base text-white/70">6 decimals</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <ActionButton onFormSubmit={handleMint} icon={<Plus className="w-6 h-6" />} label="Mint" />
        <ActionButton onFormSubmit={handleTransfer} icon={<Send className="w-6 h-6" />} label="Transfer" />
        <ActionButton onFormSubmit={handleApprove} icon={<History className="w-6 h-6" />} label="Approve" />
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
              {optimisticEvents.map((event, index) => (
                <TableRow
                  key={event.id || event.transactionHash || index}
                  className={`transition-colors hover:bg-gray-50 ${event.status === 'Pending' ? 'opacity-70' : ''}`}
                >
                  <TableCell>{event.type}</TableCell>
                  <TableCell>{event.amount}</TableCell>
                  <TableCell className={event.status === 'Pending' ? 'text-yellow-500' : 'text-green-500'}>
                    {event.status || 'Success'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

export default TokenDashboard;
