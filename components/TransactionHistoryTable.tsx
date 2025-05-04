'use client';

import { useEffect, useState } from 'react';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { RotateCcw, ExternalLink, EllipsisVertical } from 'lucide-react';

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
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<OptimisticEvent | null>(null);

  const eventsFilteredByToken =
    optimisticEvents?.filter((event) => tableFilter === 'ALL' || event.token === tableFilter) ?? null;

  const showEvents = !isWrongNetwork && eventsFilteredByToken;
  const displayEvents = showEvents ? eventsFilteredByToken : [];

  function refreshEvents() {
    const showLoadingMessage = eventsFetchError;

    fetchEvents(walletAddress, showLoadingMessage);
  }

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

  function handleOpenModal(event: OptimisticEvent) {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }

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
    {
      id: 'explorer',
      header: '',
      cell: ({ row }) => {
        const event = row.original;
        if (!event.transactionHash) return null;

        return (
          <a
            href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        );
      },
    },
    {
      id: 'more-info',
      cell: ({ row }) => {
        const event = row.original;
        // Optionally hide for pending/failed or based on other logic
        // if (event.status === 'Pending' || event.status === 'Failed') return null;

        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenModal(event);
                }}
              >
                <span className="sr-only">More Info</span>
                <EllipsisVertical className="w-4 h-4" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-auto p-2 text-sm">Click for details</HoverCardContent>
          </HoverCard>
        );
      },
    },
  ];

  // --- No Results Message ---
  const noResultsMessage = tableFilter === 'ALL' ? 'No transactions yet.' : `No ${tableFilter} transactions yet.`;

  return (
    <Card className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800/30 transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 gap-3 lg:flex-col lg:items-start lg:justify-start">
        <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap flex-shrink-0 flex items-center justify-between w-full">
          Recent Transactions
          <Button size="sm" variant="outline" onClick={refreshEvents} disabled={isRetryingEvents}>
            <RotateCcw className="w-4 h-4" />
            {/* {isRetryingEvents ? 'Retrying...' : 'Retry'} */}
          </Button>
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

      {/* --- Event Details Modal --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[450px] dark:bg-gray-850 border-gray-300 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Transaction Details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Detailed information about the selected transaction event.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedEvent.type}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                <Badge
                  variant={selectedEvent.status === 'Failed' ? 'destructive' : 'secondary'}
                  className={cn(
                    'text-xs',
                    selectedEvent.status === 'Success' &&
                      'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200',
                    selectedEvent.status === 'Pending' &&
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200 opacity-80 italic'
                  )}
                >
                  {selectedEvent.status}
                </Badge>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="text-gray-800 dark:text-gray-200">{Number(selectedEvent.amount).toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Token:</span>
                <Badge
                  variant={'secondary'}
                  className={cn(
                    'text-xs',
                    selectedEvent.token === 'DAI'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200'
                  )}
                >
                  {selectedEvent.token}
                </Badge>
              </div>

              {/* Conditional Fields based on Type */}
              {selectedEvent.type === 'Transfer' && selectedEvent.from && (
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">From:</span>
                  <span className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                    {selectedEvent.from}
                  </span>
                </div>
              )}

              {selectedEvent.type === 'Transfer' && selectedEvent.recipient && (
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Recipient:</span>
                  <span className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                    {selectedEvent.recipient}
                  </span>
                </div>
              )}

              {selectedEvent.type === 'Approve' && selectedEvent.spender && (
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Spender:</span>
                  <span className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                    {selectedEvent.spender}
                  </span>
                </div>
              )}

              {/* Transaction Hash */}
              {selectedEvent.transactionHash && (
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tx Hash:</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${selectedEvent.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-600 hover:underline dark:text-blue-400 break-all flex items-center gap-1"
                  >
                    {selectedEvent.transactionHash}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}

              {/* Event ID (useful for debugging) */}
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Event ID:</span>
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{selectedEvent.id}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
