import React from 'react';
import { Car, Compass, Zap, Shield, Gauge } from 'lucide-react';
import { Badge } from '../../design';

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
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-2.5 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
              <Car size={15} strokeWidth={1.5} />
            </span>
            <span className="font-mono text-2xs font-semibold text-[#1F4E5F] uppercase tracking-wider">
              1-Jeep Vehicle Routing Protocol
            </span>
            <Badge variant="accent">{clusterPercentage}% Clustered</Badge>
          </div>

          <h2 className="text-base sm:text-lg font-serif font-bold text-[#1F2328] m-0">
            Cluster-First Dispatch: ~120 km Field Transit Reduction
          </h2>

          <p className="text-xs text-[#656D76] leading-relaxed m-0 font-sans">
            Grouping inspections by 1.0 km proximity cuts required patrol mileage from ~185 km to ~65 km across the 3,000 km² Demo District.
          </p>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-[4px] bg-[#FAF9F5] border border-[#D9D6CE]">
              <div className="flex items-center gap-1.5 text-[#656D76] text-2xs font-mono font-medium mb-1">
                <Gauge size={13} strokeWidth={1.5} />
                <span>Naive Route</span>
              </div>
              <div className="text-lg font-mono font-bold text-[#656D76] line-through">~185 km</div>
              <div className="text-2xs font-mono text-[#656D76]">Unclustered transit</div>
            </div>

            <div className="p-2.5 rounded-[4px] bg-[#FAFDFB] border border-[#86EFAC]">
              <div className="flex items-center gap-1.5 text-[#166534] text-2xs font-mono font-semibold mb-1">
                <Compass size={13} strokeWidth={1.5} />
                <span>Clustered Route</span>
              </div>
              <div className="text-lg font-mono font-bold text-[#166534]">~65 km</div>
              <div className="text-2xs font-mono text-[#656D76]">{totalClusters} clusters</div>
            </div>

            <div className="p-2.5 rounded-[4px] bg-[#FAF9F5] border border-[#1F4E5F]">
              <div className="flex items-center gap-1.5 text-[#1F4E5F] text-2xs font-mono font-semibold mb-1">
                <Zap size={13} strokeWidth={1.5} />
                <span>Transit Saved</span>
              </div>
              <div className="text-lg font-mono font-bold text-[#1F4E5F]">~120 km</div>
              <div className="text-2xs font-mono text-[#656D76]">64.8% reduction</div>
            </div>
          </div>
        </div>

        {/* Recommended Sequence Stepper */}
        <div className="bg-[#FAF9F5] p-3 rounded-[4px] border border-[#D9D6CE] text-xs font-mono space-y-2 w-full lg:w-72 flex-shrink-0">
          <div className="font-bold text-[#1F2328] border-b border-[#D9D6CE] pb-1 flex items-center justify-between">
            <span>Patrol Sequence</span>
            <Shield size={13} strokeWidth={1.5} className="text-[#1F4E5F]" />
          </div>

          <div className="space-y-1.5 text-2xs text-[#1F2328]">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-[2px] bg-[#FFF7ED] text-[#E8710A] border border-[#FDBA74] flex items-center justify-center font-bold text-[10px]">
                1
              </span>
              <div>
                <strong className="text-[#1F2328]">Leg A: South-Central</strong>
                <div className="text-[#656D76]">Cluster 12 &bull; 2 kilns</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-[2px] bg-[#EFF6FF] text-[#1A73E8] border border-[#93C5FD] flex items-center justify-center font-bold text-[10px]">
                2
              </span>
              <div>
                <strong className="text-[#1F2328]">Leg B: Eastern Belt</strong>
                <div className="text-[#656D76]">Clusters 1, 15, 2 &bull; 12 kilns</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-[2px] bg-[#FAF9F5] text-[#1F4E5F] border border-[#1F4E5F] flex items-center justify-center font-bold text-[10px]">
                3
              </span>
              <div>
                <strong className="text-[#1F2328]">Leg C: Central Corridor</strong>
                <div className="text-[#656D76]">Clusters 4, 6, 10 &bull; 9 kilns</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-[2px] bg-[#F0FDF4] text-[#188038] border border-[#86EFAC] flex items-center justify-center font-bold text-[10px]">
                4
              </span>
              <div>
                <strong className="text-[#1F2328]">Leg D: Western Dense Hub</strong>
                <div className="text-[#656D76]">Clusters 3, 5, 11, 13 &bull; 11 kilns</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
