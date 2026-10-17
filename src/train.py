"""Training entrypoint and validation evaluation harness for Agni Drishti.

Pipeline:
1. Loads training hyperparameters from configs/train.yaml
2. Trains pretrained YOLO-OBB backbone (yolo11s-obb / yolov8s-obb) with AMP on
3. Saves best weights checkpoint to weights/best.pt
4. Generates and saves training curves and figures to reports/figures/
5. Runs validation inference on val set tiles (conf=0.001 for high recall)
6. Evaluates detections using our exact custom scorer (Rotated IoU >= 0.5,
   DOTA-style all-point interpolated AP, equal 1/3 macro-averaged mAP)
"""

import argparse
import os
import shutil
import sys
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import yaml
import torch
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.scorer import evaluate_detections, load_ground_truth, print_score_report
from src.postprocess import format_detection_row, save_submission_csv
from src.data.dataset import CLASS_NAMES

CLASS_MAP = {idx: name for idx, name in enumerate(CLASS_NAMES)}
REPORTS_FIGURES = PROJECT_ROOT / "reports" / "figures"
REPORTS_METRICS = PROJECT_ROOT / "reports" / "metrics"


def resolve_data_yaml(raw_config_path: str) -> Path:
    """Ensure data.yaml uses valid absolute paths and points to prepared data."""
    data_yaml_path = Path(raw_config_path).resolve()
    with open(data_yaml_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    cfg["path"] = str((PROJECT_ROOT / "data").resolve())
    oversampled_txt = PROJECT_ROOT / "data_prepared" / "train_oversampled.txt"
    if oversampled_txt.exists():
        cfg["train"] = str(oversampled_txt.resolve())
    else:
        cfg["train"] = "images/train"
    cfg["val"] = "images/val"
    cfg["test"] = "images/test"

    resolved_path = PROJECT_ROOT / "configs" / "resolved_data.yaml"
    with open(resolved_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(cfg, f)
    return resolved_path


def save_training_figures(save_dir: Path, run_name: str):
    """Parse results.csv and save training curves and ultralytics figures to reports/figures/."""
    REPORTS_FIGURES.mkdir(parents=True, exist_ok=True)
    results_csv = save_dir / "results.csv"

    if results_csv.exists():
        df = pd.read_csv(results_csv)
        # Strip whitespace from columns
        df.columns = [c.strip() for c in df.columns]

        fig, axes = plt.subplots(2, 3, figsize=(15, 9))
        epochs = df["epoch"] if "epoch" in df.columns else range(1, len(df) + 1)

        # 1. Box and Angle Loss
        if "train/box_loss" in df.columns:
            axes[0, 0].plot(epochs, df["train/box_loss"], label="Train Box Loss", color="#1A73E8", lw=2)
        if "val/box_loss" in df.columns:
            axes[0, 0].plot(epochs, df["val/box_loss"], label="Val Box Loss", color="#E8710A", lw=2, linestyle="--")
        axes[0, 0].set_title("Rotated Box Loss", fontweight="bold")
        axes[0, 0].set_xlabel("Epoch")
        axes[0, 0].legend()
        axes[0, 0].grid(True)

        # 2. Classification Loss
        if "train/cls_loss" in df.columns:
            axes[0, 1].plot(epochs, df["train/cls_loss"], label="Train Cls Loss", color="#188038", lw=2)
        if "val/cls_loss" in df.columns:
            axes[0, 1].plot(epochs, df["val/cls_loss"], label="Val Cls Loss", color="#D93025", lw=2, linestyle="--")
        axes[0, 1].set_title("Classification Loss", fontweight="bold")
        axes[0, 1].set_xlabel("Epoch")
        axes[0, 1].legend()
        axes[0, 1].grid(True)

        # 3. Angle Loss / DFL
        if "train/angle_loss" in df.columns:
            axes[0, 2].plot(epochs, df["train/angle_loss"], label="Train Angle Loss", color="#9C27B0", lw=2)
        if "val/angle_loss" in df.columns:
            axes[0, 2].plot(epochs, df["val/angle_loss"], label="Val Angle Loss", color="#673AB7", lw=2, linestyle="--")
        axes[0, 2].set_title("Orientation Angle Loss", fontweight="bold")
        axes[0, 2].set_xlabel("Epoch")
        axes[0, 2].legend()
        axes[0, 2].grid(True)

        # 4. Precision & Recall
        prec_col = [c for c in df.columns if "precision" in c.lower()]
        rec_col = [c for c in df.columns if "recall" in c.lower()]
        if prec_col:
            axes[1, 0].plot(epochs, df[prec_col[0]], label="Precision", color="#00897B", lw=2)
        if rec_col:
            axes[1, 0].plot(epochs, df[rec_col[0]], label="Recall", color="#FB8C00", lw=2)
        axes[1, 0].set_title("Precision & Recall per Epoch", fontweight="bold")
        axes[1, 0].set_xlabel("Epoch")
        axes[1, 0].legend()
        axes[1, 0].grid(True)

        # 5. mAP50 and mAP50-95
        map50_col = [c for c in df.columns if "map50" in c.lower() and "95" not in c.lower()]
        map_all_col = [c for c in df.columns if "map50-95" in c.lower()]
        if map50_col:
            axes[1, 1].plot(epochs, df[map50_col[0]], label="mAP@0.5", color="#1A73E8", lw=2.5)
        if map_all_col:
            axes[1, 1].plot(epochs, df[map_all_col[0]], label="mAP@0.5:0.95", color="#5E35B1", lw=2, linestyle="--")
        axes[1, 1].set_title("Validation mAP per Epoch", fontweight="bold")
        axes[1, 1].set_xlabel("Epoch")
        axes[1, 1].legend()
        axes[1, 1].grid(True)

        # 6. Learning Rate Schedule
        lr_cols = [c for c in df.columns if c.startswith("lr/")]
        if lr_cols:
            for lrc in lr_cols:
                axes[1, 2].plot(epochs, df[lrc], label=lrc, lw=1.5)
        axes[1, 2].set_title("Cosine Learning Rate Schedule", fontweight="bold")
        axes[1, 2].set_xlabel("Epoch")
        axes[1, 2].legend()
        axes[1, 2].grid(True)

        plt.suptitle(f"Agni Drishti Training Curves ({run_name})", fontsize=15, fontweight="bold", y=0.98)
        plt.tight_layout()
        plt.savefig(REPORTS_FIGURES / f"{run_name}_curves.png", dpi=300)
        plt.savefig(REPORTS_FIGURES / "training_curves.png", dpi=300)
        plt.close()
        print(f"[SUCCESS] Saved training curves to {REPORTS_FIGURES / 'training_curves.png'}")

    # Copy standard ultralytics evaluation figures
    copy_targets = [
        ("results.png", "ultralytics_results.png"),
        ("BoxPR_curve.png", "box_pr_curve.png"),
        ("BoxF1_curve.png", "box_f1_curve.png"),
        ("confusion_matrix.png", "confusion_matrix.png"),
        ("confusion_matrix_normalized.png", "confusion_matrix_normalized.png"),
    ]
    for src_name, dst_name in copy_targets:
        src_file = save_dir / src_name
        if src_file.exists():
            shutil.copy(src_file, REPORTS_FIGURES / dst_name)
            print(f"[SUCCESS] Copied {src_name} -> {REPORTS_FIGURES / dst_name}")


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

    val_pred_df = pd.read_csv(val_preds_csv)
    gt_df = load_ground_truth(val_labels_dir)

    print(f"[INFO] Evaluating {len(val_pred_df)} detections against {len(gt_df)} ground truth boxes...")
    metrics = evaluate_detections(val_pred_df, gt_df, iou_thresh=0.5)
    print_score_report(metrics)
    return metrics


def train_model(
    config_path: str = "configs/train.yaml",
    run_name: Optional[str] = None,
    epochs_override: Optional[int] = None,
    imgsz_override: Optional[int] = None,
    batch_override: Optional[int] = None,
    architecture_override: Optional[str] = None,
) -> Tuple[Any, Dict[str, Any]]:
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    # 1. Device configuration
    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"[INFO] Compute device selected: {device} (CUDA available: {torch.cuda.is_available()})")

    # 2. Data configuration
    raw_data_yaml = cfg["data"].get("config_path", "configs/data.yaml")
    resolved_data_yaml = resolve_data_yaml(raw_data_yaml)

    # 3. Model setup
    model_name = architecture_override or cfg["model"].get("architecture", "yolo11s-obb.pt")
    from ultralytics import YOLO

    try:
        print(f"[INFO] Loading model checkpoint: {model_name}...")
        model = YOLO(model_name)
    except Exception as e:
        fallback = "yolov8s-obb.pt"
        print(f"[WARN] Failed to load {model_name} ({e}), falling back to {fallback}...")
        model = YOLO(fallback)

    # 4. Training parameters
    train_args = cfg.get("train", {}).copy()
    train_args["imgsz"] = imgsz_override or cfg["data"].get("imgsz", 256)
    train_args["batch"] = batch_override or cfg["data"].get("batch_size", 32)
    train_args["workers"] = cfg["data"].get("workers", 4)
    train_args["device"] = device
    train_args["project"] = "runs/detect"
    train_args["name"] = run_name or cfg.get("train", {}).get("name", "baseline_obb")
    train_args["exist_ok"] = True
    if epochs_override is not None:
        train_args["epochs"] = epochs_override

    print(f"[INFO] Commencing training on {resolved_data_yaml} (name={train_args['name']}, epochs={train_args.get('epochs', 30)}, imgsz={train_args['imgsz']}, batch={train_args['batch']}, AMP={train_args.get('amp', True)})...")
    results = model.train(data=str(resolved_data_yaml), **train_args)

    save_dir = Path(results.save_dir) if hasattr(results, "save_dir") else PROJECT_ROOT / "runs" / "detect" / train_args["name"]

    # 5. Save training figures
    save_training_figures(save_dir, train_args["name"])

    # 6. Persist best and last weights
    weights_dir = PROJECT_ROOT / "weights"
    weights_dir.mkdir(parents=True, exist_ok=True)
    best_weight_candidate = save_dir / "weights" / "best.pt"
    last_weight_candidate = save_dir / "weights" / "last.pt"

    if best_weight_candidate.exists():
        shutil.copy(best_weight_candidate, weights_dir / "best.pt")
        print(f"[SUCCESS] Saved best model checkpoint to {(weights_dir / 'best.pt').resolve()}")
    if last_weight_candidate.exists():
        shutil.copy(last_weight_candidate, weights_dir / "last.pt")

    # 7. Evaluate on validation set using OUR custom scorer
    best_model = YOLO(str(weights_dir / "best.pt")) if (weights_dir / "best.pt").exists() else model
    custom_metrics = evaluate_val_split_with_custom_scorer(
        best_model,
        data_dir=PROJECT_ROOT / "data",
        conf_thresh=cfg.get("infer", {}).get("conf_threshold", 0.001),
        device=device,
    )

    return results, custom_metrics


def main():
    parser = argparse.ArgumentParser(description="Train Chimney Census YOLO-OBB")
    parser.add_argument("--config", type=str, default="configs/train.yaml", help="Path to training config YAML")
    parser.add_argument("--name", type=str, default=None, help="Experiment name")
    parser.add_argument("--epochs", type=int, default=None, help="Override epochs count")
    parser.add_argument("--imgsz", type=int, default=None, help="Override image size")
    parser.add_argument("--batch", type=int, default=None, help="Override batch size")
    parser.add_argument("--model", type=str, default=None, help="Override architecture")
    args = parser.parse_args()

    train_model(
        config_path=args.config,
        run_name=args.name,
        epochs_override=args.epochs,
        imgsz_override=args.imgsz,
        batch_override=args.batch,
        architecture_override=args.model,
    )


if __name__ == "__main__":
    main()
