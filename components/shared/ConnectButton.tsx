'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal, useAccountModal, useChainModal } from '@rainbow-me/rainbowkit';

import { cn } from '@/lib/utils';
import { useIsWrongNetwork, useNetworkActions, useProfileActions } from '@/providers/stores/storeProvider';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function ConnectButton() {
  const router = useRouter();
  const { isConnecting, isConnected, chain, address: walletAddress } = useAccount();

  const isWrongNetwork = useIsWrongNetwork();

  const { setIsWrongNetwork } = useNetworkActions();
  const { fetchProfile } = useProfileActions();

  useEffect(
    function fetchProfileState() {
      if (walletAddress) {
        fetchProfile(walletAddress);
      } else {
        console.error('Failed to fetch profile: walletAddress is undefined');
      }
    },
    [walletAddress, fetchProfile]
  );

  useEffect(
    function setIsWrongNetworkState() {
      if (isConnected && !chain) {
        setIsWrongNetwork(true);
      } else {
        setIsWrongNetwork(false);
      }
    },
    [isConnected, chain, setIsWrongNetwork, router]
  );

  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();
  const { disconnect } = useDisconnect();

  const prevIsConnected = useRef(isConnected);

  useEffect(
    function redirectToDashboardOnSuccessfulLogInOnly() {
      if (!prevIsConnected.current && isConnected && !isConnecting) {
        // Only redirect if we just connected
        router.push('/dashboard');
      }
      // Update the ref after the check
      prevIsConnected.current = isConnected;
    },
    [isConnected, isConnecting, router]
  );

  if (!isConnected) {
    return (
      <Button
        variant="default"
        onClick={async () => {
          if (isConnected) {
            disconnect();
          }
          openConnectModal?.();
        }}
        disabled={isConnecting}
        className={cn(
          'relative overflow-hidden group',
          'bg-gradient-to-r from-indigo-500 to-purple-600',
          'hover:from-indigo-600 hover:to-purple-700',
          'text-white font-semibold',
          'px-8 py-6',
          'hover:px-4',
          'rounded-xl',
          'transition-colors',
          'transition-all duration-300',
          'shadow-lg hover:shadow-xl',
          'transform hover:-translate-y-0.5',
          'hover:px-10',
          'cursor-pointer',
          'before:absolute before:inset-0',
          'before:bg-gradient-to-r before:from-white/10 before:to-transparent',
          'before:opacity-0 hover:before:opacity-100',
          'before:transition-opacity before:duration-300'
        )}
      >
        {isConnecting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <span className="text-lg">Connect Wallet</span>
            <svg
              className="w-5 h-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </Button>
    );
  }

  if (isWrongNetwork) {
    return (
      <Button
        variant="destructive"
        onClick={openChainModal}
        className={cn(
          'relative overflow-hidden group',
          'bg-gradient-to-r from-red-500 to-red-600',
          'hover:from-red-600 hover:to-red-700',
          'text-white font-semibold',
          'px-8 py-6',
          'rounded-xl',
          'duration-300',
          'transition-colors',
          'transition-all',
          'hover:px-4',
          'cursor-pointer',
          'shadow-lg hover:shadow-xl',
          'transform hover:-translate-y-0.5',
          'before:absolute before:inset-0',
          'before:bg-gradient-to-r before:from-white/10 before:to-transparent',
          'before:opacity-0 hover:before:opacity-100',
          'before:transition-opacity before:duration-300'
        )}
      >
        <span className="text-lg">Switch Networks</span>
        <svg
          className="w-5 h-5 transition-transform group-hover:rotate-180 duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => openAccountModal?.()}
      className="p-0 rounded-full size-10 cursor-pointer focus-visible:ring-0"
    >
      <Avatar className="size-10">
        <AvatarImage src={`/images/chains/${chain?.id}.png`} />
        <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          {isConnected && chain?.name ? chain.name.charAt(0).toUpperCase() : 'A'}
        </AvatarFallback>
      </Avatar>
    </Button>
  );
}
