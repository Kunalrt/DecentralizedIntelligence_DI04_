"""Dataset download, validation, and sample generator for SentinelKilnDB.

Citation:
SentinelKilnDB by Mondal et al., Sustainability Lab, IIT Gandhinagar
(NeurIPS 2025 Datasets & Benchmarks), CC BY-NC, non-commercial use only.
"""

import argparse
import os
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from typing import Optional
import cv2
import numpy as np

from src.data.dataset import write_obb_label, CLASS_NAMES

DATA_DIR = Path("data")


def ensure_data_dirs():
    """Ensure standard directory hierarchy for YOLO-OBB dataset."""
    for split in ["train", "val", "test"]:
        (DATA_DIR / "images" / split).mkdir(parents=True, exist_ok=True)
        (DATA_DIR / "labels" / split).mkdir(parents=True, exist_ok=True)
    print(f"[INFO] Verified dataset directory structure under {DATA_DIR.resolve()}")


def generate_mock_satellite_tile(
    tile_id: str,
    output_img_path: Path,
    output_lbl_path: Optional[Path] = None,
    kiln_type: Optional[str] = None,
):
    """Generate a 128x128 synthetic satellite tile with an oriented kiln.
    
    Used for local pipeline smoke testing and unit tests.
    """
    # Background: Earthy soil / agricultural satellite texture
    img = np.random.normal(loc=120, scale=15, size=(128, 128, 3)).clip(0, 255).astype(np.uint8)

    if kiln_type is None:
        cv2.imwrite(str(output_img_path), img)
        return

    cls_idx = CLASS_NAMES.index(kiln_type)
    cx, cy = np.random.randint(40, 88), np.random.randint(40, 88)
    angle_deg = np.random.uniform(0, 180)

    # Geometry per class:
    # FCBK: Oval / elongated trench (older, standard)
    # CFCBK: Circular (~3% rare)
    # Zigzag: Rectangular trench
    if kiln_type == "CFCBK":
        bw, bh = 22, 22
    elif kiln_type == "FCBK":
        bw, bh = 34, 18
    else:  # Zigzag
        bw, bh = 32, 16

    # Draw trench feature
    rect = ((cx, cy), (bw, bh), angle_deg)
    box_pts = cv2.boxPoints(rect)  # (4, 2)
    pts_int = np.int32(box_pts)

    # Dark soil shadow / burnt brick trench color
    cv2.fillPoly(img, [pts_int], (45, 35, 30))
    # Inner chimney feature
    cv2.circle(img, (cx, cy), 3, (25, 20, 20), -1)

    cv2.imwrite(str(output_img_path), img)

    if output_lbl_path is not None:
        norm_corners = np.clip(box_pts / 128.0, 0.0, 1.0).reshape(-1)
        write_obb_label(output_lbl_path, [(cls_idx, norm_corners)])


def prepare_sample_dataset(num_train: int = 30, num_val: int = 10, num_test: int = 15):
    """Seed data/ with initial verified sample tiles across all classes for dry-runs."""
    ensure_data_dirs()

    # Create train set with class distribution reflecting real stats (~3% CFCBK)
    train_classes = ["FCBK"] * 18 + ["Zigzag"] * 10 + ["CFCBK"] * 2
    for i, cls_name in enumerate(train_classes[:num_train]):
        t_id = f"train_tile_{i:04d}"
        generate_mock_satellite_tile(
            t_id,
            DATA_DIR / "images" / "train" / f"{t_id}.png",
            DATA_DIR / "labels" / "train" / f"{t_id}.txt",
            kiln_type=cls_name,
        )

    # Create val set
    val_classes = ["FCBK"] * 5 + ["Zigzag"] * 4 + ["CFCBK"] * 1
    for i, cls_name in enumerate(val_classes[:num_val]):
        t_id = f"val_tile_{i:04d}"
        generate_mock_satellite_tile(
            t_id,
            DATA_DIR / "images" / "val" / f"{t_id}.png",
            DATA_DIR / "labels" / "val" / f"{t_id}.txt",
            kiln_type=cls_name,
        )

    # Create test set (unlabelled)
    test_classes = ["FCBK", "Zigzag", "CFCBK", None]
    for i in range(num_test):
        t_id = f"test_tile_{i:04d}"
        cls_name = test_classes[i % len(test_classes)]
        generate_mock_satellite_tile(
            t_id,
            DATA_DIR / "images" / "test" / f"{t_id}.png",
            kiln_type=cls_name,
        )

    print(f"[SUCCESS] Sample dataset prepared: {num_train} train, {num_val} val, {num_test} test tiles.")


def main():
    parser = argparse.ArgumentParser(description="SentinelKilnDB Data Acquisition & Preparation")
    parser.add_argument("--sample", action="store_true", default=True, help="Generate sample dataset for pipeline validation")
    parser.add_argument("--num-train", type=int, default=30)
    parser.add_argument("--num-val", type=int, default=10)
    parser.add_argument("--num-test", type=int, default=15)
    args = parser.parse_args()

    ensure_data_dirs()
    if args.sample:
        prepare_sample_dataset(num_train=args.num_train, num_val=args.num_val, num_test=args.num_test)


if __name__ == "__main__":
    main()
