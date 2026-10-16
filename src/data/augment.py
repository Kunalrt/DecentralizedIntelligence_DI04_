"""Satellite-specific augmentations for Oriented Bounding Box (OBB) detection.

Key transforms:
1. 360-degree rotation invariance: Satellite imagery is nadir-looking and orientation-agnostic.
2. Random horizontal and vertical flips.
3. Photometric / Spectral jitter (brightness, contrast, saturation) to address
   2023-24 vs 2025-26 domain shifts (atmospheric conditions, seasonal soil changes).
"""

from typing import Tuple, List
import cv2
import numpy as np


def rotate_tile_and_obb(
    image: np.ndarray,
    corners_norm: np.ndarray,
    angle_deg: float,
) -> Tuple[np.ndarray, np.ndarray]:
    """Rotate 128x128 image and normalized OBB corners by an arbitrary angle.
    
    Args:
        image: (H, W, 3) uint8 image.
        corners_norm: (4, 2) array of normalized [x, y] coordinates in [0, 1].
        angle_deg: Rotation angle in degrees (clockwise).
        
    Returns:
        rotated_image: (H, W, 3) uint8 image.
        rotated_corners_norm: (4, 2) array of normalized [x, y] in [0, 1].
    """
    h, w = image.shape[:2]
    center = (w / 2.0, h / 2.0)
    rot_mat = cv2.getRotationMatrix2D(center, -angle_deg, 1.0)
    rotated_img = cv2.warpAffine(image, rot_mat, (w, h), borderMode=cv2.BORDER_REFLECT)

    # Transform corners (unnormalized -> rotate -> renormalize)
    pts = corners_norm * np.array([w, h], dtype=np.float32)
    pts_homo = np.hstack([pts, np.ones((4, 1), dtype=np.float32)])
    rotated_pts = (rot_mat @ pts_homo.T).T
    rotated_corners_norm = np.clip(rotated_pts / np.array([w, h], dtype=np.float32), 0.0, 1.0)
    return rotated_img, rotated_corners_norm


def apply_spectral_jitter(image: np.ndarray, alpha_range=(0.8, 1.2), beta_range=(-15, 15)) -> np.ndarray:
    """Apply contrast and brightness jitter to simulate atmospheric/domain shift."""
    alpha = np.random.uniform(*alpha_range)
    beta = np.random.uniform(*beta_range)
    jittered = np.clip(alpha * image.astype(np.float32) + beta, 0, 255).astype(np.uint8)
    return jittered


def flip_tile_and_obb(
    image: np.ndarray,
    corners_norm: np.ndarray,
    flip_h: bool = False,
    flip_v: bool = False,
) -> Tuple[np.ndarray, np.ndarray]:
    """Flip image and adjust normalized OBB corners."""
    out_img = image.copy()
    out_corners = corners_norm.copy()

    if flip_h:
        out_img = cv2.flip(out_img, 1)
        out_corners[:, 0] = 1.0 - out_corners[:, 0]
    if flip_v:
        out_img = cv2.flip(out_img, 0)
        out_corners[:, 1] = 1.0 - out_corners[:, 1]

    return out_img, out_corners
