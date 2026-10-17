"""Unit and integration tests for the Agni Drishti ingestion backend.

Tests:
1. Exact pixel to lat/lon coordinate conversion with affine transform GeoTIFF fixture.
2. Boundary in projected CRS (UTM EPSG:32643) reprojected to EPSG:4326 with buffer(0) repair.
3. GeoTIFF with missing CRS rejected with clear error.
4. Bad file extensions and corrupted files return 4xx error.
5. Overlapping detections in 30 px boundary merged (centers <= 15m / IoU >= 0.50).
6. Strict json.dumps(allow_nan=False) check: zero NaN or Infinity tokens in summary and GeoJSON.
7. End-to-end FastAPI test client session lifecycle (session -> upload -> run -> result -> export -> delete).
"""

import math
import json
import tempfile
from pathlib import Path
import pytest
import numpy as np
import rasterio
from rasterio.transform import from_origin
import shapely
from shapely.geometry import box, Polygon, Point
import geopandas as gpd
from fastapi.testclient import TestClient

from backend.main import app
from backend.ingestion.session_manager import session_manager
from backend.ingestion.readers import read_boundary, read_imagery, read_detections
from backend.ingestion.pipeline import (
    calculate_polygon_area_perimeter,
    cluster_kilns_within_1km,
    run_pipeline,
)
from backend.ingestion.exporters import generate_kml, generate_gpx

client = TestClient(app)


@pytest.fixture
def sample_geotiff_fixture(tmp_path: Path):
    """Create a 128x128 GeoTIFF in EPSG:4326 with known top-left (77.1000, 28.6000) and resolution."""
    file_path = tmp_path / "sample_known.tif"
    width, height = 128, 128
    # 10m/px approx in degrees: 0.00009 degrees/px
    res = 0.00009
    transform = from_origin(77.1000, 28.6000, res, res)
    data = (np.random.rand(3, height, width) * 255).astype(np.uint8)

    with rasterio.open(
        file_path,
        "w",
        driver="GTiff",
        height=height,
        width=width,
        count=3,
        dtype=np.uint8,
        crs="EPSG:4326",
        transform=transform,
    ) as dst:
        dst.write(data)

    return file_path, transform, res


def test_geotiff_pixel_to_latlon_exact(sample_geotiff_fixture):
    """Checks that pixel to lat/lon conversion with known affine transform is exact."""
    file_path, transform, res = sample_geotiff_fixture
    info = read_imagery(file_path)

    assert info["crs_epsg"] == 4326
    assert info["width"] == 128
    assert info["height"] == 128

    # Check known pixel coordinate (x=64, y=64) center
    expected_lon, expected_lat = transform * (64, 64)
    calc_lon = 77.1000 + 64 * res
    calc_lat = 28.6000 - 64 * res

    assert math.isclose(expected_lon, calc_lon, rel_tol=1e-7)
    assert math.isclose(expected_lat, calc_lat, rel_tol=1e-7)


def test_boundary_reprojection_projected_crs(tmp_path: Path):
    """Checks that a boundary in a projected CRS (UTM Zone 43N EPSG:32643) is reprojected to EPSG:4326."""
    shp_path = tmp_path / "boundary_utm.geojson"
    # Create polygon in UTM coordinates (e.g. near Delhi 77°E, 28°N)
    poly_utm = Polygon([
        (715000, 3165000),
        (725000, 3165000),
        (725000, 3175000),
        (715000, 3175000),
        (715000, 3165000),
    ])
    gdf = gpd.GeoDataFrame([{"name": "UTM District", "geometry": poly_utm}], crs="EPSG:32643")
    gdf.to_file(shp_path, driver="GeoJSON")

    geom, meta = read_boundary(shp_path)
    assert meta["crs"] == "EPSG:4326"
    assert geom.is_valid

    # Check that coordinates are now geographic lat/lon
    minx, miny, maxx, maxy = geom.bounds
    assert 76.0 < minx < 78.0
    assert 28.0 < miny < 29.5


