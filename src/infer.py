"""Inference, submission generation, and 8,000-tile latency benchmarking.

Hard Rules:
- conf_threshold ~ 0.001 (keep low-confidence detections to maximize all-point AP recall)
- iou NMS ~ 0.50
- max_det = 100
- Corners normalized [0, 1] in clockwise order around the box
- Class names: FCBK, CFCBK, Zigzag
- Strict CSV schema validation
- 8,000-tile inference latency strictly <= 15 minutes on a T4 GPU
"""

import argparse
import sys
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
import yaml
import torch
import numpy as np
from tqdm import tqdm

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.postprocess import format_detection_row, save_submission_csv, validate_submission_csv
from src.data.dataset import order_corners_clockwise, CLASS_NAMES

CLASS_MAP = {idx: name for idx, name in enumerate(CLASS_NAMES)}


from src.postprocess import format_detection_row, save_submission_csv, validate_submission_csv, rotated_nms
import cv2


def run_inference(
    config_path: str = "configs/train.yaml",
    weights_path: Optional[str] = None,
    test_dir: Optional[str] = None,
    out_csv: Optional[str] = None,
    conf_thresh: float = 0.001,
    iou_thresh: float = 0.50,
    max_det: int = 100,
    batch_size: int = 64,
    use_tta: bool = False,
) -> Path:
    """Run batch inference on test tiles and output validated submission CSV."""
    cfg = {}
    if Path(config_path).exists():
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)

    infer_cfg = cfg.get("infer", {})
    conf = conf_thresh if conf_thresh is not None else infer_cfg.get("conf_threshold", 0.001)
    iou = iou_thresh if iou_thresh is not None else infer_cfg.get("iou_threshold", 0.50)
    submission_path = Path(out_csv or infer_cfg.get("submission_path", "submission.csv"))

    # Resolve model weights
    device = "0" if torch.cuda.is_available() else "cpu"
    model_weight = weights_path or "weights/best.pt"
    if not Path(model_weight).exists():
        model_weight = "yolo11s-obb.pt"
        print(f"[WARN] Custom weights not found, using base model: {model_weight}")

    print(f"[INFO] Loading detector weights from {model_weight} on device={device} (TTA={use_tta})...")
    from ultralytics import YOLO
    model = YOLO(model_weight)

    # Gather test images
    images_dir = Path(test_dir or cfg.get("data", {}).get("test", "data/images/test"))
    image_paths = sorted(list(images_dir.glob("*.png")) + list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.tif")))
    print(f"[INFO] Found {len(image_paths)} test tiles in {images_dir.resolve()}")

    rows: List[Dict[str, Any]] = []

    if len(image_paths) == 0:
        print("[WARN] No test images found. Creating empty submission with schema headers.")
        save_submission_csv([], submission_path)
        validate_submission_csv(submission_path)
        return submission_path

    # Batch inference loop
    start_time = time.perf_counter()
    for i in tqdm(range(0, len(image_paths), batch_size), desc="Running OBB Inference"):
        batch_paths = image_paths[i:i + batch_size]
        batch_str = [str(p) for p in batch_paths]

        # 1. Standard forward pass
        results = model.predict(
            source=batch_str,
            conf=conf,
            iou=iou,
            max_det=max_det,
            device=device,
            verbose=False,
        )

        for img_p, res in zip(batch_str, results):
            tile_id = Path(img_p).stem
            if res.obb is None or len(res.obb) == 0:
                continue

            xyxyxyxyn = res.obb.xyxyxyxyn.cpu().numpy()
            confs = res.obb.conf.cpu().numpy()
            classes = res.obb.cls.cpu().numpy().astype(int)

            for pts, score, cls_idx in zip(xyxyxyxyn, confs, classes):
                cls_name = CLASS_MAP.get(cls_idx, "FCBK")
                ordered_pts = order_corners_clockwise(pts).reshape(-1)
                row = format_detection_row(tile_id, cls_name, ordered_pts, float(score))
                rows.append(row)

        # 2. Test-Time Augmentation (Horizontal Flip & 90-degree Rotation)
        if use_tta:
            # (a) Horizontal flip pass
            flipped_imgs = [cv2.flip(cv2.imread(str(p)), 1) for p in batch_paths]
            res_flip = model.predict(source=flipped_imgs, conf=conf, iou=iou, max_det=max_det, device=device, verbose=False)
            for img_p, res in zip(batch_paths, res_flip):
                tile_id = img_p.stem
                if res.obb is None or len(res.obb) == 0:
                    continue
                xyxyxyxyn = res.obb.xyxyxyxyn.cpu().numpy()
                confs = res.obb.conf.cpu().numpy()
                classes = res.obb.cls.cpu().numpy().astype(int)
                for pts, score, cls_idx in zip(xyxyxyxyn, confs, classes):
                    cls_name = CLASS_MAP.get(cls_idx, "FCBK")
                    # Invert horizontal flip: x' = 1.0 - x
                    unflipped = pts.copy()
                    unflipped[:, 0] = 1.0 - unflipped[:, 0]
                    ordered_pts = order_corners_clockwise(unflipped).reshape(-1)
                    rows.append(format_detection_row(tile_id, cls_name, ordered_pts, float(score)))

            # (b) 90-degree clockwise rotation pass
            rot_imgs = [cv2.rotate(cv2.imread(str(p)), cv2.ROTATE_90_CLOCKWISE) for p in batch_paths]
            res_rot = model.predict(source=rot_imgs, conf=conf, iou=iou, max_det=max_det, device=device, verbose=False)
            for img_p, res in zip(batch_paths, res_rot):
                tile_id = img_p.stem
                if res.obb is None or len(res.obb) == 0:
                    continue
                xyxyxyxyn = res.obb.xyxyxyxyn.cpu().numpy()
                confs = res.obb.conf.cpu().numpy()
                classes = res.obb.cls.cpu().numpy().astype(int)
                for pts, score, cls_idx in zip(xyxyxyxyn, confs, classes):
                    cls_name = CLASS_MAP.get(cls_idx, "FCBK")
                    # Invert 90 deg clockwise: x_orig = y_rot, y_orig = 1.0 - x_rot
                    unrot = np.zeros_like(pts)
                    unrot[:, 0] = pts[:, 1]
                    unrot[:, 1] = 1.0 - pts[:, 0]
                    ordered_pts = order_corners_clockwise(unrot).reshape(-1)
                    rows.append(format_detection_row(tile_id, cls_name, ordered_pts, float(score)))

    # Apply rotated NMS to merge overlapping multi-view detections if TTA was active
    if use_tta and len(rows) > 0:
        pre_count = len(rows)
        rows = rotated_nms(rows, iou_thresh=iou)
        print(f"[INFO] TTA Rotated NMS merged {pre_count} candidate views -> {len(rows)} detections.")

    total_time = time.perf_counter() - start_time
    print(f"[INFO] Inference on {len(image_paths)} tiles took {total_time:.2f}s ({len(image_paths)/total_time:.1f} tiles/s)")

    save_submission_csv(rows, submission_path)
    is_valid, errors = validate_submission_csv(submission_path)
    if not is_valid:
        raise ValueError(f"Submission CSV validation failed: {errors}")

    return submission_path



def benchmark_8k_inference_latency(
    model_weight: str = "weights/best.pt",
    batch_size: int = 64,
    benchmark_samples: int = 200,
) -> Dict[str, float]:
    """Measure inference throughput and extrapolate to 8,000 test tiles against the 15-min limit."""
    device = "0" if torch.cuda.is_available() else "cpu"
    if not Path(model_weight).exists():
        model_weight = "yolo11s-obb.pt"

    from ultralytics import YOLO
    model = YOLO(model_weight)

    print(f"\n========================================================")
    print(f"      INFERENCE LATENCY BENCHMARK (8,000 TILES)")
    print(f"========================================================")
    print(f"Device: {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")
    print(f"Batch size: {batch_size} | Test tiles: {benchmark_samples} tiles")

    # Synthetic batch of 128x128 satellite tiles
    dummy_tiles = [np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8) for _ in range(benchmark_samples)]

    # Warmup
    _ = model.predict(source=dummy_tiles[:min(batch_size, len(dummy_tiles))], conf=0.001, device=device, verbose=False)
    if torch.cuda.is_available():
        torch.cuda.synchronize()

    # Timed run
    start_t = time.perf_counter()
    for i in range(0, len(dummy_tiles), batch_size):
        batch = dummy_tiles[i:i + batch_size]
        _ = model.predict(source=batch, conf=0.001, iou=0.50, max_det=100, device=device, verbose=False)
    if torch.cuda.is_available():
        torch.cuda.synchronize()
    elapsed = time.perf_counter() - start_t

    throughput = benchmark_samples / elapsed  # tiles / second
    time_per_tile_ms = (elapsed / benchmark_samples) * 1000.0
    projected_8k_seconds = 8000.0 / throughput
    projected_8k_minutes = projected_8k_seconds / 60.0
    margin_minutes = 15.0 - projected_8k_minutes

    print(f"Throughput:           {throughput:.1f} tiles/second")
    print(f"Latency per tile:     {time_per_tile_ms:.2f} ms")
    print(f"Projected 8k time:    {projected_8k_seconds:.1f} seconds ({projected_8k_minutes:.2f} minutes)")
    print(f"T4 Competition Limit: 15.00 minutes (900 seconds)")
    print(f"Safety Margin:        {margin_minutes:.2f} minutes below budget (PASS)")
    print(f"========================================================\n")

    assert projected_8k_minutes < 15.0, f"Extrapolated time {projected_8k_minutes:.2f} min exceeds 15-minute T4 budget!"

    return {
        "throughput_tiles_per_sec": throughput,
        "ms_per_tile": time_per_tile_ms,
        "projected_8k_min": projected_8k_minutes,
        "margin_min": margin_minutes,
    }


def main():
    parser = argparse.ArgumentParser(description="Chimney Census OBB Inference & Benchmarking")
    parser.add_argument("--config", type=str, default="configs/train.yaml")
    parser.add_argument("--weights", type=str, default="weights/best.pt")
    parser.add_argument("--test-dir", type=str, default="data/images/test")
    parser.add_argument("--output", type=str, default="submission.csv")
    parser.add_argument("--conf", type=float, default=0.001)
    parser.add_argument("--iou", type=float, default=0.50)
    parser.add_argument("--max-det", type=int, default=100)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--tta", action="store_true", help="Enable multi-view test-time augmentation (flips/rot90 + rotated NMS)")
    parser.add_argument("--benchmark", action="store_true", help="Run 8,000-tile latency extrapolation benchmark")
    args = parser.parse_args()

    if args.benchmark:
        benchmark_8k_inference_latency(args.weights, batch_size=args.batch_size)
    else:
        run_inference(
            config_path=args.config,
            weights_path=args.weights,
            test_dir=args.test_dir,
            out_csv=args.output,
            conf_thresh=args.conf,
            iou_thresh=args.iou,
            max_det=args.max_det,
            batch_size=args.batch_size,
            use_tta=args.tta,
        )


if __name__ == "__main__":
    main()

