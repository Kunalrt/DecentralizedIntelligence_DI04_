#!/usr/bin/env bash
# Download and setup SentinelKilnDB dataset and competition splits
set -e

echo "[INFO] Running data preparation pipeline..."
python src/data/download.py

echo "[INFO] Dataset setup script completed."
