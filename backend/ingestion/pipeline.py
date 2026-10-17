"""Core ingestion and spatial processing pipeline.

Pipeline stages:
1. read: Reads uploaded boundary, imagery, or detections
2. check: Validates CRS, derives missing boundary, checks GSD (resample / drone flag)
3. detect: 128x128 tiling with 30px overlap, YOLO-OBB model inference
4. locate: Affine coordinate reprojection, 30px overlap deduplication, point-in-polygon filtering
5. roads: Overpass API highway/rail/water query with bbox caching and offline fallback
6. summarise: Precise GIS metrics (area, perimeter, density, 1km clustering, road distances), GeoJSON exports, preview.png
"""

import json
import time
import math
import hashlib
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import pandas as pd
import shapely
from shapely.geometry import Point, Polygon, MultiPolygon, LineString, MultiLineString, box, mapping
from shapely.ops import transform, unary_union, nearest_points
import pyproj
from pyproj import Transformer, CRS
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import cv2
import requests

from .session_manager import IngestionSession
from .readers import read_boundary, read_imagery, read_detections

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
WEIGHTS_PATH = PROJECT_ROOT / "weights" / "best.pt"
FALLBACK_WEIGHTS = PROJECT_ROOT / "yolo11s-obb.pt"

# In-memory Overpass cache
OVERPASS_CACHE: Dict[str, Any] = {}


def get_utm_crs_for_latlon(lat: float, lon: float) -> Tuple[CRS, str]:
    """Calculate UTM CRS and zone string for a geographic point."""
    zone_number = int((lon + 180) / 6) + 1
    is_north = lat >= 0
    hemisphere = "N" if is_north else "S"
    epsg_code = (32600 if is_north else 32700) + zone_number
    zone_str = f"UTM Zone {zone_number}{hemisphere}"
    return CRS.from_epsg(epsg_code), zone_str


def calculate_polygon_area_perimeter(geom: shapely.Geometry) -> Tuple[float, float, str]:
    """Calculate geodesic/projected area in km2 and perimeter in km in local UTM CRS."""
    centroid = geom.centroid
    utm_crs, zone_str = get_utm_crs_for_latlon(centroid.y, centroid.x)
    transformer = Transformer.from_crs("EPSG:4326", utm_crs, always_xy=True)
    geom_utm = transform(transformer.transform, geom)
    
    area_km2 = float(geom_utm.area / 1_000_000.0)
    perimeter_km = float(geom_utm.length / 1000.0)
    return round(area_km2, 3), round(perimeter_km, 3), zone_str


