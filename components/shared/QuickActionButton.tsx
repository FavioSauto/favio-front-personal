import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
}

export function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  className,
  variant = 'default',
}: QuickActionButtonProps) {
  return (
    <Button variant={variant} onClick={onClick} className={cn('flex flex-col items-center gap-1 h-20 w-20', className)}>
      <Icon className="h-6 w-6" />
      <span className="text-xs">{label}</span>
    </Button>
  );
}
