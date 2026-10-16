import React, { useState } from 'react';
import { KILN_COLORS } from '../../config/constants';
import type { ClusterSummaryRow, Within1kmRow } from '../../types/data';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Copy,
  Check,
  Layers,
} from 'lucide-react';

interface ClustersBreakdownProps {
  clusters: ClusterSummaryRow[];
  within1km: Within1kmRow[];
}

export const ClustersBreakdown: React.FC<ClustersBreakdownProps> = ({
  clusters,
  within1km,
}) => {
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [copiedCenter, setCopiedCenter] = useState<string | null>(null);

  const toggleCluster = (cId: string) => {
    setExpandedCluster(expandedCluster === cId ? null : cId);
  };

  const handleCopyCenter = (cId: string, coords: string) => {
    navigator.clipboard.writeText(coords);
    setCopiedCenter(cId);
    setTimeout(() => setCopiedCenter(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 m-0">
              18 Spatial Proximity Clusters Breakdown
            </h3>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Groups of kilns separated by &le; 1.0 km neighbor gaps. Farida can park once and inspect multiple sites on foot.
          </p>
        </div>

        <div className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 self-start sm:self-auto">
          51 Kilns across 18 Patrol Hubs
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {clusters.map((c) => {
          const isExpanded = expandedCluster === c.cluster;
          const clusterKilns = within1km.filter((k) => k.cluster === c.cluster);

          return (
            <div key={c.cluster} className="transition-colors hover:bg-slate-50/50">
              {/* Row Header */}
              <div
                onClick={() => toggleCluster(c.cluster)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {c.cluster.replace('Cluster ', '#')}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-slate-900">{c.cluster}</strong>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {c.kilns} Kilns
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.types}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                  {/* Centre Lat/Lon */}
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded border border-slate-200">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{c.centre_lat_lon}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCenter(c.cluster, c.centre_lat_lon);
                      }}
                      title="Copy Cluster Center Coordinates"
                      className="p-0.5 rounded text-slate-400 hover:text-brand-primary"
                    >
                      {copiedCenter === c.cluster ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Max Gap */}
                  <div className="text-right whitespace-nowrap">
                    <span className="text-[11px] text-slate-500">Max Gap: </span>
                    <strong className="text-slate-800">{c.max_gap_m} m</strong>
                  </div>

                  {/* Expand Chevron */}
                  <div className="p-1 rounded text-slate-400 hover:text-slate-700">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 bg-slate-50/80 border-t border-slate-100 text-xs animate-in fade-in duration-150">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Kilns Assigned to {c.cluster} ({clusterKilns.length} sites):
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {clusterKilns.map((k) => {
                      const color =
                        k.class === 'FCBK'
                          ? KILN_COLORS.FCBK
                          : k.class === 'Zigzag'
                          ? KILN_COLORS.Zigzag
                          : KILN_COLORS.CFCBK;

                      return (
                        <div
                          key={k.kiln_id}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900">{k.kiln_id}</span>
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                              style={{ backgroundColor: color }}
                            >
                              {k.class}
                            </span>
                          </div>

                          <div className="font-mono text-[11px] text-slate-600">
                            {Number(k.lat).toFixed(5)}, {Number(k.lon).toFixed(5)}
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1">
                            <span>Neighbor gap:</span>
                            <span className="font-semibold text-slate-700">{k.nearest_gap_m} m</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
