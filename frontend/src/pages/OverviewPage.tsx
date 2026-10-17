import React from 'react';
import { useData } from '../context/DataContext';
import { KILN_COLORS } from '../config/constants';
import type { TabKey } from '../components/Header';
import { KpiCard } from '../components/overview/KpiCard';
import { UncertaintyPanel } from '../components/overview/UncertaintyPanel';
import { CountsComparisonChart } from '../components/overview/CountsComparisonChart';
import { PrecisionRecallTable } from '../components/overview/PrecisionRecallTable';
import { InspectorActionCard } from '../components/overview/InspectorActionCard';
import { SectionHeader, Badge } from '../design';
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

  const totalDetected = totalRow?.detected ?? data.summaryStats?.unique_physical_kilns ?? 20;
  const fcbkDetected = fcbkRow?.detected ?? 8;
  const zigzagDetected = zigzagRow?.detected ?? 9;
  const cfcbkDetected = cfcbkRow?.detected ?? 3;

  const convZigzag = data.summaryStats?.conversions_tracked?.converted_to_zigzag ?? 0;
  const unconvertedFcbk = data.summaryStats?.conversions_tracked?.unconverted_fcbk_violations ?? fcbkDetected;
  const clustersCount = data.summaryStats?.total_clusters_count ?? (data.clusters?.length ?? 0);
  const clusteredKilns = data.summaryStats?.kilns_within_1km_cluster ?? (data.within1km?.length ?? 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Section Header */}
      <SectionHeader
        title="District Surveillance Overview"
        subtitle="Automated satellite inventory across 3,000 km² Demo District based on 10 m/px Sentinel-2 imagery."
        badge={<Badge variant="accent">Registry 2026</Badge>}
      />

      {/* 1. Inspector Farida Khan Operational Dispatch Banner */}
      <InspectorActionCard
        clusteredKilns={clusteredKilns}
        totalClusters={clustersCount}
        convertedZigzag={convZigzag}
        unconvertedViolations={unconvertedFcbk}
        onNavigateTab={onNavigateTab}
      />

      {/* 2. Primary KPI Cards Grid (5 Cards: Total, FCBK, Zigzag, CFCBK, Clusters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* Total Kilns */}
        <KpiCard
          title="Total Kilns"
          value={totalDetected}
          rangeText={`${totalRow?.est_low ?? 42} – ${totalRow?.est_high ?? 100}`}
          subtitle="Deduplicated in 120 tiles"
          icon={<Layers size={16} strokeWidth={1.5} />}
          accentBorderColor="#656D76"
        />

        {/* FCBK Violations */}
        <KpiCard
          title="FCBK (Banned)"
          value={fcbkDetected}
          rangeText={`${fcbkRow?.est_low ?? 18} – ${fcbkRow?.est_high ?? 41}`}
          badge={{ text: 'Illegal Draft', variant: 'warning' }}
          colorSwatch={KILN_COLORS.FCBK}
          accentBorderColor={KILN_COLORS.FCBK}
          subtitle="Priority vehicle targets"
          icon={<Flame size={16} strokeWidth={1.5} className="text-[#E8710A]" />}
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
          subtitle="Forced-draft retrofits"
          icon={<CheckCircle2 size={16} strokeWidth={1.5} className="text-[#1A73E8]" />}
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
          subtitle="Circular Bull's Trench"
          icon={<CircleDot size={16} strokeWidth={1.5} className="text-[#188038]" />}
          onClick={onNavigateTab ? () => onNavigateTab('map') : undefined}
        />

        {/* Clustered for Jeep Patrol */}
        <KpiCard
          title="1 km Clusters"
          value={clusteredKilns}
          unit="kilns"
          badge={{ text: `${clustersCount} Clusters`, variant: 'neutral' }}
          accentBorderColor="#1F4E5F"
          subtitle="Within 1.0 km neighbor gap"
          icon={<Navigation size={16} strokeWidth={1.5} className="text-[#1F4E5F]" />}
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
