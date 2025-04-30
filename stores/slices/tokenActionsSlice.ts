import { formatUnits, parseUnits } from 'viem';
import { readContract, writeContract } from 'wagmi/actions';
import { sepolia } from 'wagmi/chains';
import { StateCreator } from 'zustand';

import { config } from '@/lib/config';
// Import other slice types to allow get() access
import { ErrorSlice } from './errorSlice';
import { HistorySlice } from './historySlice';
import { NetworkSlice } from './networkSlice';
import { ProfileSlice } from './profileSlice';

// ERC20 ABI minimal interface
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: 'remaining', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_address', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    type: 'function',
  },
] as const;

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

interface TokenBalance {
  balance: string;
  symbol: string;
  loading: boolean;
  error: string | null;
}

export interface TransactionState {
  loading: boolean;
  error: string | null;
  success: boolean;
  txHash: string | null;
}

export interface TokenActionsSlice {
  daiBalance: TokenBalance;
  usdcBalance: TokenBalance;
  transactionState: TransactionState;
  selectedToken: 'DAI' | 'USDC';
  approve: {
    allowance: string;
    form: {
      amount: string;
      spenderAddress: string;
      validationErrors: {
        amount: string;
        spenderAddress: string;
      };
    };
    transactionState: TransactionState;
  };
  transfer: {
    form: {
      amount: string;
      recipientAddress: string;
      validationErrors: {
        amount: string;
        recipientAddress: string;
      };
    };
    transactionState: TransactionState;
  };
  mint: {
    selectedToken: 'DAI' | 'USDC';
    form: {
      amount: string;
      validationErrors: {
        amount: string;
      };
    };
    transactionState: TransactionState;
  };
  balanceActions: {
    fetchTokenBalances: (walletAddress: string | undefined) => Promise<void>;
    setSelectedToken: (token: 'DAI' | 'USDC') => void;
    resetTransactionState: () => void;

    setTransferFormValues: (values: { amount?: string; recipientAddress?: string }) => void;
    setTransferFormValidationErrors: (errors: { amount?: string; recipientAddress?: string }) => void;
    setTransferTransactionState: (transactionState: TransactionState) => void;
    transferToken: (token: 'DAI' | 'USDC', recipient: string, amount: string) => Promise<`0x${string}` | undefined>;

    setApproveFormValues: (values: { amount?: string; spenderAddress?: string }) => void;
    setApproveFormValidationErrors: (errors: { amount?: string; spenderAddress?: string }) => void;
    setApproveTransactionState: (state: TransactionState) => void;
    approveToken: (token: 'DAI' | 'USDC', spender: string, amount: string) => Promise<`0x${string}` | undefined>;

    setMintAmount: (amount: string) => void;
    mintToken: (token: 'DAI' | 'USDC', amount: string) => Promise<`0x${string}` | undefined>;
    setMintFormValidationErrors: (errors: { amount?: string; recipientAddress?: string }) => void;
    setMintTransactionState: (state: TransactionState) => void;
  };
}

// Define the combined state type for use with get()
// Ensure all your actual slice types are included here
type AppState = TokenActionsSlice & ErrorSlice & HistorySlice & NetworkSlice & ProfileSlice;

