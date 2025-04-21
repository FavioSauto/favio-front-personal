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
  useStore,
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
  const selectedToken = useStore((state) => state.selectedToken);
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
    id: event.transactionHash || `event-${Date.now()}`,
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
          id: txHash ?? tempId,
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
          id: txHash ?? tempId,
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
          id: txHash ?? tempId,
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
  }: {
    tokenType: TokenType;
    balance: number;
    isTokenPending: boolean;
  }) => {
    const colors =
      tokenType === 'USDC'
        ? {
            border: 'border-blue-500',
            text: 'text-blue-700',
            bg: 'bg-blue-50',
            darkText: 'dark:text-blue-300',
            darkBg: 'dark:bg-blue-900/20',
            darkBorder: 'dark:border-blue-700',
          }
        : {
            border: 'border-yellow-500',
            text: 'text-yellow-700',
            bg: 'bg-yellow-50',
            darkText: 'dark:text-yellow-300',
            darkBg: 'dark:bg-yellow-900/20',
            darkBorder: 'dark:border-yellow-600',
          };

    return (
      <div className="relative w-full transition-all duration-300 ease-in-out">
        <Card
          className={cn(
            `border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200`,
            colors.border,
            colors.bg,
            colors.darkBg,
            colors.darkBorder
          )}
        >
          <CardContent className="px-6 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className={cn('text-xl font-semibold', colors.text, colors.darkText)}>{tokenType}</h2>
              {/* Optional: Add small icon here */}
            </div>
            <div className="space-y-1">
              <p className={cn('text-3xl font-bold tracking-tight flex items-center', colors.text, colors.darkText)}>
                {balance.toFixed(tokenType === 'USDC' ? 2 : 4)} {/* Adjust decimals */}
                {isTokenPending && (
                  <span
                    className={cn(
                      'ml-2 w-2.5 h-2.5 rounded-full animate-pulse',
                      tokenType === 'USDC' ? 'bg-blue-400' : 'bg-yellow-400'
                    )}
                  ></span>
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tokenType === 'DAI' ? '18 decimals' : '6 decimals'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    // Main container with max-width and centering
    <div className="w-full bg-accent">
      {/* Header */}
      <PageHeader title="Token Dashboard" icon={<Wallet className="w-6 h-6 text-gray-800 dark:text-gray-200" />} />

      {/* Container for Token Card and Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Token Card Display (Conditional) */}
        <div className="flex justify-center md:justify-start min-h-[120px]">
          {' '}
          {/* Adjusted alignment */}
          {selectedToken === 'DAI' && (
            <TokenCard tokenType="DAI" balance={optimisticDaiBalance.balance} isTokenPending={isDaiPending} />
          )}
          {selectedToken === 'USDC' && (
            <TokenCard tokenType="USDC" balance={optimisticUsdcBalance.balance} isTokenPending={isUsdcPending} />
          )}
        </div>

        {/* Quick Actions - Now operate on selectedToken */}
        <Card className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-700 dark:text-gray-300">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            {' '}
            {/* Changed to always be 1 column */}
            <ActionButton
              onFormSubmit={handleMintAction}
              icon={<Plus className="w-5 h-5 mr-2" />} // Smaller icon, added margin
              label="Mint"
              disabled={isPending || (selectedToken === 'DAI' ? isDaiPending : isUsdcPending)}
              // Add specific styling for action buttons if needed
              className="rounded-md"
            />
            <ActionButton
              onFormSubmit={handleTransferAction}
              icon={<Send className="w-5 h-5 mr-2" />}
              label="Transfer"
              disabled={isPending || (selectedToken === 'DAI' ? isDaiPending : isUsdcPending)}
              className="rounded-md"
            />
            <ActionButton
              onFormSubmit={handleApproveAction}
              icon={<History className="w-5 h-5 mr-2" />}
              label="Approve"
              disabled={isPending || (selectedToken === 'DAI' ? isDaiPending : isUsdcPending)}
              className="rounded-md"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions - Use filteredEvents */}
      <Card className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800/30 transition-all duration-300 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300">Recent Transactions</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={tableFilter === 'ALL' ? 'secondary' : 'ghost'} // Use subtle variants
              onClick={() => setTableFilter('ALL')}
              className="rounded-md px-3"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={tableFilter === 'DAI' ? 'secondary' : 'ghost'}
              onClick={() => setTableFilter('DAI')}
              className={cn(
                'rounded-md px-3',
                tableFilter === 'DAI' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200'
              )}
            >
              DAI
            </Button>
            <Button
              size="sm"
              variant={tableFilter === 'USDC' ? 'secondary' : 'ghost'}
              onClick={() => setTableFilter('USDC')}
              className={cn(
                'rounded-md px-3',
                tableFilter === 'USDC' && 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200'
              )}
            >
              USDC
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {' '}
          {/* Remove default padding top */}
          <Table>
            <TableHeader>
              <TableRow className="border-b-gray-200 dark:border-b-gray-700">
                <TableHead className="text-xs text-gray-500 uppercase dark:text-gray-400">Type</TableHead>
                <TableHead className="text-xs text-gray-500 uppercase dark:text-gray-400">Amount</TableHead>
                <TableHead className="text-xs text-gray-500 uppercase dark:text-gray-400">Status</TableHead>
                <TableHead className="text-xs text-gray-500 uppercase dark:text-gray-400">Token</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 && (
                <TableRow className="border-0">
                  <TableCell colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    {tableFilter === 'ALL' ? 'No transactions yet.' : `No ${tableFilter} transactions yet.`}
                  </TableCell>
                </TableRow>
              )}
              {filteredEvents.map((event) => (
                <TableRow
                  key={event.id}
                  className={cn(
                    'transition-colors duration-150 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0',
                    event.status === 'Pending' && 'opacity-70 italic', // More subtle pending
                    event.status === 'Failed' && 'bg-red-50/50 dark:bg-red-900/20 opacity-80' // Subtle failed bg
                  )}
                >
                  <TableCell className="font-medium text-gray-800 dark:text-gray-200 py-3">{event.type}</TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300 py-3">{event.amount}</TableCell>
                  <TableCell
                    className={cn(
                      'py-3 text-sm font-medium', // Base style
                      event.status === 'Pending' && 'text-yellow-600 dark:text-yellow-400',
                      event.status === 'Success' && 'text-green-600 dark:text-green-400',
                      event.status === 'Failed' && 'text-red-600 dark:text-red-400 line-through' // Added line-through
                    )}
                  >
                    {event.status}
                  </TableCell>
                  <TableCell className="py-3">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        event.tokenType === 'DAI'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200'
                      )}
                    >
                      {event.tokenType}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenDashboard;
