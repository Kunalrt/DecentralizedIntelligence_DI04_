import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Tooltip,
  CircleMarker,
  ScaleControl,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
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

// Custom DivIcon marker with distinct shapes: FCBK (Circle), Zigzag (Square), CFCBK (Triangle)
function createKilnDivIcon(
  kilnClass: 'FCBK' | 'Zigzag' | 'CFCBK',
  isSelected: boolean
): L.DivIcon {
  const color = KILN_COLORS[kilnClass] || '#1F4E5F';
  const symbol = kilnClass === 'FCBK' ? '●' : kilnClass === 'Zigzag' ? '■' : '▲';
  const radiusStyle =
    kilnClass === 'FCBK'
      ? 'border-radius: 50%;'
      : kilnClass === 'Zigzag'
      ? 'border-radius: 1px;'
      : 'border-radius: 3px;';
  const size = isSelected ? 24 : 18;

  return L.divIcon({
    className: 'custom-kiln-div-icon',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        width: ${size}px;
        height: ${size}px;
        ${radiusStyle}
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isSelected ? '11px' : '9px'};
        font-weight: bold;
        box-shadow: ${
          isSelected
            ? `0 0 0 2px #ffffff, 0 0 0 3.5px #1F2328`
            : '0 1px 3px rgba(0,0,0,0.3)'
        };
        border: 1.5px solid #ffffff;
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

// Marker cluster group for kiln markers at low zoom
function KilnMarkerClusterGroup({
  filteredKilns,
  selectedKiln,
  onSelectKiln,
}: {
  filteredKilns: KilnGeoJSONFeature[];
  selectedKiln: KilnProperties | null;
  onSelectKiln: (kiln: KilnProperties) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      disableClusteringAtZoom: 16,
      spiderfyOnMaxZoom: true,
      chunkedLoading: true,
    });

    filteredKilns.forEach((feature) => {
      const kId = feature.properties.id || feature.properties.kiln_id || 'n/a';
      const isSelected = Boolean(
        selectedKiln?.id === feature.properties.id ||
          (selectedKiln && selectedKiln.id === kId)
      );
      const { lat, lon, score } = feature.properties;
      const kilnClass = (feature.properties.class as 'FCBK' | 'Zigzag' | 'CFCBK') || 'FCBK';
      const scoreText =
        typeof score === 'number' ? `${(score * 100).toFixed(0)}%` : '-';

      const marker = L.marker([lat, lon], {
        icon: createKilnDivIcon(kilnClass, isSelected),
      });

      marker.bindTooltip(
        `<div class="text-2xs font-mono font-medium"><strong>${kId}</strong> &bull; ${kilnClass} (${scoreText})</div>`,
        { direction: 'top', offset: [0, -10] }
      );

      marker.on('click', () => {
        onSelectKiln(feature.properties);
      });

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, filteredKilns, selectedKiln, onSelectKiln]);

  return null;
}

export const MapContainerView: React.FC<MapContainerViewProps> = ({
  filteredKilns,
  historicalFeatures,
  selectedKiln,
  onSelectKiln,
  showHistorical,
  mapTarget,
}) => {
  const clusterHulls = useMemo(() => {
    return computeClusterHulls(filteredKilns);
  }, [filteredKilns]);

  return (
    <div className="relative w-full h-[620px] rounded-[4px] overflow-hidden border border-[#D9D6CE] shadow-sm bg-[#14181C]">
      <MapContainer
        center={MAP_CONFIG.defaultCenter}
        zoom={MAP_CONFIG.defaultZoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        scrollWheelZoom={true}
        preferCanvas={true}
        className="w-full h-full"
      >
        {/* OpenStreetMap Standard Vector Tile Layer ONLY */}
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
              color: '#1F4E5F',
              fillColor: '#1F4E5F',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          >
            <Tooltip sticky direction="top" className="custom-cluster-tooltip">
              <div className="text-2xs font-mono">
                <strong className="text-[#1F4E5F]">{hull.clusterId}</strong>
                <div className="text-[#656D76]">
                  {hull.count} kilns ({hull.classesSummary})
                </div>
              </div>
            </Tooltip>
          </Polygon>
        ))}

        {/* 2. Historical 2023 Baseline Sites */}
        {showHistorical &&
          historicalFeatures.map((hist) => {
            const [lon, lat] = hist.geometry.coordinates;
            return (
              <CircleMarker
                key={`hist-${hist.properties.id}`}
                center={[lat, lon]}
                radius={7}
                pathOptions={{
                  color: '#1F2328',
                  fillColor: '#ECEAE4',
                  fillOpacity: 0.6,
                  weight: 1.2,
                  dashArray: '3, 3',
                }}
              >
                <Tooltip direction="top">
                  <div className="text-2xs font-mono">
                    <strong className="text-[#1F2328]">2023: {hist.properties.id}</strong>
                    <div className="text-[#656D76]">{hist.properties.status}</div>
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
                color: isSelected ? '#1F2328' : color,
                fillColor: color,
                fillOpacity: isSelected ? 0.6 : 0.25,
                weight: isSelected ? 2.5 : 1.2,
              }}
              eventHandlers={{
                click: () => onSelectKiln(feature.properties),
              }}
            />
          );
        })}

        {/* 4. Center Markers Grouped in MarkerClusterGroup */}
        <KilnMarkerClusterGroup
          filteredKilns={filteredKilns}
          selectedKiln={selectedKiln}
          onSelectKiln={onSelectKiln}
        />
      </MapContainer>

      {/* North Arrow */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 border border-[#D9D6CE] p-1.5 rounded-[2px] shadow-map text-center font-mono text-2xs text-[#1F2328] pointer-events-none">
        <div className="font-bold">▲ N</div>
      </div>
    </div>
  );
};
