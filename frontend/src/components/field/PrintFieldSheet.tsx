import React from 'react';
import type { Top20Row } from '../../types/data';

interface PrintFieldSheetProps {
  rows: Top20Row[];
}

export const PrintFieldSheet: React.FC<PrintFieldSheetProps> = ({ rows }) => {
  return (
    <div className="hidden print:block p-4 max-w-4xl mx-auto text-black font-sans bg-white">
      {/* Official Header */}
      <div className="border-b-2 border-black pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide m-0">
              State Pollution Control Board (SPCB)
            </h1>
            <h2 className="text-sm font-semibold tracking-normal text-slate-800 m-0 mt-0.5">
              Brick Kiln Enforcement Division &bull; Demo District Surveillance Zone
            </h2>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold border border-black px-2 py-1 uppercase">
              CONFIDENTIAL &bull; FIELD DISPATCH
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-300 text-xs">
          <div>
            <span className="text-slate-600 block text-[10px] uppercase">Lead Inspector</span>
            <strong className="text-black">Farida Khan</strong>
          </div>
          <div>
            <span className="text-slate-600 block text-[10px] uppercase">Vehicle Assigned</span>
            <strong className="text-black">Jeep #1 (2 Field Staff)</strong>
          </div>
          <div>
            <span className="text-slate-600 block text-[10px] uppercase">Patrol Date</span>
            <span className="text-slate-800 font-mono">____ / ____ / 2026</span>
          </div>
          <div>
            <span className="text-slate-600 block text-[10px] uppercase">Mileage Start / End</span>
            <span className="text-slate-800 font-mono">______ km / ______ km</span>
          </div>
        </div>
      </div>

      {/* Target Table */}
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-1.5">
          Top 20 Priority Inspection Targets (Field Verification Checklist)
        </h3>
        <table className="w-full text-left border-collapse border border-black text-[10px]">
          <thead>
            <tr className="bg-slate-200 border-b border-black font-bold uppercase text-[9px]">
              <th className="border border-black p-1 text-center w-6">Chk</th>
              <th className="border border-black p-1 text-center w-6">#</th>
              <th className="border border-black p-1 w-20">Kiln ID</th>
              <th className="border border-black p-1 w-14">Type</th>
              <th className="border border-black p-1 w-28">GPS Coordinates</th>
              <th className="border border-black p-1 w-12 text-right">Conf</th>
              <th className="border border-black p-1">Regulatory Reason & Direction</th>
              <th className="border border-black p-1 w-28">Field Finding</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.kiln_id} className="border-b border-slate-400">
                <td className="border border-black p-1 text-center font-mono text-sm">
                  &#x25A2;
                </td>
                <td className="border border-black p-1 text-center font-bold font-mono">
                  {row.rank}
                </td>
                <td className="border border-black p-1 font-mono font-bold">
                  {row.kiln_id}
                </td>
                <td className="border border-black p-1 font-semibold uppercase">
                  {row.class}
                </td>
                <td className="border border-black p-1 font-mono text-[9px] whitespace-nowrap">
                  {Number(row.lat).toFixed(5)}, {Number(row.lon).toFixed(5)}
                </td>
                <td className="border border-black p-1 text-right font-mono font-bold">
                  {(Number(row.confidence) * 100).toFixed(0)}%
                </td>
                <td className="border border-black p-1 leading-tight">
                  {row.why_visit}
                </td>
                <td className="border border-black p-1 text-[8px] leading-tight font-mono">
                  [ ] VIOLATION<br />
                  [ ] CONVERTED<br />
                  [ ] INACTIVE
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Field Notes & Sign-Off */}
      <div className="border border-black p-3 text-xs space-y-3">
        <div className="font-bold uppercase text-[10px]">
          Field Observation Notes & Action Taken:
        </div>
        <div className="h-10 border-b border-dashed border-slate-400" />
        <div className="h-10 border-b border-dashed border-slate-400" />

        <div className="grid grid-cols-2 gap-8 pt-4">
          <div>
            <div className="border-b border-black pb-4 text-center text-slate-400">
              Signature of Accompanying Field Officer
            </div>
            <div className="text-[10px] text-slate-500 text-center mt-1">Staff Member 1 / 2</div>
          </div>
          <div>
            <div className="border-b border-black pb-4 text-center font-bold text-slate-800">
              Inspector Farida Khan
            </div>
            <div className="text-[10px] text-slate-500 text-center mt-1">Lead Inspector Sign-off</div>
          </div>
        </div>
      </div>
    </div>
  );
};
