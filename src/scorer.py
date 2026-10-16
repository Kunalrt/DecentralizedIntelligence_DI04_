"""Metric evaluation engine for Chimney Census.

Metric: mAP@0.5 on rotated-box IoU, macro-averaged equally over the 3 classes:
- FCBK (1/3 of score)
- CFCBK (1/3 of score)
- Zigzag (1/3 of score)
Uses DOTA-style all-point interpolated AP.
"""

import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Any
import numpy as np
import pandas as pd
from shapely.geometry import Polygon

CLASS_NAMES = ["FCBK", "CFCBK", "Zigzag"]


def polygon_iou(pts1: np.ndarray, pts2: np.ndarray) -> float:
    """Calculate IoU between two oriented bounding boxes given 8 corner coords."""
    poly1 = Polygon(pts1.reshape(4, 2))
    poly2 = Polygon(pts2.reshape(4, 2))

    if not poly1.is_valid:
        poly1 = poly1.buffer(0)
    if not poly2.is_valid:
        poly2 = poly2.buffer(0)

    if not poly1.is_valid or not poly2.is_valid or poly1.area <= 0 or poly2.area <= 0:
        return 0.0

    intersection = poly1.intersection(poly2).area
    union = poly1.area + poly2.area - intersection
    if union <= 0:
        return 0.0
    return float(intersection / union)


def compute_all_point_ap(recalls: np.ndarray, precisions: np.ndarray) -> float:
    """Compute DOTA-style all-point interpolated Average Precision (AP)."""
    mrec = np.concatenate(([0.0], recalls, [1.0]))
    mpre = np.concatenate(([0.0], precisions, [0.0]))

    # Compute the precision envelope
    for i in range(mpre.size - 1, 0, -1):
        mpre[i - 1] = np.maximum(mpre[i - 1], mpre[i])

    # Integrate area under curve
    i = np.where(mrec[1:] != mrec[:-1])[0]
    ap = np.sum((mrec[i + 1] - mrec[i]) * mpre[i + 1])
    return float(ap)


def evaluate_detections(
    pred_df: pd.DataFrame,
    gt_df: pd.DataFrame,
    iou_thresh: float = 0.5,
) -> Dict[str, float]:
    """Evaluate predictions against ground truth and return per-class AP and macro mAP."""
    results = {}
    aps = []

    for cls in CLASS_NAMES:
        cls_preds = pred_df[pred_df["class"] == cls].sort_values(by="score", ascending=False)
        cls_gts = gt_df[gt_df["class"] == cls]
        num_gts = len(cls_gts)

        if num_gts == 0:
            results[f"AP_{cls}"] = 0.0
            aps.append(0.0)
            continue

        if len(cls_preds) == 0:
            results[f"AP_{cls}"] = 0.0
            aps.append(0.0)
            continue

        tp = np.zeros(len(cls_preds))
        fp = np.zeros(len(cls_preds))
        detected_gts = set()

        for p_idx, (_, pred_row) in enumerate(cls_preds.iterrows()):
            tile_id = pred_row["tile_id"]
            p_pts = np.array([pred_row[f"x{i}"] for i in range(1, 5)] + [pred_row[f"y{i}"] for i in range(1, 5)], dtype=np.float32)
            # Reorder [x1, x2, x3, x4, y1, y2, y3, y4] to [x1, y1, x2, y2, x3, y3, x4, y4]
            p_pts = np.array([pred_row["x1"], pred_row["y1"], pred_row["x2"], pred_row["y2"],
                              pred_row["x3"], pred_row["y3"], pred_row["x4"], pred_row["y4"]], dtype=np.float32)

            tile_gts = cls_gts[cls_gts["tile_id"] == tile_id]
            best_iou = 0.0
            best_gt_idx = -1

            for g_idx, g_row in tile_gts.iterrows():
                g_pts = np.array([g_row["x1"], g_row["y1"], g_row["x2"], g_row["y2"],
                                  g_row["x3"], g_row["y3"], g_row["x4"], g_row["y4"]], dtype=np.float32)
                iou = polygon_iou(p_pts, g_pts)
                if iou > best_iou:
                    best_iou = iou
                    best_gt_idx = g_idx

            if best_iou >= iou_thresh and best_gt_idx not in detected_gts:
                tp[p_idx] = 1.0
                detected_gts.add(best_gt_idx)
            else:
                fp[p_idx] = 1.0

        cum_tp = np.cumsum(tp)
        cum_fp = np.cumsum(fp)
        recalls = cum_tp / num_gts
        precisions = cum_tp / (cum_tp + cum_fp)

        ap = compute_all_point_ap(recalls, precisions)
        results[f"AP_{cls}"] = ap
        aps.append(ap)

    results["mAP@0.5"] = float(np.mean(aps))
    return results


def main():
    parser = argparse.ArgumentParser(description="Evaluate rotated IoU mAP@0.5 for Chimney Census")
    parser.add_argument("--preds", type=str, default="submission.csv", help="Path to predictions CSV")
    parser.add_argument("--targets", type=str, default="ground_truth.csv", help="Path to ground truth CSV")
    parser.add_argument("--iou-thresh", type=float, default=0.5, help="Rotated IoU threshold")
    args = parser.parse_args()

    print(f"[INFO] Evaluating {args.preds} against {args.targets} (IoU >= {args.iou_thresh})...")
    if not Path(args.preds).exists():
        print(f"[WARN] Predictions file {args.preds} not found yet. Scorer ready for evaluation.")
        return

    pred_df = pd.read_csv(args.preds)
    gt_df = pd.read_csv(args.targets)
    metrics = evaluate_detections(pred_df, gt_df, iou_thresh=args.iou_thresh)
    print("\n--- Evaluation Results ---")
    for k, v in metrics.items():
        print(f"{k}: {v:.4f}")


if __name__ == "__main__":
    main()
