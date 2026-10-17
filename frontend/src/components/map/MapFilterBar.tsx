import React from 'react';
import { KILN_COLORS } from '../../config/constants';
import type { KilnClass } from '../../types/data';
import { Filter, Search, RotateCcw, History } from 'lucide-react';
import { Badge } from '../../design';

export interface MapFiltersState {
  classes: Record<KilnClass, boolean>;
  onlyClustered: boolean;
  onlyConverted: boolean;
  minScore: number;
  showHistorical: boolean;
  searchQuery: string;
}

interface MapFilterBarProps {
  filters: MapFiltersState;
  onChange: (updated: Partial<MapFiltersState>) => void;
  onReset: () => void;
  filteredCount: number;
  totalCount: number;
  classCounts: Record<KilnClass, number>;
  historicalCount: number;
}

export const MapFilterBar: React.FC<MapFilterBarProps> = ({
  filters,
  onChange,
  onReset,
  filteredCount,
  totalCount,
  classCounts,
  historicalCount,
}) => {
  const toggleClass = (cls: KilnClass) => {
    onChange({
      classes: {
        ...filters.classes,
        [cls]: !filters.classes[cls],
      },
    });
  };

  return (
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] p-3 shadow-xs space-y-2.5">
      {/* Top Row: Search + Status Counters + Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#D9D6CE]">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
            <Filter size={14} strokeWidth={1.5} />
          </span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1F2328]">
            Surveillance Filters
          </span>
          <Badge variant="accent">
            {filteredCount} / {totalCount} kilns
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Kiln ID Search */}
          <div className="relative flex-1 sm:w-48">
            <Search size={13} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#656D76]" />
            <input
              type="text"
              placeholder="Search ID (e.g. 025)..."
              value={filters.searchQuery}
              onChange={(e) => onChange({ searchQuery: e.target.value })}
              className="w-full pl-7 pr-3 py-1 text-xs font-mono bg-white border border-[#D9D6CE] rounded-[2px] focus:outline-none focus:ring-1 focus:ring-[#1F4E5F] transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={onReset}
            title="Reset All Filters"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] border border-[#D9D6CE] bg-[#FAF9F5] text-xs font-mono text-[#1F2328] hover:bg-[#F5F3EE] transition-colors"
          >
            <RotateCcw size={12} strokeWidth={1.5} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs font-mono">
        {/* Class Selection Buttons */}
        <div className="md:col-span-5 flex flex-wrap items-center gap-1.5">
          {/* FCBK */}
          <button
            type="button"
            onClick={() => toggleClass('FCBK')}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-2xs font-semibold transition-colors ${
              filters.classes.FCBK
                ? 'bg-[#FFF7ED] border-[#FDBA74] text-[#E8710A]'
                : 'bg-[#FAF9F5] border-[#D9D6CE] text-[#656D76] opacity-60'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: KILN_COLORS.FCBK }}
            />
            <span>FCBK ({classCounts.FCBK})</span>
          </button>

          {/* Zigzag */}
          <button
            type="button"
            onClick={() => toggleClass('Zigzag')}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-2xs font-semibold transition-colors ${
              filters.classes.Zigzag
                ? 'bg-[#EFF6FF] border-[#93C5FD] text-[#1A73E8]'
                : 'bg-[#FAF9F5] border-[#D9D6CE] text-[#656D76] opacity-60'
            }`}
          >
            <span
              className="w-2 h-2 rounded-[1px] inline-block"
              style={{ backgroundColor: KILN_COLORS.Zigzag }}
            />
            <span>Zigzag ({classCounts.Zigzag})</span>
          </button>

          {/* CFCBK */}
          <button
            type="button"
            onClick={() => toggleClass('CFCBK')}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-2xs font-semibold transition-colors ${
              filters.classes.CFCBK
                ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#188038]'
                : 'bg-[#FAF9F5] border-[#D9D6CE] text-[#656D76] opacity-60'
            }`}
          >
            <span className="inline-block w-0 h-0 border-l-[3.5px] border-r-[3.5px] border-b-[6px] border-l-transparent border-r-transparent border-b-[#188038]" />
            <span>CFCBK ({classCounts.CFCBK})</span>
          </button>
        </div>

        {/* Toggles: Clustered, Converted, Baseline */}
        <div className="md:col-span-4 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ onlyClustered: !filters.onlyClustered })}
            className={`px-2 py-0.5 rounded-[2px] border text-2xs font-semibold transition-colors ${
              filters.onlyClustered
                ? 'bg-[#1F4E5F] text-white border-[#1F4E5F]'
                : 'bg-[#FAF9F5] border-[#D9D6CE] text-[#1F2328] hover:bg-[#F5F3EE]'
            }`}
          >
            1 km Clusters
          </button>

          <button
            type="button"
            onClick={() => onChange({ onlyConverted: !filters.onlyConverted })}
            className={`px-2 py-0.5 rounded-[2px] border text-2xs font-semibold transition-colors ${
              filters.onlyConverted
                ? 'bg-[#1F4E5F] text-white border-[#1F4E5F]'
                : 'bg-[#FAF9F5] border-[#D9D6CE] text-[#1F2328] hover:bg-[#F5F3EE]'
            }`}
          >
            Converted
          </button>

          <button
            type="button"
            onClick={() => onChange({ showHistorical: !filters.showHistorical })}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-2xs font-semibold transition-colors ${
              filters.showHistorical
                ? 'bg-[#1F2328] text-white border-[#1F2328]'
                : 'bg-[#FAF9F5] border-[#D9D6CE] text-[#656D76] hover:bg-[#F5F3EE]'
            }`}
          >
            <History size={11} strokeWidth={1.5} />
            <span>2023 ({historicalCount})</span>
          </button>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="md:col-span-3 flex items-center gap-2 bg-[#FAF9F5] px-2.5 py-1 rounded-[2px] border border-[#D9D6CE]">
          <span className="text-[#656D76] text-2xs whitespace-nowrap">
            Min: <strong className="text-[#1F2328]">{(filters.minScore * 100).toFixed(0)}%</strong>
          </span>
          <input
            type="range"
            min="0.25"
            max="0.95"
            step="0.05"
            value={filters.minScore}
            onChange={(e) => onChange({ minScore: parseFloat(e.target.value) })}
            className="w-full accent-[#1F4E5F] cursor-pointer h-1 bg-[#D9D6CE] rounded-[2px]"
          />
        </div>
      </div>
    </div>
  );
};
