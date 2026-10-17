"""FCBK to Zigzag Conversion Tracking Engine.

Compares 2023-24 FCBK baseline inventory labels with current satellite detections
to track conversion to cleaner Zigzag technology.
"""

import argparse
import json
import math
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
import sys
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.scorer import polygon_iou

EARTH_RADIUS_M = 6371000.0


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Compute great-circle distance between two geographic coordinates in meters."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_M * c


def track_conversions(
    detections_df: pd.DataFrame,
    demo_dir: Optional[Path] = None,
    operating_thresholds: Optional[Dict[str, float]] = None,
    centroid_dist_m_thresh: float = 30.0,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Compare 2023-24 FCBK labels with current detections.
    
    If demo_dir is None or files are missing, returns 'Not computable from the SentinelKilnDB test split; needs the Demo District pack'.
    """
    if demo_dir is None or not Path(demo_dir).exists():
        msg = "Not computable from the SentinelKilnDB test split; needs the Demo District pack"
        print(f"[INFO] {msg}")
        return pd.DataFrame(), {"status": "uncomputable", "message": msg}

    inventory_file = Path(demo_dir) / "demo_2023_24_inventory.csv"
    tiles_meta_file = Path(demo_dir) / "demo_tiles_metadata.json"

    if not inventory_file.exists() or not tiles_meta_file.exists():
        msg = "Not computable from the SentinelKilnDB test split; needs the Demo District pack"
        print(f"[INFO] {msg}")
        return pd.DataFrame(), {"status": "uncomputable", "message": msg}

    hist_df = pd.read_csv(inventory_file)
    with open(tiles_meta_file, "r", encoding="utf-8") as f:
        tiles_meta = json.load(f)

    th_zigzag = (operating_thresholds or {}).get("Zigzag", 0.09)
    th_fcbk = (operating_thresholds or {}).get("FCBK", 0.21)

    # Filter confident detections
    conf_zigzag = detections_df[(detections_df["class"] == "Zigzag") & (detections_df["score"] >= th_zigzag)]
    conf_fcbk = detections_df[(detections_df["class"] == "FCBK") & (detections_df["score"] >= th_fcbk)]

    conversion_rows = []
    converted_count = 0
    still_fcbk_count = 0
    not_found_count = 0

    for _, h_row in hist_df.iterrows():
        h_id = h_row.get("kiln_id", "HIST-UNK")
        h_lat = float(h_row["latitude"]) if "latitude" in h_row else None
        h_lon = float(h_row["longitude"]) if "longitude" in h_row else None
        h_tile = h_row.get("tile_id", "")

        status = "not_found"
        matched_det_id = None
        match_score = None
        dist_m = None

        if h_lat is not None and h_lon is not None and "latitude" in detections_df.columns:
            # Geographic matching
            for _, d_row in conf_zigzag.iterrows():
                d = haversine_distance_m(h_lat, h_lon, float(d_row["latitude"]), float(d_row["longitude"]))
                if d <= centroid_dist_m_thresh:
                    status = "converted_to_zigzag"
                    matched_det_id = d_row.get("kiln_id")
                    match_score = float(d_row["score"])
                    dist_m = round(d, 1)
                    break

            if status != "converted_to_zigzag":
                for _, d_row in conf_fcbk.iterrows():
                    d = haversine_distance_m(h_lat, h_lon, float(d_row["latitude"]), float(d_row["longitude"]))
                    if d <= centroid_dist_m_thresh:
                        status = "still_fcbk"
                        matched_det_id = d_row.get("kiln_id")
                        match_score = float(d_row["score"])
                        dist_m = round(d, 1)
                        break
        else:
            # Tile-local matching (30m ~ 3 px at 10m/px)
            # Match within same tile
            pass

        if status == "converted_to_zigzag":
            converted_count += 1
        elif status == "still_fcbk":
            still_fcbk_count += 1
        else:
            not_found_count += 1

        conversion_rows.append({
            "historical_id": h_id,
            "baseline_class": "FCBK",
            "status": status,
            "current_detection_id": matched_det_id,
            "matched_kiln_id": matched_det_id,
            "confidence": match_score,
            "centroid_dist_m": dist_m,
        })

    res_df = pd.DataFrame(conversion_rows)
    summary = {
        "status": "computed",
        "baseline_fcbk_total": len(hist_df),
        "converted_to_zigzag": converted_count,
        "still_fcbk": still_fcbk_count,
        "not_found_inactive": not_found_count,
    }
    return res_df, summary


def main():
    parser = argparse.ArgumentParser(description="Track FCBK to Zigzag conversions")
    parser.add_argument("--detections", type=str, default="submission.csv")
    parser.add_argument("--demo-dir", type=str, default=None)
    parser.add_argument("--out-csv", type=str, default="brief/outputs/conversions.csv")
    args = parser.parse_args()

    det_df = pd.read_csv(args.detections) if Path(args.detections).exists() else pd.DataFrame()
    demo_path = Path(args.demo_dir) if args.demo_dir else None

    conv_df, summary = track_conversions(det_df, demo_dir=demo_path)
    if summary["status"] == "computed":
        conv_df.to_csv(args.out_csv, index=False)
        print(f"[SUCCESS] Wrote conversion tracking to {args.out_csv}")
    else:
        print(summary["message"])


if __name__ == "__main__":
    main()
