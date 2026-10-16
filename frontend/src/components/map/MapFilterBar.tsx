import React from 'react';
import { KILN_COLORS } from '../../config/constants';
import type { KilnClass } from '../../types/data';
import { Filter, Search, RotateCcw, History } from 'lucide-react';

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
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Top Row: Search + Status Counters + Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Surveillance Filters
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-brand-primary border border-blue-200">
            Showing {filteredCount} of {totalCount} kilns
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Kiln ID Search */}
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID (e.g. 025)..."
              value={filters.searchQuery}
              onChange={(e) => onChange({ searchQuery: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition"
            />
          </div>

          <button
            type="button"
            onClick={onReset}
            title="Reset All Filters"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Middle & Bottom Rows: Interactive Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-xs">
        {/* Class Selection Checkboxes */}
        <div className="md:col-span-5 flex flex-wrap items-center gap-2">
          <span className="text-slate-500 font-medium mr-1">Types:</span>

          {/* FCBK */}
          <button
            type="button"
            onClick={() => toggleClass('FCBK')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              filters.classes.FCBK
                ? 'bg-orange-50 border-orange-300 text-orange-800 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: KILN_COLORS.FCBK }}
            />
            <span>FCBK ({classCounts.FCBK})</span>
          </button>

          {/* Zigzag */}
          <button
            type="button"
            onClick={() => toggleClass('Zigzag')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              filters.classes.Zigzag
                ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded"
              style={{ backgroundColor: KILN_COLORS.Zigzag }}
            />
            <span>Zigzag ({classCounts.Zigzag})</span>
          </button>

          {/* CFCBK */}
          <button
            type="button"
            onClick={() => toggleClass('CFCBK')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              filters.classes.CFCBK
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: KILN_COLORS.CFCBK }}
            />
            <span>CFCBK ({classCounts.CFCBK})</span>
          </button>
        </div>

        {/* Toggles: Clustered & Converted */}
        <div className="md:col-span-4 flex flex-wrap items-center gap-2">
          {/* Only Clustered */}
          <button
            type="button"
            onClick={() => onChange({ onlyClustered: !filters.onlyClustered })}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              filters.onlyClustered
                ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            &le; 1 km Clusters Only
          </button>

          {/* Only Converted */}
          <button
            type="button"
            onClick={() => onChange({ onlyConverted: !filters.onlyConverted })}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              filters.onlyConverted
                ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Converted Only
          </button>

          {/* 2023 Historical Baseline Toggle */}
          <button
            type="button"
            onClick={() => onChange({ showHistorical: !filters.showHistorical })}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              filters.showHistorical
                ? 'bg-slate-800 border-slate-900 text-white shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>2023 Baseline ({historicalCount})</span>
          </button>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="md:col-span-3 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="text-slate-600 font-medium whitespace-nowrap">
            Min Conf: <strong>{(filters.minScore * 100).toFixed(0)}%</strong>
          </span>
          <input
            type="range"
            min="0.25"
            max="0.95"
            step="0.05"
            value={filters.minScore}
            onChange={(e) => onChange({ minScore: parseFloat(e.target.value) })}
            className="w-full accent-brand-primary cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
