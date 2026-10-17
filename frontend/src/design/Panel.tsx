import React from 'react';

interface PanelProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  noPadding?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  badge,
  action,
  children,
  className = '',
  headerClassName = '',
  noPadding = false,
}) => {
  const hasHeader = Boolean(title || subtitle || badge || action);

  return (
    <section
      className={`bg-white border border-[#D9D6CE] rounded-[4px] shadow-sm transition-all ${className}`}
    >
      {hasHeader && (
        <header
          className={`px-4 py-3 border-b border-[#D9D6CE] flex items-center justify-between gap-3 bg-[#FAF9F5] ${headerClassName}`}
        >
          <div>
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="text-sm font-semibold text-[#1F2328] m-0 tracking-tight">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-[#656D76] m-0 mt-0.5 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={noPadding ? '' : 'p-4'}>{children}</div>
    </section>
  );
};
