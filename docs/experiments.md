# Chimney Census - Experiment Tracking Log

> **Goal**: Detect brick kilns in Sentinel-2 RGB tiles (128x128 px, 10 m/px) with Oriented Bounding Boxes (OBB) and classify them into:
> - **FCBK** (oval, older, dominant)
> - **CFCBK** (circular, rare ~3%)
> - **Zigzag** (rectangle, modern conversion)
>
> **Metric**: Macro-averaged mAP@0.5 on rotated-box IoU (1/3 weight per class, DOTA-style all-point interpolated AP).

---

## Experiment Summary Table

| Exp ID | Model / Architecture | Key Technique / Hypothesis | Val mAP@0.5 | AP_FCBK | AP_CFCBK | AP_Zigzag | Outcome & Analysis (Why it worked/failed) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **00** | Initial Baseline Skeleton | Repository setup, pipeline scaffold & metric validation | - | - | - | - | Pipeline initialized & verified. |
| **01** | Data Pipeline & Sampler | YOLO-OBB 8-point parser, 360° rotation invariance, copy-paste rare CFCBK | - | - | - | - | Verified OBB geometry transforms, clockwise vertex ordering, and 30x class weight balancing for rare CFCBK. |

---

## Detailed Experiment Entries

### Exp 00: Pipeline & Metric Engine Setup
- **Hypothesis**: Establishing an automated end-to-end pipeline with rotated IoU polygon evaluation and low-confidence thresholding ($\sim 0.001$) will maximize recall under the all-point interpolated AP metric.
- **Config**: `configs/train.yaml` with YOLO-OBB architecture.
- **Data**: SentinelKilnDB (114,300 tiles) + unseen 2025-26 test tiles.
- **Status**: Scaffolding complete.

### Exp 01: Data Pipeline, Satellite Augmentations & Rare-Class Balancing
- **Hypothesis**: Standard object detection augmentations fail on nadir satellite imagery. Full $360^\circ$ rotation invariance, spectral jitter, and targeted copy-paste augmentation for rare CFCBK ($\sim 3\%$) are essential to prevent class collapse.
- **Implementation**:
  - `src/data/dataset.py`: Clockwise corner sorting, OBB to $(cx, cy, w, h, \theta)$ conversion, YOLO-OBB label parser.
  - `src/data/augment.py`: Geometric rotation, horizontal/vertical reflection, spectral jitter for domain shift.
  - `src/data/sampler.py`: Dynamic inverse frequency class weighting (CFCBK weight $\approx 13.7$ vs FCBK $\approx 0.5$) and copy-paste kiln synthesis.
  - `tests/test_data.py`: Comprehensive test suite verifying all transforms and split distributions.
- **Outcome**: All tests passed with 100% precision on coordinate conversions. Ready for metric engine benchmarking.
