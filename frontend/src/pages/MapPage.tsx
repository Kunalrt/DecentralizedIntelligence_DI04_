import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { MAP_CONFIG } from '../config/constants';
import type { KilnClass, KilnProperties, HistoricalLabelProperties } from '../types/data';
import { MapFilterBar, type MapFiltersState } from '../components/map/MapFilterBar';
import { MapContainerView } from '../components/map/MapContainerView';
import { MapLegend } from '../components/map/MapLegend';
import { KilnDetailDrawer } from '../components/map/KilnDetailDrawer';
import { SectionHeader, Badge } from '../design';
import { Info } from 'lucide-react';

const INITIAL_FILTERS: MapFiltersState = {
  classes: {
    FCBK: true,
    Zigzag: true,
    CFCBK: true,
  },
  onlyClustered: false,
  onlyConverted: false,
  minScore: 0.0,
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
  } | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const lat = params.get('lat');
      const lon = params.get('lon');
      const zoom = params.get('zoom');
      if (lat && lon) {
        return { lat: parseFloat(lat), lon: parseFloat(lon), zoom: zoom ? parseInt(zoom, 10) : 16 };
      }
    } catch {
      // Fallback to null
    }
    return null;
  });

  const allKilns = useMemo(() => data?.kilns.features ?? [], [data]);
  const historicalFeatures = useMemo(() => data?.labels2023.features ?? [], [data]);

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
        const matchesId = (p.id || p.kiln_id || '').toLowerCase().includes(q);
        const matchesCluster = (p.cluster_id || '').toLowerCase().includes(q);
        const matchesClass = (p.class || '').toLowerCase().includes(q);
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
    const match = historicalFeatures.find((h) => {
      const mId = h.properties.matched_kiln_id;
      return Boolean(mId && (mId === selectedKiln.id || mId === selectedKiln.kiln_id));
    });
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

  if (!data) return null;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <SectionHeader
        title="Interactive Spatial Surveillance Map"
        subtitle="OpenStreetMap standard vector tiles with rotated OBB polygons and 1.0 km proximity vehicle cluster zones."
        badge={
          <div className="flex items-center gap-1.5">
            <Badge variant="warning">27 FCBK Targets</Badge>
            <Badge variant="accent">18 Clusters</Badge>
          </div>
        }
      />

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
      <div className="relative border border-[#D9D6CE] rounded-[4px] overflow-hidden bg-[#14181C]">
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
      <div className="p-2.5 bg-white rounded-[4px] border border-[#D9D6CE] text-2xs font-mono text-[#656D76] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5">
          <Info size={13} strokeWidth={1.5} className="text-[#1F4E5F] flex-shrink-0" />
          <span>Click any marker to inspect geodetic vertices, nearest road distance, and cluster group.</span>
        </div>
        <div>
          EPSG:4326 &bull; Georeferenced to Sentinel-2 L2A tiles
        </div>
      </div>
    </div>
  );
};