export const createTokenActionsSlice: StateCreator<AppState, [], [], TokenActionsSlice> = (set, get) => ({
  selectedToken: 'DAI',
  daiBalance: {
    balance: '',
    symbol: TOKENS.DAI.symbol,
    loading: true,
    error: null,
  },
  usdcBalance: {
    balance: '',
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
  mint: {
    selectedToken: 'DAI',
    form: {
      amount: '',
      validationErrors: {
        amount: '',
      },
    },
    transactionState: {
      loading: false,
      error: null,
      success: false,
      txHash: null,
    },
  },
  transfer: {
    form: {
      amount: '',
      recipientAddress: '',
      validationErrors: {
        amount: '',
        recipientAddress: '',
      },
    },
    transactionState: {
      loading: false,
      error: null,
      success: false,
      txHash: null,
    },
  },
  approve: {
    allowance: '',
    form: {
      amount: '',
      spenderAddress: '',
      validationErrors: {
        amount: '',
        spenderAddress: '',
      },
    },
    transactionState: {
      loading: false,
      error: null,
      success: false,
      txHash: null,
    },
  },
  balanceActions: {
    fetchTokenBalances: async (walletAddress) => {
      if (!walletAddress) {
        set({
          daiBalance: {
            balance: '0',
            symbol: TOKENS.DAI.symbol,
            loading: false,
            error: null,
          },
          usdcBalance: {
            balance: '0',
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
            balance: formattedDaiBalance,
            symbol: TOKENS.DAI.symbol,
            loading: false,
            error: null,
          },
          usdcBalance: {
            balance: formattedUsdcBalance,
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
    setSelectedToken: (token: 'DAI' | 'USDC') => {
      set((state) => ({
        ...state,
        selectedToken: token,
      }));
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

    // --- Approve Actions ---
    setApproveFormValues: (values: { amount?: string; spenderAddress?: string }) => {
      set((state) => ({
        ...state,
        approve: { ...state.approve, form: { ...state.approve.form, ...values } },
      }));
    },
    setApproveFormValidationErrors: (errors: { amount?: string; spenderAddress?: string }) => {
      set((state) => ({
        ...state,
        approve: {
          ...state.approve,
          form: { ...state.approve.form, validationErrors: { ...state.approve.form.validationErrors, ...errors } },
        },
      }));
    },
    setApproveTransactionState: (transactionState: TransactionState) => {
      set((state) => ({ approve: { ...state.approve, transactionState } }));
    },
    approveToken: async (token, spender, amount) => {
      try {
        const tokenConfig = TOKENS[token];
        const parsedAmount = parseUnits(amount, tokenConfig.decimals);

        const result = await writeContract(config, {
          address: tokenConfig.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [spender as `0x${string}`, parsedAmount],
          chainId: sepolia.id,
        });

        return result;
      } catch (error: unknown) {
        console.error(`Error approving ${token}:`, error);
        let message = `Failed to approve ${token}. Please try again.`;
        let userRejected = false;

        if (error instanceof Error) {
          message = error.message;
          userRejected = message.includes('rejected');
        } else if (typeof error === 'object' && error !== null) {
          let potentialMsg = '';
          if ('shortMessage' in error && typeof error.shortMessage === 'string') {
            potentialMsg = error.shortMessage;
          } else if ('message' in error && typeof error.message === 'string') {
            potentialMsg = error.message;
          }
          if (potentialMsg) {
            message = potentialMsg;
            userRejected = message.includes('rejected');
          }
        }

        const finalMessage = userRejected ? 'Approve transaction was rejected.' : message;
        get().errorActions.setError(finalMessage);
        return undefined;
      }
    },

    // --- Transfer Actions ---
    setTransferFormValidationErrors: (errors: { amount?: string; recipientAddress?: string }) => {
      set((state) => ({
        ...state,
        transfer: {
          ...state.transfer,
          form: { ...state.transfer.form, validationErrors: { ...state.transfer.form.validationErrors, ...errors } },
        },
      }));
    },
    setTransferFormValues: (values: { amount?: string; recipientAddress?: string }) => {
      set((state) => ({
        ...state,
        transfer: { ...state.transfer, form: { ...state.transfer.form, ...values } },
      }));
    },
    setTransferTransactionState: (transactionState: TransactionState) => {
      set((state) => ({ transfer: { ...state.transfer, transactionState } }));
    },
    transferToken: async (token, recipient, amount) => {
      try {
        const tokenConfig = TOKENS[token];
        const parsedAmount = parseUnits(amount, tokenConfig.decimals);

        const result = await writeContract(config, {
          address: tokenConfig.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [recipient as `0x${string}`, parsedAmount],
          chainId: sepolia.id,
        });

        return result;
      } catch (error: unknown) {
        console.error(`Error transferring ${token}:`, error);
        let message = `Failed to transfer ${token}. Please check details and balance.`;
        let userRejected = false;

        if (error instanceof Error) {
          message = error.message;
          userRejected = message.includes('rejected');
        } else if (typeof error === 'object' && error !== null) {
          let potentialMsg = '';
          if ('shortMessage' in error && typeof error.shortMessage === 'string') {
            potentialMsg = error.shortMessage;
          } else if ('message' in error && typeof error.message === 'string') {
            potentialMsg = error.message;
          }
          if (potentialMsg) {
            message = potentialMsg;
            userRejected = message.includes('rejected');
          }
        }

        const finalMessage = userRejected ? 'Transfer transaction was rejected.' : message;
        get().errorActions.setError(finalMessage);
        return undefined;
      }
    },

    // --- Mint Actions ---
    setMintAmount: (amount: string) => {
      set((state) => ({
        mint: { ...state.mint, form: { ...state.mint.form, amount } },
      }));
    },
    setMintFormValidationErrors: (errors: { amount?: string }) => {
      set((state) => ({
        ...state,
        mint: {
          ...state.mint,
          form: { ...state.mint.form, validationErrors: { ...state.mint.form.validationErrors, ...errors } },
        },
      }));
    },
    setMintTransactionState: (transactionState: TransactionState) => {
      set((state) => ({ mint: { ...state.mint, transactionState } }));
    },
    mintToken: async (token, amount) => {
      const walletAddress = get().details?.address;
      if (!walletAddress) {
        const message = 'Wallet address not found. Please connect your wallet.';
        console.error(message);
        get().errorActions.setError(message);
        return undefined;
      }

      try {
        const tokenConfig = TOKENS[token];
        const parsedAmount = parseUnits(amount, tokenConfig.decimals);

        const result = await writeContract(config, {
          address: tokenConfig.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'mint',
          args: [walletAddress, parsedAmount],
          chainId: sepolia.id,
        });

        return result;
      } catch (error: unknown) {
        console.error(`Error minting ${token}:`, error);
        let message = `Failed to mint ${token}. Please try again.`;
        let userRejected = false;

        if (error instanceof Error) {
          message = error.message;
          userRejected = message.includes('rejected');
        } else if (typeof error === 'object' && error !== null) {
          let potentialMsg = '';
          if ('shortMessage' in error && typeof error.shortMessage === 'string') {
            potentialMsg = error.shortMessage;
          } else if ('message' in error && typeof error.message === 'string') {
            potentialMsg = error.message;
          }
          if (potentialMsg) {
            message = potentialMsg;
            userRejected = message.includes('rejected');
          }
        }

        const finalMessage = userRejected ? 'Mint transaction was rejected.' : message;
        get().errorActions.setError(finalMessage);
        return undefined;
      }
    },
  },
});

// Export token constants for reuse
export { TOKENS };
