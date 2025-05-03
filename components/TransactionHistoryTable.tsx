'use client';

import { useEffect, useState } from 'react';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';

import { cn } from '@/lib/utils';
import {
  useDetails,
  useEventsLoading,
  useEventsFetchError,
  useIsWrongNetwork,
  useIsRetryingEvents,
  useOptimisticEvents,
  useSelectedToken,
  useEventsActions,
} from '@/providers/stores/storeProvider';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { DataTable } from '@/components/shared/DataTable';

interface OptimisticEvent {
  amount: string;
  from?: string;
  id: string; // Unique ID for mapping and updates (can be txHash or temporary)
  recipient?: string; // For Transfer
  spender?: string; // For Approve
  status: 'Pending' | 'Success' | 'Failed'; // Include status
  token: TokenType;
  transactionHash?: string; // Optional tx hash
  type: 'Mint' | 'Transfer' | 'Approve';
}

type ActionFilterType = 'Mint' | 'Transfer' | 'Approve' | 'ALL';
type TableFilterType = 'ALL' | 'DAI' | 'USDC';
type TokenType = 'DAI' | 'USDC';

export default function TransactionHistoryTable() {
  const { address: walletAddress } = useDetails();

  const optimisticEvents = useOptimisticEvents();
  const isLoadingEvents = useEventsLoading();
  const isRetryingEvents = useIsRetryingEvents();
  const isWrongNetwork = useIsWrongNetwork();
  const eventsFetchError = useEventsFetchError();
  const selectedToken = useSelectedToken();

  const { fetchEvents } = useEventsActions();

  const [tableFilter, setTableFilter] = useState<TableFilterType>(selectedToken);
  const [actionFilter, setActionFilter] = useState<ActionFilterType>('ALL');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  console.log('optimisticEvents', optimisticEvents);
  const eventsFilteredByToken =
    optimisticEvents?.filter((event) => tableFilter === 'ALL' || event.token === tableFilter) ?? null;

  const showEvents = !isWrongNetwork && eventsFilteredByToken;
  const displayEvents = showEvents ? eventsFilteredByToken : [];

  useEffect(
    function fetchEventsOnMount() {
      if (walletAddress && !showEvents) {
        fetchEvents(walletAddress);
      }
    },
    [walletAddress, fetchEvents, showEvents]
  );

  useEffect(
    function updateActionFilter() {
      if (actionFilter === 'ALL') {
        setColumnFilters((prev) => prev.filter((f) => f.id !== 'type'));
      } else {
        setColumnFilters((prev) => [...prev.filter((f) => f.id !== 'type'), { id: 'type', value: actionFilter }]);
      }
    },
    [actionFilter]
  );

  useEffect(
    function updateTokenFilter() {
      setTableFilter(selectedToken);
    },
    [selectedToken]
  );

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
        const amount = Number(event.amount); // Ensure it's a number
        const formattedAmount = isNaN(amount) ? event.amount : amount.toFixed(2); // Format or fallback

        return (
          <div
            className={cn(
              'text-gray-700 dark:text-gray-300',
              event.status === 'Pending' && 'opacity-70 italic',
              event.status === 'Failed' && 'opacity-80'
            )}
          >
            {formattedAmount}
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
      accessorKey: 'token',
      header: 'Token',
      cell: ({ row }) => {
        const event = row.original;
        return (
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              event.token === 'DAI'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200',
              event.status === 'Pending' && 'opacity-70 italic',
              event.status === 'Failed' && 'opacity-80'
            )}
          >
            {event.token}
          </span>
        );
      },
    },
    // Add more columns if needed (e.g., From, To/Recipient, Spender, Transaction Hash)
  ];

  // --- No Results Message ---
  const noResultsMessage = tableFilter === 'ALL' ? 'No transactions yet.' : `No ${tableFilter} transactions yet.`;

  return (
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
                actionFilter === 'Approve' && 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800/30 dark:text-indigo-200'
              )}
            >
              Approve
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {eventsFetchError ? (
          <div className="text-center py-8 px-4">
            <p className="mb-4">Failed to load transaction history.</p>
            <Button
              onClick={() => fetchEvents(walletAddress)}
              disabled={isRetryingEvents}
              size="sm"
              className="cursor-pointer"
              variant="outline"
            >
              {isRetryingEvents ? 'Retrying...' : 'Retry'}
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={displayEvents}
            noResultsMessage={noResultsMessage}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            isLoading={isLoadingEvents}
          />
        )}
      </CardContent>
    </Card>
  );
}
