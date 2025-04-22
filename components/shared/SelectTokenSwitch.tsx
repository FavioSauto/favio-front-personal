'use client';

import { useBalanceActions, useSelectedToken } from '@/providers/stores/storeProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';

export default function SelectTokenSwitch() {
  const { isConnected } = useAccount();
  const selectedToken = useSelectedToken();
  const { setSelectedToken } = useBalanceActions();

  if (!isConnected) return null;

  return (
    <div className="flex items-center gap-2 rounded-full p-1 bg-gray-100 dark:bg-gray-700">
      <Button
        variant={selectedToken === 'DAI' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setSelectedToken('DAI')}
        className={cn(
          'w-16 rounded-full transition-colors duration-200',
          selectedToken === 'DAI'
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700'
            : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
        )}
      >
        DAI
      </Button>
      <Button
        variant={selectedToken === 'USDC' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setSelectedToken('USDC')}
        className={cn(
          'w-16 rounded-full transition-colors duration-200',
          selectedToken === 'USDC'
            ? 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700'
            : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
        )}
      >
        USDC
      </Button>
    </div>
  );
}
