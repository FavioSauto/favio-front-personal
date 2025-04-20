'use client';

import { RainbowKitProvider, darkTheme as createDarkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, cookieToInitialState } from 'wagmi';

import { config } from '@/lib/config';
import { StoreProvider } from '@/providers/stores/storeProvider';

const queryClient = new QueryClient();

type Props = {
  children: React.ReactNode;
  cookie?: string | null;
};

export default function Providers({ children, cookie }: Props) {
  const initialState = cookieToInitialState(config, cookie);
  const darkTheme = createDarkTheme({
    accentColor: '#0E76FD',
    accentColorForeground: 'white',
    borderRadius: 'large',
    fontStack: 'system',
    overlayBlur: 'small',
  });

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <StoreProvider>
          <RainbowKitProvider theme={darkTheme} modalSize="compact" coolMode>
            {children}
          </RainbowKitProvider>
        </StoreProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
