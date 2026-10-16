"""Unit tests for inference pipeline, submission formatting, schema validation, and latency constraints."""

import sys
from pathlib import Path
import numpy as np
import pandas as pd

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.postprocess import format_detection_row, save_submission_csv, validate_submission_csv, SUBMISSION_COLUMNS
from src.infer import benchmark_8k_inference_latency


def test_submission_schema_and_validation():
    # 1. Valid row
    valid_corners = np.array([0.1, 0.1, 0.4, 0.1, 0.4, 0.3, 0.1, 0.3], dtype=np.float32)
    row = format_detection_row("test_01", "FCBK", valid_corners, 0.85)
    assert row["tile_id"] == "test_01"
    assert row["class"] == "FCBK"
    assert row["x1"] == 0.1
    assert row["score"] == 0.85

    # 2. Save and validate
    test_csv = PROJECT_ROOT / "runs" / "test_validate.csv"
    save_submission_csv([row], test_csv)
    is_valid, errors = validate_submission_csv(test_csv)
    assert is_valid, f"Expected valid CSV, got errors: {errors}"
    print("[PASS] test_submission_schema_and_validation (Valid Case)")

    # 3. Invalid Class test
    invalid_rows = [
        {"tile_id": "test_02", "class": "UnknownKiln", "x1": 0.1, "y1": 0.1, "x2": 0.4, "y2": 0.1,
         "x3": 0.4, "y3": 0.3, "x4": 0.1, "y4": 0.3, "score": 0.9}
    ]
    pd.DataFrame(invalid_rows).to_csv(test_csv, index=False)
    is_valid, errors = validate_submission_csv(test_csv)
    assert not is_valid, "Expected invalid class to fail validation"
    assert any("UnknownKiln" in e for e in errors)
    print("[PASS] test_submission_schema_and_validation (Invalid Class Detected)")

    # 4. Out-of-bounds coordinate test
    oob_rows = [
        {"tile_id": "test_03", "class": "FCBK", "x1": 1.5, "y1": 0.1, "x2": 0.4, "y2": 0.1,
         "x3": 0.4, "y3": 0.3, "x4": 0.1, "y4": 0.3, "score": 0.9}
    ]
    pd.DataFrame(oob_rows).to_csv(test_csv, index=False)
    is_valid, errors = validate_submission_csv(test_csv)
    assert not is_valid, "Expected out-of-bounds coordinate to fail validation"
    print("[PASS] test_submission_schema_and_validation (Out-of-Bounds Coordinate Detected)")

    # Clean up test artifact
    if test_csv.exists():
        test_csv.unlink()


def test_latency_under_15_minutes():
    bench = benchmark_8k_inference_latency(batch_size=64, benchmark_samples=64)
    assert bench["projected_8k_min"] < 15.0
    assert bench["throughput_tiles_per_sec"] > 50.0  # Must be fast (>50 tiles/s)
    print(f"[PASS] test_latency_under_15_minutes: {bench['projected_8k_min']:.2f} min << 15.0 min ceiling")


if __name__ == "__main__":
    test_submission_schema_and_validation()
    test_latency_under_15_minutes()
    print("\n[ALL INFERENCE & VALIDATION TESTS PASSED!]")
