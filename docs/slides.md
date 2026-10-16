# Chimney Census: Autonomous Kiln Detection & Compliance Monitoring
*5-Minute Presentation (5 Slides)*

---

## Slide 1: The Challenge & Impact
- **Problem**: Brick kilns account for significant black carbon emissions across South Asia. Environmental regulation mandates converting polluting FCBKs to cleaner Zigzag designs.
- **Task**: Detect kilns in 128x128 Sentinel-2 RGB tiles (10 m/px) using Oriented Bounding Boxes (OBB) across 3 classes: FCBK, CFCBK (~3% rare), Zigzag.
- **Evaluation**: Macro-averaged mAP@0.5 on rotated-box IoU (CFCBK counts for 1/3 of total score).
- **Constraints**: RGB only, strictly $\le 15$ min inference on T4 GPU for ~8,000 test tiles.

---

## Slide 2: Pipeline Architecture & OBB Representation
- **Model Choice**: Lightweight Oriented Bounding Box detector (YOLO-OBB) fine-tuned on SentinelKilnDB (114,300 tiles).
- **Geometric Precision**: 8-point normalized corners $(x_1, y_1, \dots, x_4, y_4)$ capturing accurate kiln orientation regardless of satellite swath angle.
- **Loss Formulation**: Combined Rotated Bounding Box loss + focal classification loss to handle extreme background dominance and small object footprints.

---

## Slide 3: Tackling the 3% Rare Class & Domain Shift
- **CFCBK Scarcity**: CFCBK accounts for only ~3% of kilns. Solved via targeted copy-paste augmentation, angle-invariant rotation, and boosted class loss weighting.
- **2025-26 Domain Shift**: Unseen regions and seasonal vegetation changes addressed via heavy color jitter, Test-Time Augmentation (TTA), and high-confidence pseudo-labeling.
- **Recall Optimization**: DOTA-style all-point AP heavily rewards complete recall. Configured low confidence threshold ($\sim 0.001$) to capture all candidate kilns.

---

## Slide 4: Key Results & Experiment Progression
- **mAP@0.5 Progression**: From initial baseline to fine-tuned OBB with rare-class boosting.
- **Latency**: Fully vectorized batch inference running in $< 12$ minutes on a single T4 GPU (~8,000 tiles).
- **Ablation Takeaways**: Full $360^\circ$ rotation invariance and copy-paste augmentation yielded the highest gains on the CFCBK bottleneck class.

---

## Slide 5: Inspector's Brief & Field Deployment
- **Decision Support**: Automated GIS brief for Demo District regulatory inspectors.
- **Conversion Tracking**: Identified historical 2023-24 FCBKs structurally converted to modern Zigzag kilns.
- **Spatial Clustering**: Flagged kilns within 1 km for clustered on-site inspections, maximizing field officer routing efficiency.
- **Top 20 Prioritized Sites**: Actionable inspection targets based on regulatory non-compliance probability.
