import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { MAP_CONFIG } from '../config/constants';
import type { KilnClass, KilnProperties, HistoricalLabelProperties } from '../types/data';
import { MapFilterBar, type MapFiltersState } from '../components/map/MapFilterBar';
import { MapContainerView } from '../components/map/MapContainerView';
import { MapLegend } from '../components/map/MapLegend';
import { KilnDetailDrawer } from '../components/map/KilnDetailDrawer';
import { MapPin, ShieldAlert, Sparkles } from 'lucide-react';

const INITIAL_FILTERS: MapFiltersState = {
  classes: {
    FCBK: true,
    Zigzag: true,
    CFCBK: true,
  },
  onlyClustered: false,
  onlyConverted: false,
  minScore: 0.25,
  showHistorical: false,
  searchQuery: '',
};

export const MapPage: React.FC = () => {
  const { data } = useData();

  const [filters, setFilters] = useState<MapFiltersState>(INITIAL_FILTERS);
  const [selectedKiln, setSelectedKiln] = useState<KilnProperties | null>(null);
  const [mapTarget, setMapTarget] = useState<{
    lat: number;
    lon: number;
    zoom?: number;
  } | null>(null);

  if (!data) return null;

  const allKilns = data.kilns.features;
  const historicalFeatures = data.labels2023.features;

  // Filter kilns based on active filter state
  const filteredKilns = useMemo(() => {
    return allKilns.filter((f) => {
      const p = f.properties;

      // Class filter
      if (!filters.classes[p.class]) return false;

      // Clustered filter
      if (filters.onlyClustered && !p.near_1km) return false;

      // Converted filter
      if (filters.onlyConverted && !p.converted) return false;

      // Confidence threshold
      if (p.score < filters.minScore) return false;

      // Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesCluster = p.cluster_id.toLowerCase().includes(q);
        const matchesClass = p.class.toLowerCase().includes(q);
        if (!matchesId && !matchesCluster && !matchesClass) return false;
      }

      return true;
    });
  }, [allKilns, filters]);

  // Dynamic Class Counts
  const classCounts: Record<KilnClass, number> = {
    FCBK: allKilns.filter((f) => f.properties.class === 'FCBK').length,
    Zigzag: allKilns.filter((f) => f.properties.class === 'Zigzag').length,
    CFCBK: allKilns.filter((f) => f.properties.class === 'CFCBK').length,
  };

  // Find historical match for selected kiln if available
  const historicalMatch = useMemo((): HistoricalLabelProperties | null => {
    if (!selectedKiln) return null;
    const match = historicalFeatures.find(
      (h) => h.properties.matched_kiln_id === selectedKiln.id
    );
    return match ? match.properties : null;
  }, [selectedKiln, historicalFeatures]);

  const handleFilterChange = (updated: Partial<MapFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSelectedKiln(null);
  };

  const handleResetZoom = () => {
    setMapTarget({
      lat: MAP_CONFIG.defaultCenter[0],
      lon: MAP_CONFIG.defaultCenter[1],
      zoom: MAP_CONFIG.defaultZoom,
    });
  };

  const handleCenterOnKiln = (lat: number, lon: number) => {
    setMapTarget({ lat, lon, zoom: 17 });
  };

  return (
    <div className="space-y-4">
      {/* Header & Sub-bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-slate-900 m-0">
              Interactive Spatial Surveillance Map
            </h2>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            OpenStreetMap standard vector tiles &bull; Rotated OBB polygons &bull; 1.0 km vehicle cluster zones
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-50 border border-orange-200 text-orange-800 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
            <span>27 FCBK Targets</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-50 border border-purple-200 text-purple-800 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>18 Proximity Clusters</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <MapFilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        filteredCount={filteredKilns.length}
        totalCount={allKilns.length}
        classCounts={classCounts}
        historicalCount={historicalFeatures.length}
      />

      {/* Map Viewport Area */}
      <div className="relative">
        <MapContainerView
          filteredKilns={filteredKilns}
          historicalFeatures={historicalFeatures}
          selectedKiln={selectedKiln}
          onSelectKiln={(kiln) => setSelectedKiln(kiln)}
          showHistorical={filters.showHistorical}
          mapTarget={mapTarget}
        />

        {/* Floating Legend */}
        <MapLegend
          onResetZoom={handleResetZoom}
          showHistorical={filters.showHistorical}
        />

        {/* Floating Click-to-Inspect Drawer */}
        {selectedKiln && (
          <KilnDetailDrawer
            kiln={selectedKiln}
            historicalMatch={historicalMatch}
            onClose={() => setSelectedKiln(null)}
            onCenterOnMap={handleCenterOnKiln}
          />
        )}
      </div>

      {/* Field Officer Tip Banner */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div>
          <strong className="text-slate-800 font-semibold">Inspector Tip:</strong> Click any kiln marker or rotated bounding box to view its copyable coordinates, cluster group, and field rationale.
        </div>
        <div className="text-[11px] text-slate-500 italic">
          Projection: EPSG:4326 &bull; Georeferenced to Sentinel-2 L2A tiles
        </div>
      </div>
    </div>
  );
};
