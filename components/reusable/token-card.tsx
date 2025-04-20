import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TokenCardProps {
  token: 'DAI' | 'USDC';
  balance: string;
  value: string;
  className?: string;
}

export function TokenCard({ token, balance, value, className }: TokenCardProps) {
  const isDAI = token === 'DAI';
  const gradientClass = isDAI
    ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
    : 'bg-gradient-to-br from-emerald-500 to-teal-600';

  return (
    <Card className={cn('w-full text-white', gradientClass, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{token}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{balance}</div>
        <p className="text-xs text-white/70">${value}</p>
      </CardContent>
    </Card>
  );
}
