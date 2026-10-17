import React, { useState } from 'react';
import type { ClusterSummaryRow, Within1kmRow } from '../../types/data';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Layers,
} from 'lucide-react';
import { Badge } from '../../design';

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
    setTimeout(() => setCopiedCenter(null), 1500);
  };

  return (
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] shadow-xs overflow-hidden">
      <div className="p-4 border-b border-[#D9D6CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
              <Layers size={15} strokeWidth={1.5} />
            </span>
            <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
              Spatial Proximity Clusters Breakdown
            </h3>
          </div>
          <p className="text-2xs text-[#656D76] font-mono m-0 mt-0.5">
            Groups of kilns separated by &le; 1.0 km. Officers park once and verify multiple sites on foot.
          </p>
        </div>

        <Badge variant="accent">
          {within1km.length} Kilns across {clusters.length} Clusters
        </Badge>
      </div>

      <div className="divide-y divide-[#D9D6CE]/60 font-mono text-xs">
        {clusters.map((c) => {
          const isExpanded = expandedCluster === c.cluster;
          const clusterKilns = within1km.filter((k) => k.cluster === c.cluster);

          return (
            <div key={c.cluster} className="transition-colors hover:bg-[#FAF9F5]/60">
              <div
                onClick={() => toggleCluster(c.cluster)}
                className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[#656D76]">
                    {isExpanded ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
                  </span>
                  <div>
                    <span className="font-bold text-[#1F2328] mr-2">{c.cluster}</span>
                    <span className="text-2xs text-[#656D76]">
                      ({c.kilns} kilns &bull; Max gap: {c.max_gap_m ? `${c.max_gap_m} m` : '< 500 m'})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-2xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#656D76]">Center:</span>
                    <span>{c.centre_lat_lon}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCenter(c.cluster, c.centre_lat_lon);
                      }}
                      className="p-0.5 text-[#656D76] hover:text-[#1F4E5F]"
                      title="Copy cluster center"
                    >
                      {copiedCenter === c.cluster ? (
                        <Check size={11} strokeWidth={2} className="text-[#16A34A]" />
                      ) : (
                        <Copy size={11} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                  <Badge variant="outline">{c.types || `${c.kilns} kilns`}</Badge>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-3 pt-1 bg-[#FAF9F5] border-t border-[#D9D6CE]/40">
                  <table className="w-full text-left text-2xs">
                    <thead>
                      <tr className="text-[#656D76] border-b border-[#D9D6CE]/50">
                        <th className="py-1">Kiln ID</th>
                        <th className="py-1">Class</th>
                        <th className="py-1">Coordinates</th>
                        <th className="py-1">Distance to Nearest Neighbour</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D6CE]/30">
                      {clusterKilns.map((k) => (
                        <tr key={k.kiln_id}>
                          <td className="py-1 font-bold text-[#1F2328]">{k.kiln_id}</td>
                          <td className="py-1">
                            <span
                              className="px-1 py-0.2 rounded-[2px]"
                              style={{
                                color:
                                  k.class === 'FCBK'
                                    ? '#E8710A'
                                    : k.class === 'Zigzag'
                                    ? '#1A73E8'
                                    : '#188038',
                              }}
                            >
                              {k.class}
                            </span>
                          </td>
                          <td className="py-1">{k.lat?.toFixed(5)}°, {k.lon?.toFixed(5)}°</td>
                          <td className="py-1 text-[#656D76]">{k.nearest_gap_m ? `${k.nearest_gap_m} m` : '< 500 m'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
