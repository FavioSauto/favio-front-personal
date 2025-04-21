'use client';
import { useEffect, useState, useOptimistic, useTransition } from 'react';
import { Wallet, Send, Plus, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ActionButton,
  MintFormData,
  TransferFormData,
  ApproveFormData,
  ActionFormData,
} from '@/components/shared/ActionButton';
import {
  useDaiBalances,
  useUsdcBalances,
  useBalanceActions,
  useEventsActions,
  useEvents,
  TokenEvent,
} from '@/providers/stores/storeProvider';
import { useAccount } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/lib/config';

// Define types for optimistic update actions
type OptimisticBalanceAction = { type: 'mint'; amount: string } | { type: 'transfer'; amount: string };
type TokenType = 'DAI' | 'USDC';
type TableFilterType = TokenType | 'ALL';

// Define a more detailed type for optimistic events shown in the UI
interface OptimisticEvent {
  id: string; // Unique ID for mapping and updates (can be txHash or temporary)
  type: 'Mint' | 'Transfer' | 'Approve';
  amount: string;
  status: 'Pending' | 'Success' | 'Failed'; // Include status
  tokenType: TokenType;
  recipient?: string; // For Transfer
  spender?: string; // For Approve
  transactionHash?: string; // Optional tx hash
}

const TokenDashboard = () => {
  const { address: walletAddress } = useAccount();
  const daiBalance = useDaiBalances();
  const usdcBalance = useUsdcBalances();
  const events = useEvents();
  const { fetchEvents } = useEventsActions();
  const { mintToken, transferToken, approveToken } = useBalanceActions();
  const { fetchTokenBalances } = useBalanceActions();
  const [isPending, startTransition] = useTransition();

  const [isDaiPending, setIsDaiPending] = useState(false);
  const [isUsdcPending, setIsUsdcPending] = useState(false);

  // --- State for Token Selection and Table Filter ---
  const [selectedToken, setSelectedToken] = useState<TokenType>('USDC');
  const [tableFilter, setTableFilter] = useState<TableFilterType>('ALL');
  // ------------------------------------------------

  // Optimistic updates for USDC balance
  const [optimisticUsdcBalance, addOptimisticUsdcUpdate] = useOptimistic(
    { balance: Number(usdcBalance.balance) || 0.0 },
    (state: { balance: number }, action: OptimisticBalanceAction) => {
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
    { balance: Number(daiBalance.balance) || 0 },
    (state: { balance: number }, action: OptimisticBalanceAction) => {
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

  // Helper to map store events (TokenEvent) to OptimisticEvent for consistent display
  const mapTokenEventToOptimistic = (event: TokenEvent): OptimisticEvent => ({
    id: event.transactionHash,
    transactionHash: event.transactionHash,
    type: event.type,
    amount: event.amount,
    status: 'Success',
    tokenType: event.token === 'DAI' ? 'DAI' : 'USDC',
    recipient: event.to,
    spender: undefined,
  });

  // Optimistic updates for events
  const [optimisticEvents, addOptimisticEvent] = useOptimistic<OptimisticEvent[], OptimisticEvent>(
    events.map(mapTokenEventToOptimistic),
    (currentOptimisticEvents, newOrUpdatedEvent: OptimisticEvent) => {
      const existingIndex = currentOptimisticEvents.findIndex(
        (event) => event.id === newOrUpdatedEvent.id && event.status === 'Pending'
      );

      if (existingIndex !== -1) {
        const updatedEvents = [...currentOptimisticEvents];
        updatedEvents[existingIndex] = {
          ...updatedEvents[existingIndex],
          ...newOrUpdatedEvent,
          status: 'Pending',
        };
        return updatedEvents;
      } else {
        if (currentOptimisticEvents.some((event) => event.id === newOrUpdatedEvent.id)) {
          return currentOptimisticEvents;
        }
        return [newOrUpdatedEvent, ...currentOptimisticEvents];
      }
    }
  );

  // --- Filtered Events for Table Display ---
  const filteredEvents = optimisticEvents.filter((event) => tableFilter === 'ALL' || event.tokenType === tableFilter);
  // -----------------------------------------

  useEffect(() => {
    if (walletAddress) {
      startTransition(() => {
        fetchTokenBalances(walletAddress);
        fetchEvents(walletAddress);
      });
    }
  }, [walletAddress, fetchTokenBalances, fetchEvents]);

  // --- Action Handlers (Mint, Transfer, Approve) ---
  async function handleMint(data: MintFormData & { tokenType: TokenType }) {
    const { amount, tokenType } = data;
    const setPending = tokenType === 'DAI' ? setIsDaiPending : setIsUsdcPending;
    const addOptimisticUpdate = tokenType === 'DAI' ? addOptimisticDaiUpdate : addOptimisticUsdcUpdate;
    const tempId = `optimistic-mint-${tokenType}-${Date.now()}`;
    let txHash: `0x${string}` | undefined = undefined;

    setPending(true);

    try {
      txHash = await mintToken(tokenType, amount);
      if (!txHash) throw new Error('Transaction submission failed or rejected by user.');

      startTransition(() => {
        addOptimisticUpdate({ type: 'mint', amount: amount });
        addOptimisticEvent({
          id: txHash,
          type: 'Mint',
          amount: amount,
          status: 'Pending',
          tokenType: tokenType,
          transactionHash: txHash,
        });
      });

      await waitForTransactionReceipt(config, { hash: txHash });

      if (walletAddress) {
        await fetchTokenBalances(walletAddress);
        await fetchEvents(walletAddress);
      }
    } catch (error) {
      console.error(`[handleMint ${tokenType}] Error caught:`, error);
      startTransition(() => {
        const failureEvent: OptimisticEvent = {
          id: txHash ?? tempId,
          type: 'Mint',
          amount: amount,
          tokenType: tokenType,
          status: 'Failed',
          transactionHash: txHash ?? 'failed/rejected',
        };
        addOptimisticEvent(failureEvent);
      });
    } finally {
      startTransition(() => {
        setPending(false);
      });
    }
  }

  async function handleTransfer(data: TransferFormData & { tokenType: TokenType }) {
    const { address, amount, tokenType } = data;
    const setPending = tokenType === 'DAI' ? setIsDaiPending : setIsUsdcPending;
    const addOptimisticUpdate = tokenType === 'DAI' ? addOptimisticDaiUpdate : addOptimisticUsdcUpdate;
    const tempId = `optimistic-transfer-${tokenType}-${Date.now()}`;
    let txHash: `0x${string}` | undefined = undefined;

    setPending(true);

    try {
      txHash = await transferToken(tokenType, address, amount);
      if (!txHash) throw new Error('Transaction submission failed or rejected by user.');

      startTransition(() => {
        addOptimisticUpdate({ type: 'transfer', amount: amount });
        addOptimisticEvent({
          id: txHash,
          type: 'Transfer',
          amount: amount,
          recipient: address,
          status: 'Pending',
          tokenType: tokenType,
          transactionHash: txHash,
        });
      });

      await waitForTransactionReceipt(config, { hash: txHash });

      if (walletAddress) {
        await fetchTokenBalances(walletAddress);
        await fetchEvents(walletAddress);
      }
    } catch (error) {
      console.error(`[handleTransfer ${tokenType}] Error caught:`, error);
      startTransition(() => {
        const failureEvent: OptimisticEvent = {
          id: txHash ?? tempId,
          type: 'Transfer',
          amount: amount,
          recipient: address,
          tokenType: tokenType,
          status: 'Failed',
          transactionHash: txHash ?? 'failed/rejected',
        };
        addOptimisticEvent(failureEvent);
      });
    } finally {
      startTransition(() => {
        setPending(false);
      });
    }
  }

  async function handleApprove(data: ApproveFormData & { tokenType: TokenType }) {
    const { address, allowance, tokenType } = data;
    const tempId = `optimistic-approve-${tokenType}-${Date.now()}`;
    let txHash: `0x${string}` | undefined = undefined;

    try {
      txHash = await approveToken(tokenType, address, allowance);
      if (!txHash) throw new Error('Transaction submission failed or rejected by user.');

      startTransition(() => {
        addOptimisticEvent({
          id: txHash,
          type: 'Approve',
          amount: allowance,
          spender: address,
          status: 'Pending',
          tokenType: tokenType,
          transactionHash: txHash,
        });
      });

      await waitForTransactionReceipt(config, { hash: txHash });

      if (walletAddress) {
        await fetchEvents(walletAddress);
      }
    } catch (error) {
      console.error(`[handleApprove ${tokenType}] Error caught:`, error);
      startTransition(() => {
        const failureEvent: OptimisticEvent = {
          id: txHash ?? tempId,
          type: 'Approve',
          amount: allowance,
          spender: address,
          tokenType: tokenType,
          status: 'Failed',
          transactionHash: txHash ?? 'failed/rejected',
        };
        addOptimisticEvent(failureEvent);
      });
    } finally {
      startTransition(() => {});
    }
  }

  // --- Wrapper functions for ActionButton ---
  const handleMintAction = (formData: ActionFormData) => {
    if ('amount' in formData && !('address' in formData)) {
      handleMint({ ...formData, tokenType: selectedToken });
    }
  };

  const handleTransferAction = (formData: ActionFormData) => {
    if ('amount' in formData && 'address' in formData && !('allowance' in formData)) {
      handleTransfer({ ...formData, tokenType: selectedToken });
    }
  };

  const handleApproveAction = (formData: ActionFormData) => {
    if ('allowance' in formData && 'address' in formData) {
      handleApprove({ ...formData, tokenType: selectedToken });
    }
  };

  // --- Helper component for the Token Card ---
  const TokenCard = ({
    tokenType,
    balance,
    isTokenPending,
    gradientFrom,
    gradientTo,
  }: {
    tokenType: TokenType;
    balance: number;
    isTokenPending: boolean;
    gradientFrom: string;
    gradientTo: string;
  }) => (
    <div className="relative w-full transition-all duration-300 ease-in-out">
      <Card
        className={cn(
          `py-2 text-white transition-shadow duration-300 hover:shadow-xl bg-gradient-to-br`,
          gradientFrom,
          gradientTo
        )}
      >
        <CardContent className="px-6 py-2 space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-white/70">{tokenType}</p>
            <h2 className="text-2xl font-semibold">{tokenType}</h2>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-bold tracking-tight flex items-center">
              {balance.toFixed(2)}
              {isTokenPending && <span className="ml-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>}
            </p>
            <p className="text-base text-white/70">{tokenType === 'DAI' ? '18 decimals' : '6 decimals'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {/* Header */}
      <PageHeader title="Token Dashboard" icon={<Wallet className="w-6 h-6 text-gray-900" />} />

      {/* Token Selection Buttons */}
      <div className="flex justify-center gap-4 my-4">
        <Button
          variant={selectedToken === 'DAI' ? 'default' : 'outline'}
          onClick={() => setSelectedToken('DAI')}
          className="w-24"
        >
          DAI
        </Button>
        <Button
          variant={selectedToken === 'USDC' ? 'default' : 'outline'}
          onClick={() => setSelectedToken('USDC')}
          className="w-24"
        >
          USDC
        </Button>
      </div>

      {/* Token Card Display (Conditional) */}
      <div className="flex justify-center pt-4 mb-6 min-h-[150px]">
        {selectedToken === 'DAI' && (
          <TokenCard
            tokenType="DAI"
            balance={optimisticDaiBalance.balance}
            isTokenPending={isDaiPending}
            gradientFrom="from-orange-400"
            gradientTo="to-amber-600"
          />
        )}
        {selectedToken === 'USDC' && (
          <TokenCard
            tokenType="USDC"
            balance={optimisticUsdcBalance.balance}
            isTokenPending={isUsdcPending}
            gradientFrom="from-blue-500"
            gradientTo="to-sky-600"
          />
        )}
      </div>

      {/* Quick Actions - Now operate on selectedToken */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions for {selectedToken}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3 md:gap-6">
          <ActionButton
            onFormSubmit={handleMintAction}
            icon={<Plus className="w-6 h-6" />}
            label="Mint"
            disabled={isPending || (selectedToken === 'DAI' ? isDaiPending : isUsdcPending)}
          />
          <ActionButton
            onFormSubmit={handleTransferAction}
            icon={<Send className="w-6 h-6" />}
            label="Transfer"
            disabled={isPending || (selectedToken === 'DAI' ? isDaiPending : isUsdcPending)}
          />
          <ActionButton
            onFormSubmit={handleApproveAction}
            icon={<History className="w-6 h-6" />}
            label="Approve"
            disabled={isPending || (selectedToken === 'DAI' ? isDaiPending : isUsdcPending)}
          />
        </CardContent>
      </Card>

      {/* Recent Transactions - Use filteredEvents */}
      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={tableFilter === 'ALL' ? 'default' : 'outline'}
              onClick={() => setTableFilter('ALL')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={tableFilter === 'DAI' ? 'default' : 'outline'}
              onClick={() => setTableFilter('DAI')}
            >
              DAI
            </Button>
            <Button
              size="sm"
              variant={tableFilter === 'USDC' ? 'default' : 'outline'}
              onClick={() => setTableFilter('USDC')}
            >
              USDC
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Token</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    {tableFilter === 'ALL' ? 'No transactions yet.' : `No ${tableFilter} transactions yet.`}
                  </TableCell>
                </TableRow>
              )}
              {filteredEvents.map((event) => (
                <TableRow
                  key={event.id}
                  className={cn(
                    'transition-opacity duration-300 hover:bg-gray-50',
                    event.status === 'Pending' && 'opacity-60 animate-pulse',
                    event.status === 'Failed' && 'bg-red-50 line-through opacity-70'
                  )}
                >
                  <TableCell>{event.type}</TableCell>
                  <TableCell>{event.amount}</TableCell>
                  <TableCell
                    className={cn(
                      event.status === 'Pending' && 'text-yellow-600',
                      event.status === 'Success' && 'text-green-600',
                      event.status === 'Failed' && 'text-red-600'
                    )}
                  >
                    {event.status}
                  </TableCell>
                  <TableCell>{event.tokenType}</TableCell>
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
