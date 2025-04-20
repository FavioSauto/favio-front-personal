import { StateCreator } from 'zustand';

export interface NetworkSlice {
  network: 'sepolia';
  isWrongNetwork: boolean;
  networkActions: {
    setIsWrongNetwork: (isWrongNetwork: boolean) => void;
  };
}

export const createNetworkSlice: StateCreator<NetworkSlice, [], [], NetworkSlice> = (set) => ({
  network: 'sepolia',
  isWrongNetwork: false,
  networkActions: {
    setIsWrongNetwork: (isWrongNetwork) => set({ isWrongNetwork }),
  },
});
