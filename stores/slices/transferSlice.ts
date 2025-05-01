import { parseUnits } from 'viem';
import { writeContract } from 'wagmi/actions';
import { sepolia } from 'wagmi/chains';
import { StateCreator } from 'zustand';

import { ERC20_ABI, TOKENS } from '@/lib/contractsAbi';
import { config } from '@/lib/config';

import type { AppState, TransactionState } from '@/types/global';

export interface TransferSlice {
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
  transferActions: {
    setTransferFormValues: (values: { amount?: string; recipientAddress?: string }) => void;
    setTransferFormValidationErrors: (errors: { amount?: string; recipientAddress?: string }) => void;
    setTransferTransactionState: (transactionState: TransactionState) => void;
    transferToken: (token: 'DAI' | 'USDC', recipient: string, amount: string) => Promise<`0x${string}` | undefined>;
  };
}

export const createTransferSlice: StateCreator<AppState, [], [], TransferSlice> = (set, get) => ({
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
  transferActions: {
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
        const message = `Failed to transfer ${token}. Please check details and balance.`;
        let userRejected = false;

        if (error instanceof Error) {
          userRejected = message.includes('rejected');
        }
        const finalMessage = userRejected ? 'Transfer transaction was rejected.' : message;
        get().errorActions.setError(finalMessage);
        return undefined;
      }
    },
  },
});
