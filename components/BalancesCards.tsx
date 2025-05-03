'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { switchChain } from '@wagmi/core';
import { sepolia } from 'wagmi/chains';

import { config } from '@/lib/config';

import {
  useBalanceActions,
  useDaiBalances,
  useIsDaiPending,
  useIsUsdcPending,
  useIsWrongNetwork,
  useSelectedToken,
  useUsdcBalances,
} from '@/providers/stores/storeProvider';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import TokenCard from '@/components/shared/TokenCard';

export default function BalancesCards() {
  const { address: walletAddress } = useAccount();

  const daiBalance = useDaiBalances();
  const isDaiPending = useIsDaiPending();
  const isUsdcPending = useIsUsdcPending();
  const isWrongNetwork = useIsWrongNetwork();
  const selectedToken = useSelectedToken();
  const usdcBalance = useUsdcBalances();

  const haveBalancesLoadedCorrectly = daiBalance.balance && usdcBalance.balance;

  const { fetchTokenBalances } = useBalanceActions();

  useEffect(
    function fetchTokenBalancesAndEvents() {
      if (walletAddress && !haveBalancesLoadedCorrectly) {
        fetchTokenBalances(walletAddress);
      }
    },
    [walletAddress, haveBalancesLoadedCorrectly, fetchTokenBalances]
  );

  const handleSwitchNetwork = async () => {
    try {
      await switchChain(config, { chainId: sepolia.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
      // Handle error (e.g., show a toast notification)
    }
  };

  return (
    <>
      {/* Container for Token Card and Quick Actions */}

      {/* Wrong Network Warning */}
      {isWrongNetwork && (
        <Card className="w-full bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700">
          <CardContent className="p-4 text-center text-red-700 dark:text-red-300 font-medium flex flex-col items-center gap-2">
            <span>You are connected to the wrong network. Please switch to Sepolia to perform actions.</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSwitchNetwork}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white"
            >
              Switch to Sepolia
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center w-full md:justify-start min-h-[120px]">
        {selectedToken === 'DAI' && (
          <TokenCard
            tokenType="DAI"
            balance={isWrongNetwork ? 0 : Number(daiBalance.optimisticBalance)}
            isTokenPending={isDaiPending}
          />
        )}
        {selectedToken === 'USDC' && (
          <TokenCard
            tokenType="USDC"
            balance={isWrongNetwork ? 0 : Number(usdcBalance.optimisticBalance)}
            isTokenPending={isUsdcPending}
          />
        )}
      </div>
    </>
  );
}
