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

---

## Detailed Experiment Entries

### Exp 00: Pipeline & Metric Engine Setup
- **Hypothesis**: Establishing an automated end-to-end pipeline with rotated IoU polygon evaluation and low-confidence thresholding ($\sim 0.001$) will maximize recall under the all-point interpolated AP metric.
- **Config**: `configs/train.yaml` with YOLO-OBB architecture.
- **Data**: SentinelKilnDB (114,300 tiles) + unseen 2025-26 test tiles.
- **Status**: Scaffolding complete; ready for data acquisition and training.
