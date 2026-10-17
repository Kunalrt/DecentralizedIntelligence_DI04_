import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  CircleMarker,
  ScaleControl,
  ImageOverlay,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Compass,
  Download,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Search,
  Eye,
  Sliders,
  Flame,
  Route,
  Activity,
  AlertTriangle,
  FileText,
  Table as TableIcon,
  Map as MapIcon,
  Image as ImageIcon,
  Share2,
  ArrowUpDown,
} from 'lucide-react';
import type { IngestResult } from '../../services/ingestApi';
import { getExportDownloadUrl } from '../../services/ingestApi';
import { TOKENS, StatTile, Badge, Button, DetailsCollapse } from '../../design';

interface ExploreResultViewProps {
  result: IngestResult;
  onClearData: () => void;
}

// Controller to handle fit bounds and programmatic navigation
function MapViewController({
  bounds,
  flyTarget,
}: {
  bounds: L.LatLngBoundsExpression | null;
  flyTarget: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (flyTarget) {
      map.flyTo(flyTarget, 16, { animate: true, duration: 0.8 });
    } else if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30], animate: true });
    }
  }, [bounds, flyTarget, map]);

  return null;
}

// Cursor coordinate tracker
function CursorTracker({
  onCoordinatesChange,
}: {
  onCoordinatesChange: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    mousemove(e) {
      onCoordinatesChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const ExploreResultView: React.FC<ExploreResultViewProps> = ({
  result,
  onClearData,
}) => {
  const { summary, boundary, kilns, roads, water, session_id, is_example, banner } = result;

  // View Mode: Map or Table
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');

  // Background Mode: Street (OSM), Blank, Your Imagery
  const [basemapMode, setBasemapMode] = useState<'osm' | 'blank' | 'imagery'>('osm');

  // Layer Toggles
  const [showBoundary, setShowBoundary] = useState(true);
  const [showKilns, setShowKilns] = useState(true);
  const [showFCBK, setShowFCBK] = useState(true);
  const [showZigzag, setShowZigzag] = useState(true);
  const [showCFCBK, setShowCFCBK] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showWater, setShowWater] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [showImagery, setShowImagery] = useState(true);
  const [imageryOpacity, setImageryOpacity] = useState(0.85);

  // Before/After Split Slider
  const [sliderActive, setSliderActive] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50); // percentage 0-100
  const isDraggingSplit = useRef(false);

  // Interactive Selection
  const [selectedKiln, setSelectedKiln] = useState<any | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sorting in Table view
  const [sortKey, setSortKey] = useState<string>('kiln_id');
  const [sortAsc, setSortAsc] = useState(true);

  // Map container reference for fullscreen
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Map Bounds calculation
  const mapBounds = useMemo((): L.LatLngBoundsExpression | null => {
    const bbox = summary.boundary.bbox;
    if (bbox && bbox.length === 4) {
      return [
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]],
      ];
    }
    return null;
  }, [summary.boundary.bbox]);

  // Boundary coordinates formatted for Leaflet
  const boundaryLatLngs = useMemo(() => {
    const feat = boundary.features[0];
    if (!feat || !feat.geometry) return [];
    if (feat.geometry.type === 'Polygon') {
      return (feat.geometry.coordinates[0] || []).map((c: any) => [c[1], c[0]] as [number, number]);
    }
    return [];
  }, [boundary]);

  // Filtered & Sorted Kilns
  const visibleKilns = useMemo(() => {
    if (!showKilns) return [];
    const list = kilns.features.filter((f: any) => {
      const cls = f.properties?.class;
      if (cls === 'FCBK' && !showFCBK) return false;
      if (cls === 'Zigzag' && !showZigzag) return false;
      if (cls === 'CFCBK' && !showCFCBK) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = (f.properties?.kiln_id || '').toLowerCase().includes(q);
        const clsMatch = (f.properties?.class || '').toLowerCase().includes(q);
        if (!idMatch && !clsMatch) return false;
      }
      return true;
    });

    return [...list].sort((a: any, b: any) => {
      const pa = a.properties || {};
      const pb = b.properties || {};
      let valA = pa[sortKey];
      let valB = pb[sortKey];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [kilns, showKilns, showFCBK, showZigzag, showCFCBK, searchQuery, sortKey, sortAsc]);

  // Handle Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim().toLowerCase();

    // Check if coordinates "lat, lon"
    const parts = q.split(/[\s,]+/).map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setFlyTarget([parts[0], parts[1]]);
      return;
    }

    // Check kiln ID
    const match = kilns.features.find((f: any) =>
      (f.properties?.kiln_id || '').toLowerCase().includes(q)
    );
    if (match && match.properties) {
      setSelectedKiln(match.properties);
      setFlyTarget([match.properties.lat, match.properties.lon]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 1500);
  };

  const copyShareableUrl = () => {
    const url = new URL(window.location.href);
    if (selectedKiln) {
      url.searchParams.set('kiln', selectedKiln.kiln_id);
    }
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const downloadGeoJsonBundle = () => {
    const bundle = {
      type: 'FeatureCollection',
      features: [
        ...boundary.features,
        ...kilns.features,
        ...roads.features,
        ...water.features,
      ],
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-${session_id}-bundle.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMapPng = () => {
    // If backend preview exists, download directly; otherwise generate canvas export
    const previewUrl = `http://localhost:8000/ingest/${session_id}/preview.png`;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.target = '_blank';
    a.download = `survey-${session_id}-2x-map.png`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Example Data Banner */}
      {is_example && (
        <div className="bg-[#FAF9F5] border-l-4 border-[#1F4E5F] p-3 text-xs text-[#1F2328] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1F4E5F]" />
            <span className="font-semibold">{banner || 'Example data (Demo District Verification Package)'}</span>
          </div>
          <Badge variant="outline">Verified Fixture</Badge>
        </div>
      )}

      {/* Top Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatTile
          icon={<Compass size={16} strokeWidth={TOKENS.icons.strokeWidth} />}
          value={`${summary.boundary.area_km2}`}
          label="Area km²"
          sublabel={summary.boundary.utm_zone}
          tooltip="Calculated in local UTM coordinate system"
        />
        <StatTile
          icon={<Route size={16} strokeWidth={TOKENS.icons.strokeWidth} />}
          value={`${summary.boundary.perimeter_km}`}
          label="Perimeter km"
          sublabel="Survey boundary"
          tooltip="Geodesic perimeter along survey boundary"
        />
        <StatTile
          icon={<Flame size={16} strokeWidth={TOKENS.icons.strokeWidth} />}
          value={summary.kilns.total}
          label="Total Kilns"
          sublabel={`${summary.kilns.by_class.FCBK} FCBK / ${summary.kilns.by_class.Zigzag} ZZ`}
          tooltip="Validated kilns inside survey boundary"
        />
        <StatTile
          icon={<Activity size={16} strokeWidth={TOKENS.icons.strokeWidth} />}
          value={`${summary.kilns.density_per_km2}`}
          label="Density / km²"
          sublabel="Avg intensity"
          tooltip="Kilns per square kilometer across survey area"
        />
        <StatTile
          icon={<Route size={16} strokeWidth={TOKENS.icons.strokeWidth} />}
          value={`${summary.infrastructure.total_road_km}`}
          label="Road km"
          sublabel="OSM clipped"
          tooltip="Total road length clipped to boundary"
        />
        <StatTile
          icon={<AlertTriangle size={16} strokeWidth={TOKENS.icons.strokeWidth} />}
          value={summary.kilns.flagged_within_1km}
          label="Flagged 1km"
          sublabel={`${summary.kilns.clusters_count} clusters`}
          accentColor="#E8710A"
          tooltip="Kilns located within 1.0 km of another kiln"
        />
      </div>

      {/* View Switcher & Global Toolbar */}
      <div className="bg-white border border-[#D9D6CE] rounded-[4px] p-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: View Mode & Search */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-[2px] border border-[#D9D6CE] p-0.5 bg-[#FAF9F5]">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] font-medium transition-colors ${
                viewMode === 'map' ? 'bg-[#1F4E5F] text-white shadow-xs' : 'text-[#656D76] hover:text-[#1F2328]'
              }`}
            >
              <MapIcon size={14} strokeWidth={1.5} />
              <span>Map Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] font-medium transition-colors ${
                viewMode === 'table' ? 'bg-[#1F4E5F] text-white shadow-xs' : 'text-[#656D76] hover:text-[#1F2328]'
              }`}
            >
              <TableIcon size={14} strokeWidth={1.5} />
              <span>Kiln Table ({visibleKilns.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search ID or lat, lon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-3 py-1 bg-white border border-[#D9D6CE] rounded-[2px] text-xs font-mono w-48 focus:outline-none focus:ring-1 focus:ring-[#1F4E5F]"
            />
            <Search size={13} strokeWidth={1.5} className="absolute left-2 top-2 text-[#656D76]" />
          </form>
        </div>

        {/* Center: Background Switcher (Segmented Control) */}
        <div className="flex items-center gap-1 font-mono text-2xs">
          <span className="text-[#656D76] uppercase tracking-wider mr-1">Basemap:</span>
          <div className="inline-flex rounded-[2px] border border-[#D9D6CE] p-0.5 bg-[#FAF9F5]">
            <button
              type="button"
              onClick={() => setBasemapMode('osm')}
              className={`px-2 py-0.5 rounded-[2px] font-medium transition-colors ${
                basemapMode === 'osm' ? 'bg-white text-[#1F2328] border border-[#D9D6CE]' : 'text-[#656D76]'
              }`}
            >
              Street (OSM)
            </button>
            <button
              type="button"
              onClick={() => setBasemapMode('blank')}
              className={`px-2 py-0.5 rounded-[2px] font-medium transition-colors ${
                basemapMode === 'blank' ? 'bg-white text-[#1F2328] border border-[#D9D6CE]' : 'text-[#656D76]'
              }`}
            >
              Blank
            </button>
            {summary.imagery.present && (
              <button
                type="button"
                onClick={() => setBasemapMode('imagery')}
                className={`px-2 py-0.5 rounded-[2px] font-medium transition-colors ${
                  basemapMode === 'imagery' ? 'bg-white text-[#1F2328] border border-[#D9D6CE]' : 'text-[#656D76]'
                }`}
              >
                Your Imagery
              </button>
            )}
          </div>
        </div>

        {/* Right: Export Menu, Share URL & Clear Data */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={copyShareableUrl}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] border border-[#D9D6CE] bg-white text-[#1F2328] hover:bg-[#FAF9F5] text-xs font-mono"
            title="Shareable URL state"
          >
            {copiedLink ? <Check size={13} strokeWidth={2} className="text-[#16A34A]" /> : <Share2 size={13} strokeWidth={1.5} />}
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={downloadMapPng}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] border border-[#D9D6CE] bg-white text-[#1F2328] hover:bg-[#FAF9F5] text-xs font-mono"
            title="Download 2x PNG Map"
          >
            <ImageIcon size={13} strokeWidth={1.5} />
            <span>PNG</span>
          </button>
          <button
            type="button"
            onClick={downloadGeoJsonBundle}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] border border-[#D9D6CE] bg-white text-[#1F2328] hover:bg-[#FAF9F5] text-xs font-mono"
            title="Download GeoJSON Bundle"
          >
            <Download size={13} strokeWidth={1.5} />
            <span>GeoJSON</span>
          </button>
          <a
            href={getExportDownloadUrl(session_id, 'kml')}
            download
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] border border-[#D9D6CE] bg-white text-[#1F2328] hover:bg-[#FAF9F5] text-xs font-mono"
            title="Export KML"
          >
            <span>KML</span>
          </a>
          <a
            href={getExportDownloadUrl(session_id, 'gpx')}
            download
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] border border-[#D9D6CE] bg-white text-[#1F2328] hover:bg-[#FAF9F5] text-xs font-mono"
            title="Export GPX"
          >
            <span>GPX</span>
          </a>
          <a
            href={getExportDownloadUrl(session_id, 'pdf')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] border border-[#D9D6CE] bg-[#1F4E5F] text-white hover:bg-[#163B48] text-xs font-mono"
            title="Download 1-Page PDF Site Report"
          >
            <FileText size={13} strokeWidth={1.5} />
            <span>PDF</span>
          </a>
          <Button variant="danger" size="sm" onClick={onClearData}>
            Clear Data
          </Button>
        </div>
      </div>

      {/* Main Studio Area */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* LEFT: Layer Panel */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white border border-[#D9D6CE] rounded-[4px] p-3 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#D9D6CE]">
                <div className="flex items-center gap-1.5 font-bold font-serif text-sm text-[#1F2328]">
                  <Layers size={16} strokeWidth={1.5} />
                  <span>Survey Layers</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowBoundary(true);
                    setShowKilns(true);
                    setShowFCBK(true);
                    setShowZigzag(true);
                    setShowCFCBK(true);
                    setShowRoads(true);
                    setShowWater(true);
                    setShowClusters(true);
                    setShowImagery(true);
                  }}
                  className="text-2xs font-mono text-[#1F4E5F] hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={11} strokeWidth={1.5} />
                  <span>Reset</span>
                </button>
              </div>

              {/* Layer Rows */}
              <div className="space-y-2">
                {/* 1. Kilns Parent Layer */}
                <div className="border border-[#D9D6CE]/80 rounded-[2px] p-2 bg-[#FAF9F5]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showKilns}
                        onChange={(e) => setShowKilns(e.target.checked)}
                        className="rounded-[2px] text-[#1F4E5F] focus:ring-0"
                      />
                      <span className="font-semibold text-[#1F2328]">Kilns</span>
                    </label>
                    <Badge variant="accent">{summary.kilns.total}</Badge>
                  </div>

                  {/* Sub-classes */}
                  {showKilns && (
                    <div className="pl-5 space-y-1 pt-1 border-t border-[#D9D6CE]/50 text-2xs font-mono">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#E8710A] inline-block" />
                          <input
                            type="checkbox"
                            checked={showFCBK}
                            onChange={(e) => setShowFCBK(e.target.checked)}
                            className="hidden"
                          />
                          <span className={showFCBK ? 'text-[#1F2328]' : 'text-[#656D76] line-through'}>
                            FCBK (Circle)
                          </span>
                        </span>
                        <span className="text-[#656D76]">{summary.kilns.by_class.FCBK}</span>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-[1px] bg-[#1A73E8] inline-block" />
                          <input
                            type="checkbox"
                            checked={showZigzag}
                            onChange={(e) => setShowZigzag(e.target.checked)}
                            className="hidden"
                          />
                          <span className={showZigzag ? 'text-[#1F2328]' : 'text-[#656D76] line-through'}>
                            Zigzag (Square)
                          </span>
                        </span>
                        <span className="text-[#656D76]">{summary.kilns.by_class.Zigzag}</span>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-[#188038]" />
                          <input
                            type="checkbox"
                            checked={showCFCBK}
                            onChange={(e) => setShowCFCBK(e.target.checked)}
                            className="hidden"
                          />
                          <span className={showCFCBK ? 'text-[#1F2328]' : 'text-[#656D76] line-through'}>
                            CFCBK (Triangle)
                          </span>
                        </span>
                        <span className="text-[#656D76]">{summary.kilns.by_class.CFCBK}</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 2. Boundary */}
                <div className="flex items-center justify-between p-2 border border-[#D9D6CE]/80 rounded-[2px] bg-white">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBoundary}
                      onChange={(e) => setShowBoundary(e.target.checked)}
                      className="rounded-[2px] text-[#1F4E5F] focus:ring-0"
                    />
                    <span className="w-3 h-0 border-t-2 border-dashed border-[#1F2328]" />
                    <span className="font-medium text-[#1F2328]">Boundary</span>
                  </label>
                  {summary.boundary.derived && <Badge variant="warning">Derived</Badge>}
                </div>

                {/* 3. Roads */}
                <div className="flex items-center justify-between p-2 border border-[#D9D6CE]/80 rounded-[2px] bg-white">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRoads}
                      onChange={(e) => setShowRoads(e.target.checked)}
                      className="rounded-[2px] text-[#1F4E5F] focus:ring-0"
                    />
                    <span className="w-3 h-0.5 bg-[#475569]" />
                    <span className="font-medium text-[#1F2328]">Roads (OSM)</span>
                  </label>
                  <span className="font-mono text-2xs text-[#656D76]">{summary.infrastructure.total_road_km} km</span>
                </div>

                {/* 4. Waterways */}
                <div className="flex items-center justify-between p-2 border border-[#D9D6CE]/80 rounded-[2px] bg-white">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showWater}
                      onChange={(e) => setShowWater(e.target.checked)}
                      className="rounded-[2px] text-[#1F4E5F] focus:ring-0"
                    />
                    <span className="w-3 h-1 bg-[#6BA4B8] rounded-[1px]" />
                    <span className="font-medium text-[#1F2328]">Waterways</span>
                  </label>
                  <span className="font-mono text-2xs text-[#656D76]">{summary.infrastructure.waterways_count}</span>
                </div>

                {/* 5. 1km Clusters */}
                <div className="flex items-center justify-between p-2 border border-[#D9D6CE]/80 rounded-[2px] bg-white">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showClusters}
                      onChange={(e) => setShowClusters(e.target.checked)}
                      className="rounded-[2px] text-[#1F4E5F] focus:ring-0"
                    />
                    <span className="w-3 h-3 rounded-full border border-amber-600 bg-amber-200/50" />
                    <span className="font-medium text-[#1F2328]">1 km Clusters</span>
                  </label>
                  <Badge variant="warning">{summary.kilns.clusters_count}</Badge>
                </div>

                {/* 6. Your Imagery with Opacity Slider */}
                {summary.imagery.present && (
                  <div className="border border-[#D9D6CE]/80 rounded-[2px] p-2 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showImagery}
                          onChange={(e) => setShowImagery(e.target.checked)}
                          className="rounded-[2px] text-[#1F4E5F] focus:ring-0"
                        />
                        <span className="font-medium text-[#1F2328]">Your Imagery</span>
                      </label>
                      {summary.imagery.resampled && <Badge variant="warning">Resampled</Badge>}
                    </div>
                    {showImagery && (
                      <div className="flex items-center gap-2 text-2xs font-mono">
                        <Sliders size={12} strokeWidth={1.5} className="text-[#656D76]" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={imageryOpacity}
                          onChange={(e) => setImageryOpacity(parseFloat(e.target.value))}
                          className="w-full accent-[#1F4E5F] h-1 bg-[#D9D6CE] rounded-[2px]"
                        />
                        <span>{(imageryOpacity * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Before/After Split Mode Toggle */}
              {summary.imagery.present && (
                <div className="pt-2 border-t border-[#D9D6CE]">
                  <button
                    type="button"
                    onClick={() => setSliderActive(!sliderActive)}
                    className={`w-full py-1.5 px-2 rounded-[2px] text-xs font-mono flex items-center justify-center gap-2 border transition-colors ${
                      sliderActive
                        ? 'bg-[#1F4E5F] text-white border-[#1F4E5F]'
                        : 'bg-[#FAF9F5] text-[#1F2328] border-[#D9D6CE] hover:bg-[#F5F3EE]'
                    }`}
                  >
                    <Sliders size={13} strokeWidth={1.5} />
                    <span>{sliderActive ? 'Exit Compare Mode' : 'Before / After Slider'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Selected Kiln Details Card / Popover */}
            {selectedKiln && (
              <div className="bg-white border border-[#D9D6CE] rounded-[4px] p-3 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#D9D6CE] pb-1.5">
                  <div className="font-mono font-bold text-sm text-[#1F2328]">
                    {selectedKiln.kiln_id}
                  </div>
                  <Badge
                    variant={
                      selectedKiln.class === 'FCBK'
                        ? 'danger'
                        : selectedKiln.class === 'Zigzag'
                        ? 'success'
                        : 'warning'
                    }
                  >
                    {selectedKiln.class}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-1.5 font-mono text-2xs">
                  <div>Confidence:</div>
                  <div className="text-right font-bold text-[#1F2328]">
                    {(selectedKiln.score * 100).toFixed(1)}%
                  </div>

                  <div>Coordinates:</div>
                  <div className="text-right text-[#1F2328]">
                    {selectedKiln.lat.toFixed(5)}°, {selectedKiln.lon.toFixed(5)}°
                  </div>

                  <div>Nearest Road:</div>
                  <div className="text-right text-[#1F2328]">
                    {selectedKiln.road_dist_m ? `${selectedKiln.road_dist_m} m` : 'N/A'}
                  </div>

                  <div>1 km Cluster:</div>
                  <div className="text-right text-[#1F2328]">
                    {selectedKiln.near_1km ? selectedKiln.cluster_id : 'Isolated'}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  icon={copiedCoords ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.5} />}
                  onClick={() => copyToClipboard(`${selectedKiln.lat.toFixed(6)}, ${selectedKiln.lon.toFixed(6)}`)}
                >
                  {copiedCoords ? 'Copied to Clipboard' : 'Copy Coordinates'}
                </Button>
              </div>
            )}
          </div>

          {/* CENTRE: Map Container */}
          <div
            ref={mapContainerRef}
            className={`lg:col-span-3 relative bg-[#14181C] border border-[#D9D6CE] rounded-[4px] overflow-hidden min-h-[560px] h-[650px] shadow-sm ${
              isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none' : ''
            }`}
          >
            <MapContainer
              center={[summary.boundary.centroid[1], summary.boundary.centroid[0]]}
              zoom={13}
              preferCanvas={true}
              className="w-full h-full"
              attributionControl={false}
            >
              <MapViewController bounds={mapBounds} flyTarget={flyTarget} />
              <CursorTracker onCoordinatesChange={(lat, lon) => setCursorCoords({ lat, lon })} />
              <ScaleControl position="bottomleft" imperial={false} />

              {/* Basemap Options */}
              {basemapMode === 'osm' && (
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={18}
                />
              )}

              {/* Imagery Overlay if uploaded */}
              {summary.imagery.present && showImagery && mapBounds && (
                <ImageOverlay
                  url={`http://localhost:8000/ingest/${session_id}/preview.png`}
                  bounds={mapBounds}
                  opacity={imageryOpacity}
                />
              )}

              {/* Survey Boundary (2px dark ink dashed line) */}
              {showBoundary && boundaryLatLngs.length > 0 && (
                <Polygon
                  positions={boundaryLatLngs}
                  pathOptions={{
                    color: '#1F2328',
                    weight: 2,
                    dashArray: '5, 5',
                    fillColor: '#1F4E5F',
                    fillOpacity: 0.04,
                  }}
                />
              )}

              {/* Roads from Overpass */}
              {showRoads &&
                roads.features.map((r: any, idx: number) => {
                  const geom = r.geometry;
                  if (!geom) return null;
                  const coords = (geom.coordinates || []).map((c: any) => [c[1], c[0]] as [number, number]);
                  return (
                    <Polyline
                      key={`road-${idx}`}
                      positions={coords}
                      pathOptions={{
                        color: '#64748B',
                        weight: r.properties?.class === 'primary' ? 2.0 : 1.2,
                        opacity: 0.8,
                      }}
                    />
                  );
                })}

              {/* Waterways */}
              {showWater &&
                water.features.map((w: any, idx: number) => {
                  const geom = w.geometry;
                  if (!geom) return null;
                  const coords = (geom.coordinates || []).map((c: any) => [c[1], c[0]] as [number, number]);
                  return (
                    <Polyline
                      key={`water-${idx}`}
                      positions={coords}
                      pathOptions={{
                        color: '#6BA4B8',
                        weight: 2.0,
                        opacity: 0.9,
                      }}
                    />
                  );
                })}

              {/* Kilns (Canvas Circle Markers) */}
              {visibleKilns.map((f: any) => {
                const p = f.properties || {};
                const isSelected = selectedKiln?.kiln_id === p.kiln_id;
                const color =
                  p.class === 'FCBK'
                    ? TOKENS.colors.kiln.fcbk
                    : p.class === 'Zigzag'
                    ? TOKENS.colors.kiln.zigzag
                    : TOKENS.colors.kiln.cfcbk;

                return (
                  <CircleMarker
                    key={p.kiln_id}
                    center={[p.lat, p.lon]}
                    radius={isSelected ? 8 : 5}
                    pathOptions={{
                      color: isSelected ? '#1F2328' : '#FFFFFF',
                      weight: isSelected ? 2.5 : 1.0,
                      fillColor: color,
                      fillOpacity: 0.95,
                    }}
                    eventHandlers={{
                      click: () => setSelectedKiln(p),
                    }}
                  />
                );
              })}
            </MapContainer>

            {/* Before/After Split Divider Overlay */}
            {sliderActive && (
              <div
                className="absolute inset-0 pointer-events-none z-[500]"
                onMouseMove={(e) => {
                  if (!isDraggingSplit.current) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
                  setSplitPosition(pct);
                }}
                onMouseUp={() => {
                  isDraggingSplit.current = false;
                }}
              >
                {/* Vertical Divider line with handle */}
                <div
                  style={{ left: `${splitPosition}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-auto cursor-ew-resize flex items-center justify-center"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    isDraggingSplit.current = true;
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-[#1F4E5F] text-white border-2 border-white flex items-center justify-center text-xs shadow-md">
                    ⇄
                  </div>
                </div>

                {/* Left/Right labels */}
                <div className="absolute top-3 left-14 bg-black/60 text-white px-2 py-0.5 rounded-[2px] font-mono text-2xs">
                  Your Imagery
                </div>
                <div className="absolute top-3 right-14 bg-black/60 text-white px-2 py-0.5 rounded-[2px] font-mono text-2xs">
                  Digitised Detections
                </div>
              </div>
            )}

            {/* Map Furniture: Top Right Controls */}
            <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5">
              {/* North Arrow */}
              <div className="bg-white/95 border border-[#D9D6CE] p-1.5 rounded-[2px] shadow-map text-center font-mono text-2xs text-[#1F2328] pointer-events-none">
                <div className="font-bold">▲ N</div>
              </div>
              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="bg-white/95 hover:bg-white text-[#1F2328] border border-[#D9D6CE] p-1.5 rounded-[2px] shadow-map text-xs focus:outline-none"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={14} strokeWidth={1.5} /> : <Maximize2 size={14} strokeWidth={1.5} />}
              </button>
            </div>

            {/* Map Furniture: Fit Boundary Button */}
            <div className="absolute top-3 left-12 z-[400]">
              <button
                type="button"
                onClick={() => {
                  setSelectedKiln(null);
                  setFlyTarget(null);
                }}
                className="bg-white/95 hover:bg-white text-[#1F2328] border border-[#D9D6CE] p-1.5 rounded-[2px] shadow-map text-xs font-mono flex items-center gap-1.5 focus:outline-none"
                title="Fit to survey boundary"
              >
                <Compass size={14} strokeWidth={1.5} />
                <span>Fit Bounds</span>
              </button>
            </div>

            {/* Bottom Bar: Live Cursor Readout */}
            <div className="absolute bottom-2 left-2 z-[400] bg-white/95 border border-[#D9D6CE] px-2.5 py-1 rounded-[2px] font-mono text-2xs text-[#1F2328] shadow-map flex items-center gap-3">
              <span>
                Cursor: {cursorCoords ? `${cursorCoords.lat.toFixed(5)}°N, ${cursorCoords.lon.toFixed(5)}°E` : '--, --'}
              </span>
              {cursorCoords && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${cursorCoords.lat.toFixed(6)}, ${cursorCoords.lon.toFixed(6)}`)}
                  className="text-[#1F4E5F] hover:underline"
                >
                  {copiedCoords ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TABLE VIEW TAB: Kilns Table with Fixed Widths & Sort */
        <div className="bg-white border border-[#D9D6CE] rounded-[4px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#FAF9F5] border-b border-[#D9D6CE] text-[#656D76]">
                <tr>
                  <th
                    className="py-2.5 px-3 font-semibold w-24 cursor-pointer hover:text-[#1F2328]"
                    onClick={() => toggleSort('kiln_id')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Kiln ID</span>
                      <ArrowUpDown size={11} strokeWidth={1.5} />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 font-semibold w-28 cursor-pointer hover:text-[#1F2328]"
                    onClick={() => toggleSort('class')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Class</span>
                      <ArrowUpDown size={11} strokeWidth={1.5} />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 font-semibold text-right w-24 cursor-pointer hover:text-[#1F2328]"
                    onClick={() => toggleSort('score')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Score</span>
                      <ArrowUpDown size={11} strokeWidth={1.5} />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 font-semibold text-right w-32 cursor-pointer hover:text-[#1F2328]"
                    onClick={() => toggleSort('lat')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Latitude</span>
                      <ArrowUpDown size={11} strokeWidth={1.5} />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 font-semibold text-right w-32 cursor-pointer hover:text-[#1F2328]"
                    onClick={() => toggleSort('lon')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Longitude</span>
                      <ArrowUpDown size={11} strokeWidth={1.5} />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 font-semibold text-right w-28 cursor-pointer hover:text-[#1F2328]"
                    onClick={() => toggleSort('road_dist_m')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Road Dist</span>
                      <ArrowUpDown size={11} strokeWidth={1.5} />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 font-semibold w-28">1 km Cluster</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D6CE]/60">
                {visibleKilns.map((f: any) => {
                  const p = f.properties || {};
                  const isSelected = selectedKiln?.kiln_id === p.kiln_id;

                  return (
                    <tr
                      key={p.kiln_id}
                      onClick={() => {
                        setSelectedKiln(p);
                        setFlyTarget([p.lat, p.lon]);
                        setViewMode('map');
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#FAF9F5] font-semibold' : 'hover:bg-[#FAFDFB]'
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-[#1F2328]">{p.kiln_id}</td>
                      <td className="py-2 px-3">
                        <span
                          className="px-1.5 py-0.5 rounded-[2px] font-medium text-2xs inline-block"
                          style={{
                            color:
                              p.class === 'FCBK'
                                ? '#E8710A'
                                : p.class === 'Zigzag'
                                ? '#1A73E8'
                                : '#188038',
                            backgroundColor:
                              p.class === 'FCBK'
                                ? '#FFF7ED'
                                : p.class === 'Zigzag'
                                ? '#EFF6FF'
                                : '#F0FDF4',
                            border: `1px solid ${
                              p.class === 'FCBK'
                                ? '#FDBA74'
                                : p.class === 'Zigzag'
                                ? '#93C5FD'
                                : '#86EFAC'
                            }`,
                          }}
                        >
                          {p.class}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{(p.score * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right">{p.lat?.toFixed(5)}°</td>
                      <td className="py-2 px-3 text-right">{p.lon?.toFixed(5)}°</td>
                      <td className="py-2 px-3 text-right">
                        {p.road_dist_m ? `${p.road_dist_m} m` : '-'}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-2xs text-[#656D76]">
                          {p.near_1km ? p.cluster_id : 'Isolated'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedKiln(p);
                            setFlyTarget([p.lat, p.lon]);
                            setViewMode('map');
                          }}
                          className="text-[#1F4E5F] hover:underline text-2xs inline-flex items-center gap-1"
                        >
                          <Eye size={12} strokeWidth={1.5} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collapsible Boundary & Coordinates Panel */}
      <DetailsCollapse
        summary="Boundary Coordinates & Geodetic Vertices (EPSG:4326)"
        count={`${boundaryLatLngs.length} Points`}
      >
        <div className="space-y-3 font-mono text-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#D9D6CE]">
            <div className="flex flex-wrap items-center gap-3">
              <span>Centroid: <strong>{summary.boundary.centroid[1].toFixed(5)}°N, {summary.boundary.centroid[0].toFixed(5)}°E</strong></span>
              <span>BBox: <strong>{summary.boundary.bbox.map((n) => n.toFixed(4)).join(', ')}</strong></span>
              <span className="px-1.5 py-0.5 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE]">
                CRS: <strong>EPSG:4326</strong>
              </span>
              <span className="px-1.5 py-0.5 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE]">
                Zone: <strong>{summary.boundary.utm_zone}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<Copy size={12} strokeWidth={1.5} />}
                onClick={() => {
                  const csv = ['lat,lon', ...boundaryLatLngs.map((c) => `${c[0]},${c[1]}`)].join('\n');
                  copyToClipboard(csv);
                }}
              >
                Copy Vertices CSV
              </Button>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto border border-[#D9D6CE] rounded-[2px]">
            <table className="w-full text-left">
              <thead className="bg-[#FAF9F5] text-[#656D76] sticky top-0">
                <tr>
                  <th className="p-1.5 w-16">#</th>
                  <th className="p-1.5">Latitude (°N)</th>
                  <th className="p-1.5">Longitude (°E)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D6CE]/60">
                {boundaryLatLngs.map((c, i) => (
                  <tr key={i} className="hover:bg-[#FAF9F5]">
                    <td className="p-1 text-[#656D76]">{i + 1}</td>
                    <td className="p-1">{c[0].toFixed(6)}</td>
                    <td className="p-1">{c[1].toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DetailsCollapse>
    </div>
  );
};
