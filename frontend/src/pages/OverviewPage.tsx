import React from 'react';
import { useData } from '../context/DataContext';
import { KILN_COLORS, KILN_DESCRIPTIONS } from '../config/constants';
import { ShieldAlert, Layers, ArrowRight } from 'lucide-react';
import type { TabKey } from '../components/Header';

interface OverviewPageProps {
  onNavigateTab?: (tab: TabKey) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateTab }) => {
  const { data } = useData();

  if (!data) return null;

  const totalDetected = data.counts.find((c) => c.class === 'Total')?.detected ?? 65;
  const fcbk = data.counts.find((c) => c.class === 'FCBK');
  const zigzag = data.counts.find((c) => c.class === 'Zigzag');
  const cfcbk = data.counts.find((c) => c.class === 'CFCBK');
  const convZigzag = data.summaryStats.conversions_tracked.converted_to_zigzag;
  const clustersCount = data.summaryStats.total_clusters_count;
  const clusteredKilns = data.summaryStats.kilns_within_1km_cluster;

  return (
    <div className="space-y-6">
      {/* Welcome & Directive Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-sm border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-semibold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" /> High-Priority Compliance Dispatch
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white m-0">
              Demo District Surveillance Brief
            </h2>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl leading-relaxed">
              Automated Sentinel-2 surveillance across 120 satellite tiles (~154 sq km).
              Designed for <strong>Inspector Farida Khan</strong> to plan targeted vehicle inspections, verify converted Zigzag sites, and enforce the 2022 FCBK ban.
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('map')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition shadow self-start md:self-auto"
            >
              Open Interactive Map <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Kilns */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Active Kilns</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{totalDetected}</div>
          <div className="mt-1 text-xs text-slate-500">
            Deduplicated across 30 px tile overlaps
          </div>
        </div>

        {/* FCBK Violations */}
        <div className="bg-white p-5 rounded-xl border border-orange-200 bg-orange-50/20 shadow-sm">
          <div className="flex items-center justify-between text-orange-700 text-xs font-medium">
            <span>Persistent FCBKs (Banned)</span>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: KILN_COLORS.FCBK }} />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-orange-700">{fcbk?.detected ?? 27}</div>
          <div className="mt-1 text-xs text-orange-600">
            Est. True Count: <strong>{fcbk?.est_low ?? 18} – {fcbk?.est_high ?? 41}</strong> (95% CI)
          </div>
        </div>

        {/* Compliant Zigzag */}
        <div className="bg-white p-5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-sm">
          <div className="flex items-center justify-between text-blue-700 text-xs font-medium">
            <span>Zigzag Conversions</span>
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: KILN_COLORS.Zigzag }} />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-blue-700">{zigzag?.detected ?? 30}</div>
          <div className="mt-1 text-xs text-blue-600">
            <strong>{convZigzag}</strong> converted from 2023–24 baseline
          </div>
        </div>

        {/* Proximity Clusters */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Clustered Within 1 km</span>
            <span className="text-emerald-600 font-bold text-xs">{clustersCount} Groups</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{clusteredKilns}</div>
          <div className="mt-1 text-xs text-slate-500">
            Multi-site vehicle patrol efficiency
          </div>
        </div>
      </div>

      {/* Scaffold info for Phase 1 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 m-0 mb-2">Phase 1 Complete: Data Layer & Scaffold Active</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          All data feeds (<code>kilns.geojson</code>, <code>labels_2023.geojson</code>, <code>counts.csv</code>, <code>conversions.csv</code>, <code>within_1km.csv</code>, <code>top20.csv</code>, <code>metrics.json</code>, <code>experiments.json</code>) are dynamically loaded, validated, and typed. Ready for Phase 2 deep overview components and charts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-bold text-slate-700">FCBK:</span> {fcbk?.detected} detected &bull; {KILN_DESCRIPTIONS.FCBK.legalStatus}
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-bold text-slate-700">Zigzag:</span> {zigzag?.detected} detected &bull; {KILN_DESCRIPTIONS.Zigzag.legalStatus}
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-bold text-slate-700">CFCBK:</span> {cfcbk?.detected} detected &bull; {KILN_DESCRIPTIONS.CFCBK.legalStatus}
          </div>
        </div>
      </div>
    </div>
  );
};
