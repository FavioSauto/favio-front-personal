import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'mint' | 'burn';
  token: 'DAI' | 'USDC';
  amount: string;
  from: string;
  to: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

interface TransactionTableProps {
  transactions: Transaction[];
  className?: string;
}

export function TransactionTable({ transactions, className }: TransactionTableProps) {
  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Token</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">{transaction.type}</TableCell>
              <TableCell>{transaction.token}</TableCell>
              <TableCell>{transaction.amount}</TableCell>
              <TableCell className="font-mono text-sm">{transaction.from}</TableCell>
              <TableCell className="font-mono text-sm">{transaction.to}</TableCell>
              <TableCell>{transaction.timestamp}</TableCell>
              <TableCell>
                <span
                  className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', {
                    'bg-green-100 text-green-700': transaction.status === 'completed',
                    'bg-yellow-100 text-yellow-700': transaction.status === 'pending',
                    'bg-red-100 text-red-700': transaction.status === 'failed',
                  })}
                >
                  {transaction.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
