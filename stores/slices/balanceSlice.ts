import { formatUnits } from 'viem';
import { readContract } from 'wagmi/actions';
import { sepolia } from 'wagmi/chains';
import { StateCreator } from 'zustand';

import { ERC20_ABI, TOKENS } from '@/lib/contractsAbi';
import { config } from '@/lib/config';

import type { AppState, TransactionState } from '@/types/global';

interface TokenBalance {
  balance: bigint | null;
  optimisticBalance: bigint | null;
  symbol: string;
  loading: boolean;
  error: string | null;
}

export interface BalanceSlice {
  daiBalance: TokenBalance;
  usdcBalance: TokenBalance;
  transactionState: TransactionState;
  selectedToken: 'DAI' | 'USDC';
  balanceActions: {
    fetchTokenBalances: (walletAddress: string | undefined) => Promise<void>;
    resetOptimisticBalance: () => void;
    resetTransactionState: () => void;
    setIsDaiPending: (pending: boolean) => void;
    setIsUsdcPending: (pending: boolean) => void;
    setOptimisticBalance: (amount: string, txType: 'mint' | 'transfer' | 'approve') => void;
    setSelectedToken: (token: 'DAI' | 'USDC') => void;
  };
}

export const createBalanceSlice: StateCreator<AppState, [], [], BalanceSlice> = (set, get) => ({
  selectedToken: 'DAI',
  daiBalance: {
    balance: null,
    optimisticBalance: null,
    symbol: TOKENS.DAI.symbol,
    loading: true,
    error: null,
  },
  usdcBalance: {
    balance: null,
    optimisticBalance: null,
    symbol: TOKENS.USDC.symbol,
    loading: true,
    error: null,
  },
  transactionState: {
    loading: false,
    error: null,
    success: false,
    txHash: null,
  },
  balanceActions: {
    fetchTokenBalances: async (walletAddress) => {
      if (!walletAddress) {
        set({
          daiBalance: {
            balance: null,
            optimisticBalance: null,
            symbol: TOKENS.DAI.symbol,
            loading: false,
            error: null,
          },
          usdcBalance: {
            balance: null,
            optimisticBalance: null,
            symbol: TOKENS.USDC.symbol,
            loading: false,
            error: null,
          },
        });
        return;
      }

      set((state) => ({
        daiBalance: { ...state.daiBalance, loading: true, error: null },
        usdcBalance: { ...state.usdcBalance, loading: true, error: null },
      }));

      try {
        const daiBalanceResult = await readContract(config, {
          address: TOKENS.DAI.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [walletAddress as `0x${string}`],
          chainId: sepolia.id,
        });

        const usdcBalanceResult = await readContract(config, {
          address: TOKENS.USDC.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [walletAddress as `0x${string}`],
          chainId: sepolia.id,
        });

        const formattedDaiBalance = formatUnits(daiBalanceResult as bigint, TOKENS.DAI.decimals);
        const formattedUsdcBalance = formatUnits(usdcBalanceResult as bigint, TOKENS.USDC.decimals);

        set({
          daiBalance: {
            balance: BigInt(formattedDaiBalance),
            optimisticBalance: BigInt(formattedDaiBalance),
            symbol: TOKENS.DAI.symbol,
            loading: false,
            error: null,
          },
          usdcBalance: {
            balance: BigInt(formattedUsdcBalance),
            optimisticBalance: BigInt(formattedUsdcBalance),
            symbol: TOKENS.USDC.symbol,
            loading: false,
            error: null,
          },
        });
      } catch (error: unknown) {
        console.error('Error fetching token balances:', error);
        let errorMessage = 'Unknown error fetching balances';
        if (error instanceof Error) {
          errorMessage = `Failed to fetch token balances: ${error.message}`;
        } else if (typeof error === 'string') {
          errorMessage = `Failed to fetch token balances: ${error}`;
        } else if (typeof error === 'object' && error !== null) {
          if ('shortMessage' in error && typeof error.shortMessage === 'string') {
            errorMessage = `Failed to fetch token balances: ${error.shortMessage}`;
          } else if ('message' in error && typeof error.message === 'string') {
            errorMessage = `Failed to fetch token balances: ${error.message}`;
          }
        }
        get().errorActions.setError(errorMessage);
        set((state) => ({
          daiBalance: { ...state.daiBalance, loading: false, error: 'Failed' },
          usdcBalance: { ...state.usdcBalance, loading: false, error: 'Failed' },
        }));
      }
    },
    resetOptimisticBalance: () => {
      set((state) => {
        if (state.selectedToken === 'DAI') {
          return {
            daiBalance: { ...state.daiBalance, optimisticBalance: state.daiBalance.balance },
          };
        } else {
          return { usdcBalance: { ...state.usdcBalance, optimisticBalance: state.usdcBalance.balance } };
        }
      });
    },
    resetTransactionState: () => {
      set({
        transactionState: {
          loading: false,
          error: null,
          success: false,
          txHash: null,
        },
      });
    },
    setIsDaiPending: (pending: boolean) => {
      set((state) => ({
        daiBalance: { ...state.daiBalance, loading: pending },
      }));
    },
    setIsUsdcPending: (pending: boolean) => {
      set((state) => ({
        usdcBalance: { ...state.usdcBalance, loading: pending },
      }));
    },
    setOptimisticBalance: (amount: string, txType: 'mint' | 'transfer' | 'approve') => {
      set((state) => {
        if (state.selectedToken === 'DAI') {
          if (txType === 'mint') {
            return {
              ...state,
              daiBalance: {
                ...state.daiBalance,
                optimisticBalance: (state.daiBalance.balance ?? BigInt(0)) + BigInt(amount),
              },
            };
          } else if (txType === 'transfer') {
            return {
              ...state,
              daiBalance: {
                ...state.daiBalance,
                optimisticBalance: (state.daiBalance.balance ?? BigInt(0)) - BigInt(amount),
              },
            };
          } else {
            return {
              ...state,
              daiBalance: {
                ...state.daiBalance,
                optimisticBalance: state.daiBalance.balance,
              },
            };
          }
        } else {
          if (txType === 'mint') {
            return {
              ...state,
              usdcBalance: {
                ...state.usdcBalance,
                optimisticBalance: (state.usdcBalance.balance ?? BigInt(0)) + BigInt(amount),
              },
            };
          } else if (txType === 'transfer') {
            return {
              ...state,
              usdcBalance: {
                ...state.usdcBalance,
                optimisticBalance: (state.usdcBalance.balance ?? BigInt(0)) - BigInt(amount),
              },
            };
          } else {
            return {
              ...state,
              usdcBalance: {
                ...state.usdcBalance,
                optimisticBalance: state.usdcBalance.balance,
              },
            };
          }
        }
      });
    },
    setSelectedToken: (token: 'DAI' | 'USDC') => {
      set((state) => ({
        ...state,
        selectedToken: token,
      }));
    },
  },
});

// Export token constants for reuse
export { TOKENS };
