import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ErrorBar,
} from 'recharts';
import { KILN_COLORS } from '../../config/constants';
import type { CountRow } from '../../types/data';
import { BarChart3 } from 'lucide-react';

interface CountsComparisonChartProps {
  counts: CountRow[];
}

export const CountsComparisonChart: React.FC<CountsComparisonChartProps> = ({ counts }) => {
  const [includeTotal, setIncludeTotal] = useState(false);

  // Filter out Total if not selected
  const filteredCounts = counts.filter((c) => (includeTotal ? true : c.class !== 'Total'));

  // Format chart data with error ranges for Recharts ErrorBar
  const chartData = filteredCounts.map((c) => {
    const lowerOffset = Math.max(0, c.detected - c.est_low);
    const upperOffset = Math.max(0, c.est_high - c.detected);
    const color =
      c.class === 'FCBK'
        ? KILN_COLORS.FCBK
        : c.class === 'Zigzag'
        ? KILN_COLORS.Zigzag
        : c.class === 'CFCBK'
        ? KILN_COLORS.CFCBK
        : '#475569';

    return {
      class: c.class,
      detected: c.detected,
      est_low: c.est_low,
      est_high: c.est_high,
      errorRange: [lowerOffset, upperOffset],
      precision: c.precision,
      recall: c.recall,
      note: c.note,
      color,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center gap-2 font-bold border-b border-slate-700/80 pb-1.5">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-sm">{d.class} Kilns</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
            <div>Detected:</div>
            <div className="font-bold text-white text-right">{d.detected}</div>

            <div>Est. Range (95% CI):</div>
            <div className="font-bold text-amber-300 text-right">
              {d.est_low} – {d.est_high}
            </div>

            <div>Val. Precision:</div>
            <div className="text-right text-slate-200">
              {typeof d.precision === 'number' ? d.precision.toFixed(2) : d.precision}
            </div>

            <div>Val. Recall:</div>
            <div className="text-right text-slate-200">
              {typeof d.recall === 'number' ? d.recall.toFixed(2) : d.recall}
            </div>
          </div>

          {d.note && (
            <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800">
              {d.note}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-primary" />
            <h3 className="text-base font-bold text-slate-900 m-0">
              Detected vs. Estimated True Count Range
            </h3>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Solid bars show model detections. Whiskers indicate statistical uncertainty (low–high range bounds).
          </p>
        </div>

        {/* Toggle District Total */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIncludeTotal(false)}
            className={`px-2.5 py-1 rounded font-medium transition ${
              !includeTotal
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By Class Only
          </button>
          <button
            type="button"
            onClick={() => setIncludeTotal(true)}
            className={`px-2.5 py-1 rounded font-medium transition ${
              includeTotal
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Include Total
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 25, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="class"
              tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: '#CBD5E1' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={{ stroke: '#CBD5E1' }}
              tickLine={false}
              domain={[0, includeTotal ? 110 : 50]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="detected" radius={[4, 4, 0, 0]} maxBarSize={56}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <ErrorBar
                dataKey="errorRange"
                width={8}
                strokeWidth={2}
                stroke="#1E293B"
                direction="y"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Range Breakdown Legend Strip */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
        {chartData.map((item) => (
          <div
            key={item.class}
            className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.class}
              </span>
              <span className="font-bold text-slate-900">{item.detected}</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Range:</span>
              <span className="font-semibold text-slate-700">
                {item.est_low} – {item.est_high}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
