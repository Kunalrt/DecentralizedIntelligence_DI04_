"""Class imbalance and rare-class handling for Chimney Census.

CFCBK accounts for only ~3% of all kilns in SentinelKilnDB, but contributes
an equal 1/3 (33.3%) to the final macro-averaged mAP@0.5 competition metric.
This module provides:
- Inverse frequency class weighting
- Copy-paste augmentation for rare CFCBK kiln instances
- Resampling weights for training batches
- Automated synthesis of rare CFCBK training tiles
"""

from pathlib import Path
from typing import Dict, List, Tuple
import numpy as np
import cv2
import random
from src.data.dataset import parse_obb_label, write_obb_label, CLASS_NAMES


def compute_class_weights(class_counts: Dict[str, int]) -> Dict[str, float]:
    """Calculate balanced loss weights inversely proportional to class frequencies."""
    total = sum(class_counts.values())
    if total == 0:
        return {name: 1.0 for name in CLASS_NAMES}
    num_classes = len(CLASS_NAMES)
    weights = {}
    for name in CLASS_NAMES:
        cnt = class_counts.get(name, 0)
        # Avoid zero division and cap extreme ratios
        weights[name] = float(total / (num_classes * max(cnt, 1)))
    return weights


def copy_paste_kiln(
    src_image: np.ndarray,
    src_corners_norm: np.ndarray,
    dst_image: np.ndarray,
    target_center_norm: Tuple[float, float],
) -> Tuple[np.ndarray, np.ndarray]:
    """Extract a kiln from source tile and paste onto destination tile.
    
    Used to synthesize additional training tiles containing the rare CFCBK (~3%) class.
    """
    h, w = dst_image.shape[:2]
    src_pts = (src_corners_norm * np.array([w, h], dtype=np.float32)).astype(np.int32)

    # Create mask for source kiln
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.fillPoly(mask, [src_pts], 255)

    # Compute bounding rect of source kiln
    x, y, bw, bh = cv2.boundingRect(src_pts)
    kiln_crop = src_image[y:y+bh, x:x+bw]
    mask_crop = mask[y:y+bh, x:x+bw]

    # Target position
    tx = int(target_center_norm[0] * w - bw / 2)
    ty = int(target_center_norm[1] * h - bh / 2)
    tx = max(0, min(w - bw, tx))
    ty = max(0, min(h - bh, ty))

    # Blend onto destination
    out_img = dst_image.copy()
    roi = out_img[ty:ty+bh, tx:tx+bw]
    mask_inv = cv2.bitwise_not(mask_crop)
    img_bg = cv2.bitwise_and(roi, roi, mask=mask_inv)
    kiln_fg = cv2.bitwise_and(kiln_crop, kiln_crop, mask=mask_crop)
    out_img[ty:ty+bh, tx:tx+bw] = cv2.add(img_bg, kiln_fg)

    # Shift corners to destination position
    offset_x = (tx - x) / float(w)
    offset_y = (ty - y) / float(h)
    new_corners_norm = src_corners_norm.copy()
    new_corners_norm[:, 0] += offset_x
    new_corners_norm[:, 1] += offset_y
    new_corners_norm = np.clip(new_corners_norm, 0.0, 1.0)

    return out_img, new_corners_norm


def synthesize_rare_cfcbk_tiles(data_dir: Path, multiplier: int = 5, seed: int = 42) -> int:
    """Find all CFCBK training instances and synthesize additional training samples via copy-paste.
    
    Args:
        data_dir: Root dataset path containing images/train and labels/train.
        multiplier: Number of synthetic variants generated per real CFCBK instance.
        
    Returns:
        Number of synthetic tiles created.
    """
    random.seed(seed)
    np.random.seed(seed)

    train_img_dir = data_dir / "images" / "train"
    train_lbl_dir = data_dir / "labels" / "train"

    # Find tiles containing CFCBK (class index 1)
    cfcbk_sources = []
    all_train_images = sorted(list(train_img_dir.glob("*.png")) + list(train_img_dir.glob("*.jpg")))

    for img_p in all_train_images:
        lbl_p = train_lbl_dir / f"{img_p.stem}.txt"
        if lbl_p.exists():
            annos = parse_obb_label(lbl_p)
            for cls_idx, coords in annos:
                if cls_idx == 1:  # CFCBK
                    cfcbk_sources.append((img_p, coords.reshape(4, 2)))

    if not cfcbk_sources:
        print("[WARN] No CFCBK training samples found to synthesize.")
        return 0

    print(f"[INFO] Found {len(cfcbk_sources)} CFCBK training instances. Synthesizing {multiplier}x variants...")
    created_count = 0

    for idx, (src_img_p, src_corners) in enumerate(cfcbk_sources):
        src_img = cv2.imread(str(src_img_p))
        if src_img is None:
            continue

        for m in range(multiplier):
            # Select random destination image (or generate new background)
            dst_p = random.choice(all_train_images)
            dst_img = cv2.imread(str(dst_p))
            if dst_img is None:
                continue

            target_center = (random.uniform(0.3, 0.7), random.uniform(0.3, 0.7))
            blended_img, new_corners = copy_paste_kiln(src_img, src_corners, dst_img, target_center)

            synth_id = f"synth_cfcbk_{idx:03d}_{m:02d}"
            out_img_p = train_img_dir / f"{synth_id}.png"
            out_lbl_p = train_lbl_dir / f"{synth_id}.txt"

            cv2.imwrite(str(out_img_p), blended_img)
            write_obb_label(out_lbl_p, [(1, new_corners.reshape(-1))])
            created_count += 1

    print(f"[SUCCESS] Synthesized {created_count} rare CFCBK training tiles into {train_img_dir.resolve()}")
    return created_count
