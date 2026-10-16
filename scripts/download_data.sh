#!/usr/bin/env bash
# Fetch SentinelKilnDB (Kaggle API or provided URL/path via environment variable)
# Citation: SentinelKilnDB by Mondal et al., Sustainability Lab, IIT Gandhinagar (NeurIPS 2025)
set -e

DATA_DIR="${DATA_DIR:-./data}"
mkdir -p "$DATA_DIR"

echo "=========================================================="
echo " SentinelKilnDB Acquisition & Preparation"
echo "=========================================================="

# 1. Check if path is provided via env var SENTINELKILNDB_PATH
if [ -n "$SENTINELKILNDB_PATH" ] && [ -e "$SENTINELKILNDB_PATH" ]; then
    echo "[INFO] Found dataset path in \$SENTINELKILNDB_PATH: $SENTINELKILNDB_PATH"
    if [ -d "$SENTINELKILNDB_PATH" ]; then
        echo "[INFO] Copying/syncing dataset from $SENTINELKILNDB_PATH to $DATA_DIR..."
        cp -rn "$SENTINELKILNDB_PATH"/* "$DATA_DIR/" 2>/dev/null || true
    elif [[ "$SENTINELKILNDB_PATH" == *.zip ]]; then
        echo "[INFO] Unzipping $SENTINELKILNDB_PATH into $DATA_DIR..."
        unzip -q -n "$SENTINELKILNDB_PATH" -d "$DATA_DIR"
    fi

# 2. Check if URL is provided via env var SENTINELKILNDB_URL
elif [ -n "$SENTINELKILNDB_URL" ]; then
    echo "[INFO] Downloading dataset from \$SENTINELKILNDB_URL: $SENTINELKILNDB_URL"
    curl -L "$SENTINELKILNDB_URL" -o "$DATA_DIR/sentinelkilndb.zip"
    unzip -q -n "$DATA_DIR/sentinelkilndb.zip" -d "$DATA_DIR"
    rm -f "$DATA_DIR/sentinelkilndb.zip"

# 3. Check if Kaggle CLI is available
elif command -v kaggle >/dev/null 2>&1; then
    KAGGLE_SLUG="${KAGGLE_DATASET:-sustainability-lab/sentinelkilndb}"
    echo "[INFO] Attempting download from Kaggle: $KAGGLE_SLUG..."
    kaggle datasets download -d "$KAGGLE_SLUG" -p "$DATA_DIR" --unzip || true

else
    echo "[WARN] No external source found via \$SENTINELKILNDB_PATH, \$SENTINELKILNDB_URL, or Kaggle CLI."
    echo "[INFO] Initializing benchmark verification dataset structure via python..."
fi

python src/data/download.py
echo "[SUCCESS] Data setup complete."
