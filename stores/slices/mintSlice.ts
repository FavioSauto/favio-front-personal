import { parseUnits } from 'viem';
import { writeContract } from 'wagmi/actions';
import { sepolia } from 'wagmi/chains';
import { StateCreator } from 'zustand';

import { ERC20_ABI, TOKENS } from '@/lib/contractsAbi';
import { config } from '@/lib/config';

import type { AppState, TransactionState } from '@/types/global';

export interface MintSlice {
  mint: {
    form: {
      amount: string;
      validationErrors: {
        amount: string;
      };
    };
    transactionState: TransactionState;
  };
  mintActions: {
    setMintAmount: (amount: string) => void;
    mintToken: (token: 'DAI' | 'USDC', amount: string) => Promise<`0x${string}` | undefined>;
    setMintFormValidationErrors: (errors: { amount?: string; recipientAddress?: string }) => void;
    setMintTransactionState: (state: TransactionState) => void;
  };
}

export const createMintSlice: StateCreator<AppState, [], [], MintSlice> = (set, get) => ({
  mint: {
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
  mintActions: {
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
        const message = `Failed to mint ${token}. Please try again.`;
        let userRejected = false;

        if (error instanceof Error) {
          userRejected = message.includes('rejected');
        }

        const finalMessage = userRejected ? 'Mint transaction was rejected.' : message;
        get().errorActions.setError(finalMessage);
        return undefined;
      }
    },
  },
});
