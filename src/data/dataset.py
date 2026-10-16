"""Dataset utilities for Sentinel-2 128x128 px tiles and YOLO-OBB formats.

Citation:
SentinelKilnDB by Mondal et al., Sustainability Lab, IIT Gandhinagar
(NeurIPS 2025 Datasets & Benchmarks), CC BY-NC, non-commercial use only.
"""

from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
import numpy as np

CLASS_NAMES = ["FCBK", "CFCBK", "Zigzag"]
CLASS_TO_IDX = {name: idx for idx, name in enumerate(CLASS_NAMES)}
IDX_TO_CLASS = {idx: name for idx, name in enumerate(CLASS_NAMES)}


def order_corners_clockwise(pts: np.ndarray) -> np.ndarray:
    """Sort 4 vertices in clockwise order starting from the top-leftmost vertex.
    
    Args:
        pts: (4, 2) array of (x, y) coordinates.
        
    Returns:
        (4, 2) array ordered clockwise starting from top-left.
    """
    pts = pts.reshape(4, 2)
    center = pts.mean(axis=0)
    # Compute polar angle relative to centroid
    angles = np.arctan2(pts[:, 1] - center[1], pts[:, 0] - center[0])
    sort_idx = np.argsort(angles)
    pts_sorted = pts[sort_idx]

    # Find the top-left point (smallest x + y)
    s = pts_sorted.sum(axis=1)
    top_left_idx = np.argmin(s)
    ordered = np.roll(pts_sorted, -top_left_idx, axis=0)
    return ordered


def obb_to_xywhr(pts: np.ndarray) -> Tuple[float, float, float, float, float]:
    """Convert 8-point polygon [x1, y1, x2, y2, x3, y3, x4, y4] to (cx, cy, w, h, angle_rad)."""
    pts = pts.reshape(4, 2)
    cx, cy = float(pts[:, 0].mean()), float(pts[:, 1].mean())
    # Edge lengths
    d1 = np.linalg.norm(pts[1] - pts[0])
    d2 = np.linalg.norm(pts[2] - pts[1])
    if d1 >= d2:
        w, h = float(d1), float(d2)
        angle = float(np.arctan2(pts[1, 1] - pts[0, 1], pts[1, 0] - pts[0, 0]))
    else:
        w, h = float(d2), float(d1)
        angle = float(np.arctan2(pts[2, 1] - pts[1, 1], pts[2, 0] - pts[1, 0]))
    return cx, cy, w, h, angle


from shapely.geometry import box as shapely_box, Polygon


def is_kiln_valid_on_tile_edge(corners_norm: np.ndarray, min_inside_ratio: float = 0.50) -> bool:
    """Verify that kilns cut by tile edges have >=50% area inside the tile boundary [0, 1] x [0, 1]."""
    tile_boundary = shapely_box(0.0, 0.0, 1.0, 1.0)
    poly = Polygon(corners_norm.reshape(4, 2))
    if not poly.is_valid:
        poly = poly.buffer(0)
    if not poly.is_valid or poly.area <= 1e-9:
        return False
    inside_area = poly.intersection(tile_boundary).area
    ratio = inside_area / poly.area
    return ratio >= min_inside_ratio


def parse_obb_label(label_path: Path, filter_edges: bool = True) -> List[Tuple[int, np.ndarray]]:
    """Parse YOLO-OBB label file.
    
    Format per line:
    class_idx x1 y1 x2 y2 x3 y3 x4 y4 (normalized coordinates [0, 1])
    Filters out truncated kilns with < 50% area inside the tile boundary.
    """
    annotations = []
    if not label_path.exists():
        return annotations

    with open(label_path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 9:
                cls_idx = int(parts[0])
                coords = np.array([float(x) for x in parts[1:9]], dtype=np.float32)
                ordered = order_corners_clockwise(coords.reshape(4, 2)).reshape(-1)
                if filter_edges and not is_kiln_valid_on_tile_edge(ordered, min_inside_ratio=0.50):
                    continue
                annotations.append((cls_idx, ordered))
    return annotations


def write_obb_label(label_path: Path, annotations: List[Tuple[int, np.ndarray]]):
    """Write YOLO-OBB label file."""
    label_path.parent.mkdir(parents=True, exist_ok=True)
    with open(label_path, "w", encoding="utf-8") as f:
        for cls_idx, coords in annotations:
            line_parts = [str(cls_idx)] + [f"{float(c):.6f}" for c in coords]
            f.write(" ".join(line_parts) + "\n")


def scan_dataset_distribution(data_root: Path) -> Dict[str, Any]:
    """Scan images and label distribution across train, val, test splits."""
    stats = {}
    for split in ["train", "val", "test"]:
        img_dir = data_root / "images" / split
        lbl_dir = data_root / "labels" / split
        img_files = list(img_dir.glob("*.png")) + list(img_dir.glob("*.jpg"))
        lbl_files = list(lbl_dir.glob("*.txt"))

        cls_counts = {name: 0 for name in CLASS_NAMES}
        total_boxes = 0

        for lf in lbl_files:
            annos = parse_obb_label(lf)
            for cls_idx, _ in annos:
                if 0 <= cls_idx < len(CLASS_NAMES):
                    cls_counts[CLASS_NAMES[cls_idx]] += 1
                    total_boxes += 1

        stats[split] = {
            "num_images": len(img_files),
            "num_label_files": len(lbl_files),
            "total_boxes": total_boxes,
            "class_distribution": cls_counts,
        }
    return stats
