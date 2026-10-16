import React from 'react';
import { KILN_COLORS } from '../../config/constants';
import type { CountRow, MetricsData } from '../../types/data';
import { Table, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface PrecisionRecallTableProps {
  counts: CountRow[];
  metrics: MetricsData;
}

export const PrecisionRecallTable: React.FC<PrecisionRecallTableProps> = ({
  counts,
  metrics,
}) => {
  const getApForClass = (cls: string): string => {
    if (cls === 'FCBK') return (metrics.AP_FCBK * 100).toFixed(1) + '%';
    if (cls === 'Zigzag') return (metrics.AP_Zigzag * 100).toFixed(1) + '%';
    if (cls === 'CFCBK') return (metrics.AP_CFCBK * 100).toFixed(1) + '%';
    if (cls === 'Total') return (metrics.mAP * 100).toFixed(1) + '% (mAP)';
    return '-';
  };

  const format2dp = (val: number | string): string => {
    if (typeof val === 'number') return val.toFixed(2);
    const num = parseFloat(String(val));
    return isNaN(num) ? String(val) : num.toFixed(2);
  };

  const getStatusBadge = (cls: string) => {
    if (cls === 'FCBK') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-800 border border-orange-200">
          <AlertTriangle className="w-3 h-3 text-orange-600" /> Banned Design
        </span>
      );
    }
    if (cls === 'Zigzag') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <CheckCircle2 className="w-3 h-3 text-blue-600" /> Mandate Compliant
        </span>
      );
    }
    if (cls === 'CFCBK') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Legacy Circular
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        District Total
      </span>
    );
  };

  const getOperationalGuidance = (cls: string) => {
    if (cls === 'FCBK') {
      return 'High model precision (0.89). ~9 in 10 detections are true persistent violators. Priority enforcement target.';
    }
    if (cls === 'Zigzag') {
      return 'Moderate precision (0.65) / recall (0.62). Retrofit shapes vary. Field officer visual inspection recommended.';
    }
    if (cls === 'CFCBK') {
      return 'Very high precision (0.90) & recall (0.95). Unmistakable circular footprint; near-zero classification confusion.';
    }
    return 'Deduplicated across 120 satellite tiles. 51 kilns (78.5%) clustered within 1 km for efficient vehicle routing.';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-brand-primary" />
            <h3 className="text-base font-bold text-slate-900 m-0">
              Validation Metrics & Detection Summary
            </h3>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Per-class precision, recall, and AP@0.50 on validation benchmarks (Rotated IoU &ge; 0.50).
          </p>
        </div>
        <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          IoU Threshold: <strong>&ge; 0.50</strong> &bull; Macro mAP: <strong>{(metrics.mAP * 100).toFixed(1)}%</strong>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Class & Legal Status</th>
              <th className="py-3 px-4 text-right">Detected</th>
              <th className="py-3 px-4 text-right">Est. True Count (95% CI)</th>
              <th className="py-3 px-4 text-right">Val. Precision</th>
              <th className="py-3 px-4 text-right">Val. Recall</th>
              <th className="py-3 px-4 text-right">AP@0.50</th>
              <th className="py-3 px-4">Operational Interpretation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {counts.map((row) => {
              const isTotal = row.class === 'Total';
              const color =
                row.class === 'FCBK'
                  ? KILN_COLORS.FCBK
                  : row.class === 'Zigzag'
                  ? KILN_COLORS.Zigzag
                  : row.class === 'CFCBK'
                  ? KILN_COLORS.CFCBK
                  : '#475569';

              return (
                <tr
                  key={row.class}
                  className={`hover:bg-slate-50/60 transition ${
                    isTotal ? 'bg-slate-50/90 font-bold border-t-2 border-slate-300' : ''
                  }`}
                >
                  {/* Class Name + Swatch + Badge */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-bold text-slate-900">{row.class}</span>
                      {getStatusBadge(row.class)}
                    </div>
                  </td>

                  {/* Detected */}
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                    {row.detected.toLocaleString()}
                  </td>

                  {/* Range */}
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {row.est_low.toLocaleString()} – {row.est_high.toLocaleString()}
                    </span>
                  </td>

                  {/* Precision */}
                  <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                    {format2dp(row.precision)}
                  </td>

                  {/* Recall */}
                  <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                    {format2dp(row.recall)}
                  </td>

                  {/* AP@0.50 */}
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                    {getApForClass(row.class)}
                  </td>

                  {/* Guidance */}
                  <td className="py-3.5 px-4 text-slate-600 leading-relaxed max-w-xs sm:max-w-md">
                    {getOperationalGuidance(row.class)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          Confidence bounds derived from DOTA-style rotated bounding box evaluation on SentinelKilnDB test partitions.
        </div>
        <div className="italic">
          Precision = TP / (TP + FP) &bull; Recall = TP / (TP + FN)
        </div>
      </div>
    </div>
  );
};
