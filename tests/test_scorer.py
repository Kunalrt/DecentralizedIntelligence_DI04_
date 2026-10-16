"""Unit tests for rotated IoU and DOTA-style all-point interpolated mAP@0.5 evaluation engine."""

import sys
from pathlib import Path
import numpy as np
import pandas as pd

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.scorer import (
    polygon_iou,
    compute_all_point_ap,
    evaluate_detections,
    load_ground_truth,
    CLASS_NAMES,
)


def test_polygon_iou_identical():
    # Box 1: [0.2, 0.2, 0.6, 0.2, 0.6, 0.5, 0.2, 0.5]
    box = np.array([0.2, 0.2, 0.6, 0.2, 0.6, 0.5, 0.2, 0.5], dtype=np.float32)
    iou = polygon_iou(box, box)
    assert abs(iou - 1.0) < 1e-4, f"Expected 1.0 for identical boxes, got {iou}"
    print(f"[PASS] test_polygon_iou_identical: IoU={iou:.4f}")


def test_polygon_iou_disjoint():
    box1 = np.array([0.1, 0.1, 0.3, 0.1, 0.3, 0.3, 0.1, 0.3], dtype=np.float32)
    box2 = np.array([0.6, 0.6, 0.9, 0.6, 0.9, 0.9, 0.6, 0.9], dtype=np.float32)
    iou = polygon_iou(box1, box2)
    assert abs(iou - 0.0) < 1e-4, f"Expected 0.0 for disjoint boxes, got {iou}"
    print(f"[PASS] test_polygon_iou_disjoint: IoU={iou:.4f}")


def test_polygon_iou_rotated():
    # 45-degree diamond vs axis-aligned square centered at (0.5, 0.5)
    # Diamond: vertices at (0.5, 0.3), (0.7, 0.5), (0.5, 0.7), (0.3, 0.5)
    diamond = np.array([0.5, 0.3, 0.7, 0.5, 0.5, 0.7, 0.3, 0.5], dtype=np.float32)
    square = np.array([0.3, 0.3, 0.7, 0.3, 0.7, 0.7, 0.3, 0.7], dtype=np.float32)
    # Diamond area = 0.5 * d1 * d2 = 0.5 * 0.4 * 0.4 = 0.08
    # Square area = 0.4 * 0.4 = 0.16
    # Intersection = diamond area = 0.08, Union = square area = 0.16 -> IoU = 0.5
    iou = polygon_iou(diamond, square)
    assert abs(iou - 0.5) < 1e-3, f"Expected 0.5 for diamond inside square, got {iou}"
    print(f"[PASS] test_polygon_iou_rotated: IoU={iou:.4f}")


def test_all_point_ap():
    # Perfect detection: Recall 1.0 at Precision 1.0
    recalls = np.array([0.2, 0.4, 0.6, 0.8, 1.0])
    precisions = np.array([1.0, 1.0, 1.0, 1.0, 1.0])
    ap = compute_all_point_ap(recalls, precisions)
    assert abs(ap - 1.0) < 1e-4, f"Expected 1.0 for perfect AP, got {ap}"

    # Deteriorating precision
    recalls = np.array([0.5, 1.0])
    precisions = np.array([1.0, 0.5])
    ap = compute_all_point_ap(recalls, precisions)
    assert 0.5 < ap <= 1.0
    print(f"[PASS] test_all_point_ap: AP={ap:.4f}")


