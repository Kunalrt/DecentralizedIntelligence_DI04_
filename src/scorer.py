"""Metric evaluation engine for Chimney Census.

Metric: mAP@0.5 on rotated-box IoU, macro-averaged equally over the 3 classes:
- FCBK (1/3 of score)
- CFCBK (1/3 of score)
- Zigzag (1/3 of score)

Evaluation Methodology:
- Rotated-box IoU computed using polygon intersection over union via Shapely.
- DOTA-style all-point interpolated Average Precision (AP) curve integration.
- True positive if IoU >= 0.5 with an unmatched ground truth box of the same class.
- Per-class ranking by confidence score.
- Precision, Recall, and F1 evaluation at specific operating thresholds.
- Equal macro-average weighting across all three classes.
"""

import argparse
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Any, Union, Optional
import numpy as np
import pandas as pd
from shapely.geometry import Polygon

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.data.dataset import CLASS_NAMES, parse_obb_label

GROUND_TRUTH_COLUMNS = ["tile_id", "class", "x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4"]
PREDICTION_COLUMNS = ["tile_id", "class", "x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4", "score"]


def polygon_iou(pts1: np.ndarray, pts2: np.ndarray) -> float:
    """Calculate rotated IoU between two oriented bounding boxes given 8 corner coordinates.
    
    Args:
        pts1: 8 float array [x1, y1, x2, y2, x3, y3, x4, y4]
        pts2: 8 float array [x1, y1, x2, y2, x3, y3, x4, y4]
        
    Returns:
        float IoU in [0.0, 1.0]
    """
    poly1 = Polygon(np.asarray(pts1, dtype=np.float64).reshape(4, 2))
    poly2 = Polygon(np.asarray(pts2, dtype=np.float64).reshape(4, 2))

    if not poly1.is_valid:
        poly1 = poly1.buffer(0)
    if not poly2.is_valid:
        poly2 = poly2.buffer(0)

    # Fallback to convex hull if still invalid
    if not poly1.is_valid:
        poly1 = poly1.convex_hull
    if not poly2.is_valid:
        poly2 = poly2.convex_hull

    if not poly1.is_valid or not poly2.is_valid or poly1.area <= 1e-9 or poly2.area <= 1e-9:
        return 0.0

    intersection = poly1.intersection(poly2).area
    union = poly1.area + poly2.area - intersection
    if union <= 1e-9:
        return 0.0
    return float(np.clip(intersection / union, 0.0, 1.0))


def compute_all_point_ap(recalls: np.ndarray, precisions: np.ndarray) -> float:
    """Compute DOTA-style all-point interpolated Average Precision (AP).
    
    Computes precision envelope mpre[i] = max(mpre[i], mpre[i+1])
    and integrates the area under the curve across all unique recall thresholds.
    """
    mrec = np.concatenate(([0.0], recalls, [1.0]))
    mpre = np.concatenate(([0.0], precisions, [0.0]))

    # Compute precision envelope (monotonically decreasing)
    for i in range(mpre.size - 1, 0, -1):
        mpre[i - 1] = np.maximum(mpre[i - 1], mpre[i])

    # Integrate area under the curve
    i = np.where(mrec[1:] != mrec[:-1])[0]
    ap = np.sum((mrec[i + 1] - mrec[i]) * mpre[i + 1])
    return float(ap)


def load_ground_truth(target_source: Union[str, Path]) -> pd.DataFrame:
    """Load ground truth either from a CSV file or from a directory of YOLO-OBB text files."""
    path = Path(target_source)
    if path.is_file() and path.suffix.lower() == ".csv":
        return pd.read_csv(path)

    # Search directory for label .txt files
    lbl_dir = path
    if (path / "labels").exists():
        lbl_dir = path / "labels"

    txt_files = list(lbl_dir.glob("*.txt"))
    rows = []
    for txt_file in txt_files:
        tile_id = txt_file.stem
        annos = parse_obb_label(txt_file)
        for cls_idx, coords in annos:
            if 0 <= cls_idx < len(CLASS_NAMES):
                cls_name = CLASS_NAMES[cls_idx]
                rows.append({
                    "tile_id": tile_id,
                    "class": cls_name,
                    "x1": float(coords[0]), "y1": float(coords[1]),
                    "x2": float(coords[2]), "y2": float(coords[3]),
                    "x3": float(coords[4]), "y3": float(coords[5]),
                    "x4": float(coords[6]), "y4": float(coords[7]),
                })

    return pd.DataFrame(rows, columns=GROUND_TRUTH_COLUMNS)


