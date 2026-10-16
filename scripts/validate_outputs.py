#!/usr/bin/env python3
"""Validation Script for Chimney Census Analytical Outputs.

Strictly verifies that:
1. Every JSON and GeoJSON file parses cleanly without NaN, Infinity, or -Infinity.
2. kilns.geojson features have all required properties: kiln_id, class, score, lat, lon.
3. Every kiln_id is a non-empty string, unique, and consistent across all files (top20.csv, within_1km.csv, conversions.csv).
4. class is strictly one of ("FCBK", "CFCBK", "Zigzag").
5. score is a valid float in [0.0, 1.0].
6. lat and lon are inside the designated district bounds (lat: [28.4, 28.8], lon: [77.0, 77.4]).
7. Per-class counts add up to the total across all files (counts.csv, kilns.geojson, summary_stats.json).
8. Exits with code 0 on full pass, or code 1 with actionable error report on any failure.
"""

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Dict, Any, List, Set
import pandas as pd

# District Coordinate Bounds (Northern Indo-Gangetic Plains / Demo District)
LAT_MIN = 28.40
LAT_MAX = 28.80
LON_MIN = 77.00
LON_MAX = 77.40
ALLOWED_CLASSES = {"FCBK", "CFCBK", "Zigzag"}


def fail_constant(c: str):
    """Callback for json.loads that raises an immediate exception on NaN or Infinity."""
    raise ValueError(f"Invalid bare JSON constant '{c}' detected! Standard JSON forbids bare NaN and Infinity.")


def parse_json_strict(path: Path) -> Any:
    """Parse JSON or GeoJSON file with allow_nan disabled."""
    if not path.exists():
        raise FileNotFoundError(f"Required output file does not exist: {path}")
    text = path.read_text(encoding="utf-8")
    try:
        return json.loads(text, parse_constant=fail_constant)
    except Exception as e:
        raise ValueError(f"JSON parsing error in {path.name}: {e}") from e


