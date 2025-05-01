import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type TokenType = 'DAI' | 'USDC';

export default function TokenCard({
  tokenType,
  balance,
  isTokenPending,
}: {
  tokenType: TokenType;
  balance: number;
  isTokenPending: boolean;
}) {
  const colors =
    tokenType === 'USDC'
      ? {
          border: 'border-blue-500',
          text: 'text-blue-700',
          bg: 'bg-blue-50',
          darkText: 'dark:text-blue-300',
          darkBg: 'dark:bg-blue-900/20',
          darkBorder: 'dark:border-blue-700',
        }
      : {
          border: 'border-yellow-500',
          text: 'text-yellow-700',
          bg: 'bg-yellow-50',
          darkText: 'dark:text-yellow-300',
          darkBg: 'dark:bg-yellow-900/20',
          darkBorder: 'dark:border-yellow-600',
        };

  console.log('tokenType', tokenType, balance);
  return (
    <div className="relative w-full transition-all duration-300 ease-in-out">
      <Card
        className={cn(
          `border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200`,
          colors.border,
          colors.bg,
          colors.darkBg,
          colors.darkBorder
        )}
      >
        <CardContent className="px-6 py-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className={cn('text-xl font-semibold', colors.text, colors.darkText)}>{tokenType}</h2>
            {/* Optional: Add small icon here */}
          </div>
          <div className="space-y-1">
            <p className={cn('text-3xl font-bold tracking-tight flex items-center', colors.text, colors.darkText)}>
              {balance.toFixed(2)} {/* Adjust decimals */}
              {isTokenPending && (
                <span
                  className={cn(
                    'ml-2 w-2.5 h-2.5 rounded-full animate-pulse',
                    tokenType === 'USDC' ? 'bg-blue-400' : 'bg-yellow-400'
                  )}
                ></span>
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {balance.toFixed(tokenType === 'USDC' ? 6 : 18)} {/* Adjust decimals */}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
