# Agni Drishti: Brick Kiln Detection & Compliance Monitoring via Sentinel-2

Oriented Bounding Box (OBB) detection and 3-class classification of brick kilns in Sentinel-2 RGB satellite imagery ($128 \times 128$ px, $10\text{ m/pixel}$), developed for the **Agni Drishti** project.

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

| Exp ID | Model / Architecture | Key Intervention / Hypothesis | Val mAP@0.5 | Test mAP@0.5 | AP_FCBK | AP_CFCBK | AP_Zigzag | Outcome & Analysis |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **03** | YOLO11s-OBB Baseline | Pretrained backbone, $imgsz=256$, 30 epochs, AMP, $conf=0.001$ | **0.6864** | - | 0.7200 | 1.0000 | 0.3393 | Baseline trained with satellite augmentations (`degrees: 180`, `hsv_h: 0.0`). CFCBK 1.00, but small Zigzag struggled. |
| **05a** | **Champion Model** ($imgsz=384$) | Input upscaled to 384px to preserve tiny $12 \times 6$ px kilns | **0.9333** | **0.8472** | **0.7292** | **1.0000** | **0.8125** | **+0.2469 Val mAP jump!** Zigzag surged to 0.9500 on Val / 0.8125 on Test. Test 95% CI: **[0.7037, 0.9779]**. Champion weights in `weights/best.pt`. |
| **05b** | Diminishing Returns ($imgsz=512$) | Further upscaling to 512px | **0.8591** | - | 0.8000 | 1.0000 | 0.7773 | Over-smoothing on small targets and 2.7x latency increase (6.6 ms/tile). Decisively rejected. |

- **Inference Latency Extrapolation**: 8,000 tiles execute in **51.2 seconds** (0.85 minutes) at 156.3 tiles/sec on GPU, well within the 15-minute T4 competition ceiling (14.15-minute safety margin).

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
make brief  # Or: python brief/generate_test_brief_package.py && python scripts/validate_outputs.py
```

> [!IMPORTANT]
> **Data Integrity Rule**: Always export with `allow_nan=False` (never emit bare `NaN` or `Infinity` tokens, which are invalid in JSON) and run `scripts/validate_outputs.py` before syncing data to the frontend or publishing deliverables.

---

## 🌐 Interactive Frontend Dashboard

An interactive React 19 + Vite + TypeScript dashboard designed for **Inspector Farida Khan (State Pollution Control Board)** to plan field patrols, explore kiln clusters, and review mandate conversions.

- **Live Deployment**: [https://kunalrt.github.io/new_repo/](https://kunalrt.github.io/new_repo/) (configured via GitHub Pages & GitHub Actions).
- **Basemap Compliance**: Uses **OpenStreetMap standard tiles exclusively**; strictly zero satellite, Google, or Esri imagery.
- **Color & Shape System**: FCBK (#E8710A, Circle), Zigzag (#1A73E8, Square), CFCBK (#188038, Triangle).

### 🖥️ Dashboard Architecture & Tab Modules

1. **Overview Dashboard (`#overview`)**:
   - High-level KPI cards (Total: 65 [42–100], FCBK Violations: 27 [18–41], Converted Zigzags: 30 [21–45], Circular CFCBKs: 8 [3–14], 1 km Clusters: 51 kilns).
   - Recharts visual chart comparing model detections against 95% CI honest range whiskers.
   - Per-class validation precision & recall table formatted to 2 decimal places.
   - "How Sure Are We?" uncertainty panel explaining 10 m resolution, 2025–26 domain shift, and regional statistical bounds.

2. **Interactive Spatial Map (`#map`)**:
   - Leaflet map with standard OpenStreetMap tiles exclusively.
   - Every kiln rendered as an oriented bounding box (OBB) polygon and center marker colored by class.
   - Convex hull boundaries highlighting the 18 vehicle proximity clusters ($\le 1.0\text{ km}$ gaps).
   - 2023–24 baseline layer toggle rendering historical FCBK sites as dashed gray circles.
   - Multi-criteria filter bar (by class, clusters only, conversions only, min confidence score slider).
   - Click-to-inspect side drawer with 1-click copyable GPS coordinates and inspector directives.

3. **Field Inspection Plan (`#field`)**:
   - Top 20 priority table ranked by ban violation, model confidence, and cluster density.
   - Vehicle routing card detailing single-jeep logistics and **~120 km of travel distance saved** (reducing transit from ~185 km to ~65 km).
   - 18 proximity clusters breakdown with collapsible accordion cards listing assigned kilns and coordinates.
   - 1-click export to CSV and GPX (for Garmin handhelds, OsmAnd, or phone GPS).
   - Print-friendly 1-page clipboard checklist view (`window.print()`).

4. **Method & Evidence (`#method`)**:
   - 6-stage end-to-end processing pipeline diagram (Sentinel-2 tiles $\to$ YOLO11s-OBB $\to$ Rotated NMS $\to$ Cross-tile deduplication $\to$ Spatial clustering $\to$ Compliance scorer).
   - 10-experiment progression table (Exp 00 to 09) tracking mAP deltas and per-class AP.
   - Honest negative results analysis: Exp 08 pseudo-labeling confirmation bias failure ($-0.0719$ delta rejected), Exp 03 baseline class collapse, and heavy mosaic latency.
   - Formal SentinelKilnDB citation with copyable BibTeX and CC BY-NC 4.0 notice.
   - Systemic machine learning & remote sensing limitations (what the model cannot do).

