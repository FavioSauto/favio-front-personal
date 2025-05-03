'use client';

import { useAccount } from 'wagmi';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface WalletConnectionGuardProps {
  children: React.ReactNode;
}

export default function WalletConnectionGuard({ children }: WalletConnectionGuardProps) {
  const { isConnected, isConnecting } = useAccount();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(
    function redirectToRootIfNotConnected() {
      // Wait until the connection status is determined
      if (isConnecting) {
        return;
      }

      // If not connected and not already on the root page, redirect to root
      if (!isConnected && pathname !== '/') {
        router.push('/');
      }
    },
    [isConnected, isConnecting, router, pathname]
  );

  // While connecting or if redirecting, potentially show a loader or nothing
  // Or only render children if connected or on the root page
  if ((isConnecting || (!isConnected && pathname !== '/')) && pathname !== '/') {
    // Optional: Render a loading indicator or null while checking/redirecting
    // For now, let's render null to avoid flashing content
    return null;
  }

  // Render children if connected, or if on the root page regardless of connection
  return <>{children}</>;
}
