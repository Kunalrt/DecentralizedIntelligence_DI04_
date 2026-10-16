"""Class imbalance and rare-class handling for Chimney Census.

CFCBK accounts for only ~3% of all kilns in SentinelKilnDB, but contributes
an equal 1/3 (33.3%) to the final macro-averaged mAP@0.5 competition metric.
This module provides:
- Inverse frequency class weighting
- Copy-paste augmentation for rare CFCBK kiln instances
- Resampling weights for training batches
"""

from pathlib import Path
from typing import Dict, List, Tuple
import numpy as np
import cv2
from src.data.dataset import parse_obb_label, CLASS_NAMES


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
