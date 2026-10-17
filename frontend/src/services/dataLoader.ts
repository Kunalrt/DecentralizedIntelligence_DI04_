/**
 * Robust Typed Data Loader with Schema Validation & Fallback Repair
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

let hasRepairedData = false;

export function wasDataRepaired(): boolean {
  return hasRepairedData;
}

export function resetDataRepaired(): void {
  hasRepairedData = false;
}

/**
 * Fallback sanitizer to replace bare NaN, Infinity, -Infinity tokens outside strings with null.
 */
export function sanitizeBareNaNs(text: string): string {
  return text
    .replace(/(:\s*)(-?Infinity|NaN)\b/g, '$1null')
    .replace(/(\[\s*)(-?Infinity|NaN)\b/g, '$1null')
    .replace(/(,\s*)(-?Infinity|NaN)\b/g, '$1null');
}

/**
 * Fetch a JSON file safely by reading as text first.
 * If JSON parsing fails, attempts fallback repair of bare NaNs.
 * If parsing still fails, raises an informative error identifying the exact file.
 */
export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();

  try {
    return JSON.parse(text) as T;
  } catch (initialErr) {
    // Attempt fallback repair only if bare NaN or Infinity tokens are present
    const sanitized = sanitizeBareNaNs(text);
    if (sanitized !== text) {
      try {
        const parsed = JSON.parse(sanitized) as T;
        console.warn(`[DATA REPAIR] Repaired invalid bare NaN/Infinity values in ${url}`);
        hasRepairedData = true;
        return parsed;
      } catch {
        // Fall through to throw detailed error below
      }
    }
    const rawMsg = initialErr instanceof Error ? initialErr.message : String(initialErr);
    throw new Error(`Data Synchronization Error in file "${url}": invalid JSON syntax (${rawMsg})`);
  }
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
    resetDataRepaired();

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
      summaryStatsRaw,
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
      fetchJSON<Record<string, any>>(getAssetUrl('data/summary_stats.json')),
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

    // Normalize summaryStats with reliable fallbacks
    const summaryStats: SummaryStats = {
      district_name: String(summaryStatsRaw?.district_name || 'SentinelKilnDB Sector'),
      total_tiles_scanned: Number(summaryStatsRaw?.total_tiles_scanned || 15),
      raw_tile_detections: Number(summaryStatsRaw?.raw_tile_detections || kilns.features.length),
      unique_physical_kilns: Number(summaryStatsRaw?.unique_physical_kilns || summaryStatsRaw?.total_detected || kilns.features.length),
      deduplicated_overlap_count: Number(summaryStatsRaw?.deduplicated_overlap_count || 0),
      class_counts_raw: summaryStatsRaw?.class_counts_raw || {},
      kilns_within_1km_cluster: Number(summaryStatsRaw?.kilns_within_1km_cluster || within1km.length),
      total_clusters_count: Number(summaryStatsRaw?.total_clusters_count || clusters.length),
      conversions_tracked: {
        total_2023_baseline_fcbk: Number(summaryStatsRaw?.conversions_tracked?.total_2023_baseline_fcbk ?? 0),
        converted_to_zigzag: Number(summaryStatsRaw?.conversions_tracked?.converted_to_zigzag ?? 0),
        unconverted_fcbk_violations: Number(summaryStatsRaw?.conversions_tracked?.unconverted_fcbk_violations ?? (counts.find((c) => c.class === 'FCBK')?.detected ?? 0)),
        dismantled_or_inactive: Number(summaryStatsRaw?.conversions_tracked?.dismantled_or_inactive ?? 0),
      },
    };

    // Data Validation Assertions
    if (!kilns || !kilns.features || kilns.features.length === 0) {
      throw new Error('kilns.geojson is empty or corrupted');
    }

    // Ensure every kiln has consistent id and kiln_id properties, and null-safe attributes
    kilns.features.forEach((f) => {
      const p = f.properties;
      const kId = p.kiln_id || p.id || 'n/a';
      p.id = kId;
      p.kiln_id = kId;
      if (p.prev_class === undefined) p.prev_class = null;
      if (p.converted === undefined) p.converted = false;
    });

    const totalFromCounts = counts.find((c) => c.class === 'Total')?.detected;
    if (totalFromCounts && totalFromCounts !== kilns.features.length) {
      console.warn(
        `[DATA WARNING] Total in counts.csv (${totalFromCounts}) does not match kilns.geojson count (${kilns.features.length})`
      );
    }

    const warningBanner = hasRepairedData
      ? 'Data file contained invalid values and was repaired. Re-export it.'
      : null;

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
      dataWarning: warningBanner,
    };
  } catch (err) {
    console.error('[DATA LOADER ERROR]', err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}
