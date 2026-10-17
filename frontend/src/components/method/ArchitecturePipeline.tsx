import React from 'react';
import {
  Satellite,
  Cpu,
  Layers,
  Filter,
  Network,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Badge } from '../../design';

export const ArchitecturePipeline: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Sentinel-2 RGB Nadir',
      subtitle: '10 m/px nadir optical tiles',
      desc: '128x128 px tiles with 30 px overlap margin across 120 satellite tiles (~154 km²).',
      icon: <Satellite size={16} strokeWidth={1.5} className="text-[#1F4E5F]" />,
      tag: 'Input Data',
    },
    {
      num: '02',
      title: 'Tile Inference (OBB)',
      subtitle: 'Rotated bounding box head',
      desc: 'Predicts oriented boxes (cx, cy, w, h, θ) for FCBK, Zigzag, CFCBK.',
      icon: <Cpu size={16} strokeWidth={1.5} className="text-[#1A73E8]" />,
      tag: 'Inference',
    },
    {
      num: '03',
      title: 'Rotated NMS (IoU 0.50)',
      subtitle: 'Exact polygon IoU',
      desc: 'Suppresses intra-tile redundant boxes while preserving adjacent dense kilns.',
      icon: <Filter size={16} strokeWidth={1.5} className="text-[#1F4E5F]" />,
      tag: 'NMS',
    },
    {
      num: '04',
      title: 'Tile Deduplication',
      subtitle: '30 px overlap & 15 m merge',
      desc: 'Merges boundary kilns captured in adjacent tiles into unique physical kilns.',
      icon: <Layers size={16} strokeWidth={1.5} className="text-[#188038]" />,
      tag: 'Deduplication',
    },
    {
      num: '05',
      title: 'Spatial Clustering (1 km)',
      subtitle: 'Vehicle proximity hulls',
      desc: 'Identifies kilns grouped in clusters with <= 1.0 km neighbor gaps.',
      icon: <Network size={16} strokeWidth={1.5} className="text-[#E8710A]" />,
      tag: 'Clustering',
    },
    {
      num: '06',
      title: 'Compliance & Export',
      subtitle: 'Priority ranking & reports',
      desc: 'Classifies legal status, matches 2023 baseline, exports GPX, KML, and PDF.',
      icon: <FileText size={16} strokeWidth={1.5} className="text-[#1F4E5F]" />,
      tag: 'Export',
    },
  ];

  return (
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#D9D6CE]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
              <Layers size={15} strokeWidth={1.5} />
            </span>
            <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
              End-to-End System Pipeline
            </h3>
          </div>
          <p className="text-2xs text-[#656D76] font-mono m-0 mt-0.5">
            From raw Sentinel-2 constellation passes to verified field survey outputs.
          </p>
        </div>
        <Badge variant="accent">6 Pipeline Stages</Badge>
      </div>

      {/* Responsive Pipeline Stepper Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {steps.map((step) => (
          <div
            key={step.num}
            className="p-3 rounded-[4px] border border-[#D9D6CE] bg-[#FAF9F5] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5 font-mono">
                <span className="text-2xs font-semibold px-1.5 py-0.2 rounded-[2px] bg-white border border-[#D9D6CE] text-[#1F4E5F]">
                  {step.tag}
                </span>
                <span className="text-2xs font-bold text-[#656D76]">
                  {step.num}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded-[2px] bg-white border border-[#D9D6CE]">{step.icon}</div>
                <div>
                  <h4 className="text-xs font-serif font-bold text-[#1F2328] m-0 leading-tight">
                    {step.title}
                  </h4>
                  <div className="text-2xs font-mono text-[#656D76]">
                    {step.subtitle}
                  </div>
                </div>
              </div>

              <p className="text-2xs text-[#656D76] leading-relaxed mt-1 m-0 font-sans">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Technical Summary Strip */}
      <div className="p-2.5 bg-[#FAF9F5] rounded-[2px] border border-[#D9D6CE] text-2xs font-mono text-[#656D76] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={13} strokeWidth={1.5} className="text-[#16A34A] flex-shrink-0" />
          <span>Throughput: ~151 tiles/sec &bull; 8,000-tile extrapolation: 52.8 s</span>
        </div>
        <div>Zero data leakage: spatial grouping isolates all 30 px tile overlap regions</div>
      </div>
    </div>
  );
};
