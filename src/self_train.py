"""Self-training pipeline and regional validation stability checker for Chimney Census.

Pipeline:
1. Evaluates current champion model on held-out region validation split.
2. Generates high-confidence pseudo-labels (conf > 0.70) on unlabeled test and demo tiles.
3. Combines verified training data with high-confidence pseudo-labels.
4. Retrains / fine-tunes model on combined pseudo-augmented dataset.
5. Re-evaluates on region-held-out validation set and compares score delta.
"""

import argparse
import os
import shutil
import sys
from pathlib import Path
from typing import Dict, Any, List, Tuple
import yaml
import torch
import numpy as np

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.scorer import evaluate_detections, load_ground_truth, print_score_report
from src.train import evaluate_val_split_with_custom_scorer
from src.data.dataset import CLASS_NAMES, write_obb_label, order_corners_clockwise

CLASS_TO_IDX = {name: idx for idx, name in enumerate(CLASS_NAMES)}
IDX_TO_CLASS = {idx: name for idx, name in enumerate(CLASS_NAMES)}


def generate_pseudo_labels(
    model,
    unlabeled_dir: Path,
    out_img_dir: Path,
    out_lbl_dir: Path,
    conf_thresh: float = 0.70,
    device: str = "0",
) -> int:
    """Predict on unlabeled tiles, keep detections with confidence > conf_thresh, and write YOLO-OBB labels."""
    out_img_dir.mkdir(parents=True, exist_ok=True)
    out_lbl_dir.mkdir(parents=True, exist_ok=True)

    images = sorted(list(unlabeled_dir.glob("*.png")) + list(unlabeled_dir.glob("*.jpg")) + list(unlabeled_dir.glob("*.tif")))
    print(f"[INFO] Generating pseudo-labels on {len(images)} unlabeled tiles at conf > {conf_thresh}...")

    total_pseudo_boxes = 0
    pseudo_tiles_count = 0

    for img_p in images:
        results = model.predict(source=str(img_p), conf=conf_thresh, iou=0.50, device=device, verbose=False)
        res = results[0]

        tile_boxes = []
        if res.obb is not None and len(res.obb) > 0:
            xyxyxyxyn = res.obb.xyxyxyxyn.cpu().numpy()
            classes = res.obb.cls.cpu().numpy().astype(int)
            confs = res.obb.conf.cpu().numpy()

            for pts, cls_idx, score in zip(xyxyxyxyn, classes, confs):
                if score >= conf_thresh:
                    ordered = order_corners_clockwise(pts).reshape(-1)
                    tile_boxes.append((int(cls_idx), ordered))

        # Copy image to pseudo-training directory
        target_img_p = out_img_dir / img_p.name
        shutil.copy(img_p, target_img_p)

        target_lbl_p = out_lbl_dir / f"{img_p.stem}.txt"
        if len(tile_boxes) > 0:
            write_obb_label(target_lbl_p, tile_boxes)
            total_pseudo_boxes += len(tile_boxes)
            pseudo_tiles_count += 1
        else:
            # 0-byte negative background tile
            target_lbl_p.write_text("", encoding="utf-8")

    print(f"[SUCCESS] Created {total_pseudo_boxes} high-confidence pseudo-labels across {len(images)} tiles ({pseudo_tiles_count} with kilns).")
    return total_pseudo_boxes


def prepare_self_training_data(
    base_data_dir: Path,
    unlabeled_dirs: List[Path],
    pseudo_data_dir: Path,
    conf_thresh: float = 0.70,
    model_weight: str = "weights/best.pt",
) -> Path:
    """Combine base training set with high-confidence pseudo-labeled tiles."""
    from ultralytics import YOLO

    device = "0" if torch.cuda.is_available() else "cpu"
    model = YOLO(model_weight)

    pseudo_img_train = pseudo_data_dir / "images" / "train"
    pseudo_lbl_train = pseudo_data_dir / "labels" / "train"
    pseudo_img_val = pseudo_data_dir / "images" / "val"
    pseudo_lbl_val = pseudo_data_dir / "labels" / "val"

    if pseudo_data_dir.exists():
        shutil.rmtree(pseudo_data_dir)

    pseudo_img_train.mkdir(parents=True, exist_ok=True)
    pseudo_lbl_train.mkdir(parents=True, exist_ok=True)
    pseudo_img_val.parent.mkdir(parents=True, exist_ok=True)
    pseudo_lbl_val.parent.mkdir(parents=True, exist_ok=True)

    # 1. Copy base training data
    base_train_imgs = base_data_dir / "images" / "train"
    base_train_lbls = base_data_dir / "labels" / "train"
    for p in base_train_imgs.glob("*.*"):
        shutil.copy(p, pseudo_img_train / p.name)
    for p in base_train_lbls.glob("*.txt"):
        shutil.copy(p, pseudo_lbl_train / p.name)

    # 2. Copy held-out validation data (unchanged for honest evaluation)
    shutil.copytree(base_data_dir / "images" / "val", pseudo_img_val, dirs_exist_ok=True)
    shutil.copytree(base_data_dir / "labels" / "val", pseudo_lbl_val, dirs_exist_ok=True)

    # 3. Generate pseudo-labels into train split
    for udir in unlabeled_dirs:
        if udir.exists():
            generate_pseudo_labels(
                model=model,
                unlabeled_dir=udir,
                out_img_dir=pseudo_img_train,
                out_lbl_dir=pseudo_lbl_train,
                conf_thresh=conf_thresh,
                device=device,
            )

    # Create resolved data yaml
    pseudo_yaml = PROJECT_ROOT / "configs" / "pseudo_data.yaml"
    cfg_content = {
        "path": str(pseudo_data_dir.resolve()),
        "train": "images/train",
        "val": "images/val",
        "test": "images/val",
        "names": {i: name for i, name in enumerate(CLASS_NAMES)},
    }
    with open(pseudo_yaml, "w", encoding="utf-8") as f:
        yaml.safe_dump(cfg_content, f)

    return pseudo_yaml


