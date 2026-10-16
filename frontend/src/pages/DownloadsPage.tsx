import React from 'react';
import { Download, FileText, Map, Database, FileSpreadsheet } from 'lucide-react';

export const DownloadsPage: React.FC = () => {
  const downloadItems = [
    {
      name: "Inspector's Brief PDF (2 Pages)",
      file: 'data/inspector_brief.pdf',
      desc: 'Official Platypus brief prepared for Inspector Farida Khan with tables and map.',
      icon: <FileText className="w-5 h-5 text-red-500" />,
      size: '~405 KB',
      format: 'PDF',
    },
    {
      name: 'Kilns Vector Layer (GeoJSON)',
      file: 'data/kilns.geojson',
      desc: 'All 65 active kilns with OBB polygons, coordinates, confidence, and ranking.',
      icon: <Database className="w-5 h-5 text-emerald-500" />,
      size: '~65 KB',
      format: 'GeoJSON',
    },
    {
      name: '2023–24 Baseline Layer (GeoJSON)',
      file: 'data/labels_2023.geojson',
      desc: '45 historical FCBK sites with conversion status and current spatial matches.',
      icon: <Database className="w-5 h-5 text-blue-500" />,
      size: '~29 KB',
      format: 'GeoJSON',
    },
    {
      name: 'Ranked Top 20 Inspections (CSV)',
      file: 'data/top20.csv',
      desc: 'Actionable dispatch priority order with transparent scores and rationale.',
      icon: <FileSpreadsheet className="w-5 h-5 text-amber-500" />,
      size: '~2.2 KB',
      format: 'CSV',
    },
    {
      name: 'Kilns Within 1 km Proximity (CSV)',
      file: 'data/within_1km.csv',
      desc: '51 clustered kilns organized into 18 localized inspection groups.',
      icon: <FileSpreadsheet className="w-5 h-5 text-amber-500" />,
      size: '~4.0 KB',
      format: 'CSV',
    },
    {
      name: 'Cartographic Surveillance Map (PNG)',
      file: 'data/map.png',
      desc: 'High-res cartographic map with legend, north arrow, and 5 km scale bar.',
      icon: <Map className="w-5 h-5 text-purple-500" />,
      size: '~327 KB',
      format: 'PNG (300 DPI)',
    },
  ];

  const getFullUrl = (path: string) => {
    const baseUrl = import.meta.env.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${cleanBase}${path}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0 flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" />
            Downloads & Exportable Surveillance Packages
          </h2>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Export raw geospatial layers, official briefs, and tabular inspection targets for offline field use
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {downloadItems.map((item) => (
          <div
            key={item.file}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">{item.icon}</div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">{item.name}</h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      {item.format} &bull; {item.size}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">{item.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Last updated: October 2026</span>
              <a
                href={getFullUrl(item.file)}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
