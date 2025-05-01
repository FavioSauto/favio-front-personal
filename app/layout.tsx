import type { Metadata } from 'next';
import { headers } from 'next/headers';

import Providers from '@/providers/globalProvider';
import WalletConnectionGuard from '@/components/auth/WalletConnectionGuard';
import ErrorModal from '@/components/shared/ErrorModal';

import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wonderland Challenge',
  description: 'Blockchain Mock Application that integrates with smart contracts and he state is managed by Zustand.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookie = (await headers()).get('cookie');

  return (
    <html lang="en">
      <head>{/* <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" /> */}</head>
      <body className="relative">
        <Providers cookie={cookie}>
          <WalletConnectionGuard>{children}</WalletConnectionGuard>
          <ErrorModal />
        </Providers>
      </body>
    </html>
  );
}
