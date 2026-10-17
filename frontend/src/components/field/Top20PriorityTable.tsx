import React, { useState } from 'react';
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
import { Badge, Button } from '../../design';

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
    setTimeout(() => setCopiedId(null), 1500);
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
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] shadow-xs overflow-hidden">
      {/* Header Toolbar */}
      <div className="p-4 border-b border-[#D9D6CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
              Top 20 Priority Inspection Targets
            </h3>
            <Badge variant="accent">
              {verifiedCount} / {rows.length} Verified
            </Badge>
          </div>
          <p className="text-2xs text-[#656D76] font-mono m-0 mt-0.5">
            Ranked by regulatory ban violation, confidence, and cluster density.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Search Bar */}
          <div className="relative w-40">
            <Search size={13} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#656D76]" />
            <input
              type="text"
              placeholder="Filter list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1 text-xs font-mono bg-white border border-[#D9D6CE] rounded-[2px] focus:outline-none focus:ring-1 focus:ring-[#1F4E5F]"
            />
          </div>

          <Button
            size="sm"
            variant="secondary"
            icon={<FileSpreadsheet size={13} strokeWidth={1.5} />}
            onClick={() => exportTop20ToCsv(rows)}
          >
            CSV
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={<Download size={13} strokeWidth={1.5} />}
            onClick={() => exportTop20ToGpx(rows)}
          >
            GPX
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={<Printer size={13} strokeWidth={1.5} />}
            onClick={onPrint}
          >
            Print Sheet
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-[#FAF9F5] text-[#656D76] font-semibold border-b border-[#D9D6CE] text-2xs uppercase tracking-wider">
              <th className="py-2.5 px-3 text-center w-10">Done</th>
              <th className="py-2.5 px-3 text-center w-12">Rank</th>
              <th className="py-2.5 px-3">Kiln ID</th>
              <th className="py-2.5 px-3">Class</th>
              <th className="py-2.5 px-3">Coordinates</th>
              <th className="py-2.5 px-3 text-right">Confidence</th>
              <th className="py-2.5 px-3 text-center">Score</th>
              <th className="py-2.5 px-3">Inspection Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D6CE]/60">
            {filteredRows.map((row) => {
              const isChecked = !!checkedIds[row.kiln_id];

              return (
                <tr
                  key={row.kiln_id}
                  className={`transition-colors ${
                    isChecked ? 'bg-[#FAFDFB] text-[#656D76]' : 'hover:bg-[#FAF9F5] text-[#1F2328]'
                  }`}
                >
                  {/* Field Checkbox */}
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleCheck(row.kiln_id)}
                      className="text-[#656D76] hover:text-[#16A34A] focus:outline-none"
                      aria-label={`Toggle verified for ${row.kiln_id}`}
                    >
                      {isChecked ? (
                        <CheckSquare size={15} strokeWidth={2} className="text-[#16A34A]" />
                      ) : (
                        <Square size={15} strokeWidth={1.5} />
                      )}
                    </button>
                  </td>

                  {/* Rank */}
                  <td className="py-2 px-3 text-center font-bold text-[#1F2328]">
                    <span className="w-5 h-5 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] inline-flex items-center justify-center text-2xs">
                      {row.rank}
                    </span>
                  </td>

                  {/* Kiln ID */}
                  <td className="py-2 px-3 font-bold text-[#1F2328]">
                    {row.kiln_id || '-'}
                  </td>

                  {/* Class Badge */}
                  <td className="py-2 px-3">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-2xs font-semibold"
                      style={{
                        color:
                          row.class === 'FCBK'
                            ? '#E8710A'
                            : row.class === 'Zigzag'
                            ? '#1A73E8'
                            : '#188038',
                        backgroundColor:
                          row.class === 'FCBK'
                            ? '#FFF7ED'
                            : row.class === 'Zigzag'
                            ? '#EFF6FF'
                            : '#F0FDF4',
                        border: `1px solid ${
                          row.class === 'FCBK'
                            ? '#FDBA74'
                            : row.class === 'Zigzag'
                            ? '#93C5FD'
                            : '#86EFAC'
                        }`,
                      }}
                    >
                      {row.class || '-'}
                    </span>
                  </td>

                  {/* Coordinates + Copy */}
                  <td className="py-2 px-3 text-2xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>
                        {row.lat != null && row.lon != null
                          ? `${Number(row.lat).toFixed(5)}°, ${Number(row.lon).toFixed(5)}°`
                          : '-'}
                      </span>
                      {row.lat != null && row.lon != null && (
                        <button
                          type="button"
                          onClick={() => handleCopyCoord(row.kiln_id || '', Number(row.lat), Number(row.lon))}
                          title="Copy Coordinates"
                          className="p-0.5 text-[#656D76] hover:text-[#1F4E5F] focus:outline-none"
                        >
                          {copiedId === row.kiln_id ? (
                            <Check size={12} strokeWidth={2} className="text-[#16A34A]" />
                          ) : (
                            <Copy size={12} strokeWidth={1.5} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Confidence */}
                  <td className="py-2 px-3 text-right font-bold text-[#1F2328]">
                    {row.confidence != null ? `${(Number(row.confidence) * 100).toFixed(1)}%` : '-'}
                  </td>

                  {/* Priority Score */}
                  <td className="py-2 px-3 text-center">
                    <span className="px-1.5 py-0.5 rounded-[2px] text-2xs font-bold bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
                      {row.priority_score ?? '-'}
                    </span>
                  </td>

                  {/* Why Visit */}
                  <td className="py-2 px-3 text-[#656D76] text-2xs truncate max-w-xs font-sans">
                    {row.why_visit || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-2.5 bg-[#FAF9F5] border-t border-[#D9D6CE] text-2xs font-mono text-[#656D76] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          Showing {filteredRows.length} targets. Check off inspected sites in the field.
        </div>
        <div>WGS-84 standard (5 decimal places ~1 m precision)</div>
      </div>
    </div>
  );
};
