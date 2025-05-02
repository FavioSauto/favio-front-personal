import { create } from 'zustand';

import { AppState } from '@/types/global';

import { createHistorySlice } from './slices/historySlice';
import { createNetworkSlice } from './slices/networkSlice';
import { createProfileSlice } from './slices/profileSlice';
import { createBalanceSlice } from './slices/balanceSlice';
import { createErrorSlice } from './slices/errorSlice';
import { createMintSlice } from './slices/mintSlice';
import { createTransferSlice } from './slices/transferSlice';
import { createApproveSlice } from './slices/approveSlice';

export function createStore() {
  return create<AppState>()((...a) => ({
    ...createProfileSlice(...a),
    ...createBalanceSlice(...a),
    ...createHistorySlice(...a),
    ...createNetworkSlice(...a),
    ...createErrorSlice(...a),
    ...createMintSlice(...a),
    ...createApproveSlice(...a),
    ...createTransferSlice(...a),
  }));
}
