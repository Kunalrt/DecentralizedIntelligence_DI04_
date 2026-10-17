import React from 'react';
import {
  TOKENS,
  Panel,
  StatTile,
  SectionHeader,
  DetailsCollapse,
  SymbolLegend,
  Button,
  Badge,
} from '../design';
import {
  Flame,
  Layers,
  Compass,
  AlertTriangle,
  CheckCircle,
  Database,
  Download,
} from 'lucide-react';

export const StyleguidePage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <SectionHeader
        title="Cartographic Survey Office Design System"
        subtitle="Calm, precise, information-dense survey aesthetic. Strict guidelines: 1px borders, max 4px radius, IBM Plex typography, no AI hype or neon gradients."
        badge={<Badge variant="accent">v2.0 Survey Spec</Badge>}
      />

      {/* 1. Color Palette */}
      <Panel title="Color Tokens & Symbology" subtitle="Neutral canvas, dark ink boundaries, calibrated kiln markers">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <div className="border border-[#D9D6CE] rounded-[4px] p-2 bg-white">
            <div className="h-10 rounded-[2px] bg-[#F5F3EE] border border-[#D9D6CE] mb-2" />
            <div className="font-mono text-xs font-semibold">#F5F3EE</div>
            <div className="text-2xs text-[#656D76]">Canvas Background</div>
          </div>

          <div className="border border-[#D9D6CE] rounded-[4px] p-2 bg-white">
            <div className="h-10 rounded-[2px] bg-white border border-[#D9D6CE] mb-2" />
            <div className="font-mono text-xs font-semibold">#FFFFFF</div>
            <div className="text-2xs text-[#656D76]">Panel Background</div>
          </div>

          <div className="border border-[#D9D6CE] rounded-[4px] p-2 bg-white">
            <div className="h-10 rounded-[2px] bg-[#1F2328] mb-2" />
            <div className="font-mono text-xs font-semibold text-white bg-[#1F2328] px-1 rounded-[2px]">#1F2328</div>
            <div className="text-2xs text-[#656D76]">Charcoal Primary</div>
          </div>

          <div className="border border-[#D9D6CE] rounded-[4px] p-2 bg-white">
            <div className="h-10 rounded-[2px] bg-[#1F4E5F] mb-2" />
            <div className="font-mono text-xs font-semibold text-white bg-[#1F4E5F] px-1 rounded-[2px]">#1F4E5F</div>
            <div className="text-2xs text-[#656D76]">Deep Survey Accent</div>
          </div>

          <div className="border border-[#D9D6CE] rounded-[4px] p-2 bg-white">
            <div className="h-10 rounded-[2px] bg-[#D9D6CE] mb-2" />
            <div className="font-mono text-xs font-semibold">#D9D6CE</div>
            <div className="text-2xs text-[#656D76]">Muted Border Rule</div>
          </div>

          <div className="border border-[#D9D6CE] rounded-[4px] p-2 bg-white">
            <div className="h-10 rounded-[2px] bg-[#14181C] mb-2" />
            <div className="font-mono text-xs font-semibold text-white bg-[#14181C] px-1 rounded-[2px]">#14181C</div>
            <div className="text-2xs text-[#656D76]">Dark Map Canvas</div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#D9D6CE]">
          <div className="text-xs font-semibold text-[#656D76] uppercase tracking-wider mb-2">
            Target Kiln Symbology
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-2.5 bg-[#FAF9F5] border border-[#D9D6CE] rounded-[4px] flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-[#E8710A] flex-shrink-0" />
              <div>
                <div className="font-semibold text-xs text-[#1F2328]">FCBK: #E8710A (Circle)</div>
                <div className="text-2xs text-[#656D76]">Banned under 2022 Mandate</div>
              </div>
            </div>

            <div className="p-2.5 bg-[#FAF9F5] border border-[#D9D6CE] rounded-[4px] flex items-center gap-3">
              <span className="w-4 h-4 rounded-[2px] bg-[#1A73E8] flex-shrink-0" />
              <div>
                <div className="font-semibold text-xs text-[#1F2328]">Zigzag: #1A73E8 (Square)</div>
                <div className="text-2xs text-[#656D76]">Mandate Compliant Clean Draft</div>
              </div>
            </div>

            <div className="p-2.5 bg-[#FAF9F5] border border-[#D9D6CE] rounded-[4px] flex items-center gap-3">
              <span className="inline-block w-0 h-0 border-l-[7px] border-r-[7px] border-b-[12px] border-l-transparent border-r-transparent border-b-[#188038] flex-shrink-0" />
              <div>
                <div className="font-semibold text-xs text-[#1F2328]">CFCBK: #188038 (Triangle)</div>
                <div className="text-2xs text-[#656D76]">Rare Circular (~3%) Heritage</div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* 2. Typography Scale */}
      <Panel title="Typography & Scale" subtitle="IBM Plex Sans for interface, IBM Plex Mono for coordinates/counts, Source Serif 4 for titles">
        <div className="space-y-3 font-sans">
          <div className="flex items-baseline justify-between border-b border-[#D9D6CE] pb-2">
            <span className="font-serif text-xl font-bold">Source Serif 4 - 28px Section Title</span>
            <span className="font-mono text-2xs text-[#656D76]">font-serif text-xl (28px)</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-[#D9D6CE] pb-2">
            <span className="font-sans text-lg font-bold">IBM Plex Sans - 20px Major Heading</span>
            <span className="font-mono text-2xs text-[#656D76]">font-sans text-lg (20px)</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-[#D9D6CE] pb-2">
            <span className="font-sans text-base font-semibold">IBM Plex Sans - 16px Panel Title</span>
            <span className="font-mono text-2xs text-[#656D76]">font-sans text-base (16px)</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-[#D9D6CE] pb-2">
            <span className="font-sans text-sm">IBM Plex Sans - 14px Standard UI Text & Inputs</span>
            <span className="font-mono text-2xs text-[#656D76]">font-sans text-sm (14px)</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-[#D9D6CE] pb-2">
            <span className="font-sans text-xs text-[#656D76]">IBM Plex Sans - 12px Subtitles, tooltips, secondary labels</span>
            <span className="font-mono text-2xs text-[#656D76]">font-sans text-xs (12px)</span>
          </div>
          <div className="flex items-baseline justify-between pb-1">
            <span className="font-mono text-sm font-semibold">IBM Plex Mono - 28.6139° N, 77.2090° E (Count: 65, Score: 0.942)</span>
            <span className="font-mono text-2xs text-[#656D76]">font-mono (Numeric / GIS)</span>
          </div>
        </div>
      </Panel>

      {/* 3. Metric Stat Tiles */}
      <Panel title="Metric Stat Tiles" subtitle="Icon + Big Mono Number + Small Label (Replaces explanatory paragraphs)">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile
            icon={<Flame size={16} strokeWidth={TOKENS.icons.strokeWidth} />}
            value="65"
            label="Total Kilns"
            sublabel="Demo District"
            tooltip="Physical unique kilns after 300 m cross-tile deduplication"
          />
          <StatTile
            icon={<AlertTriangle size={16} strokeWidth={TOKENS.icons.strokeWidth} />}
            value="27"
            label="FCBK Violations"
            sublabel="Range: 18 - 41"
            accentColor="#E8710A"
            tooltip="Oval fixed-chimney kilns banned under Central Pollution Control Board mandate"
          />
          <StatTile
            icon={<CheckCircle size={16} strokeWidth={TOKENS.icons.strokeWidth} />}
            value="30"
            label="Converted Zigzag"
            sublabel="33 tracked"
            accentColor="#1A73E8"
            tooltip="Rectangular zigzag draft kilns operating in full legal compliance"
          />
          <StatTile
            icon={<Layers size={16} strokeWidth={TOKENS.icons.strokeWidth} />}
            value="51"
            label="1 km Clusters"
            sublabel="18 patrol groups"
            accentColor="#1F4E5F"
            tooltip="Kilns located within 1.0 km of another kiln, optimized for single patrol dispatch"
          />
        </div>
      </Panel>

      {/* 4. Action Buttons & Badges */}
      <Panel title="Interactive Controls & Badges" subtitle="Buttons, chips, status tags, and symbol legend">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" icon={<Compass size={14} strokeWidth={1.5} />}>
              Map New Area
            </Button>
            <Button variant="secondary" icon={<Download size={14} strokeWidth={1.5} />}>
              Export GeoJSON
            </Button>
            <Button variant="outline" icon={<Database size={14} strokeWidth={1.5} />}>
              Download Package
            </Button>
            <Button variant="danger" icon={<AlertTriangle size={14} strokeWidth={1.5} />}>
              Clear Data
            </Button>
            <Button variant="ghost" size="sm">
              Dismiss
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#D9D6CE]">
            <Badge variant="neutral">EPSG:4326</Badge>
            <Badge variant="accent">UTM Zone 43N</Badge>
            <Badge variant="warning">Resampled 10 m/px</Badge>
            <Badge variant="danger">Unconverted FCBK</Badge>
            <Badge variant="success">Compliant</Badge>
            <Badge variant="outline">Derived Footprint</Badge>
          </div>

          <div className="pt-2 border-t border-[#D9D6CE]">
            <SymbolLegend horizontal showGeo />
          </div>
        </div>
      </Panel>

      {/* 5. Collapsible Caveats & Details */}
      <Panel title="Collapsible Details & Honest Limits" subtitle="Deep technical notes accessible on demand without visual clutter">
        <div className="space-y-2">
          <DetailsCollapse summary="Honest Uncertainty & Bootstrap Confidence Intervals (95% CI)" count="3 Classes">
            <div className="space-y-1.5 text-xs text-[#656D76]">
              <p className="m-0">
                Satellite counts are mathematically adjusted by held-out test precision and recall:
                <strong className="text-[#1F2328] font-mono"> True Estimate = (Detections × Precision) / Recall</strong>.
              </p>
              <p className="m-0 font-mono text-2xs">
                FCBK: 27 detected → Est 28 [18, 41] | Zigzag: 30 detected → Est 31 [20, 45] | CFCBK: 8 detected → Est 8 [3, 13].
              </p>
            </div>
          </DetailsCollapse>

          <DetailsCollapse summary="Systemic Machine Learning & Remote Sensing Limits" count="4 Constraints">
            <ul className="list-disc list-inside space-y-1 text-xs text-[#656D76] m-0">
              <li>10 m/pixel resolution cannot inspect internal combustion chambers or fuel feeds.</li>
              <li>Atmospheric haze, seasonal cloud cover, and brick dust alter radiometric reflectance.</li>
              <li>Temporary operational shutdowns look identical to permanently closed sites.</li>
              <li>All satellite alerts require ground truth field patrol verification prior to sanction.</li>
            </ul>
          </DetailsCollapse>
        </div>
      </Panel>
    </div>
  );
};
