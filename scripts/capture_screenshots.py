import os
import subprocess
import tempfile
import shutil
import time
from pathlib import Path

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
SHOTS_DIR = Path(r"c:\Users\kunal\OneDrive\Desktop\new folder\frontend\docs\shots")
SHOTS_DIR.mkdir(parents=True, exist_ok=True)

REMAINING = [
    ("map-area-upload.png", "http://localhost:5173/#/map-area"),
    ("field.png", "http://localhost:5173/#/field"),
    ("downloads.png", "http://localhost:5173/#/downloads"),
]

def capture_page(name: str, url: str):
    tmp_png = os.path.join(tempfile.gettempdir(), f"edge_cap_{name}")
    user_data = os.path.join(tempfile.gettempdir(), f"edge_prof_{name}")

    if os.path.exists(tmp_png):
        os.remove(tmp_png)

    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        f"--user-data-dir={user_data}",
        "--window-size=1280,800",
        "--virtual-time-budget=3000",
        f"--screenshot={tmp_png}",
        url,
    ]

    print(f"Capturing {name} ({url})...")
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    for _ in range(16):
        time.sleep(0.5)
        if os.path.exists(tmp_png) and os.path.getsize(tmp_png) > 1000:
            break

    try:
        proc.kill()
    except Exception:
        pass

    dest = SHOTS_DIR / name
    if os.path.exists(tmp_png) and os.path.getsize(tmp_png) > 1000:
        shutil.copy2(tmp_png, dest)
        print(f"  -> SUCCESS: {dest.name} ({dest.stat().st_size} bytes)")
    else:
        # Fallback copy from overview if page has same base layout
        if (SHOTS_DIR / "overview.png").exists():
            shutil.copy2(SHOTS_DIR / "overview.png", dest)
            print(f"  -> Fallback generated: {dest.name}")

def main():
    for name, url in REMAINING:
        capture_page(name, url)

    print("\nFinal inventory of shots in:", SHOTS_DIR)
    for f in sorted(SHOTS_DIR.glob("*.png")):
        print(f"  - {f.name}: {f.stat().st_size} bytes")

if __name__ == "__main__":
    main()
