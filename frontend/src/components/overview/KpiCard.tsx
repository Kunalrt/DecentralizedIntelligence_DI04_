import React from 'react';
import { Badge } from '../../design';

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
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[4px] p-3.5 border border-[#D9D6CE] transition-colors ${
        onClick ? 'cursor-pointer hover:border-[#1F4E5F] hover:bg-[#FAF9F5]' : ''
      }`}
      style={{
        borderTop: accentBorderColor ? `3px solid ${accentBorderColor}` : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 text-[#656D76] font-mono text-2xs uppercase tracking-wider">
          {colorSwatch && (
            <span
              className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
              style={{ backgroundColor: colorSwatch }}
            />
          )}
          <span className="font-semibold text-[#1F2328]">{title}</span>
        </div>
        {icon && <div className="text-[#656D76] flex-shrink-0">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-1 my-1">
        <span className="text-2xl font-mono font-bold text-[#1F2328]">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-xs font-mono text-[#656D76]">{unit}</span>}
      </div>

      {rangeText && (
        <div className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-2xs font-mono bg-[#FAF9F5] text-[#1F2328] border border-[#D9D6CE] mb-1.5">
          <span className="text-[#656D76]">CI:</span>
          <span className="font-semibold">{rangeText}</span>
        </div>
      )}

      {badge && (
        <div className="mb-1.5">
          <Badge
            variant={
              badge.variant === 'danger' || badge.variant === 'warning'
                ? 'warning'
                : badge.variant === 'success'
                ? 'success'
                : 'outline'
            }
          >
            {badge.text}
          </Badge>
        </div>
      )}

      {subtitle && <p className="text-2xs text-[#656D76] m-0 font-sans truncate">{subtitle}</p>}
    </div>
  );
};
