import React from 'react';
import { Car, MapPin, CheckCircle2, AlertOctagon, ArrowRight, FileText } from 'lucide-react';
import type { TabKey } from '../Header';

interface InspectorActionCardProps {
  clusteredKilns: number;
  totalClusters: number;
  convertedZigzag: number;
  unconvertedViolations: number;
  onNavigateTab?: (tab: TabKey) => void;
}

export const InspectorActionCard: React.FC<InspectorActionCardProps> = ({
  clusteredKilns,
  totalClusters,
  convertedZigzag,
  unconvertedViolations,
  onNavigateTab,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            <Car className="w-3.5 h-3.5" /> Field Inspection Directive &bull; 1-Jeep Operational Protocol
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white m-0">
            Inspector Farida Khan&rsquo;s Field Action Briefing
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed m-0">
            With one vehicle and two field officers covering 3,000 sq km, random patrols are impractical.
            Our spatial clustering identifies <strong>{clusteredKilns} of 65 kilns</strong> situated within <strong>1.0 km</strong> of each other across <strong>{totalClusters} compact clusters</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-orange-400 text-xs font-semibold mb-1">
                <AlertOctagon className="w-3.5 h-3.5" /> Persistent Violations
              </div>
              <div className="text-xl font-extrabold text-white">{unconvertedViolations} FCBKs</div>
              <div className="text-[11px] text-slate-400 mt-0.5">High-confidence enforcement targets</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Conversions
              </div>
              <div className="text-xl font-extrabold text-white">{convertedZigzag} Zigzags</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Converted from 2023 baseline</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold mb-1">
                <MapPin className="w-3.5 h-3.5" /> Patrol Efficiency
              </div>
              <div className="text-xl font-extrabold text-white">{clusteredKilns} Kilns</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across {totalClusters} tight 1 km groups</div>
            </div>
          </div>
        </div>

        {onNavigateTab && (
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 flex-shrink-0 self-stretch sm:self-auto justify-center">
            <button
              onClick={() => onNavigateTab('field')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition shadow"
            >
              <FileText className="w-4 h-4" /> Open Field Plan & Top 20 <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('map')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-200 border border-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-700 transition"
            >
              <MapPin className="w-4 h-4 text-emerald-400" /> View District Map
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
