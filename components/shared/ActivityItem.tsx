import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItemProps {
  icon: React.ReactNode;
  iconBgClass?: string; // e.g., 'bg-indigo-100'
  iconColorClass?: string; // e.g., 'text-indigo-600'
  title: string;
  subtitle?: string;
  amount?: string;
  time?: string;
  onClick?: () => void;
  showChevron?: boolean;
  className?: string;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  icon,
  iconBgClass = 'bg-gray-100', // Default background
  iconColorClass = 'text-gray-600', // Default icon color
  title,
  subtitle,
  amount,
  time,
  onClick,
  showChevron = false,
  className,
}) => {
  const content = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', iconBgClass)}>
          <div className={cn('w-5 h-5 flex items-center justify-center', iconColorClass)}>{icon}</div>
        </div>
        <div>
          <p className="font-medium">{title}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {(amount || time) && (
        <div className="text-right">
          {amount && <p className="font-medium">{amount}</p>}
          {time && <p className="text-sm text-gray-500">{time}</p>}
        </div>
      )}
      {showChevron && !onClick && <ChevronRight className="w-5 h-5 text-gray-400 ml-auto pl-2 flex-shrink-0" />}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer w-full text-left',
          className
        )}
      >
        {content}
        {showChevron && <ChevronRight className="w-5 h-5 text-gray-400 ml-auto pl-2 flex-shrink-0" />}
      </button>
    );
  }

  // Non-clickable version (e.g., using Card for structure)
  return (
    <Card className={cn('transition-all hover:shadow-md', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">{content}</div>
      </CardContent>
    </Card>
  );
};
