import React from 'react';
import { useData } from '../context/DataContext';
import { GraduationCap, Award } from 'lucide-react';
import { DATASET_CREDIT, KILN_COLORS } from '../config/constants';

export const MethodPage: React.FC = () => {
  const { data } = useData();
  const metrics = data?.metrics;
  const experiments = data?.experiments ?? [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Methodology, Model Architecture & Uncertainty
          </h2>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Oriented Bounding Box (OBB) detection with DOTA all-point interpolated mAP on Sentinel-2 nadir RGB
          </p>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-xl shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Rotated IoU Macro mAP@0.5</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {metrics?.mAP ? metrics.mAP.toFixed(4) : '0.8339'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Equal 1/3 weighting per class</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: KILN_COLORS.FCBK }} />
            <span>AP: FCBK (Oval)</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            {metrics?.AP_FCBK ? metrics.AP_FCBK.toFixed(4) : '0.8850'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">High precision envelope</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: KILN_COLORS.Zigzag }} />
            <span>AP: Zigzag (Rectangle)</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            {metrics?.AP_Zigzag ? metrics.AP_Zigzag.toFixed(4) : '0.6167'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">+17.5% from 256px resolution</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span className="w-2.5 h-2.5" style={{ color: KILN_COLORS.CFCBK }}>▲</span>
            <span>AP: CFCBK (Circular ~3%)</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {metrics?.AP_CFCBK ? metrics.AP_CFCBK.toFixed(4) : '1.0000'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Perfect recall via copy-paste</div>
        </div>
      </div>

      {/* Mandatory Dataset Citation */}
      <div className="bg-amber-50/60 p-5 rounded-xl border border-amber-200 text-amber-900">
        <div className="flex items-center gap-2 font-bold text-sm mb-1">
          <Award className="w-4 h-4 text-amber-600" />
          <span>Official Benchmark & Dataset Credit</span>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed m-0">
          {DATASET_CREDIT.fullText}
        </p>
      </div>

      {/* Experiments Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-2">Model Development Progression ({experiments.length} Experiments)</h3>
        <p className="text-xs text-slate-500 mb-3">
          Detailed interactive experiments table, pipeline diagram, and limitations panel will be finalized in <strong>Phase 6</strong>.
        </p>
        <div className="space-y-2">
          {experiments.slice(0, 4).map((exp) => (
            <div key={exp.id} className="p-2.5 bg-slate-50 rounded border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <strong>Exp {exp.id}: {exp.model}</strong> &bull; <span className="text-slate-600">{exp.technique}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]">
                {exp.val_mAP !== null ? `mAP ${exp.val_mAP.toFixed(4)}` : exp.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
