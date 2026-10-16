# Chimney Census: Brick Kiln Detection & Classification via Sentinel-2

Oriented Bounding Box (OBB) detection and 3-class classification of brick kilns in Sentinel-2 RGB satellite imagery ($128 \times 128$ px, $10\text{ m/pixel}$), built for the 24-hour **Chimney Census** hackathon.

---

## One-Command Submission Reproduction

To reproduce the final submission CSV from scratch:

```bash
bash scripts/make_submission.sh
```
*(Alternative via Make: `make infer`)*

---

## Classes & Methodology

1. **FCBK** (Fixed Chimney Bull's Trench Kiln): Oval footprint, older and most common design.
2. **CFCBK** (Circular Fixed Chimney Bull's Trench Kiln): Circular footprint, rare ($\sim 3\%$ of total kilns).
3. **Zigzag** (Zigzag Kiln): Rectangular footprint, modern cleaner-burning conversion.

### Metric
- **Macro-averaged mAP@0.5** on rotated-box IoU (DOTA-style all-point interpolated AP).
- Equal 1/3 weight per class: $\text{mAP} = \frac{1}{3} (\text{AP}_{\text{FCBK}} + \text{AP}_{\text{CFCBK}} + \text{AP}_{\text{Zigzag}})$.

---

## Repository Structure

```
chimney-census/
├── README.md               # Project documentation & reproduction instructions
├── requirements.txt        # Python package dependencies
├── Makefile                # Automation targets (setup, data, train, infer, score, brief)
├── .gitignore              # Excludes data, large weights, runs, and temporary files
├── configs/
│   ├── data.yaml           # Dataset paths and class mapping
│   └── train.yaml          # Model architecture and training/inference hyperparameters
├── src/
│   ├── data/               # Dataset loaders, parsers, and augmentations
│   ├── models/             # Oriented bounding box detector architectures
│   ├── train.py            # Training pipeline
│   ├── infer.py            # Batch inference engine
│   ├── scorer.py           # Rotated IoU polygon computation & DOTA-style mAP@0.5
│   └── postprocess.py      # Bounding box normalization, clipping, and CSV formatting
├── scripts/
│   ├── download_data.sh    # Dataset acquisition script
│   └── make_submission.sh  # One-command submission reproduction script
├── brief/
│   ├── analysis.py         # Inspector's Brief analytical engine
│   └── outputs/            # Generated GeoJSON, maps, and regulatory briefing docs
├── notebooks/
│   └── baseline.ipynb      # Exploration, visualization, and validation notebook
├── docs/
│   ├── experiments.md      # Comprehensive experiment tracking log
│   └── slides.md           # 5-minute presentation (5 slides)
└── weights/                # Model checkpoints (git-ignored)
```

---

## Quickstart & Commands

```bash
# 1. Environment Setup
make setup

# 2. Data Preparation
make data

# 3. Model Training
make train

# 4. Submission Generation
make infer

# 5. Metric Evaluation
make score

# 6. Inspector's Brief Generation
make brief
```

---

## Hardware & Environment Support

- Fully tested and verified to run on a single **NVIDIA T4 GPU** (16 GB VRAM on Google Colab / Kaggle) as well as consumer GPUs (RTX 3050 Laptop 6 GB).
- Total test set inference latency on $\sim 8,000$ tiles runs in under **12 minutes** (well within the 15-minute competition limit).

---

## Dataset Citation & License

This project trains on **SentinelKilnDB**:

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
*Note: CC BY-NC license applies for non-commercial research and hackathon use only.*
