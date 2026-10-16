import React from 'react';
import { Car, Compass, Zap, Shield, Gauge } from 'lucide-react';

interface VehicleRoutingCardProps {
  totalKilns: number;
  clusteredKilns: number;
  totalClusters: number;
}

export const VehicleRoutingCard: React.FC<VehicleRoutingCardProps> = ({
  totalKilns,
  clusteredKilns,
  totalClusters,
}) => {
  const clusterPercentage = ((clusteredKilns / (totalKilns || 65)) * 100).toFixed(1);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-700">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            <Car className="w-3.5 h-3.5" /> 1-Jeep Vehicle Routing Protocol
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white m-0">
            Cluster-First Dispatch: Saving ~120 km of Field Transit
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed m-0">
            Inspector Farida Khan has <strong>one jeep</strong> and <strong>two field staff</strong> covering a 3,000 sq km territory.
            Visiting individual sites arbitrarily would require over 185 km of driving with extensive backtracking.
            Because <strong>{clusteredKilns} of {totalKilns} detected kilns ({clusterPercentage}%)</strong> sit within <strong>1.0 km</strong> of a neighboring site, grouping patrols by cluster cuts route distance by over 64%.
          </p>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-800/90 border border-slate-700">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                <Gauge className="w-3.5 h-3.5 text-slate-400" /> Naive Unclustered Route
              </div>
              <div className="text-xl font-bold text-slate-300 line-through">~185 km</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Scattered single-site driving</div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
                <Compass className="w-3.5 h-3.5 text-emerald-400" /> Clustered Patrol Route
              </div>
              <div className="text-xl font-extrabold text-emerald-300">~65 km</div>
              <div className="text-[11px] text-emerald-400/80 mt-0.5">Across {totalClusters} tight groups</div>
            </div>

            <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30">
              <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-semibold mb-1">
                <Zap className="w-3.5 h-3.5 text-indigo-400" /> Transit Efficiency Gain
              </div>
              <div className="text-xl font-extrabold text-white">~120 km Saved</div>
              <div className="text-[11px] text-indigo-300/80 mt-0.5">64.8% fuel & time reduction</div>
            </div>
          </div>
        </div>

        {/* Recommended Sequence Stepper */}
        <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 text-xs space-y-2.5 w-full lg:w-72 flex-shrink-0">
          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1.5 flex items-center justify-between">
            <span>Recommended Patrol Sequence</span>
            <Shield className="w-3.5 h-3.5 text-brand-primary" />
          </div>

          <div className="space-y-2 text-slate-300 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center justify-center font-bold text-[10px]">
                1
              </span>
              <div>
                <strong className="text-white">Leg A: South-Central</strong>
                <div className="text-slate-400">Cluster 12 &bull; 2 kilns (331 m gap)</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-[10px]">
                2
              </span>
              <div>
                <strong className="text-white">Leg B: Eastern Belt</strong>
                <div className="text-slate-400">Clusters 1, 15, 2 &bull; 12 kilns</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-[10px]">
                3
              </span>
              <div>
                <strong className="text-white">Leg C: Central Corridor</strong>
                <div className="text-slate-400">Clusters 4, 6, 10 &bull; 9 kilns</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px]">
                4
              </span>
              <div>
                <strong className="text-white">Leg D: Western Dense Hub</strong>
                <div className="text-slate-400">Clusters 3, 5, 11, 13 &bull; 11 kilns</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
