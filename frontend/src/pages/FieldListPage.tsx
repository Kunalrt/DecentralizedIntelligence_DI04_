import React from 'react';
import { useData } from '../context/DataContext';
import { ClipboardList } from 'lucide-react';
import { KILN_COLORS } from '../config/constants';

export const FieldListPage: React.FC = () => {
  const { data } = useData();
  const top20 = data?.top20 ?? [];
  const within1km = data?.within1km ?? [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            Field Inspection Dispatch Registry
          </h2>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Inspector Farida Khan &bull; Ranked Top 20 Priority Violations & 1 km Proximity Clusters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-semibold">
            {top20.length} Targets Ranked
          </span>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold">
            {within1km.length} In Proximity Clusters
          </span>
        </div>
      </div>

      {/* Top 20 Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 m-0">Top 20 Priority Inspection Targets (Preview)</h3>
          <span className="text-xs text-slate-500">Full checklist & local notes active in Phase 4</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-900 text-white font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">#</th>
                <th className="py-2.5 px-3">Kiln ID</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Lat / Lon</th>
                <th className="py-2.5 px-3 text-right">Confidence</th>
                <th className="py-2.5 px-3">Why Visit (Regulatory Directive)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {top20.slice(0, 10).map((row) => (
                <tr key={row.kiln_id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-center font-bold text-slate-900">{row.rank}</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{row.kiln_id}</td>
                  <td className="py-2 px-3 font-sans">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: KILN_COLORS[row.class] }}
                    >
                      {row.class}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    {Number(row.lat).toFixed(5)}, {Number(row.lon).toFixed(5)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800">
                    {Number(row.confidence).toFixed(2)}
                  </td>
                  <td className="py-2 px-3 font-sans text-slate-700">{row.why_visit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          Showing first 10 of {top20.length} targets. Interactive checkboxes, notes, and maps fly-to in Phase 4.
        </div>
      </div>
    </div>
  );
};
