"""Inference and submission generation entrypoint."""

import argparse
from pathlib import Path
from typing import List, Dict, Any
import yaml
import numpy as np
from tqdm import tqdm
from src.postprocess import format_detection_row, save_submission_csv

CLASS_MAP = {0: "FCBK", 1: "CFCBK", 2: "Zigzag"}


def run_inference(config_path: str, weights_path: str = None, test_dir: str = None, out_csv: str = None):
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    infer_cfg = cfg.get("infer", {})
    conf_thresh = infer_cfg.get("conf_threshold", 0.001)
    iou_thresh = infer_cfg.get("iou_threshold", 0.50)
    device = infer_cfg.get("device", "0")
    submission_path = out_csv or infer_cfg.get("submission_path", "submission.csv")

    model_path = weights_path or "weights/best.pt"
    if not Path(model_path).exists():
        model_path = cfg["model"].get("architecture", "yolov8n-obb.pt")
        print(f"[WARN] Custom weights not found at {weights_path}, using base model: {model_path}")

    from ultralytics import YOLO
    model = YOLO(model_path)

    images_dir = Path(test_dir or cfg["data"].get("test", "data/images/test"))
    image_paths = sorted(list(images_dir.glob("*.png")) + list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.tif")))
    print(f"[INFO] Found {len(image_paths)} test tiles in {images_dir}")

    rows: List[Dict[str, Any]] = []

    if len(image_paths) == 0:
        print("[WARN] No test images found. Creating empty submission with schema headers.")
        save_submission_csv([], submission_path)
        return submission_path

    # Batch prediction
    batch_size = 128
    for i in tqdm(range(0, len(image_paths), batch_size), desc="Inferring"):
        batch = [str(p) for p in image_paths[i:i + batch_size]]
        results = model.predict(source=batch, conf=conf_thresh, iou=iou_thresh, device=device, verbose=False)

        for img_p, res in zip(batch, results):
            tile_id = Path(img_p).stem
            if res.obb is None or len(res.obb) == 0:
                continue

            xyxyxyxyn = res.obb.xyxyxyxyn.cpu().numpy()  # (N, 4, 2) normalized
            confs = res.obb.conf.cpu().numpy()
            classes = res.obb.cls.cpu().numpy().astype(int)

            for pts, conf, cls_idx in zip(xyxyxyxyn, confs, classes):
                cls_name = CLASS_MAP.get(cls_idx, "FCBK")
                flat_pts = pts.reshape(-1)  # [x1, y1, x2, y2, x3, y3, x4, y4]
                row = format_detection_row(tile_id, cls_name, flat_pts, conf)
                rows.append(row)

    save_submission_csv(rows, submission_path)
    return submission_path


def main():
    parser = argparse.ArgumentParser(description="Run inference and generate submission CSV")
    parser.add_argument("--config", type=str, default="configs/train.yaml")
    parser.add_argument("--weights", type=str, default=None)
    parser.add_argument("--test-dir", type=str, default=None)
    parser.add_argument("--output", type=str, default="submission.csv")
    args = parser.parse_args()

    run_inference(args.config, weights_path=args.weights, test_dir=args.test_dir, out_csv=args.output)


if __name__ == "__main__":
    main()