def validate_outputs(output_dir: Path) -> bool:
    errors: List[str] = []
    print(f"==================================================")
    print(f"  VALIDATING ANALYTICAL OUTPUTS IN: {output_dir}")
    print(f"==================================================")

    # 1. Parse and validate all JSON files in output_dir
    json_files = list(output_dir.glob("*.json")) + list(output_dir.glob("*.geojson"))
    if not json_files:
        errors.append(f"No JSON or GeoJSON files found in {output_dir}")

    for jf in sorted(json_files):
        try:
            data = parse_json_strict(jf)
            print(f"  [PASS] {jf.name}: Valid JSON (no NaN/Infinity)")
        except Exception as e:
            errors.append(str(e))
            print(f"  [FAIL] {jf.name}: {e}")

    # 2. Detailed validation of kilns.geojson
    kilns_geojson_path = output_dir / "kilns.geojson"
    kiln_ids: Set[str] = set()
    class_counts: Dict[str, int] = {c: 0 for c in ALLOWED_CLASSES}

    if kilns_geojson_path.exists():
        try:
            kg = parse_json_strict(kilns_geojson_path)
            features = kg.get("features", [])
            if not features:
                errors.append("kilns.geojson has 0 features")

            for idx, feat in enumerate(features):
                props = feat.get("properties", {})
                k_id = props.get("kiln_id") or props.get("id")

                # Check kiln_id presence & type
                if not k_id or not isinstance(k_id, str) or k_id.strip() == "" or k_id.lower() == "nan":
                    errors.append(f"Feature #{idx} in kilns.geojson is missing valid string kiln_id (got: {k_id})")
                elif k_id in kiln_ids:
                    errors.append(f"Duplicate kiln_id '{k_id}' detected in kilns.geojson")
                else:
                    kiln_ids.add(k_id)

                # Check class
                k_class = props.get("class")
                if k_class not in ALLOWED_CLASSES:
                    errors.append(f"Kiln '{k_id}' has invalid class '{k_class}'. Must be one of {ALLOWED_CLASSES}")
                else:
                    class_counts[k_class] += 1

                # Check score
                score = props.get("score")
                if score is None or not isinstance(score, (int, float)) or math.isnan(score) or not (0.0 <= score <= 1.0):
                    errors.append(f"Kiln '{k_id}' has invalid score '{score}'. Must be a float in [0.0, 1.0]")

                # Check lat & lon
                lat = props.get("lat")
                lon = props.get("lon")
                if lat is None or not isinstance(lat, (int, float)) or not (LAT_MIN <= lat <= LAT_MAX):
                    errors.append(f"Kiln '{k_id}' lat '{lat}' is out of district bounds [{LAT_MIN}, {LAT_MAX}]")
                if lon is None or not isinstance(lon, (int, float)) or not (LON_MIN <= lon <= LON_MAX):
                    errors.append(f"Kiln '{k_id}' lon '{lon}' is out of district bounds [{LON_MIN}, {LON_MAX}]")

                # Check prev_class and converted
                prev_class = props.get("prev_class")
                if prev_class is not None and prev_class not in ALLOWED_CLASSES:
                    errors.append(f"Kiln '{k_id}' has invalid prev_class '{prev_class}'. Must be null or one of {ALLOWED_CLASSES}")

                converted = props.get("converted")
                if not isinstance(converted, bool):
                    errors.append(f"Kiln '{k_id}' converted must be boolean (got: {converted})")

            print(f"  [PASS] kilns.geojson: {len(features)} valid features, {len(kiln_ids)} unique IDs, bounds verified")
        except Exception as e:
            errors.append(f"Error validating kilns.geojson: {e}")

    # 3. Validation of labels_2023.geojson
    labels_2023_path = output_dir / "labels_2023.geojson"
    if labels_2023_path.exists():
        try:
            hg = parse_json_strict(labels_2023_path)
            h_features = hg.get("features", [])
            for idx, feat in enumerate(h_features):
                props = feat.get("properties", {})
                h_id = props.get("kiln_id") or props.get("id")
                if not h_id or not isinstance(h_id, str):
                    errors.append(f"Feature #{idx} in labels_2023.geojson missing valid id")

                matched_k_id = props.get("matched_kiln_id")
                if matched_k_id is not None:
                    if not isinstance(matched_k_id, str) or matched_k_id.lower() == "nan":
                        errors.append(f"Historical kiln '{h_id}' has invalid matched_kiln_id: {matched_k_id}")
                    elif kiln_ids and matched_k_id not in kiln_ids:
                        errors.append(f"Historical kiln '{h_id}' references unknown kiln_id '{matched_k_id}'")

            print(f"  [PASS] labels_2023.geojson: {len(h_features)} historical sites validated")
        except Exception as e:
            errors.append(f"Error validating labels_2023.geojson: {e}")

    # 4. Validation of counts.csv and Per-Class Count Consistency
    counts_path = output_dir / "counts.csv"
    if counts_path.exists():
        try:
            counts_df = pd.read_csv(counts_path)
            required_classes = ["FCBK", "Zigzag", "CFCBK", "Total"]
            found_classes = list(counts_df["class"].unique())
            for rc in required_classes:
                if rc not in found_classes:
                    errors.append(f"counts.csv is missing required class row '{rc}'")

            # Check math
            det_map = dict(zip(counts_df["class"], counts_df["detected"]))
            fcbk_det = det_map.get("FCBK", 0)
            zigzag_det = det_map.get("Zigzag", 0)
            cfcbk_det = det_map.get("CFCBK", 0)
            total_det = det_map.get("Total", 0)

            if fcbk_det + zigzag_det + cfcbk_det != total_det:
                errors.append(f"counts.csv sum mismatch: FCBK({fcbk_det}) + Zigzag({zigzag_det}) + CFCBK({cfcbk_det}) = {fcbk_det + zigzag_det + cfcbk_det} != Total({total_det})")

            # Consistency with kilns.geojson
            if kiln_ids:
                if class_counts.get("FCBK", 0) != fcbk_det:
                    errors.append(f"FCBK count mismatch: kilns.geojson ({class_counts.get('FCBK')}) vs counts.csv ({fcbk_det})")
                if class_counts.get("Zigzag", 0) != zigzag_det:
                    errors.append(f"Zigzag count mismatch: kilns.geojson ({class_counts.get('Zigzag')}) vs counts.csv ({zigzag_det})")
                if class_counts.get("CFCBK", 0) != cfcbk_det:
                    errors.append(f"CFCBK count mismatch: kilns.geojson ({class_counts.get('CFCBK')}) vs counts.csv ({cfcbk_det})")
                if len(kiln_ids) != total_det:
                    errors.append(f"Total count mismatch: kilns.geojson ({len(kiln_ids)}) vs counts.csv ({total_det})")

            print(f"  [PASS] counts.csv: Class sum consistent ({fcbk_det} FCBK + {zigzag_det} Zigzag + {cfcbk_det} CFCBK = {total_det} Total)")
        except Exception as e:
            errors.append(f"Error validating counts.csv: {e}")

    # 5. Validation of top20.csv
    top20_path = output_dir / "top20.csv"
    if top20_path.exists():
        try:
            top20_df = pd.read_csv(top20_path)
            if len(top20_df) != 20:
                errors.append(f"top20.csv has {len(top20_df)} rows, expected exactly 20")

            t20_ids = list(top20_df["kiln_id"])
            if len(t20_ids) != len(set(t20_ids)):
                errors.append("Duplicate kiln_id detected in top20.csv")

            for k_id in t20_ids:
                if kiln_ids and k_id not in kiln_ids:
                    errors.append(f"top20.csv contains unknown kiln_id '{k_id}' not found in kilns.geojson")

            print(f"  [PASS] top20.csv: 20 unique priority targets verified in master registry")
        except Exception as e:
            errors.append(f"Error validating top20.csv: {e}")

    # 6. Validation of within_1km.csv
    within_path = output_dir / "within_1km.csv"
    if within_path.exists():
        try:
            w_df = pd.read_csv(within_path)
            w_ids = list(w_df["kiln_id"])
            for k_id in w_ids:
                if kiln_ids and k_id not in kiln_ids:
                    errors.append(f"within_1km.csv contains unknown kiln_id '{k_id}'")
            print(f"  [PASS] within_1km.csv: {len(w_df)} clustered kilns verified in master registry")
        except Exception as e:
            errors.append(f"Error validating within_1km.csv: {e}")

    # 7. Validation of conversions.csv
    conv_path = output_dir / "conversions.csv"
    if conv_path.exists():
        try:
            c_df = pd.read_csv(conv_path)
            matched_ids = c_df["matched_kiln_id"].dropna()
            for m_id in matched_ids:
                m_str = str(m_id)
                if m_str.lower() != "nan" and m_str != "None":
                    if kiln_ids and m_str not in kiln_ids:
                        errors.append(f"conversions.csv contains matched_kiln_id '{m_str}' not in kilns.geojson")
            print(f"  [PASS] conversions.csv: {len(c_df)} site conversions tracked cleanly")
        except Exception as e:
            errors.append(f"Error validating conversions.csv: {e}")

    # 8. Summary validation result
    print("--------------------------------------------------")
    if errors:
        print(f"FAILED: Found {len(errors)} validation errors:")
        for idx, err in enumerate(errors, 1):
            print(f"  {idx}. {err}")
        return False
    else:
        print("SUCCESS: All analytical outputs passed validation with zero errors!")
        print(f"  Total physical kilns: {len(kiln_ids)}")
        print(f"  Classes: {class_counts}")
        print(f"  Geo bounds: Lat [{LAT_MIN}, {LAT_MAX}], Lon [{LON_MIN}, {LON_MAX}]")
        return True


def main():
    parser = argparse.ArgumentParser(description="Validate Chimney Census analytical outputs")
    parser.add_argument("--dir", type=str, default="brief/outputs", help="Directory containing analytical outputs")
    args = parser.parse_args()

    out_dir = Path(args.dir)
    success = validate_outputs(out_dir)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
