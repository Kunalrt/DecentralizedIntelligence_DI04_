import React from 'react';
import { useData } from '../context/DataContext';
import { VehicleRoutingCard } from '../components/field/VehicleRoutingCard';
import { Top20PriorityTable } from '../components/field/Top20PriorityTable';
import { ClustersBreakdown } from '../components/field/ClustersBreakdown';
import { PrintFieldSheet } from '../components/field/PrintFieldSheet';
import { ClipboardList, ShieldAlert, Sparkles } from 'lucide-react';

export const FieldListPage: React.FC = () => {
  const { data } = useData();

  if (!data) return null;

  const top20 = data.top20;
  const clusters = data.clusters;
  const within1km = data.within1km;
  const totalKilns = data.summaryStats.unique_physical_kilns;
  const clusteredKilns = data.summaryStats.kilns_within_1km_cluster;
  const totalClusters = data.summaryStats.total_clusters_count;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* 1. Print-Only Clipboard Sheet (Hidden on screen, visible during window.print) */}
      <PrintFieldSheet rows={top20} />

      {/* 2. Interactive Screen View (Hidden when printing) */}
      <div className="space-y-6 print:hidden">
        {/* Header Bar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900 m-0">
                Field Inspection Dispatch & Route Planning
              </h2>
            </div>
            <p className="text-xs text-slate-500 m-0 mt-1">
              Inspector Farida Khan (SPCB) &bull; 1-Jeep Vehicle Optimization &bull; Demo District (3,000 sq km)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              {top20.length} Priority Targets
            </span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {totalClusters} Proximity Clusters
            </span>
          </div>
        </div>

        {/* Vehicle Routing Logistics & Distance Savings Card */}
        <VehicleRoutingCard
          totalKilns={totalKilns}
          clusteredKilns={clusteredKilns}
          totalClusters={totalClusters}
        />

        {/* Top 20 Priority Targets Table with Exports */}
        <Top20PriorityTable rows={top20} onPrint={handlePrint} />

        {/* 18 Proximity Clusters Breakdown */}
        <ClustersBreakdown clusters={clusters} within1km={within1km} />
      </div>
    </>
  );
};
