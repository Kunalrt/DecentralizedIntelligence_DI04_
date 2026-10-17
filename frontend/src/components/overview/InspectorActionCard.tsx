import React from 'react';
import { Car, MapPin, CheckCircle2, AlertOctagon, ArrowRight } from 'lucide-react';
import type { TabKey } from '../Header';
import { Button, Badge } from '../../design';

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
    <div className="bg-white border border-[#D9D6CE] rounded-[4px] p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2.5 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
              <Car size={16} strokeWidth={1.5} />
            </span>
            <span className="font-mono text-2xs font-semibold text-[#1F4E5F] uppercase tracking-wider">
              Field Directive &bull; 1-Jeep Operational Protocol
            </span>
            <Badge variant="accent">SPCB Enforcement</Badge>
          </div>

          <h2 className="text-base sm:text-lg font-serif font-bold text-[#1F2328] m-0">
            Inspector Farida Khan Patrol Briefing
          </h2>

          <p className="text-xs text-[#656D76] leading-relaxed m-0 font-sans">
            Optimised patrol itinerary for 1 vehicle covering 3,000 km². Spatial clustering groups <strong>{clusteredKilns} of 65 kilns</strong> into <strong>{totalClusters} compact 1 km clusters</strong> for efficient field verification.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-[4px] bg-[#FAF9F5] border border-[#D9D6CE]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E8710A] mb-1">
                <AlertOctagon size={14} strokeWidth={1.5} />
                <span>Violations</span>
              </div>
              <div className="text-lg font-mono font-bold text-[#1F2328]">{unconvertedViolations} FCBK</div>
              <div className="text-2xs font-mono text-[#656D76]">Priority inspection targets</div>
            </div>

            <div className="p-2.5 rounded-[4px] bg-[#FAF9F5] border border-[#D9D6CE]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A73E8] mb-1">
                <CheckCircle2 size={14} strokeWidth={1.5} />
                <span>Conversions</span>
              </div>
              <div className="text-lg font-mono font-bold text-[#1F2328]">{convertedZigzag} Zigzag</div>
              <div className="text-2xs font-mono text-[#656D76]">Verified retrofits</div>
            </div>

            <div className="p-2.5 rounded-[4px] bg-[#FAF9F5] border border-[#D9D6CE]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F4E5F] mb-1">
                <MapPin size={14} strokeWidth={1.5} />
                <span>Routing Efficiency</span>
              </div>
              <div className="text-lg font-mono font-bold text-[#1F2328]">{clusteredKilns} Kilns</div>
              <div className="text-2xs font-mono text-[#656D76]">Across {totalClusters} 1 km groups</div>
            </div>
          </div>
        </div>

        {onNavigateTab && (
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 flex-shrink-0 self-stretch sm:self-auto justify-center">
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRight size={14} strokeWidth={1.5} />}
              onClick={() => onNavigateTab('field')}
            >
              Open Field Plan
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<MapPin size={14} strokeWidth={1.5} />}
              onClick={() => onNavigateTab('map')}
            >
              Surveillance Map
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
