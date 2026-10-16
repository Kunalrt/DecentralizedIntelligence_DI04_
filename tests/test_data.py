"""Unit tests for SentinelKilnDB data pipeline and OBB transformations."""

import sys
from pathlib import Path
import numpy as np
import cv2

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.data.dataset import (
    order_corners_clockwise,
    obb_to_xywhr,
    parse_obb_label,
    write_obb_label,
    scan_dataset_distribution,
    CLASS_NAMES,
)
from src.data.augment import rotate_tile_and_obb, flip_tile_and_obb, apply_spectral_jitter
from src.data.sampler import compute_class_weights, copy_paste_kiln


def test_order_corners_clockwise():
    # Construct a rectangle with disordered corners
    # (top-left, bottom-right, top-right, bottom-left)
    unordered = np.array([
        [0.2, 0.2],
        [0.8, 0.6],
        [0.8, 0.2],
        [0.2, 0.6]
    ], dtype=np.float32)

    ordered = order_corners_clockwise(unordered)
    assert ordered.shape == (4, 2)
    # First point should be top-left
    assert np.allclose(ordered[0], [0.2, 0.2])
    print("[PASS] test_order_corners_clockwise")


def test_obb_to_xywhr():
    # Box centered at (0.5, 0.5) with width 0.4 and height 0.2, angle 0
    box = np.array([
        [0.3, 0.4],
        [0.7, 0.4],
        [0.7, 0.6],
        [0.3, 0.6]
    ], dtype=np.float32)

    cx, cy, w, h, angle = obb_to_xywhr(box)
    assert abs(cx - 0.5) < 1e-4
    assert abs(cy - 0.5) < 1e-4
    assert abs(w - 0.4) < 1e-4 or abs(h - 0.4) < 1e-4
    print("[PASS] test_obb_to_xywhr")


def test_augmentations():
    img = np.ones((128, 128, 3), dtype=np.uint8) * 100
    corners = np.array([[0.2, 0.2], [0.6, 0.2], [0.6, 0.4], [0.2, 0.4]], dtype=np.float32)

    # 1. Rotation 90 degrees
    rot_img, rot_corners = rotate_tile_and_obb(img, corners, 90.0)
    assert rot_img.shape == (128, 128, 3)
    assert rot_corners.shape == (4, 2)
    assert np.all(rot_corners >= 0.0) and np.all(rot_corners <= 1.0)

    # 2. Horizontal flip
    flip_img, flip_corners = flip_tile_and_obb(img, corners, flip_h=True)
    assert flip_img.shape == (128, 128, 3)
    # x should be reflected around 0.5
    assert abs(flip_corners[0, 0] - (1.0 - corners[0, 0])) < 1e-5

    # 3. Spectral jitter
    jittered = apply_spectral_jitter(img)
    assert jittered.shape == (128, 128, 3)
    print("[PASS] test_augmentations")


def test_class_weights_and_copy_paste():
    counts = {"FCBK": 90, "CFCBK": 3, "Zigzag": 30}
    weights = compute_class_weights(counts)
    # Rare CFCBK must receive significantly higher weight than FCBK
    assert weights["CFCBK"] > weights["FCBK"] * 5
    print(f"[PASS] test_class_weights (CFCBK weight: {weights['CFCBK']:.2f}, FCBK: {weights['FCBK']:.2f})")

    # Copy paste test
    src_img = np.full((128, 128, 3), 50, dtype=np.uint8)
    dst_img = np.full((128, 128, 3), 200, dtype=np.uint8)
    src_corners = np.array([[0.2, 0.2], [0.4, 0.2], [0.4, 0.4], [0.2, 0.4]], dtype=np.float32)

    blended, new_corners = copy_paste_kiln(src_img, src_corners, dst_img, (0.7, 0.7))
    assert blended.shape == (128, 128, 3)
    assert new_corners.shape == (4, 2)
    print("[PASS] test_copy_paste")


def test_dataset_scan():
    stats = scan_dataset_distribution(Path("data"))
    assert "train" in stats and "val" in stats and "test" in stats
    assert stats["train"]["num_images"] > 0
    assert stats["val"]["num_images"] > 0
    assert stats["test"]["num_images"] > 0
    print(f"[PASS] test_dataset_scan: Train={stats['train']}, Val={stats['val']}, Test={stats['test']}")


if __name__ == "__main__":
    test_order_corners_clockwise()
    test_obb_to_xywhr()
    test_augmentations()
    test_class_weights_and_copy_paste()
    test_dataset_scan()
    print("\n[ALL TESTS PASSED SUCCESSFULLY!]")
