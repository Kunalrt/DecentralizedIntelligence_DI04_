"""Training entrypoint for Chimney Census oriented bounding box detector."""

import argparse
from pathlib import Path
import yaml
from src.models.detector import KilnOBBDetector


def train_model(config_path: str):
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    model_name = cfg["model"].get("architecture", "yolov8n-obb.pt")
    data_yaml = cfg["data"].get("config_path", "configs/data.yaml")
    train_args = cfg.get("train", {})
    train_args["imgsz"] = cfg["data"].get("imgsz", 128)
    train_args["batch"] = cfg["data"].get("batch_size", 64)
    train_args["workers"] = cfg["data"].get("workers", 4)

    print(f"[INFO] Initializing model {model_name}...")
    detector = KilnOBBDetector(model_name)
    print(f"[INFO] Launching training with data={data_yaml}...")
    results = detector.train(data_yaml=data_yaml, **train_args)
    return results


def main():
    parser = argparse.ArgumentParser(description="Train Chimney Census OBB Detector")
    parser.add_argument("--config", type=str, default="configs/train.yaml", help="Path to training config YAML")
    args = parser.parse_args()

    print(f"[INFO] Starting training with config: {args.config}")
    train_model(args.config)


if __name__ == "__main__":
    main()
