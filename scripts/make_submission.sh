#!/usr/bin/env bash
# ONE-COMMAND SUBMISSION REPRODUCTION
# Generates final submission.csv from test tiles using trained weights
set -e

echo "=========================================================="
echo " Chimney Census - Submission Reproduction"
echo "=========================================================="

python src/infer.py --config configs/train.yaml --weights weights/best.pt --output submission.csv

echo "[SUCCESS] Final submission created at submission.csv"
