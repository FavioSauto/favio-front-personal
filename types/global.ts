import { ErrorSlice } from '@/stores/slices/errorSlice';
import { HistorySlice } from '@/stores/slices/historySlice';
import { MintSlice } from '@/stores/slices/mintSlice';
import { NetworkSlice } from '@/stores/slices/networkSlice';
import { ProfileSlice } from '@/stores/slices/profileSlice';
import { BalanceSlice } from '@/stores/slices/balanceSlice';
import { TransferSlice } from '@/stores/slices/transferSlice';
import { ApproveSlice } from '@/stores/slices/approveSlice';

export interface TransactionState {
  loading: boolean;
  error: string | null;
  success: boolean;
  txHash: string | null;
}

export type AppState = ProfileSlice &
  BalanceSlice &
  HistorySlice &
  NetworkSlice &
  ErrorSlice &
  MintSlice &
  TransferSlice &
  ApproveSlice;
