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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-[#D9D6CE] text-[#1F2328] p-2.5 rounded-[4px] shadow-sm text-xs font-mono space-y-1.5 min-w-[200px]">
        <div className="flex items-center gap-1.5 font-bold border-b border-[#D9D6CE] pb-1 font-serif">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: d.color }}
          />
          <span className="text-xs">{d.class} Kilns</span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-2xs text-[#656D76]">
          <div>Detected:</div>
          <div className="font-bold text-[#1F2328] text-right">{d.detected}</div>

          <div>95% CI Range:</div>
          <div className="font-bold text-[#1F4E5F] text-right">
            {d.est_low} – {d.est_high}
          </div>

          <div>Precision:</div>
          <div className="text-right text-[#1F2328]">
            {typeof d.precision === 'number' ? d.precision.toFixed(2) : d.precision}
          </div>

          <div>Recall:</div>
          <div className="text-right text-[#1F2328]">
            {typeof d.recall === 'number' ? d.recall.toFixed(2) : d.recall}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const CountsComparisonChart: React.FC<CountsComparisonChartProps> = ({ counts }) => {
  const [includeTotal, setIncludeTotal] = useState(false);

  const filteredCounts = counts.filter((c) => (includeTotal ? true : c.class !== 'Total'));

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
        : '#1F4E5F';

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

  return (
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-[#D9D6CE]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
              <BarChart3 size={15} strokeWidth={1.5} />
            </span>
            <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
              Detected vs. Estimated True Count Range
            </h3>
          </div>
          <p className="text-2xs text-[#656D76] font-mono m-0 mt-0.5">
            Solid bars show model detections. Whiskers indicate statistical uncertainty (low–high range bounds).
          </p>
        </div>

        {/* Toggle District Total */}
        <div className="inline-flex items-center p-0.5 bg-[#FAF9F5] rounded-[2px] border border-[#D9D6CE] text-2xs font-mono self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIncludeTotal(false)}
            className={`px-2 py-0.5 rounded-[2px] font-medium transition-colors ${
              !includeTotal
                ? 'bg-[#1F4E5F] text-white shadow-xs'
                : 'text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            By Class Only
          </button>
          <button
            type="button"
            onClick={() => setIncludeTotal(true)}
            className={`px-2 py-0.5 rounded-[2px] font-medium transition-colors ${
              includeTotal
                ? 'bg-[#1F4E5F] text-white shadow-xs'
                : 'text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            Include Total
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-60 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 20, left: -10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E5E3DC" />
            <XAxis
              dataKey="class"
              tick={{ fill: '#1F2328', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              axisLine={{ stroke: '#D9D6CE' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#656D76', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              axisLine={{ stroke: '#D9D6CE' }}
              tickLine={false}
              domain={[0, includeTotal ? 110 : 50]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="detected" radius={[2, 2, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <ErrorBar
                dataKey="errorRange"
                width={6}
                strokeWidth={1.5}
                stroke="#1F2328"
                direction="y"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Range Breakdown Legend Strip */}
      <div className="mt-3 pt-3 border-t border-[#D9D6CE] grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs font-mono">
        {chartData.map((item) => (
          <div
            key={item.class}
            className="p-2 rounded-[2px] border border-[#D9D6CE] bg-[#FAF9F5] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-[#1F2328] flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.class}
              </span>
              <span className="font-bold text-[#1F2328]">{item.detected}</span>
            </div>
            <div className="text-2xs text-[#656D76] flex items-center justify-between">
              <span>CI:</span>
              <span className="font-semibold text-[#1F4E5F]">
                {item.est_low} – {item.est_high}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
