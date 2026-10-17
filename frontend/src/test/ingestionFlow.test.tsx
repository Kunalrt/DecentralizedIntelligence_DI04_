import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepBar } from '../components/ingest/StepBar';
import { DropzoneCard } from '../components/ingest/DropzoneCard';
import { ProcessProgress } from '../components/ingest/ProcessProgress';
import { ExploreResultView } from '../components/ingest/ExploreResultView';
import { Upload } from 'lucide-react';
import type { IngestStatus, IngestResult } from '../services/ingestApi';

// Mock react-leaflet for headless testing in JSDOM
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="mock-map-container">{children}</div>,
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Polygon: () => <div data-testid="mock-polygon" />,
  Polyline: () => <div data-testid="mock-polyline" />,
  CircleMarker: () => <div data-testid="mock-circle-marker" />,
  ScaleControl: () => <div data-testid="mock-scale-control" />,
  ImageOverlay: () => <div data-testid="mock-image-overlay" />,
  useMap: () => ({
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
  }),
  useMapEvents: () => ({}),
}));

const mockResult: IngestResult = {
  session_id: 'test-session-123',
  summary: {
    session_id: 'test-session-123',
    created_at: 1700000000,
    boundary: {
      derived: false,
      area_km2: 142.5,
      perimeter_km: 48.2,
      utm_zone: 'UTM 43N',
      bbox: [77.1, 28.5, 77.3, 28.7],
      centroid: [77.2, 28.6],
    },
    imagery: {
      present: true,
      gsd_m: 10.0,
      is_drone: false,
      resampled: false,
    },
    kilns: {
      total: 12,
      by_class: { FCBK: 6, Zigzag: 4, CFCBK: 2 },
      density_per_km2: 0.08,
      flagged_within_1km: 5,
      clusters_count: 2,
      outside_boundary_omitted: 0,
    },
    infrastructure: {
      roads_available: true,
      total_road_km: 84.6,
      road_km_by_class: { primary: 20.0, secondary: 30.0, residential: 34.6 },
      waterways_count: 3,
    },
    warnings: [],
  },
  boundary: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'District Boundary', area_km2: 142.5, perimeter_km: 48.2 },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [77.1, 28.5],
              [77.3, 28.5],
              [77.3, 28.7],
              [77.1, 28.7],
              [77.1, 28.5],
            ],
          ],
        },
      },
    ],
  },
  kilns: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          kiln_id: 'KILN-001',
          class: 'FCBK',
          score: 0.94,
          lat: 28.55,
          lon: 77.15,
          near_1km: true,
          cluster_id: 'CLUST-01',
          road_dist_m: 120,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [77.149, 28.549],
              [77.151, 28.549],
              [77.151, 28.551],
              [77.149, 28.551],
              [77.149, 28.549],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: {
          kiln_id: 'KILN-002',
          class: 'Zigzag',
          score: 0.88,
          lat: 28.56,
          lon: 77.16,
          near_1km: false,
          cluster_id: 'ISOLATED',
          road_dist_m: 350,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [77.159, 28.559],
              [77.161, 28.559],
              [77.161, 28.561],
              [77.159, 28.561],
              [77.159, 28.559],
            ],
          ],
        },
      },
    ],
  },
  roads: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { class: 'primary', name: 'Grand Trunk Road' },
        geometry: {
          type: 'LineString',
          coordinates: [
            [77.12, 28.52],
            [77.28, 28.68],
          ],
        },
      },
    ],
  },
  water: {
    type: 'FeatureCollection',
    features: [],
  },
  density: {
    type: 'FeatureCollection',
    features: [],
  },
};