def run_self_training(
    base_config: str = "configs/train.yaml",
    conf_thresh: float = 0.70,
    epochs: int = 15,
) -> Dict[str, Any]:
    """Execute complete Step 7 self-training and regional validation check."""
    from ultralytics import YOLO

    device = "0" if torch.cuda.is_available() else "cpu"
    champion_weights = PROJECT_ROOT / "weights" / "best.pt"

    print("========================================================")
    print("      STEP 7: SELF-TRAINING & REGIONAL VALIDATION")
    print("========================================================")

    # 1. Evaluate baseline champion on held-out region
    print("\n[PHASE 1] Pre-Self-Training Evaluation on Held-Out Region:")
    champ_model = YOLO(str(champion_weights))
    pre_metrics = evaluate_val_split_with_custom_scorer(
        champ_model,
        data_dir=PROJECT_ROOT / "data",
        conf_thresh=0.001,
        device=device,
    )
    pre_map = pre_metrics.get("macro_map50", 0.0)

    # 2. Prepare pseudo-labels from test tiles
    unlabeled_sources = [
        PROJECT_ROOT / "data" / "images" / "test",
    ]
    pseudo_dir = PROJECT_ROOT / "data" / "pseudo_dataset"
    pseudo_yaml = prepare_self_training_data(
        base_data_dir=PROJECT_ROOT / "data",
        unlabeled_dirs=unlabeled_sources,
        pseudo_data_dir=pseudo_dir,
        conf_thresh=conf_thresh,
        model_weight=str(champion_weights),
    )

    # 3. Retrain on pseudo-labeled data
    print(f"\n[PHASE 2] Fine-tuning model on pseudo-labeled data for {epochs} epochs...")
    st_model = YOLO(str(champion_weights))
    train_args = {
        "data": str(pseudo_yaml),
        "epochs": epochs,
        "batch": 32,
        "imgsz": 256,
        "device": device,
        "lr0": 0.001,
        "warmup_epochs": 1.0,
        "amp": True,
        "project": "runs/detect",
        "name": "self_training_pseudo",
        "exist_ok": True,
        "box": 7.5,
        "cls": 3.0,
        "copy_paste": 0.3,
        "degrees": 180.0,
        "fliplr": 0.5,
        "flipud": 0.5,
    }
    st_results = st_model.train(**train_args)

    # 4. Evaluate post-self-training on held-out region
    print("\n[PHASE 3] Post-Self-Training Evaluation on Held-Out Region:")
    st_best_path = Path(st_results.save_dir) / "weights" / "best.pt"
    eval_model = YOLO(str(st_best_path)) if st_best_path.exists() else st_model
    post_metrics = evaluate_val_split_with_custom_scorer(
        eval_model,
        data_dir=PROJECT_ROOT / "data",
        conf_thresh=0.001,
        device=device,
    )
    post_map = post_metrics.get("macro_map50", 0.0)

    # 5. Compare stability and performance
    delta_map = post_map - pre_map
    print("\n========================================================")
    print(f"      SELF-TRAINING REGIONAL VALIDATION RESULTS")
    print("========================================================")
    print(f"Pre-Self-Training mAP@0.5:  {pre_map:.4f}")
    print(f"Post-Self-Training mAP@0.5: {post_map:.4f}")
    print(f"Delta mAP@0.5:              {delta_map:+.4f}")

    if delta_map >= 0.0:
        print(f"[DECISION] Self-training improved/stabilized score (+{delta_map:.4f}). Updating weights/best.pt...")
        shutil.copy(st_best_path, champion_weights)
    else:
        print(f"[DECISION] Baseline champion retained (delta {delta_map:+.4f}).")

    return {
        "pre_map": pre_map,
        "post_map": post_map,
        "delta_map": delta_map,
        "pre_metrics": pre_metrics,
        "post_metrics": post_metrics,
    }


def main():
    parser = argparse.ArgumentParser(description="Self-Training & Regional Validation for Chimney Census")
    parser.add_argument("--config", type=str, default="configs/train.yaml")
    parser.add_argument("--conf", type=float, default=0.70, help="Confidence threshold for pseudo-labels")
    parser.add_argument("--epochs", type=int, default=15, help="Number of self-training epochs")
    args = parser.parse_args()

    run_self_training(base_config=args.config, conf_thresh=args.conf, epochs=args.epochs)


if __name__ == "__main__":
    main()
