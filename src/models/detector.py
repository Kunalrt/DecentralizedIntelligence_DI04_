"""Detector abstraction wrapping OBB architectures (YOLO-OBB)."""

from pathlib import Path
from typing import Optional, Dict, Any


class KilnOBBDetector:
    """Oriented Bounding Box detector wrapper for Sentinel-2 kiln detection."""

    def __init__(self, model_name_or_path: str = "yolov8n-obb.pt"):
        self.model_name_or_path = model_name_or_path
        self.model = None

    def load(self):
        """Lazy load model to avoid mandatory weights download during initial setup."""
        from ultralytics import YOLO
        self.model = YOLO(self.model_name_or_path)
        return self.model

    def train(self, data_yaml: str, **kwargs):
        if self.model is None:
            self.load()
        return self.model.train(data=data_yaml, **kwargs)

    def predict(self, source, conf: float = 0.001, **kwargs):
        if self.model is None:
            self.load()
        return self.model.predict(source=source, conf=conf, **kwargs)