def evaluate_detections(
    pred_df: pd.DataFrame,
    gt_df: pd.DataFrame,
    iou_thresh: float = 0.5,
) -> Dict[str, Any]:
    """Evaluate predictions against ground truth and return per-class AP and macro mAP@0.5.
    
    Args:
        pred_df: DataFrame with ['tile_id', 'class', 'x1','y1','x2','y2','x3','y3','x4','y4', 'score']
        gt_df: DataFrame with ['tile_id', 'class', 'x1','y1','x2','y2','x3','y3','x4','y4']
        iou_thresh: Rotated IoU threshold for TP assignment (default 0.5)
        
    Returns:
        dict containing 'mAP@0.5', 'AP_FCBK', 'AP_CFCBK', 'AP_Zigzag', and per-class counts.
    """
    results: Dict[str, Any] = {}
    aps = []
    curve_data = {}

    for cls in CLASS_NAMES:
        cls_preds = pred_df[pred_df["class"] == cls].sort_values(by="score", ascending=False).reset_index(drop=True)
        cls_gts = gt_df[gt_df["class"] == cls].reset_index(drop=True)
        num_gts = len(cls_gts)
        num_preds = len(cls_preds)

        results[f"gt_count_{cls}"] = num_gts
        results[f"pred_count_{cls}"] = num_preds

        if num_gts == 0:
            ap = 0.0 if num_preds > 0 else 1.0
            results[f"AP_{cls}"] = ap
            aps.append(ap)
            curve_data[cls] = {"recalls": np.array([]), "precisions": np.array([]), "scores": np.array([])}
            continue

        if num_preds == 0:
            results[f"AP_{cls}"] = 0.0
            aps.append(0.0)
            curve_data[cls] = {"recalls": np.array([]), "precisions": np.array([]), "scores": np.array([])}
            continue

        tp = np.zeros(num_preds)
        fp = np.zeros(num_preds)
        detected_gts = set()

        for p_idx, pred_row in cls_preds.iterrows():
            tile_id = pred_row["tile_id"]
            p_pts = np.array([
                pred_row["x1"], pred_row["y1"],
                pred_row["x2"], pred_row["y2"],
                pred_row["x3"], pred_row["y3"],
                pred_row["x4"], pred_row["y4"]
            ], dtype=np.float32)

            tile_gts = cls_gts[cls_gts["tile_id"] == tile_id]
            best_iou = 0.0
            best_gt_idx = -1

            for g_idx, g_row in tile_gts.iterrows():
                g_pts = np.array([
                    g_row["x1"], g_row["y1"],
                    g_row["x2"], g_row["y2"],
                    g_row["x3"], g_row["y3"],
                    g_row["x4"], g_row["y4"]
                ], dtype=np.float32)

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
        recalls = cum_tp / float(num_gts)
        precisions = cum_tp / (cum_tp + cum_fp)

        ap = compute_all_point_ap(recalls, precisions)
        results[f"AP_{cls}"] = ap
        aps.append(ap)
        curve_data[cls] = {
            "recalls": recalls,
            "precisions": precisions,
            "scores": cls_preds["score"].to_numpy(),
            "tp": tp,
            "fp": fp,
        }

    # Equal macro-average: each class contributes exactly 1/3
    results["mAP@0.5"] = float(np.mean(aps))
    results["curves"] = curve_data
    return results


