import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import L from 'leaflet';
import { MapContainerView } from '../components/map/MapContainerView';
import { computeClusterHulls } from '../utils/geoUtils';
import type { KilnGeoJSONFeature } from '../types/data';

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="mock-map-container">{children}</div>,
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Polygon: ({ positions }: any) => <div data-testid="mock-polygon" data-coords={JSON.stringify(positions)} />,
  CircleMarker: () => <div data-testid="mock-circle-marker" />,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  ScaleControl: () => <div data-testid="mock-scale-control" />,
  useMap: () => ({
    setView: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
  }),
}));

const mockKilnFixture: KilnGeoJSONFeature[] = [
  {
    type: 'Feature',
    properties: {
      id: 'KILN-TEST-FCBK',
      kiln_id: 'KILN-TEST-FCBK',
      class: 'FCBK',
      score: 0.72,
      lat: 28.61,
      lon: 77.19,
      near_1km: true,
      cluster_id: 'Cluster 1 (test_tile_0001)',
      converted: false,
      prev_class: null,
      priority_score: 60,
      why: 'FCBK violation',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[77.19, 28.61], [77.20, 28.61], [77.20, 28.62], [77.19, 28.62], [77.19, 28.61]]],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'KILN-TEST-ZIGZAG',
      kiln_id: 'KILN-TEST-ZIGZAG',
      class: 'Zigzag',
      score: 0.12, // Low confidence detection (typical of Zigzag detections in dataset)
      lat: 28.612,
      lon: 77.192,
      near_1km: true,
      cluster_id: 'Cluster 1 (test_tile_0001)',
      converted: true,
      prev_class: 'FCBK',
      priority_score: 20,
      why: 'Compliant Zigzag',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[77.192, 28.612], [77.202, 28.612], [77.202, 28.622], [77.192, 28.622], [77.192, 28.612]]],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'KILN-TEST-CFCBK',
      kiln_id: 'KILN-TEST-CFCBK',
      class: 'CFCBK',
      score: 0.98,
      lat: 28.63,
      lon: 77.21,
      near_1km: false,
      cluster_id: 'ISOLATED',
      converted: false,
      prev_class: null,
      priority_score: 80,
      why: 'Legacy circular',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[[77.21, 28.63], [77.22, 28.63], [77.22, 28.64], [77.21, 28.64], [77.21, 28.63]]],
    },
  },
];

describe('Surveillance Map Module - Clustering & Class Rendering', () => {
  let addedMarkers: any[] = [];
  let clusterGroupOptions: any = null;

  beforeEach(() => {
    addedMarkers = [];
    clusterGroupOptions = null;

    vi.spyOn(L, 'markerClusterGroup').mockImplementation((options?: any) => {
      clusterGroupOptions = options;
      return {
        addLayer: vi.fn((layer) => addedMarkers.push(layer)),
        removeLayer: vi.fn(),
        options,
      } as any;
    });
  });

  it('renders all three classes (FCBK, Zigzag, CFCBK) into the cluster group', () => {
    render(
      <MapContainerView
        filteredKilns={mockKilnFixture}
        historicalFeatures={[]}
        selectedKiln={null}
        onSelectKiln={vi.fn()}
        showHistorical={false}
        mapTarget={null}
      />
    );

    // Verify cluster options
    expect(clusterGroupOptions).toBeDefined();
    expect(clusterGroupOptions.maxClusterRadius).toBe(50);
    expect(clusterGroupOptions.disableClusteringAtZoom).toBe(16);
    expect(clusterGroupOptions.spiderfyOnMaxZoom).toBe(true);

    // Verify that all 3 features across FCBK, Zigzag, and CFCBK are added to the cluster group
    expect(addedMarkers).toHaveLength(3);
  });

  it('computes 1 km proximity cluster convex hulls for grouped kilns', () => {
    const hulls = computeClusterHulls(mockKilnFixture);
    expect(hulls).toHaveLength(1);
    expect(hulls[0].clusterId).toBe('Cluster 1 (test_tile_0001)');
    expect(hulls[0].count).toBe(2);
    expect(hulls[0].classesSummary).toContain('FCBK');
    expect(hulls[0].classesSummary).toContain('Zigzag');
  });
});
