.PHONY: all setup data train infer score brief clean help

PYTHON ?= python

all: help

help:
	@echo "Chimney Census - Brick Kiln Detection & Classification Pipeline"
	@echo ""
	@echo "Available targets:"
	@echo "  make setup   - Install project dependencies"
	@echo "  make data    - Download/prepare dataset (SentinelKilnDB & splits)"
	@echo "  make train   - Train the oriented bounding box (OBB) model"
	@echo "  make infer   - Run inference on test tiles and generate submission CSV"
	@echo "  make score   - Evaluate detections using rotated IoU mAP@0.5"
	@echo "  make brief   - Generate Inspector's Brief (GeoJSON, PNG, stats, top 20)"
	@echo "  make clean   - Clean temporary and build artifacts"

setup:
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r requirements.txt

data:
	$(PYTHON) src/data/download.py

train:
	$(PYTHON) src/train.py --config configs/train.yaml

infer:
	$(PYTHON) src/infer.py --config configs/train.yaml

score:
	$(PYTHON) src/scorer.py --preds submission.csv --targets data/labels/val

brief:
	$(PYTHON) brief/analysis.py --detections submission.csv --out-dir brief/outputs

clean:
	$(PYTHON) -c "import shutil, glob, os; [shutil.rmtree(p, ignore_errors=True) for p in glob.glob('**/__pycache__', recursive=True)]"