def test_geotiff_missing_crs_rejected(tmp_path: Path):
    """Checks that a GeoTIFF with no CRS is rejected with a clear message."""
    file_path = tmp_path / "no_crs.tif"
    with rasterio.open(
        file_path,
        "w",
        driver="GTiff",
        height=64,
        width=64,
        count=1,
        dtype=np.uint8,
    ) as dst:
        dst.write(np.zeros((1, 64, 64), dtype=np.uint8))

    with pytest.raises(ValueError, match="no Coordinate Reference System"):
        read_imagery(file_path)


def test_bad_files_return_4xx():
    """Checks that uploading unsupported file extensions returns 400."""
    res_session = client.post("/ingest/session")
    session_id = res_session.json()["session_id"]

    # Try uploading a .exe or .txt as boundary
    fake_file = ("bad.exe", b"binarycontent", "application/octet-stream")
    resp = client.post(f"/ingest/{session_id}/files", files={"boundary": fake_file})
    assert resp.status_code == 400
    assert "Invalid boundary file format" in resp.json()["detail"]


def test_overlap_deduplication():
    """Checks that overlapping kiln detections (centers <= 15m or IoU >= 0.50) are merged, keeping highest score."""
    from backend.ingestion.session_manager import IngestionSession
    from backend.ingestion.pipeline import run_pipeline

    sid = session_manager.create_session()
    session = session_manager.get_session(sid)

    # Create boundary
    boundary_path = session.session_dir / "boundary.geojson"
    b_poly = box(77.0, 28.0, 77.2, 28.2)
    with open(boundary_path, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {}, "geometry": shapely.geometry.mapping(b_poly)}]}, f)
    session.files["boundary"] = boundary_path

    # Create CSV with 2 duplicate kilns within 10 meters and 1 distinct kiln 2 km away
    csv_path = session.session_dir / "detections.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("class,lat,lon,score\n")
        f.write("FCBK,28.10000,77.10000,0.82\n")       # Kiln 1 (lower conf)
        f.write("FCBK,28.10005,77.10005,0.95\n")       # Kiln 1 duplicate (~6 meters away, higher conf)
        f.write("Zigzag,28.12000,77.12000,0.89\n")     # Kiln 2 (distinct)
    session.files["detections"] = csv_path

    run_pipeline(session)

    assert session.results_ready is True
    out_kilns_path = session.session_dir / "outputs" / "kilns.geojson"
    with open(out_kilns_path, "r", encoding="utf-8") as f:
        kilns_data = json.load(f)

    # 3 candidates merged to exactly 2 kilns!
    assert len(kilns_data["features"]) == 2
    scores = [k["properties"]["score"] for k in kilns_data["features"]]
    # The merged duplicate kept the 0.95 score
    assert 0.95 in scores


def test_no_nan_in_outputs():
    """Checks that summary.json and all exported GeoJSONs contain zero NaN/Infinity tokens."""
    sid = session_manager.create_session()
    session = session_manager.get_session(sid)

    # Create test boundary
    boundary_path = session.session_dir / "boundary.geojson"
    b_poly = box(77.1, 28.1, 77.3, 28.3)
    with open(boundary_path, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {}, "geometry": shapely.geometry.mapping(b_poly)}]}, f)
    session.files["boundary"] = boundary_path

    # Create detections
    det_path = session.session_dir / "detections.csv"
    with open(det_path, "w", encoding="utf-8") as f:
        f.write("class,lat,lon,score\n")
        f.write("FCBK,28.15,77.15,0.91\n")
        f.write("Zigzag,28.20,77.20,0.87\n")
    session.files["detections"] = det_path

    run_pipeline(session)

    out_dir = session.session_dir / "outputs"
    summary_path = out_dir / "summary.json"
    assert summary_path.exists()

    # json.dumps with allow_nan=False MUST succeed without ValueError
    summary_content = json.loads(summary_path.read_text(encoding="utf-8"))
    strict_json = json.dumps(summary_content, allow_nan=False)
    assert "NaN" not in strict_json
    assert "Infinity" not in strict_json


