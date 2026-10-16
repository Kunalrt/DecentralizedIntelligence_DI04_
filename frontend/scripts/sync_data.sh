#!/usr/bin/env bash
# Sync analytical outputs from brief/outputs/ to frontend/public/data/
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$FRONTEND_DIR")"
SRC_DIR="$PROJECT_ROOT/brief/outputs"
DEST_DIR="$FRONTEND_DIR/public/data"

echo "=== Syncing Chimney Census Data to Frontend ==="
echo "Source: $SRC_DIR"
echo "Destination: $DEST_DIR"

mkdir -p "$DEST_DIR"

FILES=(
  "kilns.geojson"
  "labels_2023.geojson"
  "counts.csv"
  "conversions.csv"
  "conversions_summary.csv"
  "within_1km.csv"
  "clusters_summary.csv"
  "top20.csv"
  "metrics.json"
  "experiments.json"
  "summary_stats.json"
  "map.png"
  "inspector_brief.pdf"
)

for file in "${FILES[@]}"; do
  if [ -f "$SRC_DIR/$file" ]; then
    cp "$SRC_DIR/$file" "$DEST_DIR/$file"
    echo "  [COPIED] $file"
  else
    echo "  [WARN] Missing: $SRC_DIR/$file"
  fi
done

echo "=== Data Sync Completed Successfully! ==="
