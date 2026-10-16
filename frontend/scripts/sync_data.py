"""Cross-platform data synchronization script.

Copies analytical outputs from brief/outputs/ to frontend/public/data/.
"""

import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = FRONTEND_DIR.parent

SRC_DIR = PROJECT_ROOT / "brief" / "outputs"
DEST_DIR = FRONTEND_DIR / "public" / "data"

# Validate analytical outputs before syncing
print("=== Validating Analytical Outputs Before Sync ===")
val_script = PROJECT_ROOT / "scripts" / "validate_outputs.py"
val_res = subprocess.run([sys.executable, str(val_script), "--dir", str(SRC_DIR)])
if val_res.returncode != 0:
    print("[ERROR] Output validation failed! Halting sync to prevent corrupting frontend data.", file=sys.stderr)
    sys.exit(1)

DEST_DIR.mkdir(parents=True, exist_ok=True)

FILES = [
    "kilns.geojson",
    "labels_2023.geojson",
    "counts.csv",
    "conversions.csv",
    "conversions_summary.csv",
    "within_1km.csv",
    "clusters_summary.csv",
    "top20.csv",
    "metrics.json",
    "experiments.json",
    "summary_stats.json",
    "map.png",
    "preview_p1.png",
    "preview_p2.png",
    "inspector_brief.pdf",
]

print("=== Syncing Chimney Census Data to Frontend ===")
copied = 0
for file_name in FILES:
    src_file = SRC_DIR / file_name
    dest_file = DEST_DIR / file_name
    if src_file.exists():
        shutil.copy2(src_file, dest_file)
        print(f"  [COPIED] {file_name} ({src_file.stat().st_size:,} bytes)")
        copied += 1
    else:
        print(f"  [WARN] Missing file: {src_file}")

print(f"=== Successfully synced {copied}/{len(FILES)} files to {DEST_DIR} ===\n")
