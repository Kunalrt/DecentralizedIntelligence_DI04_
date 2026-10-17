import React from 'react';
import { TOKENS } from './tokens';

interface SymbolLegendProps {
  className?: string;
  horizontal?: boolean;
  showGeo?: boolean;
}

export const SymbolLegend: React.FC<SymbolLegendProps> = ({
  className = '',
  horizontal = false,
  showGeo = true,
}) => {
  return (
    <div
      className={`bg-white border border-[#D9D6CE] rounded-[4px] p-2.5 text-xs text-[#1F2328] ${
        horizontal ? 'flex flex-wrap items-center gap-4' : 'space-y-2'
      } ${className}`}
    >
      <div className="font-semibold text-2xs uppercase tracking-wider text-[#656D76] mr-1">
        Symbology:
      </div>

      {/* FCBK */}
      <div className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-full inline-block flex-shrink-0"
          style={{ backgroundColor: TOKENS.colors.kiln.fcbk }}
        />
        <span className="font-medium">FCBK</span>
        <span className="text-2xs text-[#656D76] font-mono">(Circle, Banned)</span>
      </div>

      {/* Zigzag */}
      <div className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-[1px] inline-block flex-shrink-0"
          style={{ backgroundColor: TOKENS.colors.kiln.zigzag }}
        />
        <span className="font-medium">Zigzag</span>
        <span className="text-2xs text-[#656D76] font-mono">(Square, Compliant)</span>
      </div>

      {/* CFCBK */}
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent flex-shrink-0"
          style={{ borderBottomColor: TOKENS.colors.kiln.cfcbk }}
        />
        <span className="font-medium">CFCBK</span>
        <span className="text-2xs text-[#656D76] font-mono">(Triangle, Review)</span>
      </div>

      {showGeo && (
        <>
          {/* Boundary */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0 border-t-2 border-dashed border-[#1F2328] inline-block flex-shrink-0" />
            <span className="font-medium">Boundary</span>
          </div>

          {/* Road */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#475569] inline-block flex-shrink-0" />
            <span className="font-medium">Roads</span>
          </div>

          {/* Water */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-[#6BA4B8] rounded-[1px] inline-block flex-shrink-0" />
            <span className="font-medium">Water</span>
          </div>
        </>
      )}
    </div>
  );
};
