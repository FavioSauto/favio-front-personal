'use client';

import React, { useState } from 'react';
import { useTransaction } from 'wagmi';
import { ExternalLink } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Re-define or import OptimisticEvent type - ensure consistency
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

type TokenType = 'DAI' | 'USDC';
interface TransactionInfoContentProps {
  event: OptimisticEvent | null;
}

export default function TransactionInfoContent({ event }: TransactionInfoContentProps) {
  const [showFullTxHash, setShowFullTxHash] = useState(false);

  const {
    data: txData,
    error: txError,
    isLoading: isLoadingTx,
  } = useTransaction({
    hash: event?.transactionHash as `0x${string}`,
    query: {
      enabled: !!event?.transactionHash, // Only run query if hash exists
    },
  });

  if (!event) {
    return <div className="py-4 text-center text-gray-500 dark:text-gray-400">No event selected.</div>;
  }

  const baseExplorerUrl = 'https://sepolia.etherscan.io/tx/';

  // Helper to format gas
  const formatGas = (gas: bigint | undefined) => {
    if (!gas) return 'N/A';
    return (Number(gas) / 1e9).toFixed(5) + ' Gwei'; // Example formatting to Gwei
  };

  return (
    <div className="grid gap-4 py-4">
      {/* Basic Event Info */}
      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{event.type}</span>
      </div>
      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
        <Badge
          variant={event.status === 'Failed' ? 'destructive' : 'secondary'}
          className={cn(
            'text-xs',
            event.status === 'Success' && 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200',
            event.status === 'Pending' &&
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200 opacity-80 italic'
          )}
        >
          {event.status}
        </Badge>
      </div>
      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount:</span>
        <span className="text-gray-800 dark:text-gray-200">{Number(event.amount).toFixed(2)}</span>
      </div>
      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Token:</span>
        <Badge
          variant={'secondary'}
          className={cn(
            'text-xs',
            event.token === 'DAI'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200'
          )}
        >
          {event.token}
        </Badge>
      </div>

      {/* Conditional Fields based on Event Type */}
      {event.type === 'Transfer' && txData?.from && (
        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">From:</span>
          <span className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{event.from}</span>
        </div>
      )}
      {event.type === 'Transfer' && txData?.to && (
        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Recipient:</span>
          <span className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{txData.to}</span>
        </div>
      )}
      {event.type === 'Approve' && txData?.to && (
        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Spender:</span>
          <span className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{txData.to}</span>
        </div>
      )}

      {/* Transaction Hash */}
      {event.transactionHash && (
        <div className="grid grid-cols-[100px_1fr] items-start gap-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 pt-1">Tx Hash:</span>
          <div className="flex flex-col items-start">
            <a
              href={`${baseExplorerUrl}${event.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-blue-600 hover:underline dark:text-blue-400 break-all flex items-center gap-1"
              title={event.transactionHash} // Show full hash on hover
            >
              {showFullTxHash
                ? event.transactionHash
                : `${event.transactionHash.substring(0, 8)}...${event.transactionHash.substring(
                    event.transactionHash.length - 6
                  )}`}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
            <button
              onClick={() => setShowFullTxHash(!showFullTxHash)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-1"
            >
              {showFullTxHash ? 'Show Less' : 'Show More'}
            </button>
          </div>
        </div>
      )}

      {/* Additional Transaction Info from useTransaction */}
      {event.transactionHash && (
        <>
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          {isLoadingTx && (
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-full" />
            </div>
          )}
          {txError && (
            <div className="grid grid-cols-[100px_1fr] items-center gap-4 text-red-600 dark:text-red-400 text-sm">
              <span>Tx Error:</span>
              <span>Failed to load details.</span>
            </div>
          )}
          {txData && (
            <>
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Block:</span>
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {txData.blockNumber?.toString() ?? 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Gas Price:</span>
                <span className="text-sm text-gray-800 dark:text-gray-200">{formatGas(txData.gasPrice)}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Gas Used:</span>
                <span className="text-sm text-gray-800 dark:text-gray-200">{txData.gas?.toString() ?? 'N/A'}</span>
              </div>
              {/* Add more fields from txData as needed (e.g., txData.value, txData.nonce) */}
            </>
          )}
        </>
      )}

      {/* Event ID (useful for debugging) */}
      <hr className="my-2 border-gray-200 dark:border-gray-700" />
      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Event ID:</span>
        <span className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{event.id}</span>
      </div>
    </div>
  );
}
