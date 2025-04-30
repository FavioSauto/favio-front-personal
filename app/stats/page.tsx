'use client';

import Charts from '@/components/shared/Charts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIsWrongNetwork } from '@/providers/stores/storeProvider';
import { switchNetwork as switchNetworkCore } from '@wagmi/core';
import { sepolia } from 'wagmi/chains';
import { config } from '@/lib/config';

export default function StatsPage() {
  const isWrongNetwork = useIsWrongNetwork();

  const handleSwitchNetwork = async () => {
    try {
      await switchNetworkCore(config, { chainId: sepolia.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
      // Handle error (e.g., show a toast notification)
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Token Event Statistics</h1>

      {/* Wrong Network Warning */}
      {isWrongNetwork && (
        <Card className="mb-6 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700">
          <CardContent className="p-3 text-center text-red-700 dark:text-red-300 font-medium flex flex-col items-center gap-2">
            <span>You must be connected to the Sepolia network to view statistics.</span>
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

      {/* Conditionally render Charts */}
      {!isWrongNetwork && <Charts />}
    </div>
  );
}
