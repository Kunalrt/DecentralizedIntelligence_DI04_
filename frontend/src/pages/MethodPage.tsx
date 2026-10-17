import React from 'react';
import { useData } from '../context/DataContext';
import { ArchitecturePipeline } from '../components/method/ArchitecturePipeline';
import { ExperimentsTable } from '../components/method/ExperimentsTable';
import { DatasetCitationCard } from '../components/method/DatasetCitationCard';
import { HonestLimitations } from '../components/method/HonestLimitations';
import { KILN_COLORS } from '../config/constants';
import { SectionHeader, StatTile, Badge } from '../design';
import { Trophy, Flame, CheckCircle2, CircleDot } from 'lucide-react';

export const MethodPage: React.FC = () => {
  const { data } = useData();

  if (!data) return null;

  const metrics = data.metrics;
  const experiments = data.experiments;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Page Header */}
      <SectionHeader
        title="Methodology, Architecture & Experimental Evidence"
        subtitle="YOLO11s-OBB trained on Sentinel-2 10 m nadir optical imagery with rotated bounding box heads."
        badge={<Badge variant="accent">IoU &ge; 0.50 Benchmark</Badge>}
      />

      {/* Top Metrics Summary Grid (4 Tiles) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatTile
          icon={<Trophy size={16} strokeWidth={1.5} className="text-[#16A34A]" />}
          value={`${(metrics.mAP * 100).toFixed(2)}%`}
          label="Macro mAP@0.5"
          sublabel="Rotated IoU"
          tooltip="Exact continuous DOTA-style rotated bounding box evaluation metric."
        />
        <StatTile
          icon={<Flame size={16} strokeWidth={1.5} className="text-[#E8710A]" />}
          value={`${(metrics.AP_FCBK * 100).toFixed(1)}%`}
          label="FCBK AP"
          sublabel="Oval Trench"
          colorSwatch={KILN_COLORS.FCBK}
          tooltip="Average precision on illegal Fixed Chimney Bull's Trench kilns."
        />
        <StatTile
          icon={<CheckCircle2 size={16} strokeWidth={1.5} className="text-[#1A73E8]" />}
          value={`${(metrics.AP_Zigzag * 100).toFixed(1)}%`}
          label="Zigzag AP"
          sublabel="Rectangular Draft"
          colorSwatch={KILN_COLORS.Zigzag}
          tooltip="Average precision on compliant forced/natural-draft Zigzag designs."
        />
        <StatTile
          icon={<CircleDot size={16} strokeWidth={1.5} className="text-[#188038]" />}
          value={`${(metrics.AP_CFCBK * 100).toFixed(1)}%`}
          label="CFCBK AP"
          sublabel="Circular Trench"
          colorSwatch={KILN_COLORS.CFCBK}
          tooltip="Average precision on legacy Circular Bull's Trench designs."
        />
      </div>

      {/* 1. End-to-End Architecture Stepper */}
      <ArchitecturePipeline />

      {/* 2. 10-Experiment Progression Table */}
      <ExperimentsTable experiments={experiments} />

      {/* 3. Systemic ML & Remote Sensing Limitations */}
      <HonestLimitations />

      {/* 4. Official Benchmark & Dataset Citation Card */}
      <DatasetCitationCard />
    </div>
  );
};
