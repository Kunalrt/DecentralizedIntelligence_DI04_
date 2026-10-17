import React from 'react';
import {
  FileText,
  Search,
  Crosshair,
  MapPin,
  Compass,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type { IngestStatus } from '../../services/ingestApi';
import { InfoTooltip } from '../../design';

interface ProcessProgressProps {
  status: IngestStatus;
}

export const ProcessProgress: React.FC<ProcessProgressProps> = ({ status }) => {
  const steps: {
    key: string;
    label: string;
    desc: string;
    icon: React.ReactNode;
    threshold: number;
  }[] = [
    { key: 'read', label: 'Read', desc: 'Parsing input files', icon: <FileText size={16} strokeWidth={1.5} />, threshold: 20 },
    { key: 'check', label: 'Check', desc: 'CRS & GSD verification', icon: <Search size={16} strokeWidth={1.5} />, threshold: 35 },
    { key: 'detect', label: 'Detect', desc: '128x128 OBB model inference', icon: <Crosshair size={16} strokeWidth={1.5} />, threshold: 60 },
    { key: 'locate', label: 'Locate', desc: 'Affine transform & overlap merge', icon: <MapPin size={16} strokeWidth={1.5} />, threshold: 75 },
    { key: 'roads', label: 'Roads', desc: 'OpenStreetMap infrastructure', icon: <Compass size={16} strokeWidth={1.5} />, threshold: 90 },
    { key: 'summarise', label: 'Summarise', desc: 'Spatial metrics & exports', icon: <FileCheck size={16} strokeWidth={1.5} />, threshold: 100 },
  ];

  return (
    <div className="bg-white border border-[#D9D6CE] rounded-[4px] p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9D6CE]">
        <div>
          <div className="flex items-center gap-2">
            {status.completed ? (
              <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#16A34A]" />
            ) : (
              <Loader2 size={18} strokeWidth={1.5} className="animate-spin text-[#1F4E5F]" />
            )}
            <h3 className="text-base font-serif font-bold text-[#1F2328] m-0">
              {status.completed ? 'Survey Pipeline Completed' : 'Processing Spatial Ingestion'}
            </h3>
          </div>
          <p className="text-xs text-[#656D76] font-mono m-0 mt-1">
            {status.message}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-mono font-bold text-[#1F4E5F]">
            {status.percent}%
          </span>
        </div>
      </div>

      {/* Single Unified Progress Bar */}
      <div className="w-full h-2 rounded-[2px] bg-[#ECEAE4] overflow-hidden border border-[#D9D6CE]">
        <div
          className="h-full bg-[#1F4E5F] transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, status.percent))}%` }}
        />
      </div>

      {/* Six Live Icon Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {steps.map((st) => {
          const isDone = status.percent >= st.threshold || status.completed;
          const isCurrent = status.step === st.key && !status.completed;

          return (
            <div
              key={st.key}
              className={`p-2.5 rounded-[4px] border transition-colors ${
                isDone
                  ? 'bg-[#FAFDFB] border-[#86EFAC] text-[#166534]'
                  : isCurrent
                  ? 'bg-[#FAF9F5] border-[#1F4E5F] text-[#1F4E5F] font-semibold'
                  : 'bg-white border-[#D9D6CE] text-[#656D76] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="flex-shrink-0">{st.icon}</span>
                {isDone ? (
                  <CheckCircle2 size={13} strokeWidth={2} className="text-[#16A34A]" />
                ) : isCurrent ? (
                  <Loader2 size={13} strokeWidth={2} className="animate-spin text-[#1F4E5F]" />
                ) : null}
              </div>
              <div className="text-xs font-semibold truncate">{st.label}</div>
              <div className="text-2xs font-mono text-[#656D76] truncate">{st.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Amber Warning Chips with Tooltips (Not Paragraphs) */}
      {status.warnings && status.warnings.length > 0 && (
        <div className="pt-3 border-t border-[#D9D6CE] flex flex-wrap items-center gap-2">
          <span className="text-2xs font-mono text-[#656D76] uppercase tracking-wider">
            Notice:
          </span>
          {status.warnings.map((w, idx) => (
            <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E] text-2xs font-mono">
              <AlertTriangle size={12} strokeWidth={1.5} className="text-[#D97706] flex-shrink-0" />
              <span className="truncate max-w-xs">{w.length > 40 ? w.substring(0, 38) + '...' : w}</span>
              <InfoTooltip content={w} label="Warning notice" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
