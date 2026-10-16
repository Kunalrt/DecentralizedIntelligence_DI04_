"""Postprocessing utilities for OBB predictions, submission generation, and strict schema validation."""

from pathlib import Path
from typing import List, Dict, Any, Union, Tuple
import numpy as np
import pandas as pd

VALID_CLASSES = {"FCBK", "CFCBK", "Zigzag"}
SUBMISSION_COLUMNS = ["tile_id", "class", "x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4", "score"]


def format_detection_row(
    tile_id: str,
    cls_name: str,
    corners_norm: np.ndarray,
    score: float,
) -> Dict[str, Any]:
    """Format single detection to competition submission schema.
    
    Args:
        tile_id: Identifier of the Sentinel-2 tile without extension.
        cls_name: Exact class name ('FCBK', 'CFCBK', 'Zigzag').
        corners_norm: 8-element float array [x1, y1, x2, y2, x3, y3, x4, y4] in [0, 1].
        score: Confidence probability float.
    """
    assert cls_name in VALID_CLASSES, f"Invalid class: {cls_name}"
    coords = np.clip(corners_norm, 0.0, 1.0)
    return {
        "tile_id": str(tile_id),
        "class": str(cls_name),
        "x1": round(float(coords[0]), 5),
        "y1": round(float(coords[1]), 5),
        "x2": round(float(coords[2]), 5),
        "y2": round(float(coords[3]), 5),
        "x3": round(float(coords[4]), 5),
        "y3": round(float(coords[5]), 5),
        "x4": round(float(coords[6]), 5),
        "y4": round(float(coords[7]), 5),
        "score": round(float(score), 5),
    }


def save_submission_csv(rows: List[Dict[str, Any]], output_path: Union[str, Path]) -> Path:
    """Save formatted detections to submission CSV."""
    df = pd.DataFrame(rows, columns=SUBMISSION_COLUMNS)
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)
    print(f"[INFO] Saved {len(df)} predictions to {out.resolve()}")
    return out


def validate_submission_csv(csv_path: Union[str, Path]) -> Tuple[bool, List[str]]:
    """Strictly validate submission CSV according to competition hard rules.
    
    Checks:
    1. Exact column names and order
    2. Exact class names in {'FCBK', 'CFCBK', 'Zigzag'}
    3. Normalized coordinates in [0.0, 1.0]
    4. Confidence scores in [0.0, 1.0]
    5. Zero NaN, Null, or infinite values
    6. Non-empty string tile_ids
    """
    path = Path(csv_path)
    errors: List[str] = []

    if not path.exists():
        return False, [f"File not found: {path}"]

    try:
        df = pd.read_csv(path)
    except Exception as e:
        return False, [f"Failed to read CSV: {e}"]

    # 1. Header validation
    if list(df.columns) != SUBMISSION_COLUMNS:
        errors.append(f"Header mismatch. Expected {SUBMISSION_COLUMNS}, got {list(df.columns)}")

    if len(df) == 0:
        print("[WARN] Submission CSV has 0 rows (valid only if all test tiles are empty).")
        return len(errors) == 0, errors

    # 2. Null / NaN check
    if df.isna().any().any():
        null_counts = df.isna().sum().to_dict()
        errors.append(f"CSV contains NaN/null values: {null_counts}")

    # 3. Class names check
    invalid_classes = set(df["class"].unique()) - VALID_CLASSES
    if invalid_classes:
        errors.append(f"Found invalid class names: {invalid_classes}. Must be in {VALID_CLASSES}")

    # 4. Coordinate range check [0.0, 1.0]
    coord_cols = ["x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4"]
    for c in coord_cols:
        if not pd.api.types.is_numeric_dtype(df[c]):
            errors.append(f"Coordinate column '{c}' is non-numeric.")
            continue
        min_val, max_val = df[c].min(), df[c].max()
        if min_val < -1e-4 or max_val > 1.0001:
            errors.append(f"Coordinate column '{c}' out of [0, 1] bounds: min={min_val}, max={max_val}")

    # 5. Score check [0.0, 1.0]
    if not pd.api.types.is_numeric_dtype(df["score"]):
        errors.append("Column 'score' is non-numeric.")
    else:
        min_s, max_s = df["score"].min(), df["score"].max()
        if min_s < 0.0 or max_s > 1.0:
            errors.append(f"Confidence score out of [0, 1] range: min={min_s}, max={max_s}")

    # 6. Tile id check
    if (df["tile_id"].astype(str).str.strip() == "").any():
        errors.append("Found empty string tile_id entries.")

    is_valid = len(errors) == 0
    if is_valid:
        print(f"[SUCCESS] Submission CSV passed all {len(SUBMISSION_COLUMNS)} schema validation checks ({len(df)} rows).")
    else:
        print(f"[ERROR] Submission CSV failed validation with {len(errors)} errors:")
        for err in errors:
            print(f"  - {err}")

    return is_valid, errors
