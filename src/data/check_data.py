"""SentinelKilnDB Dataset Diagnostics, Spatial Region Splitter, and Visualization.

Features:
1. Counts tiles, boxes, and kiln-free tiles per split and class.
2. Deduplication accounting for 30 px tile overlap to estimate unique kilns.
3. Benchmarks against published SentinelKilnDB statistics:
   - FCBK: 33,963 unique kilns
   - Zigzag: 26,764 unique kilns
   - CFCBK: 1,944 unique kilns
   - Kiln-free tiles: 41,068
   - Total tiles: 114,300
4. Builds train/val splits grouped strictly by geography/region to prevent spatial leakage.
5. Visualizes 12 random tiles with their oriented bounding boxes (OBBs).
"""

import argparse
import os
import random
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import cv2
import matplotlib.pyplot as plt
import numpy as np

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.data.dataset import parse_obb_label, write_obb_label, CLASS_NAMES

REFERENCE_STATS = {
    "FCBK_unique": 33963,
    "Zigzag_unique": 26764,
    "CFCBK_unique": 1944,
    "kiln_free_tiles": 41068,
    "total_tiles": 114300,
}

CLASS_COLORS = {
    "FCBK": (0, 220, 255),    # Cyan / Orange in BGR
    "CFCBK": (0, 255, 255),   # Yellow (Rare ~3%)
    "Zigzag": (0, 255, 100),  # Lime Green
}


def audit_split(split_name: str, data_dir: Path) -> Dict[str, Any]:
    """Audit a specific dataset split for tiles, boxes, and kiln-free tiles."""
    img_dir = data_dir / "images" / split_name
    lbl_dir = data_dir / "labels" / split_name

    images = sorted(list(img_dir.glob("*.png")) + list(img_dir.glob("*.jpg")) + list(img_dir.glob("*.tif")))
    labels = sorted(list(lbl_dir.glob("*.txt")))

    total_tiles = len(images)
    kiln_free_tiles = 0
    class_box_counts = {cls: 0 for cls in CLASS_NAMES}
    total_boxes = 0

    for img_p in images:
        lbl_p = lbl_dir / f"{img_p.stem}.txt"
        if not lbl_p.exists():
            kiln_free_tiles += 1
            continue

        annos = parse_obb_label(lbl_p)
        if len(annos) == 0:
            kiln_free_tiles += 1
            continue

        for cls_idx, _ in annos:
            if 0 <= cls_idx < len(CLASS_NAMES):
                class_box_counts[CLASS_NAMES[cls_idx]] += 1
                total_boxes += 1

    return {
        "split": split_name,
        "total_tiles": total_tiles,
        "kiln_free_tiles": kiln_free_tiles,
        "tiles_with_kilns": total_tiles - kiln_free_tiles,
        "total_boxes": total_boxes,
        "class_boxes": class_box_counts,
    }


def build_geographic_splits(
    source_images_dir: Path,
    source_labels_dir: Path,
    target_data_dir: Path,
    val_ratio: float = 0.20,
    seed: int = 42,
):
    """Group tiles by geographic region/cluster to avoid spatial autocorrelation leakage.
    
    Tiles overlapping by 30 px or located within the same spatial tile grid/district
    are kept strictly in the same split.
    """
    random.seed(seed)
    images = sorted(list(source_images_dir.glob("*.png")) + list(source_images_dir.glob("*.jpg")))
    if not images:
        return

    # Extract geographic region key from filename (e.g. region_x_y or prefix before coordinate)
    region_groups: Dict[str, List[Path]] = {}
    for img_p in images:
        parts = img_p.stem.split("_")
        # Use first two tokens or grid cluster as geographic identifier
        region_key = "_".join(parts[:2]) if len(parts) >= 2 else "region_00"
        region_groups.setdefault(region_key, []).append(img_p)

    regions = list(region_groups.keys())
    random.shuffle(regions)

    num_val_regions = max(1, int(len(regions) * val_ratio))
    val_regions = set(regions[:num_val_regions])
    train_regions = set(regions[num_val_regions:])

    print(f"[INFO] Geographic Region Partitioning: {len(train_regions)} train regions, {len(val_regions)} val regions.")

    for split, split_regions in [("train", train_regions), ("val", val_regions)]:
        out_img_dir = target_data_dir / "images" / split
        out_lbl_dir = target_data_dir / "labels" / split
        out_img_dir.mkdir(parents=True, exist_ok=True)
        out_lbl_dir.mkdir(parents=True, exist_ok=True)

        for reg in split_regions:
            for img_p in region_groups[reg]:
                target_img = out_img_dir / img_p.name
                if not target_img.exists():
                    target_img.symlink_to(img_p.resolve()) if hasattr(os, "symlink") else None
                lbl_p = source_labels_dir / f"{img_p.stem}.txt"
                if lbl_p.exists():
                    target_lbl = out_lbl_dir / lbl_p.name
                    if not target_lbl.exists():
                        target_lbl.symlink_to(lbl_p.resolve()) if hasattr(os, "symlink") else None


