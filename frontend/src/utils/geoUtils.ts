/**
 * Spatial geometry utilities for Leaflet rendering
 * - Convex hulls for 1 km kiln clusters
 * - Coordinate transformations ([lon, lat] -> [lat, lon])
 * - Distance calculations (Haversine)
 */

import type { KilnGeoJSONFeature } from '../types/data';

export interface ClusterHull {
  clusterId: string;
  polygon: [number, number][]; // [lat, lon]
  count: number;
  classesSummary: string;
}

// Convert GeoJSON Polygon coordinates [lon, lat] to Leaflet [lat, lon]
export function geoJsonToLeafletCoords(coords: number[][][]): [number, number][] {
  if (!coords || !coords[0]) return [];
  return coords[0].map((pt) => [pt[1], pt[0]]);
}

// Haversine distance in meters
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 2D Cross product of OA and OB vectors = (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x)
function cross(
  o: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

// Monotone chain 2D convex hull algorithm
export function convexHull(points: [number, number][]): [number, number][] {
  if (points.length <= 2) return points;

  // Sort points lexicographically by lat, then lon
  const sorted = [...points].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));

  // Lower hull
  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  // Upper hull
  const upper: [number, number][] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

// Expand polygon vertices outward from centroid by a given buffer in degrees (~150m)
export function expandPolygon(
  polygon: [number, number][],
  paddingDegrees: number = 0.002
): [number, number][] {
  if (polygon.length === 0) return [];
  if (polygon.length === 1) {
    const [lat, lon] = polygon[0];
    return [
      [lat + paddingDegrees, lon - paddingDegrees],
      [lat + paddingDegrees, lon + paddingDegrees],
      [lat - paddingDegrees, lon + paddingDegrees],
      [lat - paddingDegrees, lon - paddingDegrees],
    ];
  }
  if (polygon.length === 2) {
    const [p1, p2] = polygon;
    const dLat = p2[0] - p1[0];
    const dLon = p2[1] - p1[1];
    const len = Math.sqrt(dLat * dLat + dLon * dLon) || 1;
    // Perpendicular vector
    const perpLat = (-dLon / len) * paddingDegrees;
    const perpLon = (dLat / len) * paddingDegrees;
    const extendLat = (dLat / len) * paddingDegrees;
    const extendLon = (dLon / len) * paddingDegrees;

    return [
      [p1[0] - extendLat + perpLat, p1[1] - extendLon + perpLon],
      [p2[0] + extendLat + perpLat, p2[1] + extendLon + perpLon],
      [p2[0] + extendLat - perpLat, p2[1] + extendLon - perpLon],
      [p1[0] - extendLat - perpLat, p1[1] - extendLon - perpLon],
    ];
  }

  // Calculate centroid
  let sumLat = 0;
  let sumLon = 0;
  for (const [lat, lon] of polygon) {
    sumLat += lat;
    sumLon += lon;
  }
  const cLat = sumLat / polygon.length;
  const cLon = sumLon / polygon.length;

  // Scale outward from centroid
  return polygon.map(([lat, lon]) => {
    const dLat = lat - cLat;
    const dLon = lon - cLon;
    const dist = Math.sqrt(dLat * dLat + dLon * dLon) || 1;
    const scale = (dist + paddingDegrees) / dist;
    return [cLat + dLat * scale, cLon + dLon * scale];
  });
}

// Compute cluster hulls for all multi-kiln clusters
export function computeClusterHulls(features: KilnGeoJSONFeature[]): ClusterHull[] {
  const clusterMap: Record<string, KilnGeoJSONFeature[]> = {};

  features.forEach((f) => {
    const cId = f.properties.cluster_id;
    if (cId && cId.startsWith('Cluster')) {
      if (!clusterMap[cId]) clusterMap[cId] = [];
      clusterMap[cId].push(f);
    }
  });

  const hulls: ClusterHull[] = [];

  Object.entries(clusterMap).forEach(([clusterId, clusterFeatures]) => {
    if (clusterFeatures.length < 2) return;

    const points: [number, number][] = clusterFeatures.map((f) => [
      f.properties.lat,
      f.properties.lon,
    ]);

    const hullPoints = convexHull(points);
    const bufferedPolygon = expandPolygon(hullPoints, 0.0018); // ~200 meters buffer

    // Summarize classes
    const classCounts: Record<string, number> = {};
    clusterFeatures.forEach((f) => {
      classCounts[f.properties.class] = (classCounts[f.properties.class] || 0) + 1;
    });
    const summary = Object.entries(classCounts)
      .map(([cls, cnt]) => `${cnt} ${cls}`)
      .join(', ');

    hulls.push({
      clusterId,
      polygon: bufferedPolygon,
      count: clusterFeatures.length,
      classesSummary: summary,
    });
  });

  return hulls;
}
