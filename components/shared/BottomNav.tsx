'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PieChart, History } from 'lucide-react';
import clsx from 'clsx';

interface BottomNavProps {
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = () => {
  const pathname = usePathname();

  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100">
      <div className="grid h-full grid-cols-3 px-6 !max-w-[380px] mx-auto">
        <Link
          href="/dashboard"
          className={clsx(
            'flex flex-col items-center justify-center gap-1 transition-colors hover:text-indigo-500',
            pathname === '/dashboard' ? 'text-indigo-600' : 'text-gray-500'
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-xs font-medium">Dashboard</span>
        </Link>
        <Link
          href="/approvals"
          className={clsx(
            'flex flex-col items-center justify-center gap-1 transition-colors hover:text-indigo-500',
            pathname === '/approvals' ? 'text-indigo-600' : 'text-gray-500'
          )}
        >
          <History className="w-5 h-5" />
          <span className="text-xs font-medium">Approvals</span>
        </Link>
        <Link
          href="/stats"
          className={clsx(
            'flex flex-col items-center justify-center gap-1 transition-colors hover:text-indigo-500',
            pathname === '/stats' ? 'text-indigo-600' : 'text-gray-500'
          )}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-xs font-medium">Stats</span>
        </Link>
        {/* <Link
          href="/history"
          className={clsx(
            'flex flex-col items-center justify-center gap-1 transition-colors hover:text-indigo-500',
             pathname === '/history' ? 'text-indigo-600' : 'text-gray-500'
          )}
        >
          <History className="w-5 h-5" />
          <span className="text-xs font-medium">History</span>
        </Link> */}
      </div>
    </div>
  );
};
