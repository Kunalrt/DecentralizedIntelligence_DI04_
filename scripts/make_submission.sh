#!/usr/bin/env bash
# ONE-COMMAND SUBMISSION REPRODUCTION
# Generates final submission.csv from test tiles using trained weights
set -e

echo "=========================================================="
echo " Chimney Census - Submission Reproduction Pipeline"
echo "=========================================================="

WEIGHTS_PATH="${WEIGHTS_PATH:-weights/best.pt}"
TEST_DIR="${TEST_DIR:-data/images/test}"
OUT_CSV="${OUT_CSV:-submission.csv}"

echo "[INFO] Running inference on $TEST_DIR using $WEIGHTS_PATH..."
python src/infer.py --weights "$WEIGHTS_PATH" --test-dir "$TEST_DIR" --output "$OUT_CSV" --conf 0.001 --iou 0.50 --max-det 100 --tta

echo "[SUCCESS] Verified submission CSV generated at $OUT_CSV"

