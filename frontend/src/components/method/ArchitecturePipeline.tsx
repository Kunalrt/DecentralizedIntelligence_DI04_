import React from 'react';
import {
  Satellite,
  Cpu,
  Layers,
  Filter,
  Network,
  CheckCircle2,
  FileText,
  ArrowRight,
} from 'lucide-react';

export const ArchitecturePipeline: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Sentinel-2 RGB Nadir',
      subtitle: '10 m/pixel nadir optical tiles',
      desc: '128x128 px tiles with 30 px overlap margin across 120 satellite tiles (~154 sq km).',
      icon: <Satellite className="w-5 h-5 text-blue-500" />,
      tag: 'Input Data',
      color: 'border-blue-300 bg-blue-50/40 text-blue-900',
    },
    {
      num: '02',
      title: 'Tile Inference (YOLO11s-OBB)',
      subtitle: 'Upscaled 256 px resolution',
      desc: 'Rotated bounding box head (cx, cy, w, h, angle) predicting FCBK, Zigzag, CFCBK.',
      icon: <Cpu className="w-5 h-5 text-indigo-500" />,
      tag: 'Deep Learning',
      color: 'border-indigo-300 bg-indigo-50/40 text-indigo-900',
    },
    {
      num: '03',
      title: 'Rotated NMS (IoU 0.50)',
      subtitle: 'Exact Shapely polygon IoU',
      desc: 'Suppresses intra-tile redundant boxes while preserving adjacent dense kilns.',
      icon: <Filter className="w-5 h-5 text-purple-500" />,
      tag: 'Post-Process',
      color: 'border-purple-300 bg-purple-50/40 text-purple-900',
    },
    {
      num: '04',
      title: 'Cross-Tile Deduplication',
      subtitle: '30 px overlap & 35 m merge',
      desc: 'Merges boundary kilns captured in adjacent tiles into 65 unique physical kilns.',
      icon: <Layers className="w-5 h-5 text-emerald-500" />,
      tag: 'Spatial Merge',
      color: 'border-emerald-300 bg-emerald-50/40 text-emerald-900',
    },
    {
      num: '05',
      title: 'Spatial Clustering (1 km)',
      subtitle: 'Vehicle proximity hulls',
      desc: 'Identifies 51 kilns grouped in 18 clusters with <= 1.0 km neighbor gaps.',
      icon: <Network className="w-5 h-5 text-amber-500" />,
      tag: 'Spatial Analytics',
      color: 'border-amber-300 bg-amber-50/40 text-amber-900',
    },
    {
      num: '06',
      title: 'Compliance Scorer & Brief',
      subtitle: 'Priority ranking & exports',
      desc: 'Classifies legal status, matches 2023 baseline, scores Top 20, and exports GPX/Brief.',
      icon: <FileText className="w-5 h-5 text-rose-500" />,
      tag: 'Enforcement Output',
      color: 'border-rose-300 bg-rose-50/40 text-rose-900',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-primary" />
          <h3 className="text-base font-bold text-slate-900 m-0">
            End-to-End System Architecture Pipeline
          </h3>
        </div>
        <p className="text-xs text-slate-500 m-0 mt-0.5">
          From raw Sentinel-2 constellation passes to Inspector Farida Khan&rsquo;s actionable field dashboard.
        </p>
      </div>

      {/* Responsive Pipeline Stepper Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {steps.map((step, idx) => (
          <div
            key={step.num}
            className={`relative p-4 rounded-xl border ${step.color} shadow-xs flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/90 border border-current shadow-xs">
                  {step.tag}
                </span>
                <span className="font-mono text-xs font-extrabold text-slate-400">
                  Step {step.num}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-white shadow-xs">{step.icon}</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0 leading-tight">
                    {step.title}
                  </h4>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {step.subtitle}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed mt-2 m-0">
                {step.desc}
              </p>
            </div>

            {idx < steps.length - 1 && (
              <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 p-1 bg-white rounded-full border border-slate-200 shadow-xs text-slate-400">
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Technical Summary Strip */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            <strong>Inference Throughput:</strong> ~151 tiles/sec &bull; Extrapolated 8,000-tile runtime: <strong>52.8 s</strong> (vs 900 s T4 budget).
          </span>
        </div>
        <div className="text-[11px] text-slate-500 italic">
          Zero data leakage: spatial grouping isolates all 30 px tile overlap regions.
        </div>
      </div>
    </div>
  );
};
