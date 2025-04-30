'use client';
import { useEffect, useState, useOptimistic, useTransition } from 'react';
import { Send, Plus, History } from 'lucide-react';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TokenCard from '@/components/shared/TokenCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/shared/DataTable';
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
  useSelectedToken,
  useIsWrongNetwork,
} from '@/providers/stores/storeProvider';
import { TokenEvent } from '@/stores/slices/historySlice';
import { useAccount } from 'wagmi';
import { waitForTransactionReceipt, switchNetwork as switchNetworkCore } from '@wagmi/core';
import { config } from '@/lib/config';
import { sepolia } from 'wagmi/chains';

// Define types for optimistic update actions
type OptimisticBalanceAction = { type: 'mint'; amount: string } | { type: 'transfer'; amount: string };
type TokenType = 'DAI' | 'USDC';
type TableFilterType = TokenType | 'ALL';
type ActionFilterType = 'Mint' | 'Transfer' | 'Approve' | 'ALL';

// Define a more detailed type for optimistic events shown in the UI
interface OptimisticEvent {
  id: string; // Unique ID for mapping and updates (can be txHash or temporary)
  type: 'Mint' | 'Transfer' | 'Approve';
  amount: string;
  from?: `0x${string}`;
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
  const isWrongNetwork = useIsWrongNetwork();

  const [isDaiPending, setIsDaiPending] = useState(false);
  const [isUsdcPending, setIsUsdcPending] = useState(false);

  // --- State for Token Selection and Table Filter ---
  const selectedToken = useSelectedToken();
  const [tableFilter, setTableFilter] = useState<TableFilterType>(selectedToken);
  const [actionFilter, setActionFilter] = useState<ActionFilterType>('ALL');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
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
    from: event.from as `0x${string}`,
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
  const eventsFilteredByToken = optimisticEvents.filter(
    (event) => tableFilter === 'ALL' || event.tokenType === tableFilter
  );
  // Use empty array if network is wrong
  const displayEvents = isWrongNetwork ? [] : eventsFilteredByToken;
  // -----------------------------------------

  useEffect(() => {
    // Fetch only if wallet is connected AND events/balances might be missing
    // Note: You might refine the balance check if needed, e.g., check specific balances
    if (walletAddress && events.length === 0 /* || check if balances are zero/unset */) {
      console.log('[DashboardPage] Fetching initial data...'); // Optional log
      startTransition(() => {
        fetchTokenBalances(walletAddress);
        fetchEvents(walletAddress);
      });
    }
    // Dependencies include events.length to re-evaluate if events get cleared elsewhere
  }, [walletAddress, fetchTokenBalances, fetchEvents, events.length]);

  useEffect(() => {
    setTableFilter(selectedToken);
  }, [selectedToken]);

  useEffect(() => {
    if (actionFilter === 'ALL') {
      setColumnFilters((prev) => prev.filter((f) => f.id !== 'type'));
    } else {
      setColumnFilters((prev) => [...prev.filter((f) => f.id !== 'type'), { id: 'type', value: actionFilter }]);
    }
  }, [actionFilter]);

