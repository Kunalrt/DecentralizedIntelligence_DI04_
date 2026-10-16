import React from 'react';
import {
  Download,
  FileText,
  Map,
  Database,
  FileSpreadsheet,
  Compass,
} from 'lucide-react';
import { exportTop20ToGpx } from '../../utils/exportUtils';
import { useData } from '../../context/DataContext';

export const DownloadPackageCards: React.FC = () => {
  const { data } = useData();

  const getAssetUrl = (path: string): string => {
    const baseUrl = import.meta.env.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${cleanBase}${cleanPath}`;
  };

  const handleDownloadGpx = () => {
    if (data?.top20) {
      exportTop20ToGpx(data.top20);
    }
  };

  const downloadPackages = [
    {
      id: 'pdf-brief',
      name: "Inspector Farida Khan's Brief (2 Pages)",
      file: 'data/inspector_brief.pdf',
      desc: 'Official 2-page brief with street map, counts, honest ranges, and prioritized field inspection roster.',
      size: '405 KB',
      format: 'PDF',
      updated: 'October 2026',
      icon: <FileText className="w-5 h-5 text-red-500" />,
      tagColor: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      id: 'geojson-kilns',
      name: 'Active Kilns Vector Polygons',
      file: 'data/kilns.geojson',
      desc: 'All 65 deduplicated physical kilns as rotated oriented bounding box (OBB) polygons with coordinates and scores.',
      size: '64.7 KB',
      format: 'GeoJSON',
      updated: 'October 2026',
      icon: <Database className="w-5 h-5 text-emerald-600" />,
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'geojson-baseline',
      name: '2023–24 Baseline FCBK Sites',
      file: 'data/labels_2023.geojson',
      desc: '45 historical baseline coordinates with conversion tracking status and current spatial associations.',
      size: '29.1 KB',
      format: 'GeoJSON',
      updated: 'October 2026',
      icon: <Database className="w-5 h-5 text-blue-600" />,
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'csv-counts',
      name: 'Per-Class Counts & Honest Confidence Ranges',
      file: 'data/counts.csv',
      desc: 'Total active kilns by category (FCBK, Zigzag, CFCBK) with low-high 95% confidence intervals and validation metrics.',
      size: '250 B',
      format: 'CSV',
      updated: 'October 2026',
      icon: <FileSpreadsheet className="w-5 h-5 text-amber-600" />,
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'csv-top20',
      name: 'Ranked Top 20 Priority Targets',
      file: 'data/top20.csv',
      desc: 'Field verification roster ranked by illegal operation, confidence score, and proximity cluster density.',
      size: '2.2 KB',
      format: 'CSV',
      updated: 'October 2026',
      icon: <FileSpreadsheet className="w-5 h-5 text-orange-600" />,
      tagColor: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      id: 'csv-conversions',
      name: 'Baseline Conversion Matrix',
      file: 'data/conversions.csv',
      desc: 'Complete tracking of all 45 baseline FCBKs: 18 converted to Zigzag, 15 persistent FCBK violations, 12 inactive/unclear.',
      size: '6.1 KB',
      format: 'CSV',
      updated: 'October 2026',
      icon: <FileSpreadsheet className="w-5 h-5 text-blue-600" />,
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'csv-within1km',
      name: 'Clustered Kilns Within 1 km',
      file: 'data/within_1km.csv',
      desc: '51 kilns situated within 1.0 km of adjacent sites, with nearest-neighbor gaps and cluster group IDs.',
      size: '4.0 KB',
      format: 'CSV',
      updated: 'October 2026',
      icon: <FileSpreadsheet className="w-5 h-5 text-purple-600" />,
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'csv-clusters',
      name: '18 Spatial Proximity Clusters Summary',
      file: 'data/clusters_summary.csv',
      desc: 'Summary of the 18 vehicle patrol clusters with center coordinates, maximum internal gap, and kiln counts.',
      size: '1.1 KB',
      format: 'CSV',
      updated: 'October 2026',
      icon: <FileSpreadsheet className="w-5 h-5 text-indigo-600" />,
      tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'png-map',
      name: 'Cartographic Surveillance Map (High-Res)',
      file: 'data/map.png',
      desc: 'Publication-quality cartographic district map with plain street background, legend, scale bar & north arrow.',
      size: '327 KB',
      format: 'PNG (300 DPI)',
      updated: 'October 2026',
      icon: <Map className="w-5 h-5 text-purple-600" />,
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'gpx-waypoints',
      name: 'Top 20 GPS Waypoints File',
      isDynamicGpx: true,
      desc: 'Standard GPS exchange format (GPX) with Top 20 target coordinates for Garmin handhelds, OsmAnd, or phone GPS.',
      size: '~3.5 KB',
      format: 'GPX',
      updated: 'Live Export',
      icon: <Compass className="w-5 h-5 text-blue-600" />,
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 m-0">
          Complete Surveillance Package Downloads
        </h3>
        <p className="text-xs text-slate-500 m-0 mt-0.5">
          All analytical outputs, geospatial layers, and tabular data generated for the Demo District.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {downloadPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                    {pkg.icon}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 m-0 leading-snug">
                      {pkg.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${pkg.tagColor}`}
                      >
                        {pkg.format}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {pkg.size}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed m-0">
                {pkg.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {pkg.updated}
              </span>

              {pkg.isDynamicGpx ? (
                <button
                  onClick={handleDownloadGpx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download GPX
                </button>
              ) : (
                <a
                  href={getAssetUrl(pkg.file || '')}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
