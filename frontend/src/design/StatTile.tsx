import React from 'react';
import { InfoTooltip } from './InfoTooltip';

interface StatTileProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sublabel?: string;
  tooltip?: React.ReactNode;
  accentColor?: string;
  colorSwatch?: string;
  badge?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const StatTile: React.FC<StatTileProps> = ({
  icon,
  value,
  label,
  sublabel,
  tooltip,
  accentColor,
  colorSwatch,
  badge,
  className = '',
  onClick,
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`bg-white border border-[#D9D6CE] rounded-[4px] p-3 flex flex-col justify-between transition-colors ${
        isClickable ? 'cursor-pointer hover:border-[#1F4E5F] hover:bg-[#FAF9F5]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div
          className="flex items-center gap-1.5 text-[#656D76]"
          style={accentColor ? { color: accentColor } : undefined}
        >
          {colorSwatch ? (
            <span
              className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
              style={{ backgroundColor: colorSwatch }}
            />
          ) : (
            <span className="flex-shrink-0">{icon}</span>
          )}
          <span className="text-xs font-medium text-[#656D76] uppercase tracking-wider truncate">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {badge}
          {tooltip && <InfoTooltip content={tooltip} label={label} />}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xl font-mono font-semibold text-[#1F2328] tracking-tight">
          {value}
        </div>
        {sublabel && (
          <span className="text-2xs font-mono text-[#656D76] truncate text-right">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
