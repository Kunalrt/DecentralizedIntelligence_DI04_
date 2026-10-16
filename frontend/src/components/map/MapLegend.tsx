import React, { useState } from 'react';
import { KILN_COLORS, KILN_SHAPES } from '../../config/constants';
import { Layers, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface MapLegendProps {
  onResetZoom: () => void;
  showHistorical: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({ onResetZoom, showHistorical }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-6 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/90 text-xs text-slate-700 w-64 overflow-hidden transition-all duration-200">
      {/* Legend Header */}
      <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Layers className="w-3.5 h-3.5 text-brand-primary" />
          <span>Surveillance Legend</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onResetZoom}
            title="Reset Map Bounds to District"
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition"
            aria-label="Toggle Legend"
          >
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Legend Content */}
      {!collapsed && (
        <div className="p-3 space-y-2.5">
          {/* FCBK */}
          <div className="flex items-start gap-2">
            <span
              className="w-3.5 h-3.5 rounded flex-shrink-0 mt-0.5 shadow-xs flex items-center justify-center text-[9px] text-white font-bold"
              style={{ backgroundColor: KILN_COLORS.FCBK }}
            >
              {KILN_SHAPES.FCBK.symbol}
            </span>
            <div>
              <div className="font-bold text-slate-900">FCBK (Banned)</div>
              <div className="text-[11px] text-slate-500">Prohibited natural-draft oval trench</div>
            </div>
          </div>

          {/* Zigzag */}
          <div className="flex items-start gap-2">
            <span
              className="w-3.5 h-3.5 rounded flex-shrink-0 mt-0.5 shadow-xs flex items-center justify-center text-[9px] text-white font-bold"
              style={{ backgroundColor: KILN_COLORS.Zigzag }}
            >
              {KILN_SHAPES.Zigzag.symbol}
            </span>
            <div>
              <div className="font-bold text-slate-900">Zigzag (Compliant)</div>
              <div className="text-[11px] text-slate-500">Forced-draft zigzag air channel</div>
            </div>
          </div>

          {/* CFCBK */}
          <div className="flex items-start gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 shadow-xs flex items-center justify-center text-[9px] text-white font-bold"
              style={{ backgroundColor: KILN_COLORS.CFCBK }}
            >
              {KILN_SHAPES.CFCBK.symbol}
            </span>
            <div>
              <div className="font-bold text-slate-900">CFCBK (Legacy)</div>
              <div className="text-[11px] text-slate-500">Circular Bull&rsquo;s Trench kiln</div>
            </div>
          </div>

          {/* 1km Cluster Boundary */}
          <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
            <span className="w-3.5 h-3.5 rounded flex-shrink-0 mt-0.5 border-2 border-dashed border-indigo-500 bg-indigo-500/20" />
            <div>
              <div className="font-semibold text-indigo-900">1 km Cluster Boundary</div>
              <div className="text-[11px] text-slate-500">&le; 1 km gap between kilns</div>
            </div>
          </div>

          {/* Historical Baseline */}
          {showHistorical && (
            <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
              <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 border border-dashed border-slate-500 bg-slate-300/40" />
              <div>
                <div className="font-semibold text-slate-800">2023–24 Baseline Site</div>
                <div className="text-[11px] text-slate-500">Historical FCBK location</div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>OpenStreetMap Standard</span>
            <button
              onClick={onResetZoom}
              className="text-brand-primary font-semibold hover:underline"
            >
              Reset Zoom
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