def test_macro_average_equal_weighting():
    """Verify that CFCBK (rare ~3%) carries equal 1/3 weight in the final score."""
    gt_rows = [
        {"tile_id": "t1", "class": "FCBK", "x1": 0.1, "y1": 0.1, "x2": 0.4, "y2": 0.1, "x3": 0.4, "y3": 0.4, "x4": 0.1, "y4": 0.4},
        {"tile_id": "t2", "class": "Zigzag", "x1": 0.2, "y1": 0.2, "x2": 0.5, "y2": 0.2, "x3": 0.5, "y3": 0.5, "x4": 0.2, "y4": 0.5},
        {"tile_id": "t3", "class": "CFCBK", "x1": 0.3, "y1": 0.3, "x2": 0.6, "y2": 0.3, "x3": 0.6, "y3": 0.6, "x4": 0.3, "y4": 0.6},
    ]
    gt_df = pd.DataFrame(gt_rows)

    # Predictions where FCBK and Zigzag are perfectly detected, but CFCBK is completely missed
    pred_rows = [
        {"tile_id": "t1", "class": "FCBK", "x1": 0.1, "y1": 0.1, "x2": 0.4, "y2": 0.1, "x3": 0.4, "y3": 0.4, "x4": 0.1, "y4": 0.4, "score": 0.99},
        {"tile_id": "t2", "class": "Zigzag", "x1": 0.2, "y1": 0.2, "x2": 0.5, "y2": 0.2, "x3": 0.5, "y3": 0.5, "x4": 0.2, "y4": 0.5, "score": 0.98},
    ]
    pred_df = pd.DataFrame(pred_rows)

    metrics = evaluate_detections(pred_df, gt_df, iou_thresh=0.5)
    assert abs(metrics["AP_FCBK"] - 1.0) < 1e-4
    assert abs(metrics["AP_Zigzag"] - 1.0) < 1e-4
    assert abs(metrics["AP_CFCBK"] - 0.0) < 1e-4

    expected_macro = (1.0 + 1.0 + 0.0) / 3.0
    assert abs(metrics["mAP@0.5"] - expected_macro) < 1e-4, f"Expected {expected_macro}, got {metrics['mAP@0.5']}"
    print(f"[PASS] test_macro_average_equal_weighting: mAP@0.5 = {metrics['mAP@0.5']:.4f} (FCBK=1.0, Zigzag=1.0, CFCBK=0.0)")


