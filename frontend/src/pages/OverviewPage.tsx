import React from 'react';
import { useData } from '../context/DataContext';
import { KILN_COLORS } from '../config/constants';
import type { TabKey } from '../components/Header';
import { KpiCard } from '../components/overview/KpiCard';
import { UncertaintyPanel } from '../components/overview/UncertaintyPanel';
import { CountsComparisonChart } from '../components/overview/CountsComparisonChart';
import { PrecisionRecallTable } from '../components/overview/PrecisionRecallTable';
import { InspectorActionCard } from '../components/overview/InspectorActionCard';
import {
  Layers,
  Flame,
  CheckCircle2,
  CircleDot,
  Navigation,
} from 'lucide-react';

interface OverviewPageProps {
  onNavigateTab?: (tab: TabKey) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateTab }) => {
  const { data } = useData();

  if (!data) return null;

  const totalRow = data.counts.find((c) => c.class === 'Total');
  const fcbkRow = data.counts.find((c) => c.class === 'FCBK');
  const zigzagRow = data.counts.find((c) => c.class === 'Zigzag');
  const cfcbkRow = data.counts.find((c) => c.class === 'CFCBK');

  const totalDetected = totalRow?.detected ?? data.summaryStats.unique_physical_kilns;
  const fcbkDetected = fcbkRow?.detected ?? 27;
  const zigzagDetected = zigzagRow?.detected ?? 30;
  const cfcbkDetected = cfcbkRow?.detected ?? 8;

  const convZigzag = data.summaryStats.conversions_tracked.converted_to_zigzag;
  const unconvertedFcbk = data.summaryStats.conversions_tracked.unconverted_fcbk_violations;
  const clustersCount = data.summaryStats.total_clusters_count;
  const clusteredKilns = data.summaryStats.kilns_within_1km_cluster;

  return (
    <div className="space-y-6">
      {/* 1. Inspector Farida Khan Operational Dispatch Banner */}
      <InspectorActionCard
        clusteredKilns={clusteredKilns}
        totalClusters={clustersCount}
        convertedZigzag={convZigzag}
        unconvertedViolations={unconvertedFcbk}
        onNavigateTab={onNavigateTab}
      />

      {/* 2. Primary KPI Cards Grid (5 Cards: Total, FCBK, Zigzag, CFCBK, Clusters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Kilns */}
        <KpiCard
          title="Total Kilns"
          value={totalDetected}
          rangeText={`${totalRow?.est_low ?? 42} – ${totalRow?.est_high ?? 100}`}
          subtitle="Deduplicated across 120 Sentinel-2 tiles (4 overlaps resolved)"
          icon={<Layers className="w-5 h-5" />}
          accentBorderColor="#64748B"
        />

        {/* FCBK Violations */}
        <KpiCard
          title="FCBK (Banned)"
          value={fcbkDetected}
          rangeText={`${fcbkRow?.est_low ?? 18} – ${fcbkRow?.est_high ?? 41}`}
          badge={{ text: '2022 Ban Violations', variant: 'warning' }}
          colorSwatch={KILN_COLORS.FCBK}
          accentBorderColor={KILN_COLORS.FCBK}
          subtitle="Illegal natural draft; priority vehicle inspection targets"
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          onClick={onNavigateTab ? () => onNavigateTab('map') : undefined}
        />

        {/* Zigzag Compliant */}
        <KpiCard
          title="Zigzag Compliant"
          value={zigzagDetected}
          rangeText={`${zigzagRow?.est_low ?? 21} – ${zigzagRow?.est_high ?? 45}`}
          badge={{ text: `${convZigzag} Converted`, variant: 'info' }}
          colorSwatch={KILN_COLORS.Zigzag}
          accentBorderColor={KILN_COLORS.Zigzag}
          subtitle="Mandate-compliant forced-draft design conversions"
          icon={<CheckCircle2 className="w-5 h-5 text-blue-500" />}
          onClick={onNavigateTab ? () => onNavigateTab('map') : undefined}
        />

        {/* CFCBK Circular */}
        <KpiCard
          title="CFCBK Circular"
          value={cfcbkDetected}
          rangeText={`${cfcbkRow?.est_low ?? 3} – ${cfcbkRow?.est_high ?? 14}`}
          badge={{ text: 'Legacy Design', variant: 'success' }}
          colorSwatch={KILN_COLORS.CFCBK}
          accentBorderColor={KILN_COLORS.CFCBK}
          subtitle="Circular Bull's Trench (~12% of district detections)"
          icon={<CircleDot className="w-5 h-5 text-emerald-600" />}
          onClick={onNavigateTab ? () => onNavigateTab('map') : undefined}
        />

        {/* Clustered for Jeep Patrol */}
        <KpiCard
          title="1 km Clusters"
          value={clusteredKilns}
          unit="kilns"
          badge={{ text: `${clustersCount} Patrol Clusters`, variant: 'purple' }}
          accentBorderColor="#8B5CF6"
          subtitle="Sites within 1.0 km neighbor gap for optimal jeep routing"
          icon={<Navigation className="w-5 h-5 text-purple-600" />}
          onClick={onNavigateTab ? () => onNavigateTab('field') : undefined}
        />
      </div>

      {/* 3. Recharts Chart: Detected vs Estimated True Count Range */}
      <CountsComparisonChart counts={data.counts} />

      {/* 4. Precision & Recall Validation Table */}
      <PrecisionRecallTable counts={data.counts} metrics={data.metrics} />

      {/* 5. Honest Uncertainty Panel ("How sure are we?") */}
      <UncertaintyPanel metrics={data.metrics} />
    </div>
  );
};
