import { formatUnits } from 'viem';
import { getPublicClient } from 'wagmi/actions';
import { StateCreator } from 'zustand';

import { config } from '@/lib/config';
import { middleEllipsis } from '@/lib/utils';

export interface ProfileSlice {
  details: { address: string; chain: string; balance: string; ensName: string };
  detailsIsLoading: boolean;
  detailsHasError: string | null;
  detailsActions: {
    fetchProfile: (walletAddress: string | undefined) => Promise<void>;
  };
}

export const createProfileSlice: StateCreator<ProfileSlice, [], [], ProfileSlice> = (set) => ({
  details: { address: '', chain: '', balance: '', ensName: '' },
  detailsIsLoading: false,
  detailsHasError: null,
  detailsActions: {
    fetchProfile: async (walletAddress) => {
      const publicClient = getPublicClient(config);

      if (!walletAddress) {
        set({
          details: { address: '', chain: '', balance: '', ensName: '' },
          detailsIsLoading: false,
          detailsHasError: null,
        });
        return;
      }

      set({ detailsIsLoading: true, detailsHasError: null });

      try {
        const balance = await publicClient.getBalance({ address: walletAddress as `0x${string}` });
        const ensName = await publicClient.getEnsName({ address: walletAddress as `0x${string}` });

        set({
          details: {
            address: middleEllipsis(walletAddress as string, 4) || walletAddress,
            chain: config.chains[0].name,
            balance: `${Number(formatUnits(balance, 18)).toFixed(4)} ${config.chains[0].nativeCurrency.symbol}`,
            ensName: ensName || '',
          },
          detailsIsLoading: false,
          detailsHasError: null,
        });
      } catch (error) {
        set({ detailsHasError: error as string, detailsIsLoading: false });
      }
    },
  },
});
