import { parseUnits } from 'viem';
import { writeContract } from 'wagmi/actions';
import { sepolia } from 'wagmi/chains';
import { StateCreator } from 'zustand';

import { config } from '@/lib/config';
import { ERC20_ABI, TOKENS } from '@/lib/contractsAbi';

import type { AppState, TransactionState } from '@/types/global';

export interface ApproveSlice {
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
  approveActions: {
    setApproveFormValues: (values: { amount?: string; spenderAddress?: string }) => void;
    setApproveFormValidationErrors: (errors: { amount?: string; spenderAddress?: string }) => void;
    setApproveTransactionState: (state: TransactionState) => void;
    approveToken: (token: 'DAI' | 'USDC', spender: string, amount: string) => Promise<`0x${string}` | undefined>;
  };
}

export const createApproveSlice: StateCreator<AppState, [], [], ApproveSlice> = (set, get) => ({
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
  approveActions: {
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
        const message = `Failed to approve ${token}. Please try again.`;
        let userRejected = false;

        if (error instanceof Error) {
          userRejected = message.includes('rejected');
        }

        const finalMessage = userRejected ? 'Approve transaction was rejected.' : message;
        get().errorActions.setError(finalMessage);
        return undefined;
      }
    },
  },
});
