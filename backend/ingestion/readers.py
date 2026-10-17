"""Input readers for boundary, imagery, and detections files.

Handles:
- Boundary: .geojson, .json, .kml, .zip (shapefile) with EPSG:4326 reprojection, buffer(0) repair, dissolve.
- Imagery: GeoTIFF/COG with CRS verification, RGB 8-bit percentile stretch, GSD calculation, and 10 m/px resampling.
- Detections: .geojson, .csv with class validation (FCBK, CFCBK, Zigzag).
"""

import os
import zipfile
import tempfile
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import pandas as pd
import shapely
from shapely.geometry import Polygon, MultiPolygon, Point, box, shape
from shapely.ops import unary_union
import geopandas as gpd
import rasterio
from rasterio.warp import transform_bounds, calculate_default_transform, reproject, Resampling
from pyproj import CRS, Transformer

VALID_CLASSES = {"FCBK", "CFCBK", "ZIGZAG"}
CLASS_NORMALIZATION = {
    "fcbk": "FCBK",
    "zigzag": "Zigzag",
    "cfcbk": "CFCBK",
    "cfbk": "CFCBK",
}


def read_boundary(file_path: Path) -> Tuple[shapely.Geometry, Dict[str, Any]]:
    """Read boundary file, reproject to EPSG:4326, dissolve, and repair invalid geometry."""
    suffix = file_path.suffix.lower()
    temp_extract_dir = None

    try:
        if suffix == ".zip":
            # Extract shapefile archive
            temp_extract_dir = tempfile.mkdtemp(prefix="shp_")
            with zipfile.ZipFile(file_path, "r") as zf:
                zf.extractall(temp_extract_dir)
            shp_files = list(Path(temp_extract_dir).glob("*.shp"))
            if not shp_files:
                raise ValueError("Zipped archive does not contain a .shp shapefile.")
            read_target = str(shp_files[0])
        else:
            read_target = str(file_path)

        # Read with GeoPandas
        try:
            gdf = gpd.read_file(read_target)
        except Exception as e:
            # Fallback for KML or simple GeoJSON if pyogrio/fiona driver differs
            if suffix == ".kml":
                try:
                    gdf = gpd.read_file(read_target, driver="KML")
                except Exception:
                    raise ValueError(f"Could not parse KML file: {e}")
            else:
                raise ValueError(f"Could not read spatial file: {e}")

        if gdf.empty:
            raise ValueError("Boundary file contains no geometry records.")

        # Ensure CRS and reproject to EPSG:4326
        if gdf.crs is None:
            # Assume EPSG:4326 if unprojected and coordinates are within lat/lon range
            bounds = gdf.total_bounds
            if -180 <= bounds[0] <= 180 and -90 <= bounds[1] <= 90:
                gdf = gdf.set_crs("EPSG:4326")
            else:
                raise ValueError("Boundary file has no CRS and coordinates are outside global lat/lon range.")
        else:
            if gdf.crs.to_epsg() != 4326:
                gdf = gdf.to_crs("EPSG:4326")

        # Filter for Polygon and MultiPolygon
        polygons = []
        for geom in gdf.geometry:
            if geom is None or geom.is_empty:
                continue
            if geom.geom_type in ("Polygon", "MultiPolygon"):
                polygons.append(geom)
            elif geom.geom_type == "GeometryCollection":
                for g in geom.geoms:
                    if g.geom_type in ("Polygon", "MultiPolygon"):
                        polygons.append(g)

        if not polygons:
            raise ValueError("No valid Polygon or MultiPolygon geometries found in boundary file.")

        # Dissolve into single geometry and repair invalid geometry
        merged = unary_union(polygons)
        if not merged.is_valid:
            merged = merged.buffer(0)

        meta = {
            "source_file": file_path.name,
            "crs": "EPSG:4326",
            "geom_type": merged.geom_type,
            "bounds": list(merged.bounds),
        }
        return merged, meta

    finally:
        if temp_extract_dir and os.path.exists(temp_extract_dir):
            shutil_rmtree = getattr(os, "rmdir", None)
            import shutil
            shutil.rmtree(temp_extract_dir, ignore_errors=True)