def test_problem_example_zigzag_fcbk_false_alarm():
    """Unit test matching the exact problem specification:
    - Zigzag IoU ~0.72 (TP)
    - FCBK IoU ~0.82 (TP)
    - Low-score false alarm (FP)
    - Outputs per-class AP and macro mAP
    """
    # 1. Ground Truth boxes
    gt_zigzag_pts = np.array([0.2, 0.2, 0.6, 0.2, 0.6, 0.4, 0.2, 0.4], dtype=np.float32)
    gt_fcbk_pts = np.array([0.3, 0.3, 0.7, 0.3, 0.7, 0.5, 0.3, 0.5], dtype=np.float32)
    gt_cfcbk_pts = np.array([0.4, 0.4, 0.6, 0.4, 0.6, 0.6, 0.4, 0.6], dtype=np.float32)

    gt_rows = [
        {"tile_id": "tile_alpha", "class": "Zigzag", "x1": 0.2, "y1": 0.2, "x2": 0.6, "y2": 0.2, "x3": 0.6, "y3": 0.4, "x4": 0.2, "y4": 0.4},
        {"tile_id": "tile_alpha", "class": "FCBK", "x1": 0.3, "y1": 0.3, "x2": 0.7, "y2": 0.3, "x3": 0.7, "y3": 0.5, "x4": 0.3, "y4": 0.5},
        {"tile_id": "tile_beta", "class": "CFCBK", "x1": 0.4, "y1": 0.4, "x2": 0.6, "y2": 0.4, "x3": 0.6, "y3": 0.6, "x4": 0.4, "y4": 0.6},
    ]
    gt_df = pd.DataFrame(gt_rows)

    # 2. Predicted boxes:
    # Zigzag prediction shifted to give IoU ~ 0.72
    pred_zigzag_pts = np.array([0.2 + 0.06512, 0.2, 0.6 + 0.06512, 0.2, 0.6 + 0.06512, 0.4, 0.2 + 0.06512, 0.4], dtype=np.float32)
    # FCBK prediction shifted to give IoU ~ 0.82
    pred_fcbk_pts = np.array([0.3 + 0.03956, 0.3, 0.7 + 0.03956, 0.3, 0.7 + 0.03956, 0.5, 0.3 + 0.03956, 0.5], dtype=np.float32)
    # Low-score false alarm on an empty tile
    pred_fa_pts = np.array([0.1, 0.1, 0.3, 0.1, 0.3, 0.3, 0.1, 0.3], dtype=np.float32)

    iou_zigzag = polygon_iou(pred_zigzag_pts, gt_zigzag_pts)
    iou_fcbk = polygon_iou(pred_fcbk_pts, gt_fcbk_pts)

    assert abs(iou_zigzag - 0.72) < 0.005, f"Expected Zigzag IoU ~0.72, got {iou_zigzag:.4f}"
    assert abs(iou_fcbk - 0.82) < 0.005, f"Expected FCBK IoU ~0.82, got {iou_fcbk:.4f}"

    pred_rows = [
        # Zigzag high-confidence TP (IoU ~ 0.72)
        {"tile_id": "tile_alpha", "class": "Zigzag",
         "x1": pred_zigzag_pts[0], "y1": pred_zigzag_pts[1],
         "x2": pred_zigzag_pts[2], "y2": pred_zigzag_pts[3],
         "x3": pred_zigzag_pts[4], "y3": pred_zigzag_pts[5],
         "x4": pred_zigzag_pts[6], "y4": pred_zigzag_pts[7],
         "score": 0.94},
        # FCBK high-confidence TP (IoU ~ 0.82)
        {"tile_id": "tile_alpha", "class": "FCBK",
         "x1": pred_fcbk_pts[0], "y1": pred_fcbk_pts[1],
         "x2": pred_fcbk_pts[2], "y2": pred_fcbk_pts[3],
         "x3": pred_fcbk_pts[4], "y3": pred_fcbk_pts[5],
         "x4": pred_fcbk_pts[6], "y4": pred_fcbk_pts[7],
         "score": 0.91},
        # Low-score false alarm (FCBK on background tile_gamma)
        {"tile_id": "tile_gamma", "class": "FCBK",
         "x1": pred_fa_pts[0], "y1": pred_fa_pts[1],
         "x2": pred_fa_pts[2], "y2": pred_fa_pts[3],
         "x3": pred_fa_pts[4], "y3": pred_fa_pts[5],
         "x4": pred_fa_pts[6], "y4": pred_fa_pts[7],
         "score": 0.05},
        # CFCBK high-confidence TP
        {"tile_id": "tile_beta", "class": "CFCBK",
         "x1": 0.4, "y1": 0.4, "x2": 0.6, "y2": 0.4, "x3": 0.6, "y3": 0.6, "x4": 0.4, "y4": 0.6,
         "score": 0.88},
    ]
    pred_df = pd.DataFrame(pred_rows)

    metrics = evaluate_detections(pred_df, gt_df, iou_thresh=0.5)

    print("\n[PROBLEM EXAMPLE METRIC BREAKDOWN]")
    print(f"  - Zigzag IoU: {iou_zigzag:.4f} (>= 0.5 -> TP), AP_Zigzag: {metrics['AP_Zigzag']:.4f}")
    print(f"  - FCBK IoU:   {iou_fcbk:.4f} (>= 0.5 -> TP), AP_FCBK:   {metrics['AP_FCBK']:.4f}")
    print(f"  - CFCBK IoU:  1.0000 (>= 0.5 -> TP), AP_CFCBK:  {metrics['AP_CFCBK']:.4f}")
    print(f"  - Final Macro-Averaged mAP@0.5: {metrics['mAP@0.5']:.4f}")

    # Validations:
    # Zigzag: 1 GT, 1 Pred (TP) -> Recall=1.0, Precision=1.0 -> AP=1.0
    assert abs(metrics["AP_Zigzag"] - 1.0) < 1e-4
    # FCBK: 1 GT, 2 Preds (1 TP @ score 0.91, 1 FP @ score 0.05) -> Recall reaches 1.0 at precision 1.0 -> AP=1.0
    assert abs(metrics["AP_FCBK"] - 1.0) < 1e-4
    # CFCBK: 1 GT, 1 Pred (TP) -> AP=1.0
    assert abs(metrics["AP_CFCBK"] - 1.0) < 1e-4
    assert abs(metrics["mAP@0.5"] - 1.0) < 1e-4
    print("[PASS] test_problem_example_zigzag_fcbk_false_alarm")


def test_load_ground_truth_from_val_dir():
    gt_df = load_ground_truth(Path("data/labels/val"))
    assert len(gt_df) > 0, "Expected ground truth boxes loaded from data/labels/val"
    assert set(gt_df["class"].unique()).issubset(set(CLASS_NAMES))
    print(f"[PASS] test_load_ground_truth_from_val_dir: Loaded {len(gt_df)} boxes from data/labels/val")


if __name__ == "__main__":
    test_polygon_iou_identical()
    test_polygon_iou_disjoint()
    test_polygon_iou_rotated()
    test_all_point_ap()
    test_macro_average_equal_weighting()
    test_problem_example_zigzag_fcbk_false_alarm()
    test_load_ground_truth_from_val_dir()
    print("\n[ALL METRIC ENGINE TESTS PASSED!]")
