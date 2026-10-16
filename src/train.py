"""Training entrypoint and validation evaluation harness for Chimney Census.

Pipeline:
1. Loads training hyperparameters from configs/train.yaml
2. Trains pretrained YOLO-OBB backbone (yolo11s-obb / yolov8s-obb) with AMP on
3. Saves best weights checkpoint to weights/best.pt
4. Runs validation inference on val set tiles (conf=0.001 for high recall)
5. Evaluates detections using our exact custom scorer (Rotated IoU >= 0.5,
   DOTA-style all-point interpolated AP, equal 1/3 macro-averaged mAP)
"""

import argparse
import os
import shutil
import sys
from pathlib import Path
from typing import Dict, Any
import yaml
import torch

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.scorer import evaluate_detections, load_ground_truth, print_score_report
from src.postprocess import format_detection_row, save_submission_csv
from src.data.dataset import CLASS_NAMES

CLASS_MAP = {idx: name for idx, name in enumerate(CLASS_NAMES)}


def resolve_data_yaml(raw_config_path: str) -> Path:
    """Ensure data.yaml uses valid absolute paths to prevent working-directory mismatches."""
    data_yaml_path = Path(raw_config_path).resolve()
    with open(data_yaml_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    cfg["path"] = str((PROJECT_ROOT / "data").resolve())
    cfg["train"] = "images/train"
    cfg["val"] = "images/val"
    cfg["test"] = "images/test"

    resolved_path = PROJECT_ROOT / "configs" / "resolved_data.yaml"
    with open(resolved_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(cfg, f)
    return resolved_path


def evaluate_val_split_with_custom_scorer(model, data_dir: Path, conf_thresh: float = 0.001, device: str = "0") -> Dict[str, Any]:
    """Run validation set inference and evaluate using custom rotated-IoU all-point mAP@0.5 scorer."""
    val_images_dir = data_dir / "images" / "val"
    val_labels_dir = data_dir / "labels" / "val"

    img_paths = sorted(list(val_images_dir.glob("*.png")) + list(val_images_dir.glob("*.jpg")))
    print(f"[INFO] Running validation inference on {len(img_paths)} tiles at conf={conf_thresh}...")

    pred_rows = []
    if len(img_paths) > 0:
        batch_size = 32
        for i in range(0, len(img_paths), batch_size):
            batch = [str(p) for p in img_paths[i:i + batch_size]]
            results = model.predict(source=batch, conf=conf_thresh, iou=0.50, device=device, verbose=False)

            for img_p, res in zip(batch, results):
                tile_id = Path(img_p).stem
                if res.obb is None or len(res.obb) == 0:
                    continue

                xyxyxyxyn = res.obb.xyxyxyxyn.cpu().numpy()
                confs = res.obb.conf.cpu().numpy()
                classes = res.obb.cls.cpu().numpy().astype(int)

                for pts, conf, cls_idx in zip(xyxyxyxyn, confs, classes):
                    cls_name = CLASS_MAP.get(cls_idx, "FCBK")
                    flat_pts = pts.reshape(-1)
                    row = format_detection_row(tile_id, cls_name, flat_pts, conf)
                    pred_rows.append(row)

    val_preds_csv = PROJECT_ROOT / "runs" / "val_predictions.csv"
    val_preds_csv.parent.mkdir(parents=True, exist_ok=True)
    val_pred_df = save_submission_csv(pred_rows, val_preds_csv)

    import pandas as pd
    val_pred_df = pd.read_csv(val_preds_csv)
    gt_df = load_ground_truth(val_labels_dir)

    print(f"[INFO] Evaluating {len(val_pred_df)} detections against {len(gt_df)} ground truth boxes...")
    metrics = evaluate_detections(val_pred_df, gt_df, iou_thresh=0.5)
    print_score_report(metrics)
    return metrics


def train_model(config_path: str):
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    # 1. Device configuration
    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"[INFO] Compute device selected: {device} (CUDA available: {torch.cuda.is_available()})")

    # 2. Data configuration
    raw_data_yaml = cfg["data"].get("config_path", "configs/data.yaml")
    resolved_data_yaml = resolve_data_yaml(raw_data_yaml)

    # 3. Model setup
    model_name = cfg["model"].get("architecture", "yolo11s-obb.pt")
    from ultralytics import YOLO

    try:
        print(f"[INFO] Loading model checkpoint: {model_name}...")
        model = YOLO(model_name)
    except Exception as e:
        fallback = "yolov8s-obb.pt"
        print(f"[WARN] Failed to load {model_name} ({e}), falling back to {fallback}...")
        model = YOLO(fallback)

    # 4. Training parameters
    train_args = cfg.get("train", {})
    train_args["imgsz"] = cfg["data"].get("imgsz", 128)
    train_args["batch"] = cfg["data"].get("batch_size", 64)
    train_args["workers"] = cfg["data"].get("workers", 2)
    train_args["device"] = device
    train_args["project"] = "runs/detect"
    train_args["name"] = "baseline_obb"
    train_args["exist_ok"] = True

    print(f"[INFO] Commencing training on {resolved_data_yaml} (epochs={train_args.get('epochs', 30)}, imgsz={train_args['imgsz']}, AMP={train_args.get('amp', True)})...")
    results = model.train(data=str(resolved_data_yaml), **train_args)

    # 5. Persist best weights
    weights_dir = PROJECT_ROOT / "weights"
    weights_dir.mkdir(parents=True, exist_ok=True)
    best_weight_candidate = Path(results.save_dir) / "weights" / "best.pt" if hasattr(results, "save_dir") else Path("runs/obb/runs/detect/baseline_obb/weights/best.pt")
    if best_weight_candidate.exists():
        shutil.copy(best_weight_candidate, weights_dir / "best.pt")
        print(f"[SUCCESS] Saved best model checkpoint to {(weights_dir / 'best.pt').resolve()}")

    # 6. Evaluate on validation set using OUR custom scorer
    best_model = YOLO(str(weights_dir / "best.pt")) if (weights_dir / "best.pt").exists() else model
    custom_metrics = evaluate_val_split_with_custom_scorer(
        best_model,
        data_dir=PROJECT_ROOT / "data",
        conf_thresh=cfg.get("infer", {}).get("conf_threshold", 0.001),
        device=device,
    )

    return results, custom_metrics


def main():
    parser = argparse.ArgumentParser(description="Train Chimney Census YOLO-OBB Baseline")
    parser.add_argument("--config", type=str, default="configs/train.yaml", help="Path to training config YAML")
    args = parser.parse_args()

    train_model(args.config)


if __name__ == "__main__":
    main()
