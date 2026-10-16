import React from 'react';

export interface KpiCardProps {
  title: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  rangeText?: string;
  badge?: {
    text: string;
    variant?: 'danger' | 'warning' | 'info' | 'success' | 'neutral' | 'purple';
  };
  colorSwatch?: string;
  icon?: React.ReactNode;
  accentBorderColor?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  rangeText,
  badge,
  colorSwatch,
  icon,
  accentBorderColor,
  onClick,
}) => {
  const badgeStyles: Record<string, string> = {
    danger: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-orange-50 text-orange-700 border-orange-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''
      }`}
      style={{
        borderTop: accentBorderColor ? `3px solid ${accentBorderColor}` : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
          {colorSwatch && (
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shadow-xs flex-shrink-0"
              style={{ backgroundColor: colorSwatch }}
            />
          )}
          <span>{title}</span>
        </div>
        {icon && <div className="text-slate-400 flex-shrink-0">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}
      </div>

      {rangeText && (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 mb-2">
          <span className="text-[11px] text-slate-500 font-normal">Est. Range:</span>
          <span className="font-semibold text-slate-800">{rangeText}</span>
        </div>
      )}

      {badge && (
        <div className="mb-2">
          <span
            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              badgeStyles[badge.variant || 'neutral']
            }`}
          >
            {badge.text}
          </span>
        </div>
      )}

      {subtitle && <p className="text-xs text-slate-500 leading-normal m-0">{subtitle}</p>}
    </div>
  );
};
