import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  className?: string;
  onSearch: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  searchValue: string;
  typeValue: string;
  statusValue: string;
}

export function FilterBar({
  className,
  onSearch,
  onTypeChange,
  onStatusChange,
  searchValue,
  typeValue,
  statusValue,
}: FilterBarProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row', className)}>
      <Input
        placeholder="Search transactions..."
        value={searchValue}
        onChange={(e) => onSearch(e.target.value)}
        className="max-w-sm"
      />
      <Select value={typeValue} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Transaction type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="send">Send</SelectItem>
          <SelectItem value="receive">Receive</SelectItem>
          <SelectItem value="mint">Mint</SelectItem>
          <SelectItem value="burn">Burn</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusValue} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        onClick={() => {
          onSearch('');
          onTypeChange('all');
          onStatusChange('all');
        }}
      >
        Reset Filters
      </Button>
    </div>
  );
}