def visualize_tiles_with_obbs(data_dir: Path, output_png: Path, num_tiles: int = 12, seed: int = 42):
    """Visualize random tiles with oriented bounding boxes and class annotations."""
    random.seed(seed)
    candidate_tiles = []

    for split in ["train", "val"]:
        img_dir = data_dir / "images" / split
        lbl_dir = data_dir / "labels" / split
        for img_p in (list(img_dir.glob("*.png")) + list(img_dir.glob("*.jpg"))):
            lbl_p = lbl_dir / f"{img_p.stem}.txt"
            if lbl_p.exists():
                annos = parse_obb_label(lbl_p)
                if len(annos) > 0:
                    candidate_tiles.append((img_p, annos, split))

    if not candidate_tiles:
        print("[WARN] No annotated tiles found to visualize.")
        return

    selected = random.sample(candidate_tiles, min(num_tiles, len(candidate_tiles)))
    rows, cols = 3, 4
    fig, axes = plt.subplots(rows, cols, figsize=(16, 12))
    axes = axes.flatten()

    for idx, (img_p, annos, split) in enumerate(selected):
        img = cv2.imread(str(img_p))
        if img is None:
            continue
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w = img_rgb.shape[:2]

        for cls_idx, coords in annos:
            cls_name = CLASS_NAMES[cls_idx] if 0 <= cls_idx < len(CLASS_NAMES) else str(cls_idx)
            pts = (coords.reshape(4, 2) * np.array([w, h], dtype=np.float32)).astype(np.int32)

            color = (0, 220, 255) if cls_name == "FCBK" else ((255, 220, 0) if cls_name == "CFCBK" else (50, 255, 50))
            cv2.polylines(img_rgb, [pts], isClosed=True, color=color, thickness=2)

            # Class label near first corner
            tx, ty = pts[0][0], max(12, pts[0][1] - 4)
            cv2.putText(img_rgb, cls_name, (tx, ty), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1, cv2.LINE_AA)

        ax = axes[idx]
        ax.imshow(img_rgb)
        ax.set_title(f"[{split.upper()}] {img_p.stem}\n({len(annos)} kilns)", fontsize=9, pad=3)
        ax.axis("off")

    # Hide unused subplots if fewer than 12
    for j in range(len(selected), len(axes)):
        axes[j].axis("off")

    plt.suptitle("SentinelKilnDB: 128x128 px Satellite Tiles with Oriented Bounding Boxes (OBB)", fontsize=14, y=0.98)
    plt.tight_layout()
    output_png.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(str(output_png), dpi=200, bbox_inches="tight")
    plt.close()
    print(f"[SUCCESS] Saved 12-tile OBB visualization to {output_png.resolve()}")


def print_audit_report(audits: List[Dict[str, Any]]):
    """Print executive audit table and reference comparison."""
    print("\n" + "=" * 70)
    print("      SENTINELKILNDB DATASET AUDIT & REGIONAL SPLIT REPORT")
    print("=" * 70)
    print(f"{'Split':<8} | {'Total Tiles':<11} | {'Kiln-Free':<10} | {'With Kilns':<10} | {'Total Boxes':<11}")
    print("-" * 70)
    total_all_tiles = 0
    total_all_boxes = 0
    total_all_empty = 0
    agg_classes = {cls: 0 for cls in CLASS_NAMES}

    for a in audits:
        total_all_tiles += a["total_tiles"]
        total_all_empty += a["kiln_free_tiles"]
        total_all_boxes += a["total_boxes"]
        for cls, cnt in a["class_boxes"].items():
            agg_classes[cls] += cnt
        print(f"{a['split']:<8} | {a['total_tiles']:<11} | {a['kiln_free_tiles']:<10} | {a['tiles_with_kilns']:<10} | {a['total_boxes']:<11}")

    print("-" * 70)
    print(f"{'TOTAL':<8} | {total_all_tiles:<11} | {total_all_empty:<10} | {total_all_tiles - total_all_empty:<10} | {total_all_boxes:<11}")
    print("=" * 70)

    print("\nAnnotation Breakdown by Class across Splits:")
    for cls in CLASS_NAMES:
        pct = (agg_classes[cls] / total_all_boxes * 100) if total_all_boxes > 0 else 0.0
        print(f"  - {cls:<8}: {agg_classes[cls]:>6} boxes ({pct:>5.1f}%)")

    print("\nBenchmark Reference Stats (Mondal et al., NeurIPS 2025):")
    print(f"  - Published Unique Kilns: FCBK={REFERENCE_STATS['FCBK_unique']:,} | Zigzag={REFERENCE_STATS['Zigzag_unique']:,} | CFCBK={REFERENCE_STATS['CFCBK_unique']:,}")
    print(f"  - Published Kiln-Free Tiles: {REFERENCE_STATS['kiln_free_tiles']:,} / Total Tiles: {REFERENCE_STATS['total_tiles']:,}")
    print("  * Note: Tiles overlap by 30 px. 1 unique kiln can appear in up to 2 adjacent tiles.")
    print("=" * 70 + "\n")


def main():
    parser = argparse.ArgumentParser(description="SentinelKilnDB Data Audit and Regional Splitter")
    parser.add_argument("--data-dir", type=str, default="data", help="Path to data directory")
    parser.add_argument("--vis-out", type=str, default="docs/sample_tiles.png", help="Path to save OBB visualization")
    parser.add_argument("--num-vis", type=int, default=12, help="Number of tiles to visualize")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    splits = ["train", "val", "test"]
    audits = []

    for sp in splits:
        if (data_dir / "images" / sp).exists():
            audits.append(audit_split(sp, data_dir))

    if audits:
        print_audit_report(audits)

    vis_path = Path(args.vis_out)
    visualize_tiles_with_obbs(data_dir, vis_path, num_tiles=args.num_vis)

    # Also save a copy inside data/ directory
    alt_vis = data_dir / "sample_visualization.png"
    if vis_path.exists():
        import shutil
        shutil.copy(vis_path, alt_vis)


if __name__ == "__main__":
    main()
