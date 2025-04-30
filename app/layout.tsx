import type { Metadata } from 'next';
import { headers } from 'next/headers';

import Providers from '@/providers/globalProvider';
import { BottomNav } from '@/components/shared/BottomNav';
import WalletConnectionGuard from '@/components/auth/WalletConnectionGuard';

import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';

import Header from '@/components/header';

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
          <Header />
          <main className="relativ overflow-hidden">
            <div className="h-full pb-20 flex flex-col gap-6 overflow-y-auto lg:max-w-[1024px] lg:mx-auto">
              <WalletConnectionGuard>{children}</WalletConnectionGuard>
            </div>
            <div className="fixed bottom-0 left-0 right-0 z-50">
              <BottomNav />
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
