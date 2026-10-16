.PHONY: all setup data train infer score brief clean help

PYTHON ?= python

all: infer score brief

help:
	@echo "Chimney Census - Brick Kiln Detection & Classification Pipeline"
	@echo ""
	@echo "Available targets:"
	@echo "  make all     - Run complete pipeline: infer, score, and brief"
	@echo "  make setup   - Install project dependencies"
	@echo "  make data    - Download/prepare dataset (SentinelKilnDB & splits)"
	@echo "  make train   - Train the oriented bounding box (OBB) model"
	@echo "  make infer   - Run inference with TTA and generate validated submission.csv"
	@echo "  make score   - Evaluate detections using rotated IoU mAP@0.5"
	@echo "  make brief   - Generate Inspector's Brief (GeoJSON, PNG, PDF, Top 20)"
	@echo "  make clean   - Clean temporary and build artifacts"

setup:
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r requirements.txt

data:
	$(PYTHON) src/data/check_data.py --verify-splits

train:
	$(PYTHON) src/train.py --config configs/train.yaml

infer:
	$(PYTHON) src/infer.py --weights weights/best.pt --test-dir data/images/test --output submission.csv --conf 0.001 --iou 0.50 --max-det 100 --tta

score:
	$(PYTHON) -c "from ultralytics import YOLO; from pathlib import Path; from src.train import evaluate_val_split_with_custom_scorer; m = YOLO('weights/best.pt'); evaluate_val_split_with_custom_scorer(m, Path('data'))"

brief:
	$(PYTHON) brief/analysis.py --detections submission.csv --out-dir brief/outputs
	$(PYTHON) brief/build_brief.py


clean:
	$(PYTHON) -c "import shutil, glob, os; [shutil.rmtree(p, ignore_errors=True) for p in glob.glob('**/__pycache__', recursive=True)]"