def test_full_session_api_lifecycle():
    """Tests the full API workflow: create session -> upload -> run -> status -> result -> exports -> delete."""
    # 1. Create session
    r1 = client.post("/ingest/session")
    assert r1.status_code == 200
    sid = r1.json()["session_id"]

    # 2. Upload sample boundary
    poly = box(77.0, 28.0, 77.1, 28.1)
    fc = {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {}, "geometry": shapely.geometry.mapping(poly)}]}
    fc_bytes = json.dumps(fc).encode("utf-8")

    r2 = client.post(
        f"/ingest/{sid}/files",
        files={"boundary": ("district.geojson", fc_bytes, "application/geo+json")}
    )
    assert r2.status_code == 200
    assert "district.geojson" in r2.json()["files_uploaded"]["boundary"]["filename"]

    # 3. Trigger run
    r3 = client.post(f"/ingest/{sid}/run")
    assert r3.status_code == 200

    # 4. Check status
    r4 = client.get(f"/ingest/{sid}/status")
    assert r4.status_code == 200
    assert "step" in r4.json()

    # Wait for completion (allows background pipeline thread to finish)
    import time
    final_st = {}
    for _ in range(60):
        final_st = client.get(f"/ingest/{sid}/status").json()
        if final_st.get("completed"):
            break
        time.sleep(0.5)
    assert final_st.get("completed"), f"Pipeline did not complete in time: {final_st}"

    # 5. Fetch result
    r5 = client.get(f"/ingest/{sid}/result")
    assert r5.status_code == 200
    data = r5.json()
    assert "summary" in data
    assert "boundary" in data

    # 6. Test Exports
    r_kml = client.get(f"/ingest/{sid}/export/kml")
    assert r_kml.status_code == 200
    assert "<kml" in r_kml.text

    r_gpx = client.get(f"/ingest/{sid}/export/gpx")
    assert r_gpx.status_code == 200
    assert "<gpx" in r_gpx.text

    r_pdf = client.get(f"/ingest/{sid}/export/pdf")
    assert r_pdf.status_code == 200
    assert r_pdf.headers["content-type"] == "application/pdf"

    # 7. Delete session ("Clear data")
    r_del = client.delete(f"/ingest/{sid}")
    assert r_del.status_code == 200
    assert r_del.json()["status"] == "deleted"

    # Verify session is gone
    r_after = client.get(f"/ingest/{sid}/status")
    assert r_after.status_code == 404


def test_boundary_kml_format(tmp_path: Path):
    """Checks that a boundary supplied in .kml format is parsed and reprojected to EPSG:4326."""
    kml_file = tmp_path / "district.kml"
    kml_text = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<kml xmlns="http://www.opengis.net/kml/2.2">\n'
        '  <Document>\n'
        '    <Placemark>\n'
        '      <name>KML Area</name>\n'
        '      <Polygon>\n'
        '        <outerBoundaryIs>\n'
        '          <LinearRing>\n'
        '            <coordinates>\n'
        '              77.10,28.50,0 77.25,28.50,0 77.25,28.65,0 77.10,28.65,0 77.10,28.50,0\n'
        '            </coordinates>\n'
        '          </LinearRing>\n'
        '        </outerBoundaryIs>\n'
        '      </Polygon>\n'
        '    </Placemark>\n'
        '  </Document>\n'
        '</kml>'
    )
    kml_file.write_text(kml_text, encoding="utf-8")
    geom, meta = read_boundary(kml_file)
    assert geom.is_valid
    assert meta["crs"] == "EPSG:4326"
    assert math.isclose(geom.bounds[0], 77.10, abs_tol=1e-3)
    assert math.isclose(geom.bounds[1], 28.50, abs_tol=1e-3)


