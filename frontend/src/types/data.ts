/**
 * TypeScript Data Models for Chimney Census
 * All properties strictly conform to project schemas.
 */

export type KilnClass = 'FCBK' | 'Zigzag' | 'CFCBK';

export interface KilnProperties {
  id: string;
  class: KilnClass;
  score: number;
  lat: number;
  lon: number;
  near_1km: boolean;
  clustered_1km?: boolean;
  cluster_id: string;
  converted: boolean;
  prev_class: string | null;
  priority_score: number;
  why: string;
}

export interface KilnGeoJSONFeature {
  type: 'Feature';
  properties: KilnProperties;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface KilnGeoJSON {
  type: 'FeatureCollection';
  name: string;
  features: KilnGeoJSONFeature[];
}

export interface HistoricalLabelProperties {
  id: string;
  class: 'FCBK';
  lat: number;
  lon: number;
  status: string;
  regulatory_compliance: string;
  converted: boolean;
  matched_current_class: string;
  matched_kiln_id: string | null;
  matched_lat: number | null;
  matched_lon: number | null;
  distance_to_historical_m: number | null;
}

export interface HistoricalLabelFeature {
  type: 'Feature';
  properties: HistoricalLabelProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
}

export interface HistoricalGeoJSON {
  type: 'FeatureCollection';
  name: string;
  features: HistoricalLabelFeature[];
}

export interface CountRow {
  class: string;
  detected: number;
  est_low: number;
  est_high: number;
  est_true_count_low?: number;
  est_true_count_high?: number;
  precision: string | number;
  recall: string | number;
  note: string;
}

export interface ConversionRow {
  historical_id: string;
  lat: number;
  lon: number;
  matched_current_class: string;
  confidence: number;
  distance_to_historical_m: number;
  status: string;
  regulatory_compliance: string;
  uncertainty_level: string;
  matched_kiln_id?: string | null;
  matched_lat?: number | null;
  matched_lon?: number | null;
}

export interface Within1kmRow {
  kiln_id: string;
  cluster: string;
  class: KilnClass;
  score: number;
  lat: number;
  lon: number;
  nearest_neighbor_id: string;
  nearest_gap_m: number;
  neighbors_1km_count: number;
}

export interface ClusterSummaryRow {
  cluster: string;
  kilns: number;
  types: string;
  centre_lat_lon: string;
  max_gap_m: number;
}

export interface Top20Row {
  rank: number;
  kiln_id: string;
  class: KilnClass;
  lat: number;
  lon: number;
  confidence: number;
  why_visit: string;
  priority_score: number;
  clustered_within_1km: string;
}

export interface MetricsData {
  mAP: number;
  AP_FCBK: number;
  AP_CFCBK: number;
  AP_Zigzag: number;
  weights: {
    FCBK: number;
    CFCBK: number;
    Zigzag: number;
  };
  metric_definition?: string;
  citation?: string;
}

export interface ExperimentItem {
  id: string;
  model: string;
  technique: string;
  val_mAP: number | null;
  ap_fcbk: number | null;
  ap_cfcbk: number | null;
  ap_zigzag: number | null;
  status: string;
  outcome: string;
}

export interface SummaryStats {
  district_name: string;
  total_tiles_scanned: number;
  raw_tile_detections: number;
  unique_physical_kilns: number;
  deduplicated_overlap_count: number;
  class_counts_raw: Record<string, number>;
  kilns_within_1km_cluster: number;
  total_clusters_count: number;
  conversions_tracked: {
    total_2023_baseline_fcbk: number;
    converted_to_zigzag: number;
    unconverted_fcbk_violations: number;
    dismantled_or_inactive: number;
  };
}

export interface AppData {
  kilns: KilnGeoJSON;
  labels2023: HistoricalGeoJSON;
  counts: CountRow[];
  conversions: ConversionRow[];
  within1km: Within1kmRow[];
  clusters: ClusterSummaryRow[];
  top20: Top20Row[];
  metrics: MetricsData;
  experiments: ExperimentItem[];
  summaryStats: SummaryStats;
}
