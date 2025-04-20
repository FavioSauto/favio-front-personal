'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, createStorage, cookieStorage } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const projectId = '91db283282e562e579ba0c598b1520fa';

export const config = getDefaultConfig({
  appName: 'Wonderland Challenge',
  projectId,
  chains: [sepolia],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [sepolia.id]: http(),
  },
});
