import React from 'react';
import { Panel, SectionHeader, Button, Badge } from '../design';
import {
  Upload,
  Layers,
  MapPin,
  Play,
  FileCode,
  Image as ImageIcon,
  Crosshair,
  Info,
} from 'lucide-react';

export const MapAreaPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <SectionHeader
        title="Custom Area Ingestion & Survey Mapping"
        subtitle="Upload your district boundary, Sentinel-2 GeoTIFF imagery, or detection points. Automated 10 m/px verification, rotated OBB inference, and OpenStreetMap context enrichment."
        badge={<Badge variant="accent">Geo-Studio v2.0</Badge>}
      />

      {/* Three Step Workflow Indicator */}
      <div className="grid grid-cols-3 gap-2 bg-white border border-[#D9D6CE] rounded-[4px] p-2 text-xs font-mono">
        <div className="flex items-center gap-2 p-2 bg-[#FAF9F5] border-l-2 border-[#1F4E5F] font-semibold text-[#1F4E5F]">
          <Upload size={16} strokeWidth={1.5} />
          <span>1. Upload</span>
        </div>
        <div className="flex items-center gap-2 p-2 text-[#656D76]">
          <Layers size={16} strokeWidth={1.5} />
          <span>2. Process</span>
        </div>
        <div className="flex items-center gap-2 p-2 text-[#656D76]">
          <MapPin size={16} strokeWidth={1.5} />
          <span>3. Explore</span>
        </div>
      </div>

      {/* Upload Dropzones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Boundary Dropzone */}
        <Panel
          title="Boundary"
          subtitle="GeoJSON, KML, or Shapefile zip"
          badge={<Badge variant="outline">Optional</Badge>}
        >
          <div className="border border-dashed border-[#D9D6CE] rounded-[4px] p-6 text-center bg-[#FAF9F5] hover:bg-[#F5F3EE] transition-colors cursor-pointer">
            <FileCode size={28} strokeWidth={1.5} className="mx-auto text-[#1F4E5F] mb-2" />
            <div className="text-xs font-semibold text-[#1F2328]">Drop Boundary File</div>
            <div className="text-2xs text-[#656D76] mt-1">.geojson, .json, .kml, .zip</div>
          </div>
        </Panel>

        {/* Imagery Dropzone */}
        <Panel
          title="Imagery"
          subtitle="Sentinel-2 GeoTIFF / COG (10 m/px)"
          badge={<Badge variant="outline">Optional</Badge>}
        >
          <div className="border border-dashed border-[#D9D6CE] rounded-[4px] p-6 text-center bg-[#FAF9F5] hover:bg-[#F5F3EE] transition-colors cursor-pointer">
            <ImageIcon size={28} strokeWidth={1.5} className="mx-auto text-[#1F4E5F] mb-2" />
            <div className="text-xs font-semibold text-[#1F2328]">Drop GeoTIFF Raster</div>
            <div className="text-2xs text-[#656D76] mt-1">.tif, .tiff (with valid CRS)</div>
          </div>
        </Panel>

        {/* Detections Dropzone */}
        <Panel
          title="Detections"
          subtitle="Existing candidate kiln coords"
          badge={<Badge variant="outline">Optional</Badge>}
        >
          <div className="border border-dashed border-[#D9D6CE] rounded-[4px] p-6 text-center bg-[#FAF9F5] hover:bg-[#F5F3EE] transition-colors cursor-pointer">
            <Crosshair size={28} strokeWidth={1.5} className="mx-auto text-[#1F4E5F] mb-2" />
            <div className="text-xs font-semibold text-[#1F2328]">Drop Points / CSV</div>
            <div className="text-2xs text-[#656D76] mt-1">.csv (class, lat, lon) or .geojson</div>
          </div>
        </Panel>
      </div>

      {/* Action Bar */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="primary" icon={<Play size={14} strokeWidth={1.5} />}>
              Run Ingestion Pipeline
            </Button>
            <Button variant="secondary" icon={<Layers size={14} strokeWidth={1.5} />}>
              Load Example Data
            </Button>
          </div>

          <div className="flex items-center gap-2 text-2xs text-[#656D76]">
            <Info size={14} strokeWidth={1.5} />
            <span>Uploads processed in memory / temporary session. Deleted after 1 hour. Max 100 MB per file.</span>
          </div>
        </div>
      </Panel>
    </div>
  );
};
