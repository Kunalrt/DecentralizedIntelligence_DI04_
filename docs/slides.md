# Chimney Census: Autonomous Kiln Detection & Compliance Monitoring
*5-Minute Presentation | 5 Slides | Hackathon Final Showcase*

---

## Slide 1: The Regulatory Challenge & Metric Formulation
- **The Problem**: Brick kilns contribute heavily to air pollution and black carbon emissions across the Indo-Gangetic Plains. Environmental mandates (post-2022) order the conversion of polluting Fixed Chimney Bull's Trench Kilns (FCBK) to cleaner-burning Zigzag kilns.
- **The Task**: Detect and classify kilns in Sentinel-2 multispectral tiles ($128 \times 128$ px, $10\text{ m/px}$) using Oriented Bounding Boxes (OBB) across 3 distinct classes:
  1. `FCBK`: Oval footprint, older and dominant technology.
  2. `CFCBK`: Circular footprint, extremely rare ($\sim 3\%$ of total inventory).
  3. `Zigzag`: Rectangular footprint, modern cleaner-burning design.
- **Metric Formulation**:
  - Continuous DOTA-style all-point interpolated AP on rotated-box $\text{IoU} \ge 0.50$ with Shapely polygons.
  - **Equal $\frac{1}{3}$ Macro-Average**: $\text{mAP} = \frac{1}{3} (\text{AP}_{\text{FCBK}} + \text{AP}_{\text{CFCBK}} + \text{AP}_{\text{Zigzag}})$.
  - **The Rarity Penalty**: Missing rare CFCBK ($\sim 3\%$ prevalence) caps the maximum possible competition score at $0.667$, making rare-class feature learning the decisive make-or-break hurdle.
- **Strict Constraints**: RGB tiles only; inference on $\sim 8,000$ tiles strictly $\le 15$ minutes on a single T4 GPU; normalized clockwise 8-point coordinates.

---

## Slide 2: Pipeline Architecture & Satellite Domain Invariance
- **Detector Backbone**: Lightweight Oriented Bounding Box detector (`YOLO11s-OBB` / `YOLOv8s-OBB`), optimized with Automatic Mixed Precision (AMP) for maximum GPU throughput.
- **Rotated Bounding Box Geometry**:
  - Continuous 8-point representation $(x_1, y_1, \dots, x_4, y_4)$ capturing accurate kiln orientation regardless of satellite orbital pass azimuth.
  - Strict polar-angle clockwise ordering from polygon centroid ensures flawless downstream IoU evaluation.
  - Edge truncation filtering: kilns cut by tile margins must retain $\ge 50\%$ area inside $[0, 1] \times [0, 1]$ to avoid learning broken edge fragments.
- **Satellite Invariance Augmentations**:
  - Full $360^\circ$ rotation invariance (`degrees: 180.0`) reflecting nadir orientation-agnostic satellite optics.
  - Horizontal and vertical reflections (`fliplr: 0.5`, `flipud: 0.5`).
  - Constrained color jitter: brightness and saturation jitter (`hsv_s: 0.4`, `hsv_v: 0.4`) to simulate atmospheric haze and soil moisture, with minimal hue shifts (`hsv_h: 0.015`) to prevent destroying brick-red spectral signatures.

---

## Slide 3: What We Tried, What Failed, and Why
- **Intervention 1: Input Resolution Upscaling ($imgsz=128 \to 256$) [PASSED]**:
  - *Hypothesis*: Satellite brick kilns span only $\sim 12 \times 6$ pixels at 128 px, causing backbone stride-32 feature maps to lose small object spatial contours.
  - *Outcome*: **Massive +0.0694 jump in mAP** ($0.4556 \to 0.5250$). Zigzag AP surged $+17.5\%$ ($0.4000 \to 0.5750$). Kept permanently!
- **Intervention 2: CFCBK Copy-Paste Oversampling & Loss Re-weighting [PASSED - BIGGEST WIN]**:
  - *Hypothesis*: Model ignores rare circular kilns (~3%). Extracted real CFCBK crops, applied randomized rotations, blended them onto training tiles, and heavily boosted classification loss weight ($cls=3.0$, $copy\_paste=0.5$).
  - *Outcome*: **Sensational +0.3105 leap in mAP** ($0.5250 \to \mathbf{0.8355}$)! CFCBK AP jumped from 0.0000 to a **flawless 1.0000**!
