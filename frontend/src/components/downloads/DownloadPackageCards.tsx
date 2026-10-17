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
import { Badge, Button } from '../../design';

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
      icon: <FileText size={16} strokeWidth={1.5} className="text-[#1F4E5F]" />,
    },
    {
      id: 'geojson-kilns',
      name: 'Active Kilns Vector Polygons',
      file: 'data/kilns.geojson',
      desc: 'All 65 deduplicated physical kilns as rotated oriented bounding box (OBB) polygons with coordinates and scores.',
      size: '64.7 KB',
      format: 'GeoJSON',
      updated: 'October 2026',
      icon: <Database size={16} strokeWidth={1.5} className="text-[#188038]" />,
    },
    {
      id: 'geojson-baseline',
      name: '2023–24 Baseline FCBK Sites',
      file: 'data/labels_2023.geojson',
      desc: '45 historical baseline coordinates with conversion tracking status and current spatial associations.',
      size: '29.1 KB',
      format: 'GeoJSON',
      updated: 'October 2026',
      icon: <Database size={16} strokeWidth={1.5} className="text-[#1A73E8]" />,
    },
    {
      id: 'csv-counts',
      name: 'Per-Class Counts & Confidence Ranges',
      file: 'data/counts.csv',
      desc: 'Total active kilns by category with 95% confidence intervals and validation metrics.',
      size: '250 B',
      format: 'CSV',
      updated: 'October 2026',
      icon: <FileSpreadsheet size={16} strokeWidth={1.5} className="text-[#E8710A]" />,
    },
    {
      id: 'csv-top20',
      name: 'Ranked Top 20 Priority Targets',
      file: 'data/top20.csv',
      desc: 'Field verification roster ranked by illegal operation, confidence score, and proximity cluster density.',
      size: '2.2 KB',
      format: 'CSV',
      updated: 'October 2026',
      icon: <FileSpreadsheet size={16} strokeWidth={1.5} className="text-[#E8710A]" />,
    },
    {
      id: 'csv-conversions',
      name: 'Baseline Conversion Matrix',
      file: 'data/conversions.csv',
      desc: 'Tracking of all 45 baseline FCBKs: 18 converted to Zigzag, 15 persistent FCBK violations, 12 inactive/unclear.',
      size: '6.1 KB',
      format: 'CSV',
      updated: 'October 2026',
      icon: <FileSpreadsheet size={16} strokeWidth={1.5} className="text-[#1A73E8]" />,
    },
    {
      id: 'csv-within1km',
      name: 'Clustered Kilns Within 1 km',
      file: 'data/within_1km.csv',
      desc: '51 kilns situated within 1.0 km of adjacent sites, with nearest-neighbor gaps and cluster group IDs.',
      size: '4.0 KB',
      format: 'CSV',
      updated: 'October 2026',
      icon: <FileSpreadsheet size={16} strokeWidth={1.5} className="text-[#1F4E5F]" />,
    },
    {
      id: 'csv-clusters',
      name: '18 Spatial Proximity Clusters Summary',
      file: 'data/clusters_summary.csv',
      desc: 'Summary of the 18 vehicle patrol clusters with center coordinates, maximum internal gap, and kiln counts.',
      size: '1.1 KB',
      format: 'CSV',
      updated: 'October 2026',
      icon: <FileSpreadsheet size={16} strokeWidth={1.5} className="text-[#1F4E5F]" />,
    },
    {
      id: 'png-map',
      name: 'Cartographic Surveillance Map (High-Res)',
      file: 'data/map.png',
      desc: 'Publication-quality cartographic district map with plain street background, legend, scale bar & north arrow.',
      size: '327 KB',
      format: 'PNG (300 DPI)',
      updated: 'October 2026',
      icon: <Map size={16} strokeWidth={1.5} className="text-[#1F4E5F]" />,
    },
    {
      id: 'gpx-waypoints',
      name: 'Top 20 GPS Waypoints File',
      isDynamicGpx: true,
      desc: 'Standard GPS exchange format (GPX) with Top 20 target coordinates for Garmin handhelds or phone GPS.',
      size: '~3.5 KB',
      format: 'GPX',
      updated: 'Live Export',
      icon: <Compass size={16} strokeWidth={1.5} className="text-[#1A73E8]" />,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#D9D6CE]">
        <div>
          <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
            Surveillance Data Packages
          </h3>
          <p className="text-2xs text-[#656D76] font-mono m-0 mt-0.5">
            Geospatial vector layers, tabular priority rosters, and field report artifacts.
          </p>
        </div>
        <Badge variant="accent">10 Packages</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {downloadPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white p-3 rounded-[4px] border border-[#D9D6CE] shadow-xs hover:border-[#1F4E5F] transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE]">
                    {pkg.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-serif font-bold text-[#1F2328] m-0 leading-snug">
                      {pkg.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 font-mono text-2xs">
                      <span className="px-1 py-0.2 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F] font-semibold">
                        {pkg.format}
                      </span>
                      <span className="text-[#656D76]">
                        {pkg.size}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-2xs text-[#656D76] mt-2 leading-relaxed m-0 font-sans">
                {pkg.desc}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-[#D9D6CE]/60 flex items-center justify-between font-mono text-2xs">
              <span className="text-[#656D76]">
                {pkg.updated}
              </span>

              {pkg.isDynamicGpx ? (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Download size={12} strokeWidth={1.5} />}
                  onClick={handleDownloadGpx}
                >
                  Download GPX
                </Button>
              ) : (
                <a
                  href={getAssetUrl(pkg.file || '')}
                  download
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1F4E5F] hover:bg-[#163B48] text-white rounded-[2px] text-xs font-mono font-medium transition-colors shadow-xs"
                >
                  <Download size={12} strokeWidth={1.5} />
                  <span>Download</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
