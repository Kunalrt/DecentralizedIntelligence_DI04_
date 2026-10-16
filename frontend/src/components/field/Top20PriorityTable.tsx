import React, { useState } from 'react';
import { KILN_COLORS } from '../../config/constants';
import type { Top20Row } from '../../types/data';
import {
  Copy,
  Check,
  Download,
  Printer,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Search,
} from 'lucide-react';
import { exportTop20ToCsv, exportTop20ToGpx } from '../../utils/exportUtils';

interface Top20PriorityTableProps {
  rows: Top20Row[];
  onPrint: () => void;
}

export const Top20PriorityTable: React.FC<Top20PriorityTableProps> = ({
  rows,
  onPrint,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopyCoord = (id: string, lat: number, lon: number) => {
    const text = `${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredRows = rows.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (r.kiln_id || '').toLowerCase().includes(q) ||
      (r.class || '').toLowerCase().includes(q) ||
      (r.why_visit || '').toLowerCase().includes(q)
    );
  });

  const verifiedCount = Object.values(checkedIds).filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 m-0">
              Top 20 Priority Inspection Targets
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
              {verifiedCount} of {rows.length} Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Ranked by regulatory ban violation, model confidence, and proximity cluster density.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Search Bar */}
          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter Top 20..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {/* Export CSV */}
          <button
            onClick={() => exportTop20ToCsv(rows)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition shadow-xs"
            title="Download Top 20 as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">CSV</span>
          </button>

          {/* Export GPX */}
          <button
            onClick={() => exportTop20ToGpx(rows)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition shadow-xs"
            title="Download Top 20 as GPX for Garmin / phone GPS"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>GPX</span>
          </button>

          {/* Print Field Sheet */}
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition shadow-xs"
            title="Print 1-Page Clipboard Field Sheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 text-center w-10">Done</th>
              <th className="py-3 px-3 text-center w-10">Rank</th>
              <th className="py-3 px-3">Kiln ID</th>
              <th className="py-3 px-3">Class</th>
              <th className="py-3 px-3">GPS Coordinates</th>
              <th className="py-3 px-3 text-right">Confidence</th>
              <th className="py-3 px-3 text-center">Score</th>
              <th className="py-3 px-3">Why Farida Should Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row) => {
              const isChecked = !!checkedIds[row.kiln_id];
              const color =
                row.class === 'FCBK'
                  ? KILN_COLORS.FCBK
                  : row.class === 'Zigzag'
                  ? KILN_COLORS.Zigzag
                  : KILN_COLORS.CFCBK;

              return (
                <tr
                  key={row.kiln_id}
                  className={`transition ${
                    isChecked ? 'bg-emerald-50/40 text-slate-500' : 'hover:bg-slate-50/70 text-slate-700'
                  }`}
                >
                  {/* Field Checkbox */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => toggleCheck(row.kiln_id)}
                      className="text-slate-400 hover:text-emerald-600 transition"
                      aria-label={`Toggle verified for ${row.kiln_id}`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Rank */}
                  <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-slate-100 inline-flex items-center justify-center font-mono">
                      {row.rank}
                    </span>
                  </td>

                  {/* Kiln ID */}
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {row.kiln_id || 'n/a'}
                  </td>

                  {/* Class Badge */}
                  <td className="py-2.5 px-3">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: color }}
                    >
                      {row.class || 'n/a'}
                    </span>
                  </td>

                  {/* Coordinates + Copy */}
                  <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>
                        {row.lat != null && row.lon != null
                          ? `${Number(row.lat).toFixed(5)}, ${Number(row.lon).toFixed(5)}`
                          : 'n/a'}
                      </span>
                      {row.lat != null && row.lon != null && (
                        <button
                          onClick={() => handleCopyCoord(row.kiln_id || '', Number(row.lat), Number(row.lon))}
                          title="Copy Coordinates to Clipboard"
                          className="p-1 rounded text-slate-400 hover:text-brand-primary hover:bg-slate-100 transition"
                        >
                          {copiedId === row.kiln_id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Confidence */}
                  <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                    {row.confidence != null ? `${(Number(row.confidence) * 100).toFixed(1)}%` : 'n/a'}
                  </td>

                  {/* Priority Score */}
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                      {row.priority_score ?? 'n/a'}
                    </span>
                  </td>

                  {/* Why Visit */}
                  <td className="py-2.5 px-3 text-slate-600 leading-relaxed max-w-xs sm:max-w-md">
                    {row.why_visit || 'n/a'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          Showing {filteredRows.length} priority enforcement targets. Check off inspected sites in the field.
        </div>
        <div className="text-[11px] italic">
          All coordinates formatted to WGS-84 standard (5 decimal precision ~1 meter)
        </div>
      </div>
    </div>
  );
};