5. **Downloads & Inspector's Brief (`#downloads`)**:
   - Visual 2-page Inspector's Brief document viewer with Page 1 & Page 2 preview switcher.
   - 10 verified download packages with file sizes, formats, timestamps, and direct download buttons (`inspector_brief.pdf`, `kilns.geojson`, `labels_2023.geojson`, `counts.csv`, `conversions.csv`, `within_1km.csv`, `top20.csv`, `clusters_summary.csv`, `map.png`, `waypoints.gpx`).
   - Interactive live satellite tile inference demo with CPU-friendly FastAPI backend.

### How to Run Locally

```bash
# 1. Install dependencies (from repository root or frontend/)
npm install

# 2. Sync analytical outputs from brief/outputs/ to public/data/
npm run sync  # Or: python frontend/scripts/sync_data.py

# 3. Start local development server
npm run dev
# Dashboard launches at: http://localhost:5173/

# 4. Build production static bundle
npm run build

# 5. Start FastAPI Ingestion & Inference Backend
python -m uvicorn backend.main:app --port 8000
```

---

## 🗺️ Map Your Area: Ingestion & Spatial Pipeline

Agni Drishti includes an end-to-end area ingestion and custom survey pipeline (`/#/map-area`) enabling enforcement teams to ingest regional imagery, district boundaries, or external detections to generate official compliance reports.

```
+----------------------------------------------------------------------------------------------------+
|                                    DATA INGESTION PIPELINE                                         |
+----------------------------------------------------------------------------------------------------+
|  [ Boundary ]        [ Sentinel-2 GeoTIFF ]       [ Detections ]                                   |
|  .geojson/.kml/.zip      RGB 10 m/px COG            .csv / .geojson                                |
|        |                       |                          |                                        |
|        v                       v                          v                                        |
|  EPSG:4326 Reproject     CRS & GSD Check           Class Normalization                             |
|  buffer(0) Repair        16-bit -> 8-bit Stretch   (FCBK, Zigzag, CFCBK)                           |
|        |                       |                          |                                        |
|        +-----------+-----------+--------------------------+                                        |
|                    v                                                                               |
|             Boundary & Footprint Check (derive convex hull + 500m if omitted)                      |
|                    v                                                                               |
|             128x128 Tiling with 30 px Overlap -> YOLO11s-OBB Ingestion                             |
|                    v                                                                               |
|             Affine Pixel-to-WGS84 -> Spatial Deduplication (15 m / IoU >= 0.50)                   |
|                    v                                                                               |
|             OSM Overpass Query (Highways, Waterways) [Capped & Cached by bbox]                     |
|                    v                                                                               |
|             Spatial Metrics: Area, Perimeter, Haversine 1km Clusters, Road Distances               |
|                    v                                                                               |
|   +----------------+----------------+----------------+----------------+------------------------+   |
|   | boundary.geojson| kilns.geojson | roads.geojson  | summary.json   | preview.png            |   |
|   | KML Export      | GPX Waypoints | 1-Page PDF     | GeoJSON Bundle | Shareable Studio State |   |
|   +-----------------+---------------+----------------+----------------+------------------------+   |
+----------------------------------------------------------------------------------------------------+
```

### Accepted Formats
1. **Boundary**:
   - `.geojson`, `.json`, `.kml`, `.zip` (shapefile containing `.shp`, `.shx`, `.dbf`, `.prj`).
   - Reprojected to `EPSG:4326` using GeoPandas; dissolved into a single geometry; self-intersections repaired via `buffer(0)`.
2. **Imagery**:
   - GeoTIFF / Cloud-Optimized GeoTIFF (`.tif`, `.tiff`) with embedded Coordinate Reference System (CRS).
   - Extracts RGB bands (1–3); stretches 16-bit or float data to 8-bit using 2nd–98th percentile contrast stretching.
   - Rejects unreferenced rasters with a clear validation error.
3. **Detections**:
   - `.csv` (columns: `class,lat,lon,score` or bounding box coordinates) or `.geojson`.
   - Validates class labels to `FCBK`, `Zigzag`, `CFCBK`.

### Footprint & Boundary Derivation
- If no boundary file is supplied, the pipeline derives it automatically from:
  - The GeoTIFF bounding footprint, or
  - The detection points' convex hull buffered by $500\text{ m}$.
- Derived boundaries are marked with a `"derived": true` chip in UI and exports.

### Ground Sample Distance (GSD) Handling
- The model is calibrated for $\sim 10\text{ m/pixel}$ Sentinel-2 imagery.
- **Moderate Resampling**: If imagery GSD differs from 10 m, it is resampled to 10 m/px with an advisory notice: *"Imagery was resampled from X m/px; accuracy may drop."*
- **Drone Imagery Protection**: If GSD is $< 2.0\text{ m/pixel}$ (high-resolution drone orthomosaics), model inference is safely halted with the notice: *"Imagery resolution is drone-scale; kiln model is not suited."* Boundary, OSM roads, waterways, and spatial context layers are still generated.

### OpenStreetMap Overpass Integration
- Overpass API queries retrieve:
  - **Highways**: Class-separated (primary, secondary, residential, unclassified).
  - **Waterways**: Canals, streams, rivers for environmental setbacks.
- Cached by coordinate bounding box to prevent redundant upstream requests.
- **Offline / Server Fallback**: If Overpass is unreachable or times out, the pipeline proceeds safely without roads, setting `roads_available: false` with an advisory status chip.

### Privacy, Retention & Quotas
- **Upload Quotas**: $100\text{ MB}$ per file, $300\text{ MB}$ per session maximum (HTTP 413 enforced).
- **Time-to-Live**: 1-hour session lifetime with automated background cleanup.
- **Field Privacy**: Files processed in-memory or temporary directories; uploaded imagery is never logged or retained.
- **Clear Data**: User-initiated `"Clear Data"` action purges all session artifacts from the server immediately.

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
