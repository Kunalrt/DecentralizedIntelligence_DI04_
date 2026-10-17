import React, { useState } from 'react';
import { KILN_COLORS, KILN_DESCRIPTIONS } from '../../config/constants';
import type { KilnProperties, HistoricalLabelProperties } from '../../types/data';
import {
  X,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Crosshair,
  Compass,
} from 'lucide-react';
import { Button } from '../../design';

interface KilnDetailDrawerProps {
  kiln: KilnProperties | null;
  historicalMatch?: HistoricalLabelProperties | null;
  onClose: () => void;
  onCenterOnMap: (lat: number, lon: number) => void;
}

export const KilnDetailDrawer: React.FC<KilnDetailDrawerProps> = ({
  kiln,
  historicalMatch,
  onClose,
  onCenterOnMap,
}) => {
  const [copied, setCopied] = useState(false);

  if (!kiln) return null;

  const color =
    kiln.class === 'FCBK'
      ? KILN_COLORS.FCBK
      : kiln.class === 'Zigzag'
      ? KILN_COLORS.Zigzag
      : KILN_COLORS.CFCBK;

  const coordString =
    kiln.lat != null && kiln.lon != null
      ? `${kiln.lat.toFixed(5)}, ${kiln.lon.toFixed(5)}`
      : 'n/a';

  const handleCopy = () => {
    navigator.clipboard.writeText(coordString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isFcbk = kiln.class === 'FCBK';
  const isZigzag = kiln.class === 'Zigzag';
  const kilnId = kiln.id || kiln.kiln_id || 'n/a';
  const kilnClass = kiln.class || 'n/a';

  return (
    <div className="absolute top-3 right-3 z-[1000] w-80 sm:w-96 bg-white rounded-[4px] shadow-map border border-[#D9D6CE] overflow-hidden flex flex-col max-h-[calc(100%-1.5rem)] font-mono text-xs">
      {/* Top Accent Stripe */}
      <div className="h-1 w-full" style={{ backgroundColor: color }} />

      {/* Header */}
      <div className="p-3.5 pb-2.5 border-b border-[#D9D6CE] flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="font-bold text-[#656D76] uppercase text-2xs">
              {kilnId}
            </span>
          </div>
          <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
            {kilnClass} Kiln
          </h3>
          <p className="text-2xs text-[#656D76] m-0 font-sans">
            {KILN_DESCRIPTIONS[kiln.class]?.legalStatus || 'Active Industrial Kiln'}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-[#656D76] hover:text-[#1F2328] hover:bg-[#FAF9F5]"
          aria-label="Close Inspector Drawer"
        >
          <X size={15} strokeWidth={1.5} />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-3.5 space-y-3 overflow-y-auto">
        {/* Compliance Status Alert Box */}
        {isFcbk ? (
          <div className="p-2.5 rounded-[2px] bg-[#FFF7ED] border border-[#FDBA74] text-[#E8710A] space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-2xs">
              <AlertTriangle size={13} strokeWidth={1.5} className="flex-shrink-0" />
              <span>Persistent 2022 Ban Violation</span>
            </div>
            <p className="text-2xs text-[#9A3412] leading-relaxed m-0 font-sans">
              Natural-draft FCBK. Priority inspection target.
            </p>
          </div>
        ) : isZigzag ? (
          <div className="p-2.5 rounded-[2px] bg-[#EFF6FF] border border-[#93C5FD] text-[#1A73E8] space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-2xs">
              <CheckCircle2 size={13} strokeWidth={1.5} className="flex-shrink-0" />
              <span>Compliant Forced-Draft Retrofit</span>
            </div>
            <p className="text-2xs text-[#1E40AF] leading-relaxed m-0 font-sans">
              {kiln.converted
                ? 'Converted from 2023 FCBK baseline. Lower particulate emissions.'
                : 'Modern zigzag channel layout compliant with norms.'}
            </p>
          </div>
        ) : (
          <div className="p-2.5 rounded-[2px] bg-[#F0FDF4] border border-[#86EFAC] text-[#188038] space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-2xs">
              <ShieldCheck size={13} strokeWidth={1.5} className="flex-shrink-0" />
              <span>Circular Bull&rsquo;s Trench Design</span>
            </div>
            <p className="text-2xs text-[#166534] leading-relaxed m-0 font-sans">
              Circular configuration (~12% prevalence). High certainty.
            </p>
          </div>
        )}

        {/* Copyable Coordinates */}
        <div className="bg-[#FAF9F5] p-2.5 rounded-[2px] border border-[#D9D6CE] space-y-1">
          <div className="flex items-center justify-between text-[#656D76] font-semibold text-2xs">
            <span className="flex items-center gap-1">
              <MapPin size={12} strokeWidth={1.5} className="text-[#1F4E5F]" /> Coordinates
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-2xs font-semibold text-[#1F4E5F] hover:underline"
            >
              {copied ? (
                <>
                  <Check size={11} strokeWidth={2} className="text-[#16A34A]" />
                  <span className="text-[#16A34A]">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={11} strokeWidth={1.5} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="text-[#1F2328] text-xs font-bold select-all bg-white px-2 py-1 rounded-[2px] border border-[#D9D6CE]">
            {coordString}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-2xs">
          <div className="p-2 rounded-[2px] border border-[#D9D6CE] bg-[#FAF9F5]">
            <div className="text-[#656D76]">Confidence Score</div>
            <div className="text-sm font-bold text-[#1F2328] mt-0.5">
              {kiln.score != null ? `${(kiln.score * 100).toFixed(1)}%` : '-'}
            </div>
            <div className="w-full bg-[#D9D6CE] h-1 rounded-[1px] mt-1 overflow-hidden">
              <div
                className="h-full rounded-[1px]"
                style={{
                  width: `${Math.min(100, Math.max(10, (kiln.score ?? 0) * 100))}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>

          <div className="p-2 rounded-[2px] border border-[#D9D6CE] bg-[#FAF9F5]">
            <div className="text-[#656D76]">Spatial Cluster</div>
            <div className="text-sm font-bold text-[#1F2328] mt-0.5 truncate">
              {kiln.cluster_id || '-'}
            </div>
            <div className="text-[#656D76] mt-0.5">
              {kiln.near_1km ? '&le; 1.0 km neighbor' : 'Isolated site'}
            </div>
          </div>
        </div>

        {/* Operational Note */}
        {kiln.why && (
          <div className="p-2 rounded-[2px] border border-[#D9D6CE] bg-[#FAF9F5] space-y-0.5">
            <div className="flex items-center gap-1 text-2xs font-semibold text-[#1F2328]">
              <Compass size={12} strokeWidth={1.5} className="text-[#1F4E5F]" />
              <span>Field Inspection Note</span>
            </div>
            <p className="text-[#656D76] text-2xs leading-relaxed m-0 font-sans">{kiln.why}</p>
          </div>
        )}

        {/* Historical 2023 Correlation */}
        {historicalMatch && (
          <div className="p-2 rounded-[2px] border border-[#D9D6CE] bg-[#FAF9F5] space-y-0.5">
            <div className="text-2xs font-semibold text-[#1F2328]">
              2023–24 Baseline Match
            </div>
            <div className="text-2xs text-[#656D76]">
              Site: <strong>{historicalMatch.id || historicalMatch.kiln_id || '-'}</strong> (
              {historicalMatch.distance_to_historical_m != null
                ? `${historicalMatch.distance_to_historical_m.toFixed(1)} m gap`
                : 'Exact match'}
              )
            </div>
          </div>
        )}
      </div>

      {/* Drawer Action Buttons Footer */}
      <div className="p-2.5 border-t border-[#D9D6CE] bg-[#FAF9F5] flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={<Crosshair size={13} strokeWidth={1.5} />}
          onClick={() => onCenterOnMap(kiln.lat ?? 0, kiln.lon ?? 0)}
          className="flex-1"
        >
          Center Map
        </Button>

        <a
          href={`https://www.openstreetmap.org/?mlat=${kiln.lat ?? 0}&mlon=${kiln.lon ?? 0}#map=16/${kiln.lat ?? 0}/${kiln.lon ?? 0}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-[#1F4E5F] text-white rounded-[2px] text-xs font-mono font-medium hover:bg-[#163B48] transition-colors shadow-xs"
        >
          <ExternalLink size={13} strokeWidth={1.5} />
          <span>OSM</span>
        </a>
      </div>
    </div>
  );
};