  // --- Action Handlers (Mint, Transfer, Approve) ---
  const handleSwitchNetwork = async () => {
    try {
      await switchNetworkCore(config, { chainId: sepolia.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
      // Handle error (e.g., show a toast notification)
    }
  };

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
          from: walletAddress,
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
          from: walletAddress,
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
          from: walletAddress,
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
          from: walletAddress,
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
          from: walletAddress,
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
          from: walletAddress,
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

  // --- Column Definitions for DataTable ---
  const columns: ColumnDef<OptimisticEvent>[] = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const event = row.original;
        const displayType = event.type;
        return (
          <div
            className={cn(
              'font-medium text-gray-800 dark:text-gray-200',
              event.status === 'Pending' && 'opacity-70 italic',
              event.status === 'Failed' && 'opacity-80'
            )}
          >
            {displayType}
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const event = row.original;
        return (
          <div
            className={cn(
              'text-gray-700 dark:text-gray-300',
              event.status === 'Pending' && 'opacity-70 italic',
              event.status === 'Failed' && 'opacity-80'
            )}
          >
            {event.amount}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const event = row.original;
        return (
          <div
            className={cn(
              'text-sm font-medium',
              event.status === 'Pending' && 'text-yellow-600 dark:text-yellow-400 opacity-70 italic',
              event.status === 'Success' && 'text-green-600 dark:text-green-400',
              event.status === 'Failed' && 'text-red-600 dark:text-red-400 line-through opacity-80'
            )}
          >
            {event.status}
          </div>
        );
      },
    },
    {
      accessorKey: 'tokenType',
      header: 'Token',
      cell: ({ row }) => {
        const event = row.original;
        return (
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              event.tokenType === 'DAI'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200',
              event.status === 'Pending' && 'opacity-70 italic',
              event.status === 'Failed' && 'opacity-80'
            )}
          >
            {event.tokenType}
          </span>
        );
      },
    },
    // Add more columns if needed (e.g., From, To/Recipient, Spender, Transaction Hash)
  ];

  // --- No Results Message ---
  const noResultsMessage = tableFilter === 'ALL' ? 'No transactions yet.' : `No ${tableFilter} transactions yet.`;

  return (
    // Main container with max-width and centering
    <div className="w-full py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Container for Token Card and Quick Actions */}
      <div className="flex flex-col gap-y-4 col-span-1 items-start">
        {/* Wrong Network Warning */}
        {isWrongNetwork && (
          <Card className="w-full bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700">
            <CardContent className="p-4 text-center text-red-700 dark:text-red-300 font-medium flex flex-col items-center gap-2">
              <span>You are connected to the wrong network. Please switch to Sepolia to perform actions.</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSwitchNetwork}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white"
              >
                Switch to Sepolia
              </Button>
            </CardContent>
          </Card>
        )}
        {/* Token Card Display (Conditional) */}
        <div className="flex justify-center w-full md:justify-start min-h-[120px]">
          {' '}
          {/* Adjusted alignment */}
          {selectedToken === 'DAI' && (
            <TokenCard
              tokenType="DAI"
              balance={isWrongNetwork ? 0 : optimisticDaiBalance.balance}
              isTokenPending={isDaiPending}
            />
          )}
          {selectedToken === 'USDC' && (
            <TokenCard
              tokenType="USDC"
              balance={isWrongNetwork ? 0 : optimisticUsdcBalance.balance}
              isTokenPending={isUsdcPending}
            />
          )}
        </div>

        {/* Quick Actions - Now operate on selectedToken */}
        <Card className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800/30 w-full gap-4">
          <CardHeader className="flex items-center">
            <CardTitle className="text-base h-full font-semibold text-gray-700 dark:text-gray-300">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-x-2 w-full justify-between">
            {' '}
            {/* Changed to always be 1 column */}
            <ActionButton
              onFormSubmit={handleMintAction}
              icon={<Plus className="w-5 h-5 mr-2" />} // Smaller icon, added margin
              label="Mint"
              disabled={isWrongNetwork || isPending || (selectedToken === 'DAI' ? isDaiPending : isUsdcPending)}
              // Add specific styling for action buttons if needed
              className="rounded-md w-1/3"
            />
            <ActionButton
              onFormSubmit={handleTransferAction}
              icon={<Send className="w-5 h-5 mr-2" />}
              label="Transfer"
              disabled={isWrongNetwork || isPending || (selectedToken === 'DAI' ? isDaiPending : isUsdcPending)}
              className="rounded-md w-1/3"
            />
            <ActionButton
              onFormSubmit={handleApproveAction}
              icon={<History className="w-5 h-5 mr-2" />}
              label="Approve"
              disabled={isWrongNetwork || isPending || (selectedToken === 'DAI' ? isDaiPending : isUsdcPending)}
              className="rounded-md w-1/3"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions - Use eventsFilteredByToken */}
      <Card className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800/30 transition-all duration-300 hover:shadow-md">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 gap-3 lg:flex-col lg:items-start lg:justify-start">
          <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap flex-shrink-0">
            Recent Transactions
          </CardTitle>
          <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium mr-1 flex-shrink-0">Token:</span>
              <Button
                size="sm"
                variant={tableFilter === 'ALL' ? 'secondary' : 'ghost'}
                onClick={() => setTableFilter('ALL')}
                className={cn(
                  'rounded-md px-3',
                  tableFilter === 'ALL' && 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                )}
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

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium mr-1 flex-shrink-0">Action:</span>
              <Button
                size="sm"
                variant={actionFilter === 'ALL' ? 'secondary' : 'ghost'}
                onClick={() => setActionFilter('ALL')}
                className={cn(
                  'rounded-md px-3',
                  actionFilter === 'ALL' && 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                )}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={actionFilter === 'Mint' ? 'secondary' : 'ghost'}
                onClick={() => setActionFilter('Mint')}
                className={cn(
                  'rounded-md px-3',
                  actionFilter === 'Mint' && 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200'
                )}
              >
                Mint
              </Button>
              <Button
                size="sm"
                variant={actionFilter === 'Transfer' ? 'secondary' : 'ghost'}
                onClick={() => setActionFilter('Transfer')}
                className={cn(
                  'rounded-md px-3',
                  actionFilter === 'Transfer' &&
                    'bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-200'
                )}
              >
                Transfer
              </Button>
              <Button
                size="sm"
                variant={actionFilter === 'Approve' ? 'secondary' : 'ghost'}
                onClick={() => setActionFilter('Approve')}
                className={cn(
                  'rounded-md px-3',
                  actionFilter === 'Approve' &&
                    'bg-indigo-100 text-indigo-800 dark:bg-indigo-800/30 dark:text-indigo-200'
                )}
              >
                Approve
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable
            columns={columns}
            data={displayEvents}
            noResultsMessage={noResultsMessage}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenDashboard;
