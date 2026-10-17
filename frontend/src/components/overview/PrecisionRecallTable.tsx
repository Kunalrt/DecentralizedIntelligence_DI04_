import React from 'react';
import { KILN_COLORS } from '../../config/constants';
import type { CountRow, MetricsData } from '../../types/data';
import { Table, AlertTriangle, CheckCircle2, ShieldCheck, Info } from 'lucide-react';
import { Badge } from '../../design';

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
    if (cls === 'Total') return (metrics.mAP * 100).toFixed(1) + '%';
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
        <Badge variant="warning" icon={<AlertTriangle size={11} strokeWidth={1.5} />}>
          Banned
        </Badge>
      );
    }
    if (cls === 'Zigzag') {
      return (
        <Badge variant="accent" icon={<CheckCircle2 size={11} strokeWidth={1.5} />}>
          Compliant
        </Badge>
      );
    }
    if (cls === 'CFCBK') {
      return (
        <Badge variant="success" icon={<ShieldCheck size={11} strokeWidth={1.5} />}>
          Legacy
        </Badge>
      );
    }
    return <Badge variant="outline">Total</Badge>;
  };

  const getOperationalGuidance = (cls: string) => {
    if (cls === 'FCBK') return 'Precision 0.89. High confidence; priority enforcement.';
    if (cls === 'Zigzag') return 'Precision 0.65. Varied retrofits; field check advised.';
    if (cls === 'CFCBK') return 'Precision 0.90. Distinct circular shape; near-zero confusion.';
    return 'Deduplicated across 120 tiles; 78.5% in 1 km clusters.';
  };

  return (
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] shadow-xs overflow-hidden">
      <div className="p-4 border-b border-[#D9D6CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
              <Table size={15} strokeWidth={1.5} />
            </span>
            <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
              Validation Metrics & Detection Summary
            </h3>
          </div>
          <p className="text-2xs text-[#656D76] font-mono m-0 mt-0.5">
            Per-class precision, recall, and AP@0.50 on validation benchmarks (Rotated IoU &ge; 0.50).
          </p>
        </div>
        <div className="text-2xs font-mono text-[#1F2328] bg-[#FAF9F5] px-2.5 py-1 rounded-[2px] border border-[#D9D6CE] self-start sm:self-auto flex items-center gap-2">
          <span>IoU: <strong>&ge; 0.50</strong></span>
          <span>&bull;</span>
          <span>mAP: <strong>{(metrics.mAP * 100).toFixed(1)}%</strong></span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-[#FAF9F5] text-[#656D76] font-semibold border-b border-[#D9D6CE] text-2xs uppercase tracking-wider">
              <th className="py-2.5 px-3">Class & Status</th>
              <th className="py-2.5 px-3 text-right">Detected</th>
              <th className="py-2.5 px-3 text-right">95% CI Range</th>
              <th className="py-2.5 px-3 text-right">Precision</th>
              <th className="py-2.5 px-3 text-right">Recall</th>
              <th className="py-2.5 px-3 text-right">AP@0.50</th>
              <th className="py-2.5 px-3">Field Guidance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D6CE]/60">
            {counts.map((row) => {
              const isTotal = row.class === 'Total';
              const color =
                row.class === 'FCBK'
                  ? KILN_COLORS.FCBK
                  : row.class === 'Zigzag'
                  ? KILN_COLORS.Zigzag
                  : row.class === 'CFCBK'
                  ? KILN_COLORS.CFCBK
                  : '#1F4E5F';

              return (
                <tr
                  key={row.class}
                  className={`hover:bg-[#FAF9F5] transition-colors ${
                    isTotal ? 'bg-[#FAF9F5] font-bold border-t-2 border-[#D9D6CE]' : ''
                  }`}
                >
                  {/* Class Name + Swatch + Badge */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-bold text-[#1F2328]">{row.class}</span>
                      {getStatusBadge(row.class)}
                    </div>
                  </td>

                  {/* Detected */}
                  <td className="py-2.5 px-3 text-right font-bold text-[#1F2328]">
                    {row.detected != null ? row.detected.toLocaleString() : '-'}
                  </td>

                  {/* Range */}
                  <td className="py-2.5 px-3 text-right text-[#1F4E5F]">
                    {row.est_low != null && row.est_high != null
                      ? `${row.est_low} – ${row.est_high}`
                      : '-'}
                  </td>

                  {/* Precision */}
                  <td className="py-2.5 px-3 text-right text-[#1F2328]">
                    {row.precision != null ? format2dp(row.precision) : '-'}
                  </td>

                  {/* Recall */}
                  <td className="py-2.5 px-3 text-right text-[#1F2328]">
                    {row.recall != null ? format2dp(row.recall) : '-'}
                  </td>

                  {/* AP@0.50 */}
                  <td className="py-2.5 px-3 text-right font-bold text-[#1F2328]">
                    {getApForClass(row.class)}
                  </td>

                  {/* Guidance */}
                  <td className="py-2.5 px-3 text-[#656D76] text-2xs truncate max-w-xs font-sans">
                    {getOperationalGuidance(row.class)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-2.5 bg-[#FAF9F5] border-t border-[#D9D6CE] text-2xs font-mono text-[#656D76] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Info size={12} strokeWidth={1.5} className="text-[#1F4E5F] flex-shrink-0" />
          <span>Rotated IoU evaluation on SentinelKilnDB test partitions.</span>
        </div>
        <div>Precision = TP / (TP + FP) &bull; Recall = TP / (TP + FN)</div>
      </div>
    </div>
  );
};
