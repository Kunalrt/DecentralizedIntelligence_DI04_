# Chimney Census: Brick Kiln Detection & Compliance Monitoring via Sentinel-2

Oriented Bounding Box (OBB) detection and 3-class classification of brick kilns in Sentinel-2 RGB satellite imagery ($128 \times 128$ px, $10\text{ m/pixel}$), developed for the 24-hour **Chimney Census** hackathon.

---

## 🚀 One-Command Submission Reproduction

To reproduce the verified competition `submission.csv` from scratch in one single command:

```bash
bash scripts/make_submission.sh
```

*(Alternative via Makefile)*:
```bash
make all
```

The pipeline runs multi-view Test-Time Augmentation (TTA with Rotated NMS) on test imagery using the champion model weights, validates all 11 schema constraints, and outputs `submission.csv`.

---

## 🏆 Final Results & Experiment Progression

All experiments are evaluated using our exact custom metric engine: Shapely polygon rotated-box $\text{IoU} \ge 0.50$, continuous DOTA-style all-point interpolated AP, and equal $\frac{1}{3}$ macro-averaging across classes.

| Exp ID | Model / Architecture | Key Intervention / Hypothesis | Val mAP@0.5 | AP_FCBK | AP_CFCBK | AP_Zigzag | Outcome & Analysis |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **03** | YOLO11s-OBB Baseline | Pretrained backbone, $imgsz=128$, 30 epochs, AMP, $conf=0.001$ | **0.4556** | 0.9667 | 0.0000 | 0.4000 | Fast convergence on dominant FCBK, but rare CFCBK collapsed to 0.0000, severely bottlenecking macro mAP. |
| **05** | Exp 6a: Upscale Input ($imgsz=256$) | Doubling resolution to 256px to preserve small $12 \times 6$ px kiln spatial features | **0.5250** | 1.0000 | 0.0000 | 0.5750 | **+0.0694 mAP jump**. Zigzag AP surged +17.5% ($0.4000 \to 0.5750$). Kept as standard. |
| **06** | Exp 6c: Rare CFCBK Synthesis & Loss Boost | Targeted copy-paste CFCBK synthesis + $cls=3.0$ + $copy\_paste=0.5$ | **0.8355** | 0.8850 | 1.0000 | 0.6214 | **Sensational +0.3105 mAP surge!** CFCBK AP jumped from 0.0000 to a perfect **1.0000**. Single highest-impact intervention. |
| **07** | Exp 6e/6f: Hard Negatives & Multi-View TTA | Realistic negative tiles + Multi-view TTA (H-flip & 90° rot) + Rotated NMS | **0.8339** | 0.8850 | 1.0000 | 0.6167 | Suppressed false alarms on rivers/roads/settlements. Extrapolated 8k latency: **52.8s** (well under 15 min limit). Champion Model. |
| **08** | Step 7: Domain Shift & Self-Training | High-conf pseudo-labels ($conf > 0.70$) on test tiles + held-out region validation | **0.7620** | 0.8444 | 1.0000 | 0.4417 | Pseudo-labels introduced confirmation bias on subtle Zigzag boundaries ($-0.0719$ delta). Decisively rejected; preserved 0.8339 champion. |

---

## 📋 Hackathon Rules Compliance Matrix

| Rule / Constraint | Compliance Specification | Implementation Verification | Status |
| :--- | :--- | :--- | :---: |
| **Model Modality** | RGB tiles only; NO external Google/Esri satellite basemaps | Models train and infer strictly on Sentinel-2 RGB bands (`B04`, `B03`, `B02`). Cartographic maps use vector road/grid overlays only. | **PASS** |
| **Hardware & Latency** | Inference on $\sim 8,000$ tiles must run strictly $\le 15$ min on one T4 GPU | Extrapolated 8,000-tile latency with multi-view TTA is **52.8 seconds** (~0.88 min) on RTX 3050 / T4 equivalent, leaving a **14.12-minute safety margin**. | **PASS** |
| **Submission Schema** | Exact columns: `tile_id,class,x1,y1,x2,y2,x3,y3,x4,y4,score` | Verified via `src/postprocess.py::validate_submission_csv` with 11 strict checks (zero NaNs, valid classes, normalized bounds). | **PASS** |
| **Corner Ordering** | 4 vertices normalized $[0, 1]$ in clockwise order around the box | Verified via `src/data/dataset.py::order_corners_clockwise` using polar angle sorting from polygon centroid. | **PASS** |
| **Empty Tiles** | Tiles with no detections must produce zero rows (never blank/null rows) | Verified in `src/infer.py`; tiles without detections are omitted from rows. | **PASS** |
| **High Recall Threshold** | Low confidence threshold ($\sim 0.001$) to maximize all-point AP | Set default `conf=0.001` across inference and validation harnesses. | **PASS** |
| **Self-Training Rules** | Allowed as long as no external human labels are introduced | Fully automated pseudo-labeling on test tiles with $conf > 0.70$ without human intervention. | **PASS** |

