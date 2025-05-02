import { getBlockNumber } from '@wagmi/core';
import { formatUnits } from 'viem';
import { getPublicClient } from 'wagmi/actions';
import { StateCreator } from 'zustand';

import { config } from '@/lib/config';

// Token configuration
const TOKENS = {
  DAI: {
    symbol: 'DAI',
    address: '0x1D70D57ccD2798323232B2dD027B3aBcA5C00091',
    decimals: 18,
  },
  USDC: {
    symbol: 'USDC',
    address: '0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47',
    decimals: 6,
  },
};

export interface TokenEvent {
  amount: string;
  from: string;
  id: string;
  to: string;
  status: 'Pending' | 'Success' | 'Failed';
  token: 'DAI' | 'USDC';
  transactionHash: string;
  type: 'Transfer' | 'Approve' | 'Mint';
}

export interface HistorySlice {
  events: TokenEvent[];
  optimisticEvents: TokenEvent[];
  eventsIsLoading: boolean;
  eventsErrorMessage: string | null;
  eventsActions: {
    fetchEvents: (walletAddress: string | undefined) => Promise<void>;
    resetOptimisticEvents: () => void;
    setOptimisticEvents: (event: TokenEvent) => void;
  };
}

export const createHistorySlice: StateCreator<HistorySlice, [], [], HistorySlice> = (set) => ({
  events: [],
  optimisticEvents: [],
  eventsIsLoading: false,
  eventsErrorMessage: null,
  eventsActions: {
    fetchEvents: async (walletAddress) => {
      if (!walletAddress) {
        set({ events: [], optimisticEvents: [], eventsIsLoading: false, eventsErrorMessage: null });
        return;
      }

      set({ eventsErrorMessage: null });

      try {
        const events: TokenEvent[] = [];
        const publicClient = getPublicClient(config);
        const fromBlock = await getBlockNumber(config);

        // Fetch events for each token
        for (const [tokenSymbol, tokenConfig] of Object.entries(TOKENS)) {
          const token = tokenSymbol as 'DAI' | 'USDC';

          // Fetch all Transfer events
          const transferLogs = await publicClient.getLogs({
            address: tokenConfig.address as `0x${string}`,
            event: {
              inputs: [
                { indexed: true, name: 'from', type: 'address' },
                { indexed: true, name: 'to', type: 'address' },
                { indexed: false, name: 'value', type: 'uint256' },
              ],
              name: 'Transfer',
              type: 'event',
            },
            fromBlock: fromBlock - BigInt(10000),
            toBlock: 'latest',
          });

          // Fetch all Approval events
          const approvalLogs = await publicClient.getLogs({
            address: tokenConfig.address as `0x${string}`,
            event: {
              inputs: [
                { indexed: true, name: 'owner', type: 'address' },
                { indexed: true, name: 'spender', type: 'address' },
                { indexed: false, name: 'value', type: 'uint256' },
              ],
              name: 'Approval',
              type: 'event',
            },
            fromBlock: fromBlock - BigInt(99),
            toBlock: 'latest',
          });

          // Process Transfer events where user is involved
          for (const log of transferLogs) {
            if (!log.args?.value || !log.args?.from || !log.args?.to || !log.transactionHash) {
              continue;
            }

            // Only include events where user is sender or recipient
            if (
              log.args.from.toLowerCase() !== walletAddress.toLowerCase() &&
              log.args.to.toLowerCase() !== walletAddress.toLowerCase()
            ) {
              continue;
            }

            const eventType = log.args.from === '0x0000000000000000000000000000000000000000' ? 'Mint' : 'Transfer';

            events.push({
              amount: formatUnits(log.args.value, tokenConfig.decimals),
              from: log.args.from,
              id: log.transactionHash,
              status: 'Success',
              to: log.args.to,
              token,
              transactionHash: log.transactionHash,
              type: eventType,
            });
          }

          // Process Approval events where user is involved
          for (const log of approvalLogs) {
            if (!log.args?.value || !log.args?.owner || !log.args?.spender || !log.transactionHash) {
              continue;
            }

            // Only include events where user is owner or spender
            if (
              log.args.owner.toLowerCase() !== walletAddress.toLowerCase() &&
              log.args.spender.toLowerCase() !== walletAddress.toLowerCase()
            ) {
              continue;
            }

            events.push({
              amount: formatUnits(log.args.value, tokenConfig.decimals),
              from: log.args.owner,
              id: log.transactionHash,
              status: 'Success',
              to: log.args.spender,
              token,
              transactionHash: log.transactionHash,
              type: 'Approve',
            });
          }
        }

        set({ events, optimisticEvents: events, eventsIsLoading: false, eventsErrorMessage: null });
      } catch (error) {
        console.error('Error fetching events:', error);
        set({ events: [], optimisticEvents: [], eventsIsLoading: false, eventsErrorMessage: 'Failed to fetch events' });
      }
    },
    resetOptimisticEvents: () => {
      set((state) => ({ optimisticEvents: state.events }));
    },
    setOptimisticEvents: (event: TokenEvent) => {
      set((state) => ({ optimisticEvents: [...state.optimisticEvents, event] }));
    },
  },
});
