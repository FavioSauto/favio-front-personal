import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
  onBackClick?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, icon, onBackClick }) => {
  return (
    <div className={`flex items-center ${onBackClick ? 'gap-3' : 'justify-between'}`}>
      {onBackClick && (
        <button
          onClick={onBackClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {icon && !onBackClick && <div className="transition-transform hover:scale-110 cursor-pointer">{icon}</div>}
      {icon && onBackClick && (
        <div className="ml-auto">
          {/* Placeholder if icon needs to be shown with back button, adjust layout as needed */}
          {icon}
        </div>
      )}
    </div>
  );
};
