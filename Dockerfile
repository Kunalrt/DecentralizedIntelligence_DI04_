# Multi-stage Dockerfile for Agni Drishti Full-Stack Application
# Stage 1: Build Frontend SPA
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
ENV VITE_BASE_PATH=/
RUN npm run build

# Stage 2: Python Backend with FastAPI & YOLO11s Inference Engine
FROM python:3.11-slim AS production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies for geospatial libraries (GDAL, GEOS, PROJ) and OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libgdal-dev \
    gdal-bin \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# Copy application backend, inference weights, and analytical outputs
COPY backend/ ./backend/
COPY src/ ./src/
COPY configs/ ./configs/
COPY brief/outputs/ ./brief/outputs/
COPY yolo11s-obb.pt ./
COPY weights/ ./weights/

# Copy compiled frontend from Stage 1 into frontend/dist for FastAPI static mount
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/ingest/example || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
