import { create } from 'zustand';

import { createHistorySlice, HistorySlice } from './slices/historySlice';
import { createNetworkSlice, NetworkSlice } from './slices/networkSlice';
import { createProfileSlice, ProfileSlice } from './slices/profileSlice';
import { createTokenActionsSlice, TokenActionsSlice } from './slices/tokenActionsSlice';

export function createStore() {
  return create<ProfileSlice & TokenActionsSlice & HistorySlice & NetworkSlice>()((...a) => ({
    ...createProfileSlice(...a),
    ...createTokenActionsSlice(...a),
    ...createHistorySlice(...a),
    ...createNetworkSlice(...a),
  }));
}
