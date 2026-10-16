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
    setTimeout(() => setCopied(false), 2000);
  };

  const isFcbk = kiln.class === 'FCBK';
  const isZigzag = kiln.class === 'Zigzag';
  const kilnId = kiln.id || kiln.kiln_id || 'n/a';
  const kilnClass = kiln.class || 'n/a';

  return (
    <div className="absolute top-4 right-4 z-[1000] w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[calc(100%-2rem)] animate-in fade-in slide-in-from-right duration-200">
      {/* Top Accent Stripe */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="font-mono text-xs font-bold text-slate-500 uppercase">
              {kilnId}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 m-0">
            {kilnClass} Kiln
          </h3>
          <p className="text-xs text-slate-500 m-0">
            {KILN_DESCRIPTIONS[kiln.class]?.legalStatus || 'Active Industrial Kiln'}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Close Inspector Drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-4 space-y-4 overflow-y-auto text-xs">
        {/* Compliance Status Alert Box */}
        {isFcbk ? (
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-orange-800">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <span>Persistent 2022 Ban Violation</span>
            </div>
            <p className="text-[11px] text-orange-700 leading-relaxed m-0">
              Operating prohibited natural-draft FCBK. High enforcement priority for Inspector Farida Khan&rsquo;s team.
            </p>
          </div>
        ) : isZigzag ? (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-blue-800">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Compliant Forced-Draft Retrofit</span>
            </div>
            <p className="text-[11px] text-blue-700 leading-relaxed m-0">
              {kiln.converted
                ? 'Successfully converted from baseline 2023 FCBK site. Reduced particulate emissions.'
                : 'Modern zigzag channel layout compliant with statutory pollution control norms.'}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Circular Bull&rsquo;s Trench Design</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed m-0">
              Distinct circular configuration (~12% of district kilns). High detection certainty.
            </p>
          </div>
        )}

        {/* Copyable Coordinates */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px]">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-primary" /> GPS Coordinates
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:text-blue-700 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="font-mono text-slate-800 text-xs font-bold select-all bg-white px-2.5 py-1.5 rounded border border-slate-200">
            {coordString}
          </div>
        </div>

        {/* Metrics Grid: Score & Cluster */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Model Confidence */}
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
            <div className="text-[11px] text-slate-500 font-medium">Confidence Score</div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              {kiln.score != null ? `${(kiln.score * 100).toFixed(1)}%` : 'n/a'}
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(10, (kiln.score ?? 0) * 100))}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>

          {/* Cluster ID */}
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
            <div className="text-[11px] text-slate-500 font-medium">Spatial Cluster</div>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
              {kiln.cluster_id || 'n/a'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {kiln.near_1km ? 'Within 1.0 km neighbor' : 'Isolated site'}
            </div>
          </div>
        </div>

        {/* Operational Why & Inspection Reason */}
        {kiln.why && (
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <span>Field Inspection Rationale</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed m-0">{kiln.why || 'n/a'}</p>
          </div>
        )}

        {/* Historical 2023 Correlation */}
        {historicalMatch && (
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="text-[11px] font-semibold text-slate-700">
              2023–24 Baseline Association
            </div>
            <div className="text-[11px] text-slate-600">
              Matched Site: <strong>{historicalMatch.id || historicalMatch.kiln_id || 'n/a'}</strong> (
              {historicalMatch.distance_to_historical_m != null
                ? `${historicalMatch.distance_to_historical_m.toFixed(1)} m gap`
                : 'Exact match'}
              )
            </div>
            <div className="text-[10px] text-slate-500 italic">
              Status: {historicalMatch.status || 'n/a'}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Action Buttons Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
        <button
          onClick={() => onCenterOnMap(kiln.lat ?? 0, kiln.lon ?? 0)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 transition shadow-xs"
        >
          <Crosshair className="w-3.5 h-3.5 text-brand-primary" />
          <span>Center Map</span>
        </button>

        <a
          href={`https://www.openstreetmap.org/?mlat=${kiln.lat ?? 0}&mlon=${kiln.lon ?? 0}#map=16/${kiln.lat ?? 0}/${kiln.lon ?? 0}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-primary text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition shadow-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>OSM View</span>
        </a>
      </div>
    </div>
  );
};
