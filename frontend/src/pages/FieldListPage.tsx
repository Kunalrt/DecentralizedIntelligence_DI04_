import React from 'react';
import { useData } from '../context/DataContext';
import { VehicleRoutingCard } from '../components/field/VehicleRoutingCard';
import { Top20PriorityTable } from '../components/field/Top20PriorityTable';
import { ClustersBreakdown } from '../components/field/ClustersBreakdown';
import { PrintFieldSheet } from '../components/field/PrintFieldSheet';
import { SectionHeader, Badge } from '../design';

export const FieldListPage: React.FC = () => {
  const { data } = useData();

  if (!data) return null;

  const top20 = data.top20;
  const clusters = data.clusters;
  const within1km = data.within1km;
  const totalKilns = data.summaryStats?.unique_physical_kilns ?? (data.top20?.length ?? 20);
  const clusteredKilns = data.summaryStats?.kilns_within_1km_cluster ?? (data.within1km?.length ?? 0);
  const totalClusters = data.summaryStats?.total_clusters_count ?? (data.clusters?.length ?? 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* 1. Print-Only Clipboard Sheet */}
      <PrintFieldSheet rows={top20} />

      {/* 2. Interactive Screen View */}
      <div className="space-y-4 print:hidden max-w-7xl mx-auto">
        {/* Header Bar */}
        <SectionHeader
          title="Field Inspection Roster & Vehicle Dispatch"
          subtitle="Inspector Farida Khan (SPCB) &bull; 1-Jeep Vehicle Optimization &bull; Demo District (3,000 km²)"
          badge={
            <div className="flex items-center gap-1.5">
              <Badge variant="warning">{top20.length} Priority Targets</Badge>
              <Badge variant="accent">{totalClusters} Clusters</Badge>
            </div>
          }
        />

        {/* Vehicle Routing Logistics & Distance Savings Card */}
        <VehicleRoutingCard
          totalKilns={totalKilns}
          clusteredKilns={clusteredKilns}
          totalClusters={totalClusters}
        />

        {/* Top 20 Interactive Priority Table */}
        <Top20PriorityTable rows={top20} onPrint={handlePrint} />

        {/* Spatial Clusters Breakdown */}
        <ClustersBreakdown clusters={clusters} within1km={within1km} />
      </div>
    </>
  );
};
