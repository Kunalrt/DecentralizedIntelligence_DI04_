import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { sanitizeBareNaNs, fetchJSON, loadAllData, wasDataRepaired, resetDataRepaired } from '../services/dataLoader';
import App from '../App';

describe('Data Loader NaN Hardening & Fallback Repair', () => {
  const fixtureWithBareNaN = `
{
  "type": "FeatureCollection",
  "name": "Historical_2023_24_Kilns",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "HIST-2023-001",
        "kiln_id": "HIST-2023-001",
        "class": "FCBK",
        "lat": 28.612,
        "lon": 77.195,
        "status": "DISMANTLED / INACTIVE",
        "regulatory_compliance": "SHUT DOWN",
        "converted": false,
        "matched_current_class": "None",
        "matched_kiln_id": NaN,
        "matched_lat": NaN,
        "distance_to_historical_m": NaN
      },
      "geometry": {
        "type": "Point",
        "coordinates": [77.195, 28.612]
      }
    }
  ]
}
`.trim();

  beforeEach(() => {
    resetDataRepaired();
    vi.restoreAllMocks();
  });

  it('standard JSON.parse fails on bare NaN', () => {
    expect(() => JSON.parse(fixtureWithBareNaN)).toThrow();
  });

  it('sanitizeBareNaNs replaces bare NaN with null while preserving string tokens', () => {
    const sanitized = sanitizeBareNaNs(fixtureWithBareNaN);
    expect(sanitized).not.toContain(': NaN');
    expect(sanitized).toContain('"matched_kiln_id": null');
    expect(sanitized).toContain('"matched_lat": null');
    expect(sanitized).toContain('"distance_to_historical_m": null');

    const parsed = JSON.parse(sanitized);
    expect(parsed.features[0].properties.matched_kiln_id).toBeNull();
    expect(parsed.features[0].properties.matched_lat).toBeNull();
  });

  it('fetchJSON catches bare NaN, repairs it, and flags data as repaired', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => fixtureWithBareNaN,
    } as Response);

    const result = await fetchJSON<any>('/data/labels_2023.geojson');
    expect(wasDataRepaired()).toBe(true);
    expect(result.features[0].properties.matched_kiln_id).toBeNull();
    expect(result.features[0].properties.id).toBe('HIST-2023-001');
  });

  it('App renders with repaired warning banner when loader repairs NaN in fixture', async () => {
    // Mock all fetch calls
    const mockKilns = JSON.stringify({
      type: 'FeatureCollection',
      name: 'DemoDistrict_BrickKilns',
      features: [
        {
          type: 'Feature',
          properties: {
            id: 'KILN-DEMO-001',
            kiln_id: 'KILN-DEMO-001',
            class: 'FCBK',
            score: 0.92,
            lat: 28.612,
            lon: 77.195,
            near_1km: true,
            cluster_id: 'Cluster 1',
            converted: false,
            prev_class: null,
            priority_score: 65,
            why: 'Persistent FCBK ban violation',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[77.19, 28.61], [77.20, 28.61], [77.20, 28.62], [77.19, 28.62], [77.19, 28.61]]],
          },
        },
      ],
    });

    const mockCountsCsv = `class,detected,est_low,est_high,precision,recall,note\nFCBK,1,1,2,0.88,0.85,Banned\nZigzag,0,0,0,0.65,0.62,Compliant\nCFCBK,0,0,0,0.90,0.95,Circular\nTotal,1,1,2,-,-,All combined\n`;
    const mockSummaryStats = JSON.stringify({
      district_name: 'Demo District',
      total_tiles_scanned: 1,
      raw_tile_detections: 1,
      unique_physical_kilns: 1,
      deduplicated_overlap_count: 0,
      class_counts_raw: { FCBK: 1 },
      kilns_within_1km_cluster: 1,
      total_clusters_count: 1,
      conversions_tracked: {
        total_2023_baseline_fcbk: 1,
        converted_to_zigzag: 0,
        unconverted_fcbk_violations: 1,
        dismantled_or_inactive: 0,
      },
    });

    global.fetch = vi.fn().mockImplementation((url: string) => {
      let textContent = '';
      if (url.includes('labels_2023.geojson')) {
        // Returns the invalid fixture containing bare NaN!
        textContent = fixtureWithBareNaN;
      } else if (url.includes('kilns.geojson')) {
        textContent = mockKilns;
      } else if (url.includes('counts.csv')) {
        textContent = mockCountsCsv;
      } else if (url.includes('summary_stats.json')) {
        textContent = mockSummaryStats;
      } else if (url.includes('metrics.json')) {
        textContent = JSON.stringify({ mAP: 0.83, AP_FCBK: 0.88, AP_Zigzag: 0.62, AP_CFCBK: 1.0 });
      } else if (url.includes('experiments.json')) {
        textContent = JSON.stringify([]);
      } else {
        textContent = '';
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => textContent,
      } as Response);
    });

    // Verify loadAllData repairs it and flags dataWarning
    const loadedData = await loadAllData();
    expect(loadedData.dataWarning).toBe('Data file contained invalid values and was repaired. Re-export it.');
    expect(loadedData.labels2023.features[0].properties.matched_kiln_id).toBeNull();

    // Render the App component
    render(<App />);

    // Expect the warning banner to appear on screen
    await waitFor(() => {
      const banner = screen.getByRole('alert');
      expect(banner).toBeDefined();
      expect(banner.textContent).toContain('Data file contained invalid values and was repaired. Re-export it.');
    });

    // Expect page to render without crashing
    expect(screen.getAllByText(/Demo District/).length).toBeGreaterThan(0);
  });
});
