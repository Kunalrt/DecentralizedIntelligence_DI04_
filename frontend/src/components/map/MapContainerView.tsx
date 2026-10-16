import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Tooltip,
  CircleMarker,
  ScaleControl,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { KILN_COLORS, MAP_CONFIG } from '../../config/constants';
import type {
  KilnGeoJSONFeature,
  HistoricalLabelFeature,
  KilnProperties,
} from '../../types/data';
import { geoJsonToLeafletCoords, computeClusterHulls } from '../../utils/geoUtils';

interface MapContainerViewProps {
  filteredKilns: KilnGeoJSONFeature[];
  historicalFeatures: HistoricalLabelFeature[];
  selectedKiln: KilnProperties | null;
  onSelectKiln: (kiln: KilnProperties) => void;
  showHistorical: boolean;
  mapTarget: { lat: number; lon: number; zoom?: number } | null;
}

// MapController for programmatic pan/zoom
function MapController({
  target,
}: {
  target: { lat: number; lon: number; zoom?: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.setView([target.lat, target.lon], target.zoom || 16, {
        animate: true,
      });
    }
  }, [target, map]);

  return null;
}

// Custom DivIcon marker for kilns
function createKilnDivIcon(
  kilnClass: 'FCBK' | 'Zigzag' | 'CFCBK',
  isSelected: boolean
): L.DivIcon {
  const color = KILN_COLORS[kilnClass] || '#64748B';
  const symbol = kilnClass === 'FCBK' ? '▲' : kilnClass === 'Zigzag' ? '■' : '●';
  const size = isSelected ? 26 : 20;

  return L.divIcon({
    className: 'custom-kiln-div-icon',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        width: ${size}px;
        height: ${size}px;
        border-radius: ${kilnClass === 'CFCBK' ? '50%' : kilnClass === 'FCBK' ? '5px' : '3px'};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isSelected ? '12px' : '10px'};
        font-weight: bold;
        box-shadow: ${
          isSelected
            ? `0 0 0 3px #ffffff, 0 0 10px ${color}`
            : '0 1px 4px rgba(0,0,0,0.4)'
        };
        border: 2px solid #ffffff;
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export const MapContainerView: React.FC<MapContainerViewProps> = ({
  filteredKilns,
  historicalFeatures,
  selectedKiln,
  onSelectKiln,
  showHistorical,
  mapTarget,
}) => {
  // Pre-calculate 1 km cluster hulls from filtered kilns
  const clusterHulls = useMemo(() => {
    return computeClusterHulls(filteredKilns);
  }, [filteredKilns]);

  return (
    <div className="relative w-full h-[620px] rounded-xl overflow-hidden border border-slate-300 shadow-sm">
      <MapContainer
        center={MAP_CONFIG.defaultCenter}
        zoom={MAP_CONFIG.defaultZoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* OpenStreetMap Standard Vector Tile Layer ONLY (No satellite, no Google, no Esri) */}
        <TileLayer
          url={MAP_CONFIG.tileLayerUrl}
          attribution={MAP_CONFIG.attribution}
          maxZoom={19}
        />

        {/* Dynamic Map Controller */}
        <MapController target={mapTarget} />

        {/* Scale Bar (Metric) */}
        <ScaleControl position="bottomright" metric={true} imperial={false} />

        {/* 1. Cluster Hull Polygons (1 km Proximity Groups) */}
        {clusterHulls.map((hull) => (
          <Polygon
            key={`hull-${hull.clusterId}`}
            positions={hull.polygon}
            pathOptions={{
              color: '#6366F1',
              fillColor: '#818CF8',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: '5, 5',
            }}
          >
            <Tooltip sticky direction="top" className="custom-cluster-tooltip">
              <div className="text-xs font-sans">
                <strong className="text-indigo-800">{hull.clusterId}</strong>
                <div className="text-[11px] text-slate-600">
                  {hull.count} kilns ({hull.classesSummary})
                </div>
              </div>
            </Tooltip>
          </Polygon>
        ))}

        {/* 2. Historical 2023 Baseline Sites (Subtle Gray Rings) */}
        {showHistorical &&
          historicalFeatures.map((hist) => {
            const [lon, lat] = hist.geometry.coordinates;
            return (
              <CircleMarker
                key={`hist-${hist.properties.id}`}
                center={[lat, lon]}
                radius={8}
                pathOptions={{
                  color: '#475569',
                  fillColor: '#94A3B8',
                  fillOpacity: 0.35,
                  weight: 1.5,
                  dashArray: '3, 3',
                }}
              >
                <Tooltip direction="top">
                  <div className="text-xs font-sans">
                    <strong className="text-slate-800">2023 Baseline: {hist.properties.id}</strong>
                    <div className="text-[11px] text-slate-600">{hist.properties.status}</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

        {/* 3. Rotated Bounding Box Polygons (OBBs from GeoJSON) */}
        {filteredKilns.map((feature) => {
          const isSelected = selectedKiln?.id === feature.properties.id;
          const coords = geoJsonToLeafletCoords(feature.geometry.coordinates);
          const color =
            feature.properties.class === 'FCBK'
              ? KILN_COLORS.FCBK
              : feature.properties.class === 'Zigzag'
              ? KILN_COLORS.Zigzag
              : KILN_COLORS.CFCBK;

          return (
            <Polygon
              key={`obb-${feature.properties.id}`}
              positions={coords}
              pathOptions={{
                color: isSelected ? '#0F172A' : color,
                fillColor: color,
                fillOpacity: isSelected ? 0.65 : 0.35,
                weight: isSelected ? 3 : 1.5,
              }}
              eventHandlers={{
                click: () => onSelectKiln(feature.properties),
              }}
            />
          );
        })}

        {/* 4. Center Markers for Every Kiln */}
        {filteredKilns.map((feature) => {
          const kId = feature.properties.id || feature.properties.kiln_id || 'n/a';
          const isSelected = Boolean(selectedKiln?.id === feature.properties.id || (selectedKiln && selectedKiln.id === kId));
          const { lat, lon, score } = feature.properties;
          const kilnClass = feature.properties.class || 'n/a';
          const scoreText = typeof score === 'number' ? `${(score * 100).toFixed(0)}%` : 'n/a';

          return (
            <Marker
              key={`marker-${kId}`}
              position={[lat, lon]}
              icon={createKilnDivIcon(kilnClass, isSelected)}
              eventHandlers={{
                click: () => onSelectKiln(feature.properties),
              }}
            >
              <Tooltip direction="top" offset={[0, -12]}>
                <div className="text-xs font-sans font-medium">
                  <strong>{kId}</strong> &bull; {kilnClass} ({scoreText})
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
