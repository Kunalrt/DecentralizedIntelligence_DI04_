"""Unit tests for src/scorer.py custom rotated IoU and DOTA AP metric engine."""

import pytest
import numpy as np
import pandas as pd
from src.scorer import (
    polygon_iou,
    compute_all_point_ap,
    evaluate_detections,
    evaluate_detections_at_threshold,
)


def test_polygon_iou_prompt_example():
    """Verify the exact prompt example: Zigzag GT vs Pred gives IoU ~ 0.72."""
    gt_corners = np.array([0.400, 0.300, 0.490, 0.277, 0.502, 0.324, 0.412, 0.347])
    pr_corners = np.array([0.405, 0.305, 0.495, 0.282, 0.507, 0.329, 0.417, 0.352])

    iou = polygon_iou(gt_corners, pr_corners)
    assert 0.71 <= iou <= 0.73, f"Expected IoU around 0.72, got {iou:.4f}"


def test_class_mismatch_miss_and_false_alarm():
    """Verify that a class mismatch counts as a miss (FN) for the GT class and a false alarm (FP) for the predicted class."""
    tile_id = "test_tile_mismatch"
    gt_corners = [0.400, 0.300, 0.490, 0.277, 0.502, 0.324, 0.412, 0.347]
    pr_corners = [0.405, 0.305, 0.495, 0.282, 0.507, 0.329, 0.417, 0.352]

    # Ground truth is Zigzag
    gt_df = pd.DataFrame([{
        "tile_id": tile_id, "class": "Zigzag",
        "x1": gt_corners[0], "y1": gt_corners[1],
        "x2": gt_corners[2], "y2": gt_corners[3],
        "x3": gt_corners[4], "y3": gt_corners[5],
        "x4": gt_corners[6], "y4": gt_corners[7],
    }])

    # Prediction incorrectly predicts FCBK
    pred_df = pd.DataFrame([{
        "tile_id": tile_id, "class": "FCBK",
        "x1": pr_corners[0], "y1": pr_corners[1],
        "x2": pr_corners[2], "y2": pr_corners[3],
        "x3": pr_corners[4], "y3": pr_corners[5],
        "x4": pr_corners[6], "y4": pr_corners[7],
        "score": 0.95
    }])

    # Evaluate at threshold
    stats = evaluate_detections_at_threshold(pred_df, gt_df, thresholds=0.5, iou_thresh=0.5)

    # Zigzag has 1 GT, 0 Pred -> TP=0, FP=0, FN=1 (Miss)
    assert stats["Zigzag"]["TP"] == 0
    assert stats["Zigzag"]["FN"] == 1
    assert stats["Zigzag"]["recall"] == 0.0

    # FCBK has 0 GT, 1 Pred -> TP=0, FP=1 (False Alarm), FN=0
    assert stats["FCBK"]["TP"] == 0
    assert stats["FCBK"]["FP"] == 1
    assert stats["FCBK"]["precision"] == 0.0

    # Evaluate AP
    metrics = evaluate_detections(pred_df, gt_df, iou_thresh=0.5)
    assert metrics["AP_Zigzag"] == 0.0
    assert metrics["AP_FCBK"] == 0.0


def test_dota_all_point_ap():
    """Verify DOTA all-point interpolated AP calculation."""
    # Perfect detector: recall [0.5, 1.0], precision [1.0, 1.0] -> AP = 1.0
    recalls = np.array([0.5, 1.0])
    precisions = np.array([1.0, 1.0])
    ap = compute_all_point_ap(recalls, precisions)
    assert np.isclose(ap, 1.0)

    # Half recall with 1.0 precision -> AP = 0.5
    recalls = np.array([0.5])
    precisions = np.array([1.0])
    ap = compute_all_point_ap(recalls, precisions)
    assert np.isclose(ap, 0.5)


def test_macro_average_over_three_classes():
    """Verify that macro mAP@0.5 weights all three classes equally (1/3 each)."""
    gt_rows = [
        {"tile_id": "t1", "class": "FCBK", "x1": 0.1, "y1": 0.1, "x2": 0.3, "y2": 0.1, "x3": 0.3, "y3": 0.3, "x4": 0.1, "y4": 0.3},
        {"tile_id": "t2", "class": "CFCBK", "x1": 0.1, "y1": 0.1, "x2": 0.3, "y2": 0.1, "x3": 0.3, "y3": 0.3, "x4": 0.1, "y4": 0.3},
        {"tile_id": "t3", "class": "Zigzag", "x1": 0.1, "y1": 0.1, "x2": 0.3, "y2": 0.1, "x3": 0.3, "y3": 0.3, "x4": 0.1, "y4": 0.3},
    ]
    gt_df = pd.DataFrame(gt_rows)

    # Only detect FCBK perfectly, miss CFCBK and Zigzag
    pred_rows = [
        {"tile_id": "t1", "class": "FCBK", "x1": 0.1, "y1": 0.1, "x2": 0.3, "y2": 0.1, "x3": 0.3, "y3": 0.3, "x4": 0.1, "y4": 0.3, "score": 0.99},
    ]
    pred_df = pd.DataFrame(pred_rows)

    metrics = evaluate_detections(pred_df, gt_df, iou_thresh=0.5)
    assert np.isclose(metrics["AP_FCBK"], 1.0)
    assert np.isclose(metrics["AP_CFCBK"], 0.0)
    assert np.isclose(metrics["AP_Zigzag"], 0.0)
    # Equal 1/3 macro-average -> mAP = 1.0 / 3 = 0.3333...
    assert np.isclose(metrics["mAP@0.5"], 1.0 / 3.0)