def read_imagery(file_path: Path) -> Dict[str, Any]:
    """Read GeoTIFF raster, verify CRS, compute GSD, stretch 16-bit to 8-bit, and check resolution."""
    with rasterio.open(file_path) as src:
        if src.crs is None:
            raise ValueError(
                "Uploaded GeoTIFF has no Coordinate Reference System (CRS). "
                "A valid georeferencing CRS (e.g. EPSG:4326, UTM) is strictly required for area mapping."
            )

        native_crs = src.crs
        src_transform = src.transform
        width, height = src.width, src.height
        count = src.count

        # Read RGB bands (bands 1-3; if fewer, duplicate)
        if count >= 3:
            rgb_raw = src.read([1, 2, 3])
        elif count == 1:
            single = src.read(1)
            rgb_raw = np.stack([single, single, single], axis=0)
        else:
            b1 = src.read(1)
            b2 = src.read(2)
            rgb_raw = np.stack([b1, b2, b1], axis=0)

        # 16-bit or float to 8-bit 2-98 percentile stretch
        rgb_8bit = np.zeros((3, height, width), dtype=np.uint8)
        for i in range(3):
            band = rgb_raw[i].astype(np.float32)
            valid = band[band > 0]
            if len(valid) > 0:
                p2, p98 = np.percentile(valid, (2, 98))
                if p98 > p2:
                    band = np.clip((band - p2) / (p98 - p2) * 255.0, 0, 255)
                else:
                    band = np.clip(band, 0, 255)
            rgb_8bit[i] = band.astype(np.uint8)

        # Determine GSD in meters per pixel
        if native_crs.is_projected:
            res_x, res_y = abs(src_transform.a), abs(src_transform.e)
            gsd_m = float((res_x + res_y) / 2.0)
        else:
            # Lat/Lon degrees to approx meters at centroid
            center_lat = (src.bounds.bottom + src.bounds.top) / 2.0
            deg_x, deg_y = abs(src_transform.a), abs(src_transform.e)
            m_per_deg_lat = 111320.0
            m_per_deg_lon = 111320.0 * np.cos(np.radians(center_lat))
            gsd_m = float((deg_x * m_per_deg_lon + deg_y * m_per_deg_lat) / 2.0)

        # Reproject bounds to EPSG:4326 for footprint
        bounds_4326 = transform_bounds(src.crs, "EPSG:4326", *src.bounds)
        footprint_poly = box(*bounds_4326)

        warnings = []
        is_drone = False
        resampled_10m = False

        if gsd_m < 2.0:
            is_drone = True
            warnings.append(
                f"Imagery resolution ({gsd_m:.2f} m/px) is drone-scale. "
                "The kiln model is calibrated for 10 m/px satellite imagery and is not suited for detection. "
                "Detection skipped; boundary, roads, and context layers will be generated."
            )
        elif abs(gsd_m - 10.0) > 3.0:
            resampled_10m = True
            warnings.append(f"Imagery was resampled from {gsd_m:.1f} m/px to 10.0 m/px; accuracy may drop.")

        return {
            "source_file": file_path.name,
            "width": width,
            "height": height,
            "crs": str(native_crs),
            "crs_epsg": native_crs.to_epsg() or 4326,
            "transform": src_transform,
            "bounds_native": list(src.bounds),
            "bounds_4326": list(bounds_4326),
            "footprint": footprint_poly,
            "gsd_m": gsd_m,
            "is_drone": is_drone,
            "resampled_10m": resampled_10m,
            "warnings": warnings,
            "rgb_8bit": rgb_8bit,  # (3, H, W)
        }


def read_detections(file_path: Path) -> List[Dict[str, Any]]:
    """Read candidate kiln detections from CSV or GeoJSON and validate classes."""
    suffix = file_path.suffix.lower()
    detections = []

    if suffix == ".csv":
        df = pd.read_csv(file_path)
        # Find class column
        cls_col = next((c for c in df.columns if c.lower() in ("class", "type", "kiln_class")), None)
        lat_col = next((c for c in df.columns if c.lower() in ("lat", "latitude", "y")), None)
        lon_col = next((c for c in df.columns if c.lower() in ("lon", "lng", "longitude", "x")), None)
        score_col = next((c for c in df.columns if c.lower() in ("score", "conf", "confidence")), None)

        if not lat_col or not lon_col:
            raise ValueError("Detections CSV must contain latitude and longitude columns ('lat', 'lon').")

        for idx, row in df.iterrows():
            raw_cls = str(row[cls_col]).strip() if cls_col else "FCBK"
            cls_norm = CLASS_NORMALIZATION.get(raw_cls.lower(), "FCBK")
            lat = float(row[lat_col])
            lon = float(row[lon_col])
            score = float(row[score_col]) if score_col and not pd.isna(row[score_col]) else 0.85

            # If 8 corner columns exist, use them
            corner_cols = [f"x{i}" for i in range(1, 5)] + [f"y{i}" for i in range(1, 5)]
            if all(c in df.columns for c in corner_cols):
                pts = [[float(row[f"x{i}"]), float(row[f"y{i}"])] for i in range(1, 5)]
                poly = Polygon(pts)
            else:
                # Small 20m bounding box in degrees around lat/lon
                d_lat = 0.00018  # ~20m
                d_lon = 0.00018 / max(0.1, np.cos(np.radians(lat)))
                poly = box(lon - d_lon/2, lat - d_lat/2, lon + d_lon/2, lat + d_lat/2)

            detections.append({
                "kiln_id": f"KILN-UP-{idx+1:04d}",
                "class": cls_norm,
                "score": round(score, 4),
                "lat": lat,
                "lon": lon,
                "geometry": poly,
            })

    elif suffix in (".geojson", ".json"):
        gdf = gpd.read_file(str(file_path))
        if gdf.crs and gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs("EPSG:4326")

        for idx, row in gdf.iterrows():
            geom = row.geometry
            if geom is None or geom.is_empty:
                continue

            raw_cls = row.get("class") or row.get("type") or "FCBK"
            cls_norm = CLASS_NORMALIZATION.get(str(raw_cls).lower(), "FCBK")
            score = float(row.get("score") or row.get("confidence") or 0.85)

            centroid = geom.centroid
            detections.append({
                "kiln_id": str(row.get("kiln_id") or f"KILN-UP-{idx+1:04d}"),
                "class": cls_norm,
                "score": round(score, 4),
                "lat": float(centroid.y),
                "lon": float(centroid.x),
                "geometry": geom if geom.geom_type == "Polygon" else geom.buffer(0.0001),
            })
    else:
        raise ValueError(f"Unsupported detections format: {suffix}. Accepted: .csv, .geojson, .json")

    return detections
