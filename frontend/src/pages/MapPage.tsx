import React from 'react';
import { useData } from '../context/DataContext';
import { MapPin, Info } from 'lucide-react';
import { KILN_SHAPES, MAP_CONFIG } from '../config/constants';

export const MapPage: React.FC = () => {
  const { data } = useData();

  const totalKilns = data?.kilns.features.length ?? 0;
  const historicalCount = data?.labels2023.features.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-primary" />
            Interactive Spatial Surveillance Map
          </h2>
          <p className="text-xs text-slate-500 m-0">
            OpenStreetMap standard vector tiles &bull; {totalKilns} active kiln detections &bull; {historicalCount} baseline 2023–24 sites
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="text-orange-500 font-bold">{KILN_SHAPES.FCBK.symbol}</span>
            <span>FCBK ({data?.counts.find((c) => c.class === 'FCBK')?.detected ?? 0})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-blue-500 font-bold">{KILN_SHAPES.Zigzag.symbol}</span>
            <span>Zigzag ({data?.counts.find((c) => c.class === 'Zigzag')?.detected ?? 0})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">{KILN_SHAPES.CFCBK.symbol}</span>
            <span>CFCBK ({data?.counts.find((c) => c.class === 'CFCBK')?.detected ?? 0})</span>
          </div>
        </div>
      </div>

      {/* Map Shell Placeholder for Phase 1 */}
      <div className="bg-slate-100 rounded-xl border border-slate-300 h-[650px] relative overflow-hidden flex flex-col items-center justify-center text-center p-6 shadow-inner">
        <div className="w-16 h-16 rounded-full bg-blue-100 text-brand-primary flex items-center justify-center mb-4 shadow">
          <MapPin className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 m-0">Phase 1 Scaffold Ready</h3>
        <p className="text-sm text-slate-600 max-w-md mt-2">
          Leaflet core configured with OpenStreetMap tile provider (<code>{MAP_CONFIG.tileLayerUrl}</code>).
          Marker clustering, 1 km proximity circles, layer toggles, and conversion trace lines will be fully activated in <strong>Phase 3</strong>.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white border border-slate-200 text-xs font-mono text-slate-700 shadow-sm">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>Center: [{MAP_CONFIG.defaultCenter.join(', ')}] &bull; Zoom: {MAP_CONFIG.defaultZoom}</span>
        </div>
      </div>
    </div>
  );
};