def evaluate_detections_at_threshold(
    pred_df: pd.DataFrame,
    gt_df: pd.DataFrame,
    thresholds: Union[float, Dict[str, float]] = 0.25,
    iou_thresh: float = 0.5,
) -> Dict[str, Any]:
    """Compute exact TP, FP, FN, precision, recall, and F1 per class at specified operating thresholds."""
    if isinstance(thresholds, (int, float)):
        thresh_dict = {cls: float(thresholds) for cls in CLASS_NAMES}
    else:
        thresh_dict = thresholds

    stats = {}
    f1_list = []
    p_list = []
    r_list = []

    for cls in CLASS_NAMES:
        th = thresh_dict.get(cls, 0.25)
        cls_preds = pred_df[(pred_df["class"] == cls) & (pred_df["score"] >= th)].sort_values(by="score", ascending=False).reset_index(drop=True)
        cls_gts = gt_df[gt_df["class"] == cls].reset_index(drop=True)

        num_gts = len(cls_gts)
        num_preds = len(cls_preds)

        tp = 0
        detected_gts = set()

        for _, pred_row in cls_preds.iterrows():
            tile_id = pred_row["tile_id"]
            p_pts = np.array([
                pred_row["x1"], pred_row["y1"],
                pred_row["x2"], pred_row["y2"],
                pred_row["x3"], pred_row["y3"],
                pred_row["x4"], pred_row["y4"]
            ], dtype=np.float32)

            tile_gts = cls_gts[cls_gts["tile_id"] == tile_id]
            best_iou = 0.0
            best_gt_idx = -1

            for g_idx, g_row in tile_gts.iterrows():
                g_pts = np.array([
                    g_row["x1"], g_row["y1"],
                    g_row["x2"], g_row["y2"],
                    g_row["x3"], g_row["y3"],
                    g_row["x4"], g_row["y4"]
                ], dtype=np.float32)

                iou = polygon_iou(p_pts, g_pts)
                if iou > best_iou:
                    best_iou = iou
                    best_gt_idx = g_idx

            if best_iou >= iou_thresh and best_gt_idx not in detected_gts:
                tp += 1
                detected_gts.add(best_gt_idx)

        fp = num_preds - tp
        fn = num_gts - tp
        precision = float(tp / num_preds) if num_preds > 0 else 0.0
        recall = float(tp / num_gts) if num_gts > 0 else 0.0
        f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

        stats[cls] = {
            "threshold": th,
            "TP": tp,
            "FP": fp,
            "FN": fn,
            "GT_count": num_gts,
            "Pred_count": num_preds,
            "precision": precision,
            "recall": recall,
            "f1": f1,
        }
        f1_list.append(f1)
        p_list.append(precision)
        r_list.append(recall)

    stats["macro"] = {
        "precision": float(np.mean(p_list)),
        "recall": float(np.mean(r_list)),
        "f1": float(np.mean(f1_list)),
    }
    return stats


def print_score_report(metrics: Dict[str, Any]):
    """Print formatted metric evaluation report."""
    print("\n" + "=" * 54)
    print("      CHIMNEY CENSUS - EVALUATION METRIC REPORT")
    print("=" * 54)
    print(f"{'Class':<12} | {'GT Count':<10} | {'Pred Count':<10} | {'AP@0.5':<10}")
    print("-" * 54)
    for cls in CLASS_NAMES:
        gt_c = metrics.get(f"gt_count_{cls}", 0)
        pr_c = metrics.get(f"pred_count_{cls}", 0)
        ap = metrics.get(f"AP_{cls}", 0.0)
        print(f"{cls:<12} | {gt_c:<10} | {pr_c:<10} | {ap:.4f}")
    print("-" * 54)
    print(f"Final Macro-Averaged mAP@0.5: {metrics['mAP@0.5']:.4f}  (1/3 each)")
    print("=" * 54 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Evaluate rotated IoU mAP@0.5 for Chimney Census")
    parser.add_argument("--preds", type=str, default="submission.csv", help="Path to predictions CSV")
    parser.add_argument("--targets", type=str, default="data/labels/val", help="Path to ground truth CSV or label dir")
    parser.add_argument("--iou-thresh", type=float, default=0.5, help="Rotated IoU threshold (default: 0.5)")
    args = parser.parse_args()

    pred_path = Path(args.preds)
    if not pred_path.exists():
        print(f"[WARN] Predictions file '{args.preds}' does not exist yet. Run inference first.")
        return

    pred_df = pd.read_csv(pred_path)
    gt_df = load_ground_truth(args.targets)
    print(f"[INFO] Loaded {len(pred_df)} predictions and {len(gt_df)} ground truth boxes.")

    metrics = evaluate_detections(pred_df, gt_df, iou_thresh=args.iou_thresh)
    print_score_report(metrics)


if __name__ == "__main__":
    main()
