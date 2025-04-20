import type { Metadata } from 'next';
import { headers } from 'next/headers';

import Providers from '@/providers/globalProvider';

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
      <body>
        <Providers cookie={cookie}>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
