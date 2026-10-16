"""Postprocessing utilities for OBB predictions and submission generation."""

from pathlib import Path
from typing import List, Dict, Any, Union
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
        "tile_id": tile_id,
        "class": cls_name,
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
