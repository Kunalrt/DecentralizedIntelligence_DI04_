import React, { useState } from 'react';
import { KILN_COLORS } from '../../config/constants';
import { Layers, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';

interface MapLegendProps {
  onResetZoom: () => void;
  showHistorical: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({ onResetZoom, showHistorical }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-5 left-3 z-[1000] bg-white/95 rounded-[4px] shadow-map border border-[#D9D6CE] text-xs font-mono text-[#1F2328] w-60 overflow-hidden">
      {/* Legend Header */}
      <div className="px-2.5 py-1.5 bg-[#FAF9F5] border-b border-[#D9D6CE] flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold font-serif text-[#1F2328]">
          <Layers size={13} strokeWidth={1.5} className="text-[#1F4E5F]" />
          <span>Surveillance Legend</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onResetZoom}
            title="Reset to District Bounds"
            className="p-0.5 rounded text-[#656D76] hover:text-[#1F2328]"
          >
            <RotateCcw size={12} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-0.5 rounded text-[#656D76] hover:text-[#1F2328]"
            aria-label="Toggle Legend"
          >
            {collapsed ? <ChevronRight size={13} strokeWidth={1.5} /> : <ChevronDown size={13} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Legend Content */}
      {!collapsed && (
        <div className="p-2.5 space-y-2 text-2xs">
          {/* FCBK */}
          <div className="flex items-start gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
              style={{ backgroundColor: KILN_COLORS.FCBK }}
            />
            <div>
              <div className="font-bold text-[#1F2328]">FCBK (Banned)</div>
              <div className="text-[#656D76]">Natural-draft oval trench</div>
            </div>
          </div>

          {/* Zigzag */}
          <div className="flex items-start gap-2">
            <span
              className="w-3 h-3 rounded-[1px] flex-shrink-0 mt-0.5"
              style={{ backgroundColor: KILN_COLORS.Zigzag }}
            />
            <div>
              <div className="font-bold text-[#1F2328]">Zigzag (Compliant)</div>
              <div className="text-[#656D76]">Forced-draft zigzag layout</div>
            </div>
          </div>

          {/* CFCBK */}
          <div className="flex items-start gap-2">
            <span className="inline-block w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-[#188038] mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold text-[#1F2328]">CFCBK (Legacy)</div>
              <div className="text-[#656D76]">Circular Bull&rsquo;s Trench</div>
            </div>
          </div>

          {/* 1km Cluster Boundary */}
          <div className="flex items-start gap-2 pt-1 border-t border-[#D9D6CE]/60">
            <span className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5 border border-dashed border-[#1F4E5F] bg-[#1F4E5F]/10" />
            <div>
              <div className="font-semibold text-[#1F4E5F]">1 km Cluster Hull</div>
              <div className="text-[#656D76]">&le; 1.0 km neighbor gap</div>
            </div>
          </div>

          {/* Historical Baseline */}
          {showHistorical && (
            <div className="flex items-start gap-2 pt-1 border-t border-[#D9D6CE]/60">
              <span className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5 border border-[#656D76] bg-[#ECEAE4]" />
              <div>
                <div className="font-semibold text-[#1F2328]">2023–24 Baseline</div>
                <div className="text-[#656D76]">Historical coordinate</div>
              </div>
            </div>
          )}

          <div className="pt-1.5 border-t border-[#D9D6CE]/60 flex items-center justify-between text-[#656D76]">
            <span>OSM Standard Tiles</span>
            <button
              type="button"
              onClick={onResetZoom}
              className="text-[#1F4E5F] font-semibold hover:underline"
            >
              Reset View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