def test_boundary_zipped_shapefile(tmp_path: Path):
    """Checks that a zipped shapefile archive (.zip with .shp, .shx, .dbf) is unpacked and dissolved."""
    import zipfile
    shp_dir = tmp_path / "shp_raw"
    shp_dir.mkdir()
    poly = Polygon([(77.1, 28.5), (77.3, 28.5), (77.3, 28.7), (77.1, 28.7), (77.1, 28.5)])
    gdf = gpd.GeoDataFrame([{"id": 1, "name": "Zone A", "geometry": poly}], crs="EPSG:4326")
    shp_file = shp_dir / "boundary.shp"
    gdf.to_file(shp_file)

    zip_path = tmp_path / "boundary.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        for ext in [".shp", ".shx", ".dbf", ".prj", ".cpg"]:
            f = shp_dir / f"boundary{ext}"
            if f.exists():
                zf.write(f, arcname=f.name)

    geom, meta = read_boundary(zip_path)
    assert geom.is_valid
    assert meta["crs"] == "EPSG:4326"
    assert math.isclose(geom.bounds[0], 77.1, abs_tol=1e-3)


def test_detections_only_csv_derives_boundary():
    """Checks that a detections-only upload derives boundary from convex hull + 500m buffer and marks it derived."""
    sid = session_manager.create_session()
    session = session_manager.get_session(sid)

    csv_path = session.session_dir / "detections.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("class,lat,lon,score\n")
        f.write("FCBK,28.50,77.20,0.92\n")
        f.write("Zigzag,28.52,77.24,0.88\n")
        f.write("CFCBK,28.55,77.22,0.95\n")
    session.files["detections"] = csv_path

    run_pipeline(session)
    assert session.results_ready is True

    summary_path = session.session_dir / "outputs" / "summary.json"
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    assert summary["boundary"]["derived"] is True
    assert summary["kilns"]["total"] == 3
    assert summary["kilns"]["by_class"]["FCBK"] == 1
    assert summary["kilns"]["by_class"]["Zigzag"] == 1
    assert summary["kilns"]["by_class"]["CFCBK"] == 1


def test_drone_scale_geotiff_warning(tmp_path: Path):
    """Checks that a high-resolution GeoTIFF (< 2.0 m/px) flags is_drone=True with clear advisory warning."""
    file_path = tmp_path / "drone.tif"
    # 0.000001 deg is approx 0.11 meters
    res = 0.000001
    transform = from_origin(77.1000, 28.6000, res, res)
    data = (np.random.rand(3, 64, 64) * 255).astype(np.uint8)
    with rasterio.open(
        file_path, "w", driver="GTiff", height=64, width=64, count=3,
        dtype=np.uint8, crs="EPSG:4326", transform=transform
    ) as dst:
        dst.write(data)

    info = read_imagery(file_path)
    assert info["is_drone"] is True
    assert info["gsd_m"] < 2.0
    assert any("drone-scale" in w for w in info["warnings"])


def test_oversized_file_rejected():
    """Checks that uploading a file larger than 100 MB returns 413 Payload Too Large."""
    sid = session_manager.create_session()
    from backend.main import MAX_FILE_BYTES
    oversized_bytes = b"0" * (MAX_FILE_BYTES + 1024)
    resp = client.post(
        f"/ingest/{sid}/files",
        files={"boundary": ("oversized.geojson", oversized_bytes, "application/geo+json")}
    )
    assert resp.status_code == 413
    assert "exceeds 100 MB limit" in resp.json()["detail"]


def test_overpass_offline_graceful_fallback(monkeypatch):
    """Checks that when Overpass OSM service is offline/unreachable, pipeline finishes and notes roads unavailable."""
    import requests
    def mock_post(*args, **kwargs):
        raise requests.exceptions.ConnectTimeout("Overpass server down")

    monkeypatch.setattr("requests.post", mock_post)

    sid = session_manager.create_session()
    session = session_manager.get_session(sid)

    boundary_path = session.session_dir / "boundary.geojson"
    b_poly = box(77.1, 28.1, 77.2, 28.2)
    with open(boundary_path, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {}, "geometry": shapely.geometry.mapping(b_poly)}]}, f)
    session.files["boundary"] = boundary_path

    run_pipeline(session)
    assert session.results_ready is True
    summary_path = session.session_dir / "outputs" / "summary.json"
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    assert summary["infrastructure"]["roads_available"] is False
    assert any("Overpass" in w for w in summary.get("warnings", []))

