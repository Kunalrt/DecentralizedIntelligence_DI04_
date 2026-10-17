import React from 'react';
import { HelpCircle, AlertCircle, Compass, Microscope } from 'lucide-react';
import type { MetricsData } from '../../types/data';
import { Badge, DetailsCollapse, StatTile } from '../../design';

interface UncertaintyPanelProps {
  metrics: MetricsData;
}

export const UncertaintyPanel: React.FC<UncertaintyPanelProps> = ({ metrics }) => {
  return (
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#D9D6CE]">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
            <HelpCircle size={15} strokeWidth={1.5} />
          </span>
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
              Model Uncertainty & Field Constraints
            </h3>
            <p className="text-2xs text-[#656D76] font-mono m-0">
              Statistical boundaries and physical limits for verification patrols.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" icon={<Microscope size={12} strokeWidth={1.5} />}>
            Macro mAP: {(metrics.mAP * 100).toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* 3 Metric Tiles with Tooltips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <StatTile
          icon={<Compass size={16} strokeWidth={1.5} />}
          value="10 m/px"
          label="Ground Resolution"
          sublabel="Sentinel-2 Optical"
          tooltip="At 10 m resolution, an average 30-45 m kiln spans 3 to 5 pixels. Oval trenches and shadows are clear, but small artisanal clamps can blend into dry soil."
        />
        <StatTile
          icon={<AlertCircle size={16} strokeWidth={1.5} />}
          value="2023 → 2026"
          label="Domain Shift"
          sublabel="Seasonal Soil Baseline"
          tooltip="Trained on 2023-24 tiles. Deploying on 2025-26 imagery introduces seasonal soil moisture variation and newer hybrid kiln retrofits."
        />
        <StatTile
          icon={<HelpCircle size={16} strokeWidth={1.5} />}
          value="95% CI"
          label="Statistical Bounds"
          sublabel="Poisson Error Margins"
          tooltip="Ranges (e.g. 18-41 FCBK) reflect empirical false positive and false negative rates from test benchmarks."
        />
      </div>

      {/* Collapsible Detailed Field Caveats */}
      <DetailsCollapse summary="Technical Caveats & Uncertainty Explanations">
        <div className="text-xs text-[#1F2328] font-sans space-y-2 pt-1">
          <div>
            <strong>1. Nadir Spatial Limitation:</strong> The 10 m ground sampling distance resolves main kiln bodies and chimneys but cannot discern internal combustion brick stacking or active flame temperature.
          </div>
          <div>
            <strong>2. Partial Retrofits:</strong> Conversions from FCBK to Zigzag often alter only internal draft channels while retaining legacy exterior boundaries. Field verification remains necessary for borderline cases.
          </div>
          <div>
            <strong>3. Weather & Cloud Shadow:</strong> Monsoon moisture alters surface reflectance; all inference uses L2A surface reflectance tiles with &lt;10% cloud threshold.
          </div>
        </div>
      </DetailsCollapse>
    </div>
  );
};
