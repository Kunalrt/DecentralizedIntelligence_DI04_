import React from 'react';
import { HelpCircle, AlertCircle, Compass, Microscope } from 'lucide-react';
import type { MetricsData } from '../../types/data';

interface UncertaintyPanelProps {
  metrics: MetricsData;
}

export const UncertaintyPanel: React.FC<UncertaintyPanelProps> = ({ metrics }) => {
  return (
    <div className="bg-amber-50/50 rounded-xl border border-amber-200/90 p-5 md:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-amber-200/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              How Sure Are We? Model Uncertainty & Field Realities
            </h3>
            <p className="text-xs text-slate-600 m-0 mt-0.5">
              Honest machine learning bounds for Inspector Farida Khan and the verification team.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-2.5 py-1 rounded bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-semibold">
          <Microscope className="w-3.5 h-3.5" /> Macro mAP: {(metrics.mAP * 100).toFixed(1)}%
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Bullet 1: 10m Resolution */}
        <div className="bg-white/80 rounded-lg p-3.5 border border-amber-200/70 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Compass className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>1. 10-Meter Pixel Scale</span>
          </div>
          <p className="text-slate-600 leading-relaxed m-0">
            Sentinel-2 imagery captures 10&nbsp;m ground resolution. An average 30–45&nbsp;m kiln spans only 3 to 5 pixels across. Oval trenches and tall chimney shadows are distinguishable, but small artisanal clamps or degraded trenches can blur into dry soil.
          </p>
        </div>

        {/* Bullet 2: Domain Shift */}
        <div className="bg-white/80 rounded-lg p-3.5 border border-amber-200/70 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>2. 2025–26 Domain Shift</span>
          </div>
          <p className="text-slate-600 leading-relaxed m-0">
            Model weights were trained on benchmark 2023 labeled tiles. Deploying on 2025–2026 post-monsoon imagery introduces seasonal soil moisture variation, differing operational schedules, and newer partial hybrid kiln retrofits.
          </p>
        </div>

        {/* Bullet 3: Statistical Bounds */}
        <div className="bg-white/80 rounded-lg p-3.5 border border-amber-200/70 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>3. No Prior Ground Truth</span>
          </div>
          <p className="text-slate-600 leading-relaxed m-0">
            No physical field census has yet been performed in this Demo District. Because precision and recall vary across classes (e.g. Zigzag AP is {(metrics.AP_Zigzag * 100).toFixed(1)}%), counts are reported with honest 95% confidence bounds (FCBK: 18–41, Zigzag: 21–45).
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 gap-2">
        <div>
          <strong className="text-slate-800 font-semibold">Recommended Field Strategy:</strong> Prioritize the 18 dense clusters (51 kilns) and top-confidence FCBK sites first before dispatching the jeep to isolated edge detections.
        </div>
        <div className="text-slate-500 italic flex-shrink-0">
          Source: SentinelKilnDB (NeurIPS 2025)
        </div>
      </div>
    </div>
  );
};
