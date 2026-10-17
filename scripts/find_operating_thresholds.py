"""Find optimal per-class operating confidence thresholds (maximizing F1) on the validation set."""

import json
from pathlib import Path
import numpy as np
import pandas as pd
from ultralytics import YOLO

PROJECT_ROOT = Path(__file__).resolve().parent.parent
import sys
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.scorer import evaluate_detections_at_threshold, load_ground_truth, polygon_iou
from src.postprocess import format_detection_row, save_submission_csv
from src.data.dataset import CLASS_NAMES

CLASS_MAP = {idx: name for idx, name in enumerate(CLASS_NAMES)}


def find_best_thresholds(
    weights_path: Path = PROJECT_ROOT / "weights" / "best.pt",
    val_images_dir: Path = PROJECT_ROOT / "data" / "images" / "val",
    val_labels_dir: Path = PROJECT_ROOT / "data" / "labels" / "val",
    out_json: Path = PROJECT_ROOT / "configs" / "thresholds.json",
):
    print(f"[INFO] Evaluating optimal thresholds using {weights_path}...")
    model = YOLO(str(weights_path))

    # Run inference at very low threshold (0.001) to capture full PR space
    img_paths = sorted(list(val_images_dir.glob("*.png")) + list(val_images_dir.glob("*.jpg")))
    pred_rows = []
    results = model.predict(source=[str(p) for p in img_paths], conf=0.001, iou=0.5, verbose=False)

    for img_p, res in zip(img_paths, results):
        tile_id = img_p.stem
        if res.obb is None or len(res.obb) == 0:
            continue
        xyxyxyxyn = res.obb.xyxyxyxyn.cpu().numpy()
        confs = res.obb.conf.cpu().numpy()
        classes = res.obb.cls.cpu().numpy().astype(int)

        for pts, conf, cls_idx in zip(xyxyxyxyn, confs, classes):
            cls_name = CLASS_MAP.get(cls_idx, "FCBK")
            flat_pts = pts.reshape(-1)
            row = format_detection_row(tile_id, cls_name, flat_pts, float(conf))
            pred_rows.append(row)

    pred_df = pd.DataFrame(pred_rows)
    gt_df = load_ground_truth(val_labels_dir)

    print(f"[INFO] Total candidate detections: {len(pred_df)} across {len(gt_df)} GT boxes.")

    threshold_grid = np.linspace(0.05, 0.95, 91)
    best_thresholds = {}
    f1_curves = {cls: [] for cls in CLASS_NAMES}

    for cls in CLASS_NAMES:
        cls_preds = pred_df[pred_df["class"] == cls]
        cls_gts = gt_df[gt_df["class"] == cls]
        best_f1 = -1.0
        best_th = 0.25
        best_p = 0.0
        best_r = 0.0

        for th in threshold_grid:
            stats = evaluate_detections_at_threshold(cls_preds, cls_gts, thresholds=th, iou_thresh=0.5)
            cls_stat = stats[cls]
            f1 = cls_stat["f1"]
            f1_curves[cls].append({"threshold": float(th), "f1": float(f1), "precision": float(cls_stat["precision"]), "recall": float(cls_stat["recall"])})
            if f1 > best_f1:
                best_f1 = f1
                best_th = th
                best_p = cls_stat["precision"]
                best_r = cls_stat["recall"]

        best_thresholds[cls] = {
            "optimal_threshold": round(float(best_th), 3),
            "best_f1": round(float(best_f1), 4),
            "precision_at_optimal": round(float(best_p), 4),
            "recall_at_optimal": round(float(best_r), 4),
        }

    output_payload = {
        "metadata": {
            "source": "val_split",
            "model_weights": "weights/best.pt",
            "iou_threshold": 0.50,
            "leaderboard_csv_threshold": 0.001
        },
        "operating_thresholds": {cls: best_thresholds[cls]["optimal_threshold"] for cls in CLASS_NAMES},
        "details": best_thresholds,
    }

    out_json.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2)

    print("\n" + "=" * 50)
    print("      OPTIMAL OPERATING THRESHOLDS (MAX F1)      ")
    print("=" * 50)
    for cls in CLASS_NAMES:
        d = best_thresholds[cls]
        print(f"{cls:<10} | Threshold: {d['optimal_threshold']:<5} | F1: {d['best_f1']:.4f} | Prec: {d['precision_at_optimal']:.4f} | Rec: {d['recall_at_optimal']:.4f}")
    print("=" * 50 + "\n")
    print(f"[SUCCESS] Saved threshold configuration to {out_json}")
    return output_payload


if __name__ == "__main__":
    find_best_thresholds()