describe('Ingestion Workflow UI Components', () => {
  it('StepBar renders all 3 steps and respects canExplore flag', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <StepBar currentStep="upload" onSelectStep={onSelect} canExplore={false} />
    );

    expect(screen.getByText('Upload')).toBeTruthy();
    expect(screen.getByText('Process')).toBeTruthy();
    expect(screen.getByText('Explore')).toBeTruthy();

    // Click Explore when disabled
    const exploreBtn = screen.getByText('Explore').closest('button');
    expect(exploreBtn?.hasAttribute('disabled')).toBe(true);

    // Rerender with canExplore = true
    rerender(<StepBar currentStep="upload" onSelectStep={onSelect} canExplore={true} />);
    expect(exploreBtn?.hasAttribute('disabled')).toBe(false);
    fireEvent.click(exploreBtn!);
    expect(onSelect).toHaveBeenCalledWith('explore');
  });

  it('DropzoneCard renders chips when valid and displays error when present', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <DropzoneCard
        title="Boundary"
        description="Drop polygon boundary"
        acceptExtensions={['.geojson', '.kml']}
        file={null}
        onFileSelect={onSelect}
        error={null}
        icon={<Upload size={16} />}
      />
    );

    expect(screen.getByText('Boundary')).toBeTruthy();
    expect(screen.getByText('.geojson')).toBeTruthy();
    expect(screen.getByText('.kml')).toBeTruthy();

    // Now test with error
    rerender(
      <DropzoneCard
        title="Boundary"
        description="Drop polygon boundary"
        acceptExtensions={['.geojson', '.kml']}
        file={null}
        onFileSelect={onSelect}
        error="Invalid CRS format"
        icon={<Upload size={16} />}
      />
    );

    expect(screen.getByText('Invalid CRS format')).toBeTruthy();
  });

  it('ProcessProgress displays progress bar, 6 steps, and warnings as chips', () => {
    const mockStatus: IngestStatus = {
      step: 'detect',
      percent: 65,
      message: 'Running rotated OBB inference...',
      warnings: ['Imagery resampled from 15 m/px; accuracy may drop'],
      error: null,
      completed: false,
    };

    render(<ProcessProgress status={mockStatus} />);

    expect(screen.getByText('65%')).toBeTruthy();
    expect(screen.getByText('Read')).toBeTruthy();
    expect(screen.getByText('Check')).toBeTruthy();
    expect(screen.getByText('Detect')).toBeTruthy();
    expect(screen.getByText('Locate')).toBeTruthy();
    expect(screen.getByText('Roads')).toBeTruthy();
    expect(screen.getByText('Summarise')).toBeTruthy();

    // Warning should be visible
    expect(screen.getByText(/Imagery resampled/)).toBeTruthy();
  });

  it('ExploreResultView stat strip displays real summary metrics', () => {
    const onClear = vi.fn();
    render(<ExploreResultView result={mockResult} onClearData={onClear} />);

    // Area km2
    expect(screen.getByText('142.5')).toBeTruthy();
    // Perimeter km
    expect(screen.getByText('48.2')).toBeTruthy();
    // Kilns count
    expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1);
    // Road km
    expect(screen.getByText('84.6')).toBeTruthy();
  });

  it('ExploreResultView allows toggling layers and switching views', () => {
    const onClear = vi.fn();
    render(<ExploreResultView result={mockResult} onClearData={onClear} />);

    // Find layer toggles in panel
    expect(screen.getByText('Kilns')).toBeTruthy();
    expect(screen.getByText('Boundary')).toBeTruthy();
    expect(screen.getByText('Roads (OSM)')).toBeTruthy();

    // Switch to Table view tab
    const tableTabBtn = screen.getByText(/Kiln Table/);
    fireEvent.click(tableTabBtn);
    expect(screen.getByText('KILN-001')).toBeTruthy();
    expect(screen.getByText('KILN-002')).toBeTruthy();
  });

  it('ExploreResultView allows comparing imagery via Before/After slider control', () => {
    const onClear = vi.fn();
    render(<ExploreResultView result={mockResult} onClearData={onClear} />);

    // Slider toggle button should be present when imagery is present
    const compareBtn = screen.getByText('Before / After Slider');
    expect(compareBtn).toBeTruthy();
    fireEvent.click(compareBtn);

    // After clicking, mode changes to active and renders overlay labels
    expect(screen.getByText('Exit Compare Mode')).toBeTruthy();
    expect(screen.getAllByText('Your Imagery').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Digitised Detections')).toBeTruthy();
  });

  it('ExploreResultView handles Clear Data action', () => {
    const onClear = vi.fn();
    render(<ExploreResultView result={mockResult} onClearData={onClear} />);

    const clearBtn = screen.getByText('Clear Data');
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalled();
  });
});