---

## 🛠️ Environment Setup & Installation

Tested on Python 3.10 and 3.11 with CUDA 12.4:

```bash
# Clone repository
git clone https://github.com/Kunalrt/new_repo.git
cd new_repo

# Install dependencies
pip install -r requirements.txt
```

### Dependencies
- `torch >= 2.2.0`, `torchvision >= 0.17.0`
- `ultralytics >= 8.1.0` (YOLO-OBB)
- `shapely >= 2.0.0` (Rotated polygon geometry & exact IoU)
- `opencv-python-headless >= 4.9.0`
- `pandas`, `numpy`, `matplotlib`, `pyyaml`, `tqdm`

---

## 📦 Data Download & Preparation

The pipeline downloads and unpacks **SentinelKilnDB** automatically:

```bash
# Option 1: Read from local path
export SENTINELKILNDB_PATH="/path/to/SentinelKilnDB"
bash scripts/download_data.sh

# Option 2: Download via Kaggle API
export KAGGLE_USERNAME="your_username"
export KAGGLE_KEY="your_api_key"
bash scripts/download_data.sh

# Option 3: Download via direct HTTP URL
export SENTINELKILNDB_URL="https://example.com/SentinelKilnDB.zip"
bash scripts/download_data.sh
```

To run dataset diagnostics, confirm reference statistics, and build geographic splits:
```bash
python src/data/check_data.py --verify-splits --visualize
```

---

## 📑 Inspector's Brief & Demo District Deliverables

All regulatory field deliverables are generated under `brief/outputs/`:

1. **Surveillance Map (`brief/outputs/map.png`)**: High-resolution cartographic map colored by kiln type over a clean street/district grid.
2. **Official 2-Page Brief PDF (`brief/outputs/inspectors_brief.pdf`)**: Publication-grade briefing document designed for field inspectors.
3. **Official Brief Markdown (`brief/outputs/inspectors_brief.md`)**: Full textual brief with protocols.
4. **Vector Layer (`brief/outputs/kilns.geojson`)**: Complete GeoJSON FeatureCollection with OBB polygons, coordinates, and classification.
5. **Honest Inventory Counts (`brief/outputs/counts_summary.csv`)**: Raw detections adjusted by held-out precision/recall and 95% bootstrap confidence intervals.
6. **Conversion Tracking (`brief/outputs/conversions.csv`)**: Site-by-site tracking of 2023–24 FCBK baseline kilns converted to Zigzag.
7. **Top 20 Priority Inspections (`brief/outputs/top_20_inspections.csv`)**: Ranked priority sites with transparent scoring and concise field directives.

To re-run the Inspector's Brief analytical engine:
```bash
python brief/analysis.py --detections submission.csv --out-dir brief/outputs
python brief/build_brief.py
```

---

## 🌐 Interactive Frontend Dashboard

An interactive React + Vite + TypeScript dashboard designed for **Inspector Farida Khan (State Pollution Control Board)** to plan field patrols, explore kiln clusters, and review mandate conversions.

- **Live Deployment**: [https://kunalrt.github.io/new_repo/](https://kunalrt.github.io/new_repo/) (configured via GitHub Pages & GitHub Actions).
- **Basemap Compliance**: Uses **OpenStreetMap standard tiles exclusively**; strictly zero satellite, Google, or Esri imagery.
- **Color & Shape System**: FCBK (#E8710A, Circle), Zigzag (#1A73E8, Square), CFCBK (#188038, Triangle).

### How to Run Locally

```bash
# 1. Install frontend dependencies
cd frontend
npm install --legacy-peer-deps

# 2. Sync analytical outputs from brief/outputs/ to public/data/
npm run sync
# Or from root: make frontend-sync

# 3. Start local development server
npm run dev
# Dashboard launches at: http://localhost:5173/

# 4. Build production static bundle
npm run build
```

*(Alternative via Makefile from repository root)*:
```bash
make frontend-install
make frontend-sync
make frontend-dev
make frontend-build
```

---

## 📚 Dataset Citation & License

This project utilizes the **SentinelKilnDB** dataset:

```bibtex
@inproceedings{mondal2025sentinelkilndb,
  title     = {SentinelKilnDB: A Large-Scale Satellite Benchmark for Brick Kiln Detection and Compliance Monitoring},
  author    = {Mondal, et al.},
  booktitle = {Advances in Neural Information Processing Systems (NeurIPS 2025 Datasets and Benchmarks Track)},
  year      = {2025},
  publisher = {Sustainability Lab, IIT Gandhinagar},
  note      = {Licensed under Creative Commons Attribution-NonCommercial (CC BY-NC 4.0)}
}
```

*License Note: CC BY-NC 4.0 applies. The dataset and derived models are intended strictly for non-commercial research, academic, and hackathon benchmarking.*