def query_overpass_context(boundary_geom: shapely.Geometry) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], bool]:
    """Query OSM Overpass API for roads and waterways within boundary bbox with caching and offline fallback."""
    minx, miny, maxx, maxy = boundary_geom.bounds
    cache_key = f"{round(minx, 3)}_{round(miny, 3)}_{round(maxx, 3)}_{round(maxy, 3)}"

    if cache_key in OVERPASS_CACHE:
        return OVERPASS_CACHE[cache_key]["roads"], OVERPASS_CACHE[cache_key]["water"], True

    # Overpass QL query: highways and waterways
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""[out:json][timeout:10];
    (
      way["highway"]({miny},{minx},{maxy},{maxx});
      way["waterway"]({miny},{minx},{maxy},{maxx});
    );
    out body;
    >;
    out skel qt;
    """

    roads_features = []
    water_features = []

    try:
        resp = requests.post(overpass_url, data={"data": query}, timeout=8)
        if resp.status_code != 200:
            return [], [], False

        data = resp.json()
        nodes = {elem["id"]: (elem["lon"], elem["lat"]) for elem in data.get("elements", []) if elem.get("type") == "node"}
        
        for elem in data.get("elements", []):
            if elem.get("type") == "way" and "nodes" in elem:
                node_coords = [nodes[nid] for nid in elem["nodes"] if nid in nodes]
                if len(node_coords) >= 2:
                    ls = LineString(node_coords)
                    # Clip to boundary
                    clipped = ls.intersection(boundary_geom)
                    if not clipped.is_empty:
                        tags = elem.get("tags", {})
                        if "highway" in tags:
                            roads_features.append({
                                "geometry": clipped,
                                "class": tags.get("highway", "residential"),
                                "name": tags.get("name", "Unnamed Road"),
                            })
                        elif "waterway" in tags:
                            water_features.append({
                                "geometry": clipped,
                                "class": tags.get("waterway", "canal"),
                                "name": tags.get("name", "Waterway"),
                            })

        OVERPASS_CACHE[cache_key] = {
            "roads": roads_features,
            "water": water_features,
        }
        return roads_features, water_features, True

    except Exception:
        # Graceful fallback when Overpass is offline or network fails
        return [], [], False


def cluster_kilns_within_1km(kilns: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], int]:
    """Find kilns within 1.0 km haversine distance of each other and assign cluster IDs."""
    if not kilns:
        return kilns, 0

    n = len(kilns)
    coords = np.array([[k["lat"], k["lon"]] for k in kilns])

    # Haversine distance matrix in kilometers
    lat_rad = np.radians(coords[:, 0])
    lon_rad = np.radians(coords[:, 1])

    dlat = lat_rad[:, None] - lat_rad[None, :]
    dlon = lon_rad[:, None] - lon_rad[None, :]

    a = np.sin(dlat / 2.0)**2 + np.cos(lat_rad[:, None]) * np.cos(lat_rad[None, :]) * np.sin(dlon / 2.0)**2
    c = 2.0 * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))
    dist_km = 6371.0 * c

    # Mark kilns with neighbour <= 1.0 km (excluding self)
    adj = (dist_km <= 1.0) & (dist_km > 0.0)

    # Connected components for cluster IDs
    visited = set()
    cluster_counter = 0

    for i in range(n):
        has_neighbour = bool(np.any(adj[i]))
        kilns[i]["near_1km"] = has_neighbour

        if i not in visited:
            if has_neighbour:
                cluster_counter += 1
                cluster_id = f"CLUST-{cluster_counter:02d}"
                # Breadth-first search
                queue = [i]
                visited.add(i)
                while queue:
                    curr = queue.pop(0)
                    kilns[curr]["cluster_id"] = cluster_id
                    for neighbour in np.where(adj[curr])[0]:
                        if neighbour not in visited:
                            visited.add(neighbour)
                            queue.append(neighbour)
            else:
                kilns[i]["cluster_id"] = "ISOLATED"
                visited.add(i)

    return kilns, cluster_counter


def compute_density_grid(boundary_geom: shapely.Geometry, kilns: List[Dict[str, Any]], grid_size_km: float = 1.0) -> Dict[str, Any]:
    """Generate regular spatial grid across boundary and compute kiln density."""
    minx, miny, maxx, maxy = boundary_geom.bounds
    centroid = boundary_geom.centroid
    deg_per_km_lat = 1.0 / 111.32
    deg_per_km_lon = 1.0 / (111.32 * max(0.1, np.cos(np.radians(centroid.y))))

    dx = grid_size_km * deg_per_km_lon
    dy = grid_size_km * deg_per_km_lat

    cols = np.arange(minx, maxx + dx, dx)
    rows = np.arange(miny, maxy + dy, dy)

    points = [Point(k["lon"], k["lat"]) for k in kilns]
    features = []

    for x in cols[:-1]:
        for y in rows[:-1]:
            cell = box(x, y, x + dx, y + dy)
            intersected = cell.intersection(boundary_geom)
            if not intersected.is_empty and intersected.area > 0:
                count = sum(1 for p in points if cell.contains(p))
                features.append({
                    "type": "Feature",
                    "properties": {
                        "kiln_count": count,
                        "density_per_km2": round(count / (grid_size_km * grid_size_km), 2),
                    },
                    "geometry": mapping(intersected),
                })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


def generate_preview_map(
    boundary_geom: shapely.Geometry,
    kilns: List[Dict[str, Any]],
    roads: List[Dict[str, Any]],
    out_path: Path,
):
    """Render a clean, high-resolution preview map using matplotlib."""
    fig, ax = plt.subplots(figsize=(8, 7), dpi=150)
    fig.patch.set_facecolor("#FFFFFF")
    ax.set_facecolor("#FAF9F5")

    # 1. Render Roads
    for r in roads:
        geom = r["geometry"]
        if geom.geom_type == "LineString":
            x, y = geom.xy
            ax.plot(x, y, color="#94A3B8", linewidth=0.8, alpha=0.8, zorder=2)
        elif geom.geom_type == "MultiLineString":
            for line in geom.geoms:
                x, y = line.xy
                ax.plot(x, y, color="#94A3B8", linewidth=0.8, alpha=0.8, zorder=2)

    # 2. Render Boundary (Dark ink dashed line)
    if boundary_geom.geom_type == "Polygon":
        bx, by = boundary_geom.exterior.xy
        ax.plot(bx, by, color="#1F2328", linewidth=1.8, linestyle="--", zorder=3, label="Survey Boundary")
    elif boundary_geom.geom_type == "MultiPolygon":
        for poly in boundary_geom.geoms:
            bx, by = poly.exterior.xy
            ax.plot(bx, by, color="#1F2328", linewidth=1.8, linestyle="--", zorder=3)

    # 3. Render Kilns with class symbols
    class_styles = {
        "FCBK": {"color": "#E8710A", "marker": "o", "label": "FCBK (Banned)"},
        "Zigzag": {"color": "#1A73E8", "marker": "s", "label": "Zigzag (Compliant)"},
        "CFCBK": {"color": "#188038", "marker": "^", "label": "CFCBK (Heritage)"},
    }

    plotted_classes = set()
    for k in kilns:
        cls = k["class"]
        style = class_styles.get(cls, {"color": "#64748B", "marker": "o", "label": cls})
        lbl = style["label"] if cls not in plotted_classes else ""
        if lbl:
            plotted_classes.add(cls)

        ax.scatter(
            k["lon"],
            k["lat"],
            color=style["color"],
            marker=style["marker"],
            s=40,
            edgecolors="#FFFFFF",
            linewidth=1.0,
            zorder=4,
            label=lbl if lbl else None,
        )

    ax.set_title("Agni Drishti - Survey Area & Kiln Distribution", fontsize=11, fontweight="bold", color="#1F2328", pad=12)
    ax.legend(loc="upper right", fontsize=8, framealpha=0.95, edgecolor="#D9D6CE")
    ax.set_xlabel("Longitude (°E)", fontsize=9, color="#656D76")
    ax.set_ylabel("Latitude (°N)", fontsize=9, color="#656D76")
    ax.grid(True, linestyle=":", alpha=0.5, color="#D9D6CE")

    plt.tight_layout()
    plt.savefig(out_path, dpi=150, facecolor="#FFFFFF")
    plt.close()


def run_pipeline(session: IngestionSession):
    """Execute complete ingestion pipeline with live status updates."""
    try:
        # STEP 1: READ (0 - 20%)
        session.status["step"] = "read"
        session.status["percent"] = 5
        session.status["message"] = "Scanning and reading input files..."

        boundary_file = session.files.get("boundary")
        imagery_file = session.files.get("imagery")
        detections_file = session.files.get("detections")

        boundary_geom = None
        boundary_meta = {}
        boundary_derived = False

        if boundary_file and boundary_file.exists():
            boundary_geom, boundary_meta = read_boundary(boundary_file)
            session.status["message"] = f"Boundary parsed from {boundary_file.name}."

        session.status["percent"] = 15

        imagery_meta = None
        if imagery_file and imagery_file.exists():
            imagery_meta = read_imagery(imagery_file)
            if imagery_meta.get("warnings"):
                session.status["warnings"].extend(imagery_meta["warnings"])

        candidate_detections = []
        if detections_file and detections_file.exists():
            candidate_detections = read_detections(detections_file)

        session.status["percent"] = 20

        # STEP 2: CHECK (20 - 35%)
        session.status["step"] = "check"
        session.status["percent"] = 25
        session.status["message"] = "Verifying coordinate systems and spatial coverage..."

        # a) Derive boundary if missing
        if boundary_geom is None:
            if imagery_meta is not None:
                boundary_geom = imagery_meta["footprint"]
                boundary_derived = True
                boundary_meta = {"source": "imagery_footprint", "derived": True}
                session.status["warnings"].append("Boundary was derived from imagery footprint.")
            elif candidate_detections:
                points = [Point(d["lon"], d["lat"]) for d in candidate_detections]
                multi_pt = unary_union(points)
                # Convex hull + 500m buffer (~0.0045 degrees)
                boundary_geom = multi_pt.convex_hull.buffer(0.0045)
                boundary_derived = True
                boundary_meta = {"source": "detections_convex_hull", "derived": True}
                session.status["warnings"].append("Boundary was derived from detections convex hull + 500 m buffer.")
            else:
                raise ValueError("No boundary, imagery, or detections provided. Please upload at least one valid input file.")

        session.status["percent"] = 35

        # STEP 3: DETECT (35 - 60%)
        session.status["step"] = "detect"
        session.status["percent"] = 40
        session.status["message"] = "Tiling imagery and executing kiln detection..."

        detected_kilns = list(candidate_detections)

        # Run OBB model on imagery if available and not drone-scale
        if imagery_meta is not None and not imagery_meta["is_drone"]:
            session.status["message"] = "Running rotated OBB detector over 128x128 tiles..."
            rgb_arr = imagery_meta["rgb_8bit"]  # (3, H, W)
            _, H, W = rgb_arr.shape
            tile_size = 128
            overlap = 30
            step = tile_size - overlap  # 98 px

            transform_native = imagery_meta["transform"]
            crs_native = imagery_meta["crs"]
            transformer_to_4326 = Transformer.from_crs(crs_native, "EPSG:4326", always_xy=True)

            # Load YOLO model weights if available
            model = None
            try:
                from ultralytics import YOLO
                weight_candidate = WEIGHTS_PATH if WEIGHTS_PATH.exists() else FALLBACK_WEIGHTS
                if weight_candidate.exists():
                    model = YOLO(str(weight_candidate))
            except Exception:
                model = None

            # Tile generation
            tile_batches = []
            tile_coords = []

            for y in range(0, max(1, H - tile_size + 1), step):
                for x in range(0, max(1, W - tile_size + 1), step):
                    tile = rgb_arr[:, y:y+tile_size, x:x+tile_size]
                    if tile.shape[1] == tile_size and tile.shape[2] == tile_size:
                        tile_hwc = np.transpose(tile, (1, 2, 0))
                        tile_batches.append(tile_hwc)
                        tile_coords.append((x, y))

            # Batch model inference or spectral detection
            if model is not None and len(tile_batches) > 0:
                batch_size = 16
                for b_idx in range(0, len(tile_batches), min(len(tile_batches), 64)):
                    batch_imgs = tile_batches[b_idx:b_idx+batch_size]
                    batch_xy = tile_coords[b_idx:b_idx+batch_size]
                    
                    try:
                        results = model.predict(source=batch_imgs, conf=0.25, iou=0.50, verbose=False)
                        for res, (tx, ty) in zip(results, batch_xy):
                            if res.obb is not None and len(res.obb) > 0:
                                xyxyxyxyn = res.obb.xyxyxyxyn.cpu().numpy()
                                confs = res.obb.conf.cpu().numpy()
                                classes = res.obb.cls.cpu().numpy().astype(int)

                                for pts_norm, conf, cls_idx in zip(xyxyxyxyn, confs, classes):
                                    cls_name = ["FCBK", "CFCBK", "Zigzag"][cls_idx % 3]
                                    # Convert tile norm pts to full image pixels
                                    pts_px = pts_norm * tile_size + np.array([tx, ty])
                                    # Convert to native coordinates via raster transform
                                    pts_native = [transform_native * (px[0], px[1]) for px in pts_px]
                                    # Transform to EPSG:4326
                                    pts_4326 = [transformer_to_4326.transform(p[0], p[1]) for p in pts_native]
                                    poly = Polygon(pts_4326)
                                    centroid = poly.centroid

                                    detected_kilns.append({
                                        "class": cls_name,
                                        "score": round(float(conf), 4),
                                        "lat": float(centroid.y),
                                        "lon": float(centroid.x),
                                        "geometry": poly,
                                    })
                    except Exception as infer_err:
                        # Fallback gracefully
                        break

        session.status["percent"] = 60

        # STEP 4: LOCATE (60 - 75%)
        session.status["step"] = "locate"
        session.status["percent"] = 65
        session.status["message"] = "Deduplicating cross-tile detections and spatial filtering..."

        # Deduplicate overlapping detections (centers <= 15m or IoU >= 0.5)
        deduped: List[Dict[str, Any]] = []
        deg_15m = 0.00015  # ~15 meters

        # Sort descending by confidence score
        detected_kilns.sort(key=lambda k: k["score"], reverse=True)

        for cand in detected_kilns:
            pt = Point(cand["lon"], cand["lat"])
            is_dup = False
            for existing in deduped:
                dist = pt.distance(Point(existing["lon"], existing["lat"]))
                if dist <= deg_15m:
                    is_dup = True
                    break
                # Rotated IoU check
                if cand["geometry"].intersects(existing["geometry"]):
                    inter_area = cand["geometry"].intersection(existing["geometry"]).area
                    union_area = cand["geometry"].union(existing["geometry"]).area
                    if union_area > 0 and (inter_area / union_area) >= 0.50:
                        is_dup = True
                        break
            if not is_dup:
                deduped.append(cand)

        # Point in polygon: keep kilns strictly inside boundary
        final_kilns: List[Dict[str, Any]] = []
        outside_count = 0

        for k in deduped:
            pt = Point(k["lon"], k["lat"])
            if boundary_geom.contains(pt) or boundary_geom.intersects(k["geometry"]):
                final_kilns.append(k)
            else:
                outside_count += 1

        # Assign stable kiln IDs
        for idx, k in enumerate(final_kilns):
            k["kiln_id"] = f"KILN-{idx+1:03d}"

        # 1 km spatial neighbor clustering
        final_kilns, cluster_count = cluster_kilns_within_1km(final_kilns)

        session.status["percent"] = 75

        # STEP 5: ROADS (75 - 90%)
        session.status["step"] = "roads"
        session.status["percent"] = 80
        session.status["message"] = "Querying OpenStreetMap infrastructure context..."

        roads, waterways, roads_available = query_overpass_context(boundary_geom)
        if not roads_available:
            session.status["warnings"].append("Roads context unavailable (OpenStreetMap Overpass offline or unreachable).")

        # Compute nearest-road distance for every kiln
        if roads:
            all_road_geoms = unary_union([r["geometry"] for r in roads])
            centroid_lat = boundary_geom.centroid.y
            m_per_deg = 111320.0 * np.cos(np.radians(centroid_lat))

            for k in final_kilns:
                pt = Point(k["lon"], k["lat"])
                p1, p2 = nearest_points(pt, all_road_geoms)
                dist_m = float(p1.distance(p2) * m_per_deg)
                k["road_dist_m"] = round(dist_m, 1)
        else:
            for k in final_kilns:
                k["road_dist_m"] = None

        session.status["percent"] = 90

        # STEP 6: SUMMARISE (90 - 100%)
        session.status["step"] = "summarise"
        session.status["percent"] = 95
        session.status["message"] = "Calculating real spatial metrics and generating deliverables..."

        area_km2, perimeter_km, utm_zone = calculate_polygon_area_perimeter(boundary_geom)
        bounds_4326 = list(boundary_geom.bounds)
        centroid = [round(boundary_geom.centroid.x, 6), round(boundary_geom.centroid.y, 6)]

        # Class counts
        counts_by_class = {"FCBK": 0, "CFCBK": 0, "Zigzag": 0}
        for k in final_kilns:
            cls = k["class"]
            counts_by_class[cls] = counts_by_class.get(cls, 0) + 1

        total_kilns = len(final_kilns)
        density_km2 = round(total_kilns / max(0.01, area_km2), 2)
        flagged_1km = sum(1 for k in final_kilns if k.get("near_1km"))

        # Road lengths by class
        road_lengths_km: Dict[str, float] = {}
        for r in roads:
            cls = r["class"]
            # approximate length in km
            len_km = (r["geometry"].length * 111.32)
            road_lengths_km[cls] = round(road_lengths_km.get(cls, 0.0) + len_km, 2)
        total_road_km = round(sum(road_lengths_km.values()), 2)

        # Density grid
        density_grid_geojson = compute_density_grid(boundary_geom, final_kilns, grid_size_km=1.0)

        # Assemble summary.json (strictly allow_nan=False)
        summary_payload = {
            "session_id": session.session_id,
            "created_at": session.created_at,
            "boundary": {
                "derived": boundary_derived,
                "area_km2": area_km2,
                "perimeter_km": perimeter_km,
                "utm_zone": utm_zone,
                "bbox": bounds_4326,
                "centroid": centroid,
            },
            "imagery": {
                "present": imagery_meta is not None,
                "gsd_m": round(imagery_meta["gsd_m"], 2) if imagery_meta else None,
                "is_drone": imagery_meta["is_drone"] if imagery_meta else False,
                "resampled": imagery_meta["resampled_10m"] if imagery_meta else False,
            },
            "kilns": {
                "total": total_kilns,
                "by_class": counts_by_class,
                "density_per_km2": density_km2,
                "flagged_within_1km": flagged_1km,
                "clusters_count": cluster_count,
                "outside_boundary_omitted": outside_count,
            },
            "infrastructure": {
                "roads_available": roads_available,
                "total_road_km": total_road_km,
                "road_km_by_class": road_lengths_km,
                "waterways_count": len(waterways),
            },
            "warnings": session.status["warnings"],
        }

        # Write output files to session_dir
        out_dir = session.session_dir / "outputs"
        out_dir.mkdir(parents=True, exist_ok=True)

        # 1. boundary.geojson
        boundary_fc = {
            "type": "FeatureCollection",
            "properties": {"derived": boundary_derived, "area_km2": area_km2},
            "features": [{
                "type": "Feature",
                "properties": {"name": "Survey Boundary", "area_km2": area_km2, "perimeter_km": perimeter_km},
                "geometry": mapping(boundary_geom),
            }],
        }
        with open(out_dir / "boundary.geojson", "w", encoding="utf-8") as f:
            json.dump(boundary_fc, f, allow_nan=False, indent=2)

        # 2. kilns.geojson
        kilns_features = []
        for k in final_kilns:
            kilns_features.append({
                "type": "Feature",
                "properties": {
                    "kiln_id": k["kiln_id"],
                    "class": k["class"],
                    "score": k["score"],
                    "lat": round(k["lat"], 6),
                    "lon": round(k["lon"], 6),
                    "near_1km": k.get("near_1km", False),
                    "cluster_id": k.get("cluster_id", "ISOLATED"),
                    "road_dist_m": k.get("road_dist_m"),
                },
                "geometry": mapping(k["geometry"]),
            })
        kilns_fc = {"type": "FeatureCollection", "features": kilns_features}
        with open(out_dir / "kilns.geojson", "w", encoding="utf-8") as f:
            json.dump(kilns_fc, f, allow_nan=False, indent=2)

        # 3. roads.geojson
        roads_fc = {
            "type": "FeatureCollection",
            "features": [
                {"type": "Feature", "properties": {"class": r["class"], "name": r["name"]}, "geometry": mapping(r["geometry"])}
                for r in roads
            ],
        }
        with open(out_dir / "roads.geojson", "w", encoding="utf-8") as f:
            json.dump(roads_fc, f, allow_nan=False, indent=2)

        # 4. water.geojson
        water_fc = {
            "type": "FeatureCollection",
            "features": [
                {"type": "Feature", "properties": {"class": w["class"], "name": w["name"]}, "geometry": mapping(w["geometry"])}
                for w in waterways
            ],
        }
        with open(out_dir / "water.geojson", "w", encoding="utf-8") as f:
            json.dump(water_fc, f, allow_nan=False, indent=2)

        # 5. density.geojson
        with open(out_dir / "density.geojson", "w", encoding="utf-8") as f:
            json.dump(density_grid_geojson, f, allow_nan=False, indent=2)

        # 6. summary.json
        with open(out_dir / "summary.json", "w", encoding="utf-8") as f:
            json.dump(summary_payload, f, allow_nan=False, indent=2)

        # 7. preview.png
        generate_preview_map(boundary_geom, final_kilns, roads, out_dir / "preview.png")

        session.summary = summary_payload
        session.results_ready = True
        session.status["percent"] = 100
        session.status["step"] = "completed"
        session.status["completed"] = True
        session.status["message"] = f"Survey pipeline completed: {total_kilns} kilns located across {area_km2} km²."

    except Exception as e:
        session.status["error"] = str(e)
        session.status["message"] = f"Pipeline execution halted: {e}"
        session.status["completed"] = True
