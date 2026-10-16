/**
 * Robust Typed Data Loader with Schema Validation
 * Fetches all CSV and GeoJSON inputs dynamically from /data/.
 */

import Papa from 'papaparse';
import type {
  AppData,
  KilnGeoJSON,
  HistoricalGeoJSON,
  CountRow,
  ConversionRow,
  Within1kmRow,
  ClusterSummaryRow,
  Top20Row,
  MetricsData,
  ExperimentItem,
  SummaryStats,
} from '../types/data';

function getAssetUrl(path: string): string {
  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchCSV<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  return new Promise((resolve, reject) => {
    Papa.parse<T>(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error: Error) => reject(error),
    });
  });
}

export async function loadAllData(): Promise<AppData> {
  try {
    const [
      kilns,
      labels2023,
      countsRaw,
      conversions,
      within1km,
      clusters,
      top20,
      metrics,
      experiments,
      summaryStats,
    ] = await Promise.all([
      fetchJSON<KilnGeoJSON>(getAssetUrl('data/kilns.geojson')),
      fetchJSON<HistoricalGeoJSON>(getAssetUrl('data/labels_2023.geojson')),
      fetchCSV<Record<string, any>>(getAssetUrl('data/counts.csv')),
      fetchCSV<ConversionRow>(getAssetUrl('data/conversions.csv')),
      fetchCSV<Within1kmRow>(getAssetUrl('data/within_1km.csv')),
      fetchCSV<ClusterSummaryRow>(getAssetUrl('data/clusters_summary.csv')),
      fetchCSV<Top20Row>(getAssetUrl('data/top20.csv')),
      fetchJSON<MetricsData>(getAssetUrl('data/metrics.json')),
      fetchJSON<ExperimentItem[]>(getAssetUrl('data/experiments.json')),
      fetchJSON<SummaryStats>(getAssetUrl('data/summary_stats.json')),
    ]);

    // Normalize and validate counts.csv
    const counts: CountRow[] = countsRaw.map((row) => ({
      class: String(row.class || ''),
      detected: Number(row.detected || 0),
      est_low: Number(row.est_low ?? row.est_true_count_low ?? 0),
      est_high: Number(row.est_high ?? row.est_true_count_high ?? 0),
      precision: row.precision ?? '-',
      recall: row.recall ?? '-',
      note: String(row.note || ''),
    }));

    // Data Validation Assertions
    if (!kilns || !kilns.features || kilns.features.length === 0) {
      throw new Error('kilns.geojson is empty or corrupted');
    }

    const totalFromCounts = counts.find((c) => c.class === 'Total')?.detected;
    if (totalFromCounts && totalFromCounts !== kilns.features.length) {
      console.warn(
        `[DATA WARNING] Total in counts.csv (${totalFromCounts}) does not match kilns.geojson count (${kilns.features.length})`
      );
    }

    return {
      kilns,
      labels2023,
      counts,
      conversions,
      within1km,
      clusters,
      top20,
      metrics,
      experiments,
      summaryStats,
    };
  } catch (err) {
    console.error('[DATA LOADER ERROR]', err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}
