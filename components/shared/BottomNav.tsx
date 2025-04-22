'use client';

import { HomeIcon, PieChart, History } from 'lucide-react';

interface BottomNavProps {
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100">
      <div className="grid h-full grid-cols-3 px-6 !max-w-[380px] mx-auto">
        <button className="flex flex-col items-center justify-center gap-1 text-indigo-600 transition-colors hover:text-indigo-500">
          <HomeIcon className="w-5 h-5" />
          <span className="text-xs font-medium">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-1 text-gray-500 transition-colors hover:text-indigo-500">
          <PieChart className="w-5 h-5" />
          <span className="text-xs font-medium">Stats</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-1 text-gray-500 transition-colors hover:text-indigo-500">
          <History className="w-5 h-5" />
          <span className="text-xs font-medium">History</span>
        </button>
      </div>
    </div>
  );
};
