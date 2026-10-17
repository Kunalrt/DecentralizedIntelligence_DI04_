"""Phase 7: Comprehensive Test Set Evaluation, Bootstrap CIs, and Figure Generation.

Generates:
- reports/metrics/test_metrics.json
- reports/figures/test_pr_curves.png
- reports/figures/test_ap_barchart.png
- reports/figures/test_confusion_matrix.png
- reports/figures/test_f1_vs_threshold.png
- reports/figures/test_score_histogram.png
- reports/figures/test_recall_by_size_angle.png
- reports/figures/test_count_scatter.png
- reports/figures/test_qualitative_12_panels.png
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Tuple
import cv2
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

PROJECT_ROOT = Path(__file__).resolve().parent.parent
import sys
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.scorer import (
    evaluate_detections,
    evaluate_detections_at_threshold,
    load_ground_truth,
    polygon_iou,
    compute_all_point_ap,
)
from src.data.dataset import CLASS_NAMES

CLASS_COLORS = {
    "FCBK": "#E8710A",     # Orange
    "CFCBK": "#188038",    # Green
    "Zigzag": "#1A73E8",   # Blue
}

REPORTS_FIGURES = PROJECT_ROOT / "reports" / "figures"
REPORTS_METRICS = PROJECT_ROOT / "reports" / "metrics"


def run_test_evaluation(
    submission_path: Path = PROJECT_ROOT / "submission.csv",
    test_labels_dir: Path = PROJECT_ROOT / "data" / "labels" / "test",
    test_images_dir: Path = PROJECT_ROOT / "data" / "images" / "test",
    thresholds_json: Path = PROJECT_ROOT / "configs" / "thresholds.json",
):
    REPORTS_FIGURES.mkdir(parents=True, exist_ok=True)
    REPORTS_METRICS.mkdir(parents=True, exist_ok=True)

    print("=================================================================")
    print("            PHASE 7: FINAL EVALUATION ON TEST SET                 ")
    print("=================================================================")

    # 1. Load predictions & GT
    pred_df = pd.read_csv(submission_path)
    gt_df = load_ground_truth(test_labels_dir)
    print(f"[INFO] Loaded {len(pred_df)} predictions and {len(gt_df)} ground truth boxes.")

    # 2. Load operating thresholds
    with open(thresholds_json, "r", encoding="utf-8") as f:
        thresh_data = json.load(f)
    operating_thresholds = thresh_data.get("operating_thresholds", {"FCBK": 0.25, "CFCBK": 0.25, "Zigzag": 0.25})
    print(f"[INFO] Operating thresholds: {operating_thresholds}")

    # 3. Overall AP and mAP@0.5
    overall_metrics = evaluate_detections(pred_df, gt_df, iou_thresh=0.5)
    curves_data = overall_metrics.pop("curves")
    print(f"[INFO] Test mAP@0.5: {overall_metrics['mAP@0.5']:.4f}")
    for cls in CLASS_NAMES:
        print(f"  - AP {cls}: {overall_metrics.get(f'AP_{cls}', 0.0):.4f}")

    # 4. Operating Threshold Statistics (TP, FP, FN, Precision, Recall, F1)
    thresh_stats = evaluate_detections_at_threshold(pred_df, gt_df, thresholds=operating_thresholds, iou_thresh=0.5)

    # 5. Bootstrap Confidence Intervals (1,000 tile resamples with precomputed matching)
    test_tiles = np.array(sorted(list(set(pred_df["tile_id"].unique()).union(set(gt_df["tile_id"].unique())))))
    n_boot = 1000

    # Precompute per-prediction TP/FP flags and per-tile GT counts
    precomputed = {}
    for cls in CLASS_NAMES:
        cls_preds = pred_df[pred_df["class"] == cls].sort_values(by="score", ascending=False).reset_index(drop=True)
        cls_gts = gt_df[gt_df["class"] == cls].reset_index(drop=True)

        tp_flags = []
        scores = []
        p_tiles = []
        detected_gts = set()

        for p_idx, p_row in cls_preds.iterrows():
            t_id = p_row["tile_id"]
            p_pts = np.array([p_row["x1"], p_row["y1"], p_row["x2"], p_row["y2"], p_row["x3"], p_row["y3"], p_row["x4"], p_row["y4"]])
            tile_gts = cls_gts[cls_gts["tile_id"] == t_id]

            best_iou = 0.0
            best_gt_idx = -1
            for g_idx, g_row in tile_gts.iterrows():
                g_pts = np.array([g_row["x1"], g_row["y1"], g_row["x2"], g_row["y2"], g_row["x3"], g_row["y3"], g_row["x4"], g_row["y4"]])
                iou = polygon_iou(p_pts, g_pts)
                if iou > best_iou:
                    best_iou = iou
                    best_gt_idx = g_idx

            is_tp = (best_iou >= 0.5 and best_gt_idx not in detected_gts)
            if is_tp:
                detected_gts.add(best_gt_idx)
            tp_flags.append(1.0 if is_tp else 0.0)
            scores.append(float(p_row["score"]))
            p_tiles.append(t_id)

        gt_count_by_tile = cls_gts["tile_id"].value_counts().to_dict()
        precomputed[cls] = {
            "tp": np.array(tp_flags, dtype=np.float32),
            "scores": np.array(scores, dtype=np.float32),
            "tiles": np.array(p_tiles),
            "gt_counts": gt_count_by_tile,
        }

    boot_maps = []
    boot_class_aps = {cls: [] for cls in CLASS_NAMES}
    np.random.seed(42)

    for _ in range(n_boot):
        sample_tiles = np.random.choice(test_tiles, size=len(test_tiles), replace=True)
        sample_tile_counts = pd.Series(sample_tiles).value_counts().to_dict()

        sample_aps = []
        for cls in CLASS_NAMES:
            c_data = precomputed[cls]
            if len(c_data["tp"]) == 0:
                sample_aps.append(0.0)
                boot_class_aps[cls].append(0.0)
                continue

            # Weight occurrences by how many times each tile was sampled
            weights = np.array([sample_tile_counts.get(t, 0) for t in c_data["tiles"]], dtype=np.float32)
            mask = weights > 0
            if not np.any(mask):
                sample_aps.append(0.0)
                boot_class_aps[cls].append(0.0)
                continue

            sel_tp = c_data["tp"][mask] * weights[mask]
            sel_fp = (1.0 - c_data["tp"][mask]) * weights[mask]
            total_gt = sum(c_data["gt_counts"].get(t, 0) * sample_tile_counts.get(t, 0) for t in set(sample_tiles))

            if total_gt == 0:
                ap = 0.0 if np.sum(sel_fp) > 0 else 1.0
            else:
                cum_tp = np.cumsum(sel_tp)
                cum_fp = np.cumsum(sel_fp)
                recalls = cum_tp / float(total_gt)
                precisions = cum_tp / np.maximum(cum_tp + cum_fp, 1e-9)
                ap = compute_all_point_ap(recalls, precisions)

            sample_aps.append(ap)
            boot_class_aps[cls].append(float(ap))

        boot_maps.append(float(np.mean(sample_aps)))

    ci_map = [float(np.percentile(boot_maps, 2.5)), float(np.percentile(boot_maps, 97.5))] if boot_maps else [0.0, 1.0]
    ci_class_aps = {cls: [float(np.percentile(boot_class_aps[cls], 2.5)), float(np.percentile(boot_class_aps[cls], 97.5))] for cls in CLASS_NAMES}

    # Compile JSON report
    report = {
        "metadata": {
            "evaluation_set": "data/images/test",
            "model_weights": "weights/best.pt",
            "metric": "mAP@0.5 (DOTA continuous all-point interpolated, equal 1/3 macro-averaged)",
            "operating_thresholds": operating_thresholds,
        },
        "mAP@0.5": overall_metrics["mAP@0.5"],
        "mAP_95_CI": ci_map,
        "per_class_AP": {cls: overall_metrics.get(f"AP_{cls}", 0.0) for cls in CLASS_NAMES},
        "per_class_AP_95_CI": ci_class_aps,
        "operating_stats": thresh_stats,
        "bootstrap_samples": n_boot,
    }

    test_metrics_path = REPORTS_METRICS / "test_metrics.json"
    with open(test_metrics_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"[SUCCESS] Saved test metrics to {test_metrics_path}")

    # 6. Generate Figures
    generate_figures(pred_df, gt_df, curves_data, thresh_stats, overall_metrics, test_images_dir, operating_thresholds)


def generate_figures(pred_df, gt_df, curves_data, thresh_stats, overall_metrics, test_images_dir, operating_thresholds):
    sns.set_theme(style="whitegrid")

    # --- FIGURE 1: Per-Class Precision-Recall Curves ---
    plt.figure(figsize=(8, 6))
    for cls in CLASS_NAMES:
        c_data = curves_data.get(cls, {})
        rec = c_data.get("recalls", np.array([]))
        prec = c_data.get("precisions", np.array([]))
        ap = overall_metrics.get(f"AP_{cls}", 0.0)
        if len(rec) > 0 and len(prec) > 0:
            mrec = np.concatenate(([0.0], rec, [1.0]))
            mpre = np.concatenate(([0.0], prec, [0.0]))
            for i in range(mpre.size - 1, 0, -1):
                mpre[i - 1] = np.maximum(mpre[i - 1], mpre[i])
            plt.plot(mrec, mpre, label=f"{cls} (AP={ap:.4f})", color=CLASS_COLORS[cls], lw=2.5)
        else:
            plt.plot([0, 1], [0, 0], label=f"{cls} (AP={ap:.4f})", color=CLASS_COLORS[cls], lw=2.5)

    plt.xlabel("Recall", fontsize=12, fontweight="bold")
    plt.ylabel("Precision", fontsize=12, fontweight="bold")
    plt.title(f"Test Set Precision-Recall Curves (mAP@0.5 = {overall_metrics['mAP@0.5']:.4f})", fontsize=13, fontweight="bold")
    plt.legend(loc="lower left", fontsize=11, frameon=True)
    plt.xlim(0.0, 1.02)
    plt.ylim(0.0, 1.05)
    plt.tight_layout()
    plt.savefig(REPORTS_FIGURES / "test_pr_curves.png", dpi=300)
    plt.close()
    print(f"[SUCCESS] Saved {REPORTS_FIGURES / 'test_pr_curves.png'}")

    # --- FIGURE 2: Per-Class AP Bar Chart ---
    plt.figure(figsize=(7, 5))
    cls_labels = CLASS_NAMES + ["Macro mAP"]
    cls_scores = [overall_metrics.get(f"AP_{c}", 0.0) for c in CLASS_NAMES] + [overall_metrics["mAP@0.5"]]
    bar_colors = [CLASS_COLORS[c] for c in CLASS_NAMES] + ["#5E35B1"]
    bars = plt.bar(cls_labels, cls_scores, color=bar_colors, edgecolor="black", linewidth=1.2)
    for bar in bars:
        h = bar.get_height()
        plt.text(bar.get_x() + bar.get_width() / 2.0, h + 0.02, f"{h:.4f}", ha="center", va="bottom", fontweight="bold", fontsize=10)
    plt.ylabel("Average Precision (AP@0.5)", fontsize=12, fontweight="bold")
    plt.title("Test Set AP & Equal-Weight Macro mAP@0.5", fontsize=13, fontweight="bold")
    plt.ylim(0, 1.15)
    plt.tight_layout()
    plt.savefig(REPORTS_FIGURES / "test_ap_barchart.png", dpi=300)
    plt.close()
    print(f"[SUCCESS] Saved {REPORTS_FIGURES / 'test_ap_barchart.png'}")

    # --- FIGURE 3: Confusion Matrix at Operating Threshold ---
    # Construct 4x4 matrix: [FCBK, CFCBK, Zigzag, Background]
    cm_labels = CLASS_NAMES + ["Background"]
    matrix = np.zeros((4, 4), dtype=int)

    # Filter predictions at operating threshold
    op_preds = []
    for cls in CLASS_NAMES:
        th = operating_thresholds.get(cls, 0.25)
        cls_sub = pred_df[(pred_df["class"] == cls) & (pred_df["score"] >= th)]
        op_preds.append(cls_sub)
    op_pred_df = pd.concat(op_preds, ignore_index=True) if op_preds else pd.DataFrame()

    matched_gts = set()
    matched_preds = set()

    for p_idx, p_row in op_pred_df.iterrows():
        p_pts = np.array([p_row[f"x{i}"] for i in range(1, 5)] + [p_row[f"y{i}"] for i in range(1, 5)])  # dummy
        p_pts = np.array([p_row["x1"], p_row["y1"], p_row["x2"], p_row["y2"], p_row["x3"], p_row["y3"], p_row["x4"], p_row["y4"]])
        p_cls = p_row["class"]
        p_cls_idx = CLASS_NAMES.index(p_cls)
        tile_gts = gt_df[gt_df["tile_id"] == p_row["tile_id"]]

        best_iou = 0.0
        best_gt_idx = -1
        best_gt_cls = None

        for g_idx, g_row in tile_gts.iterrows():
            g_pts = np.array([g_row["x1"], g_row["y1"], g_row["x2"], g_row["y2"], g_row["x3"], g_row["y3"], g_row["x4"], g_row["y4"]])
            iou = polygon_iou(p_pts, g_pts)
            if iou > best_iou:
                best_iou = iou
                best_gt_idx = g_idx
                best_gt_cls = g_row["class"]

        if best_iou >= 0.5 and best_gt_idx not in matched_gts:
            g_cls_idx = CLASS_NAMES.index(best_gt_cls)
            matrix[g_cls_idx, p_cls_idx] += 1
            matched_gts.add(best_gt_idx)
            matched_preds.add(p_idx)
        else:
            # False positive -> Background true, predicted p_cls
            matrix[3, p_cls_idx] += 1

    # Unmatched ground truths are False Negatives -> GT class true, predicted Background
    for g_idx, g_row in gt_df.iterrows():
        if g_idx not in matched_gts:
            g_cls_idx = CLASS_NAMES.index(g_row["class"])
            matrix[g_cls_idx, 3] += 1

    plt.figure(figsize=(7, 6))
    sns.heatmap(matrix, annot=True, fmt="d", cmap="Blues", xticklabels=cm_labels, yticklabels=cm_labels, cbar=False)
    plt.xlabel("Predicted Class", fontsize=12, fontweight="bold")
    plt.ylabel("True Class (Ground Truth)", fontsize=12, fontweight="bold")
    plt.title("Confusion Matrix at Operating Thresholds", fontsize=13, fontweight="bold")
    plt.tight_layout()
    plt.savefig(REPORTS_FIGURES / "test_confusion_matrix.png", dpi=300)
    plt.close()
    print(f"[SUCCESS] Saved {REPORTS_FIGURES / 'test_confusion_matrix.png'}")

    # --- FIGURE 4: F1 vs Threshold Curves ---
    plt.figure(figsize=(8, 5))
    thresh_grid = np.linspace(0.01, 0.95, 95)
    for cls in CLASS_NAMES:
        cls_preds = pred_df[pred_df["class"] == cls]
        cls_gts = gt_df[gt_df["class"] == cls]
        f1s = []
        for th in thresh_grid:
            st = evaluate_detections_at_threshold(cls_preds, cls_gts, thresholds=th, iou_thresh=0.5)
            f1s.append(st[cls]["f1"])
        plt.plot(thresh_grid, f1s, label=f"{cls} (Max F1={max(f1s):.3f} @ {operating_thresholds[cls]})", color=CLASS_COLORS[cls], lw=2.2)

    plt.xlabel("Confidence Threshold", fontsize=12, fontweight="bold")
    plt.ylabel("F1 Score", fontsize=12, fontweight="bold")
    plt.title("F1 Score vs. Confidence Threshold by Kiln Type", fontsize=13, fontweight="bold")
    plt.legend(loc="lower center", fontsize=10, frameon=True)
    plt.ylim(0, 1.05)
    plt.tight_layout()
    plt.savefig(REPORTS_FIGURES / "test_f1_vs_threshold.png", dpi=300)
    plt.close()
    print(f"[SUCCESS] Saved {REPORTS_FIGURES / 'test_f1_vs_threshold.png'}")

    # --- FIGURE 5: Score Histogram for TP vs FP ---
    tp_scores = []
    fp_scores = []
    for cls in CLASS_NAMES:
        c_data = curves_data.get(cls, {})
        scores = c_data.get("scores", np.array([]))
        tp_mask = c_data.get("tp", np.array([]))
        if len(scores) > 0 and len(tp_mask) > 0:
            tp_scores.extend(scores[tp_mask == 1.0].tolist())
            fp_scores.extend(scores[tp_mask == 0.0].tolist())

    plt.figure(figsize=(8, 5))
    if len(tp_scores) > 0:
        sns.histplot(tp_scores, bins=20, color="#188038", label="True Positives (IoU >= 0.5)", kde=True, stat="density")
    if len(fp_scores) > 0:
        sns.histplot(fp_scores, bins=20, color="#D93025", label="False Positives", kde=True, stat="density", alpha=0.5)
    plt.xlabel("Detection Confidence Score", fontsize=12, fontweight="bold")
    plt.ylabel("Density", fontsize=12, fontweight="bold")
    plt.title("Confidence Score Distribution: True Positives vs. False Positives", fontsize=13, fontweight="bold")
    plt.legend(fontsize=11)
    plt.tight_layout()
    plt.savefig(REPORTS_FIGURES / "test_score_histogram.png", dpi=300)
    plt.close()
    print(f"[SUCCESS] Saved {REPORTS_FIGURES / 'test_score_histogram.png'}")

    # --- FIGURE 6: Recall by Kiln Size and by Angle ---
    gt_areas = []
    gt_angles = []
    gt_recalled = []

    for _, g_row in gt_df.iterrows():
        g_pts = np.array([g_row["x1"], g_row["y1"], g_row["x2"], g_row["y2"], g_row["x3"], g_row["y3"], g_row["x4"], g_row["y4"]]).reshape(4, 2) * 128.0
        rect = cv2.minAreaRect(g_pts.astype(np.float32))
        (cx, cy), (bw, bh), angle = rect
        area = bw * bh
        gt_areas.append(area)
        gt_angles.append(angle % 180)

        # Check if recalled at operating threshold
        t_id = g_row["tile_id"]
        cls = g_row["class"]
        th = operating_thresholds[cls]
        tile_preds = pred_df[(pred_df["tile_id"] == t_id) & (pred_df["class"] == cls) & (pred_df["score"] >= th)]
        recalled = False
        for _, p_row in tile_preds.iterrows():
            p_pts = np.array([p_row["x1"], p_row["y1"], p_row["x2"], p_row["y2"], p_row["x3"], p_row["y3"], p_row["x4"], p_row["y4"]])
            g_flat = (g_pts / 128.0).reshape(-1)
            if polygon_iou(p_pts, g_flat) >= 0.5:
                recalled = True
                break
        gt_recalled.append(1 if recalled else 0)

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))
    if gt_areas:
        sns.scatterplot(x=gt_areas, y=gt_recalled, hue=gt_recalled, palette={0: "#D93025", 1: "#188038"}, s=100, ax=axes[0], legend=False)
        axes[0].set_xlabel("Kiln Footprint Area (px²)", fontweight="bold")
        axes[0].set_ylabel("Recalled (1=Yes, 0=No)", fontweight="bold")
        axes[0].set_title("Recall vs. Kiln Size", fontweight="bold")
        axes[0].set_yticks([0, 1])
        axes[0].set_yticklabels(["Miss (0)", "Recalled (1)"])

    if gt_angles:
        sns.scatterplot(x=gt_angles, y=gt_recalled, hue=gt_recalled, palette={0: "#D93025", 1: "#188038"}, s=100, ax=axes[1], legend=False)
        axes[1].set_xlabel("Orientation Angle (°)", fontweight="bold")
        axes[1].set_ylabel("Recalled (1=Yes, 0=No)", fontweight="bold")
        axes[1].set_title("Recall vs. Kiln Orientation Angle", fontweight="bold")
        axes[1].set_yticks([0, 1])
        axes[1].set_yticklabels(["Miss (0)", "Recalled (1)"])

    plt.suptitle("Sensitivity Analysis: Detection Recall by Kiln Geometry", fontsize=13, fontweight="bold", y=0.98)
    plt.tight_layout()
    plt.savefig(REPORTS_FIGURES / "test_recall_by_size_angle.png", dpi=300)
    plt.close()
    print(f"[SUCCESS] Saved {REPORTS_FIGURES / 'test_recall_by_size_angle.png'}")

    # --- FIGURE 7: Predicted vs GT Count Scatter per Tile ---
    tile_gt_counts = gt_df["tile_id"].value_counts().to_dict()
    tile_pred_counts = op_pred_df["tile_id"].value_counts().to_dict() if len(op_pred_df) > 0 else {}
    all_tiles = sorted(list(set(list(tile_gt_counts.keys()) + list(tile_pred_counts.keys()))))

    g_counts = [tile_gt_counts.get(t, 0) for t in all_tiles]
    p_counts = [tile_pred_counts.get(t, 0) for t in all_tiles]

    plt.figure(figsize=(6, 6))
    max_c = max(max(g_counts + [1]), max(p_counts + [1])) + 1
    plt.plot([0, max_c], [0, max_c], "k--", alpha=0.5, label="Perfect Agreement (1:1)")
    sns.scatterplot(x=g_counts, y=p_counts, s=120, color="#1A73E8", edgecolor="black")
    plt.xlabel("Ground Truth Kilns per Tile", fontsize=12, fontweight="bold")
    plt.ylabel("Predicted Kilns per Tile (@ Operating Thresh)", fontsize=12, fontweight="bold")
    plt.title("Kiln Count Agreement per Tile", fontsize=13, fontweight="bold")
    plt.xlim(-0.2, max_c)
    plt.ylim(-0.2, max_c)
    plt.legend()
    plt.tight_layout()
    plt.savefig(REPORTS_FIGURES / "test_count_scatter.png", dpi=300)
    plt.close()
    print(f"[SUCCESS] Saved {REPORTS_FIGURES / 'test_count_scatter.png'}")

    # --- FIGURE 8: 12 Qualitative Panels (GT vs Prediction) ---
    plot_12_qualitative_panels(pred_df, gt_df, test_images_dir, operating_thresholds, REPORTS_FIGURES / "test_qualitative_12_panels.png")


def plot_12_qualitative_panels(pred_df, gt_df, test_images_dir, operating_thresholds, out_path):
    img_files = sorted(list(test_images_dir.glob("*.png")) + list(test_images_dir.glob("*.jpg")))[:12]
    fig, axes = plt.subplots(3, 4, figsize=(16, 12))
    axes = axes.flatten()

    for idx, img_p in enumerate(img_files):
        ax = axes[idx]
        t_id = img_p.stem
        img = cv2.imread(str(img_p))
        if img is None:
            continue
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w = img.shape[:2]

        ax.imshow(img)

        # Draw Ground Truth in dashed lines
        t_gts = gt_df[gt_df["tile_id"] == t_id]
        for _, g_row in t_gts.iterrows():
            g_pts = np.array([g_row["x1"], g_row["y1"], g_row["x2"], g_row["y2"], g_row["x3"], g_row["y3"], g_row["x4"], g_row["y4"]]).reshape(4, 2)
            pts_px = (g_pts * np.array([w, h], dtype=np.float32)).astype(np.int32)
            cls_name = g_row["class"]
            poly = plt.Polygon(pts_px, fill=False, edgecolor="white", linestyle="--", linewidth=2.5)
            ax.add_patch(poly)
            ax.text(pts_px[0, 0], pts_px[0, 1] - 4, f"GT:{cls_name}", color="white", fontsize=8, fontweight="bold",
                    bbox=dict(boxstyle="square,pad=0.1", facecolor="black", alpha=0.7, edgecolor="none"))

        # Draw Predictions at operating threshold
        for cls in CLASS_NAMES:
            th = operating_thresholds[cls]
            t_preds = pred_df[(pred_df["tile_id"] == t_id) & (pred_df["class"] == cls) & (pred_df["score"] >= th)]
            for _, p_row in t_preds.iterrows():
                p_pts = np.array([p_row["x1"], p_row["y1"], p_row["x2"], p_row["y2"], p_row["x3"], p_row["y3"], p_row["x4"], p_row["y4"]]).reshape(4, 2)
                pts_px = (p_pts * np.array([w, h], dtype=np.float32)).astype(np.int32)
                color = CLASS_COLORS[cls]
                poly = plt.Polygon(pts_px, fill=False, edgecolor=color, linewidth=2.5)
                ax.add_patch(poly)
                ax.text(pts_px[2, 0], pts_px[2, 1] + 8, f"{cls} {p_row['score']:.2f}", color="white", fontsize=8, fontweight="bold",
                        bbox=dict(boxstyle="square,pad=0.1", facecolor=color, alpha=0.9, edgecolor="none"))

        ax.set_title(f"{t_id} (GT: {len(t_gts)})", fontsize=10, fontweight="bold")
        ax.axis("off")

    plt.suptitle("Test Set Qualitative Panels: Ground Truth (Dashed White) vs Predictions (Solid Color)", fontsize=14, fontweight="bold", y=0.98)
    plt.tight_layout()
    plt.savefig(out_path, dpi=300)
    plt.close()
    print(f"[SUCCESS] Saved {out_path}")


if __name__ == "__main__":
    run_test_evaluation()