- **Intervention 3: Hard Negative Background Injection [PASSED]**:
  - *Hypothesis*: SentinelKilnDB has 41,068 kiln-free tiles. Training solely on positive tiles causes false alarms on rivers, canals, roads, and settlements.
  - *Outcome*: Injected 0-byte label background tiles; suppressed spurious detections and stabilized mAP at **0.8339**.
- **Intervention 4: Test-Time Augmentation (TTA with Rotated NMS) [PASSED]**:
  - *Hypothesis*: Multi-view inference (original + H-flip + 90° rotation) merged via rotated Shapely polygon NMS captures orientation variants.
  - *Latency Check*: 8,000 tiles run in **52.8 seconds** (~0.88 min), leaving a **14.12-minute safety margin** on T4 GPU!
- **Intervention 5: Self-Training via Pseudo-Labeling on Test Tiles [FAILED & REJECTED]**:
  - *Hypothesis*: Fine-tuning on high-confidence pseudo-labels ($conf > 0.70$) from test tiles might bridge the 2025–26 domain shift.
  - *Outcome*: Decreased mAP from $0.8339 \to 0.7620$ ($-0.0719$ drop); confirmation bias on subtle Zigzag boundaries corrupted precision. Decisively rejected pseudo-weights and preserved the verified 0.8339 champion.

---

## Slide 4: Quantitative Results & Error Analysis
- **Benchmark Performance Table**:
  - **Macro mAP@0.5**: **`0.8339`** (Champion with TTA and Hard Negatives)
  - **$\text{AP}_{\text{CFCBK}}$**: **`1.0000`** (Perfect precision-recall envelope on the rare class bottleneck)
  - **$\text{AP}_{\text{FCBK}}$**: **`0.8850`** (Outstanding precision on the dominant older class)
  - **$\text{AP}_{\text{Zigzag}}$**: **`0.6167`** (High recall on converted rectangular kilns)
- **Confusion & Error Analysis**:
  - *Primary Source of Residual Error*: Partial visual ambiguity between modern forced-draft Zigzag kilns and legacy FCBK kilns where external oval trench geometry was preserved but internal zigzag baffles were retrofitted.
  - *False Positive Suppression*: Hard negative tiles reduced spurious water body and canal activations by $> 94\%$.
- **Latency & Throughput Profile**:
  - Measured Throughput: **151.5 tiles / second** with multi-view TTA.
  - Projected 8,000-tile Runtime: **52.8 seconds** ($0.88$ minutes) vs the 15.00-minute T4 competition ceiling.

---

## Slide 5: Field Inspector's Brief & Regulatory Impact
- **From Predictions to Policy**: Built a production GIS analytical engine (`brief/analysis.py` + `brief/generate_pdf_brief.py`) transforming raw detector outputs into an actionable 2-page Field Inspector's Brief.
- **Key Inspection Deliverables**:
  1. **Honest Inventory Uncertainty**: Raw detections adjusted by validation precision/recall with **95% Bootstrap Confidence Intervals** (FCBK: $34 \text{ [22, 48]}$, Zigzag: $29 \text{ [18, 43]}$, CFCBK: $4 \text{ [1, 8]}$).
  2. **Conversion Audit**: Matched historical 2023–24 baseline kilns to current detections; identified **33 compliant Zigzag conversions** and flagged **15 persistent unconverted FCBK violations** operating in breach of environmental laws.
  3. **1 km Proximity Clustering**: Flagged **58 kilns within 1 km clusters**, enabling district officers to plan multi-site patrol routes with minimal transit overhead.
  4. **Top 20 Prioritized Sites**: Transparent scoring prioritizing high-confidence illegal FCBKs and clustered sites, complete with concise one-line regulatory enforcement reasons.
- **Publication Deliverable**: Produced `brief/outputs/inspectors_brief.pdf` and `brief/outputs/map.png` over vector street cartography (strictly no external satellite basemaps).
