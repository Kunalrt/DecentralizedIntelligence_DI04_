import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#D9D6CE] ${className}`}
    >
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-serif font-bold text-[#1F2328] tracking-tight m-0">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-[#656D76] m-0 mt-0.5 leading-normal max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
    </div>
  );
};
