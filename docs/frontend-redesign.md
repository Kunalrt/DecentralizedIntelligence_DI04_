# Frontend Redesign & Design System Specification

## Overview

Agni Drishti's user interface is styled according to a **Cartographic Survey-Office** design language: calm, precise, and information-dense, tailored for State Pollution Control Board environmental enforcement officers (e.g., Inspector Farida Khan).

---

## 1. Design System Tokens (`frontend/src/design/`)

### Color Palette
- **Canvas Background**: `#F5F3EE` (Warm off-white, replacing bright white or cool blue slates)
- **Panels & Cards**: `#FFFFFF` (Solid white with crisp 1 px borders)
- **Primary Text**: `#1F2328` (High-contrast charcoal, avoiding pure black)
- **Secondary / Neutral Text**: `#656D76` (Muted grey for labels and captions)
- **Borders & Dividers**: `#D9D6CE` (1 px solid muted rules)
- **Deep Survey Accent**: `#1F4E5F` (Deep teal for primary actions and active navigation)
- **Dark Map Panel**: `#14181C` (For map canvas contrast)

### Target Kiln Symbology
- **FCBK**: `#E8710A` — Circle (`●`), Banned traditional oval footprint
- **Zigzag**: `#1A73E8` — Square (`■`), Mandate-compliant rectangular draft
- **CFCBK**: `#188038` — Triangle (`▲`), Heritage circular kiln (~3% prevalence)
- **Boundary**: Dark ink line `#1F2328`, 2 px, dashed
- **Road Classes**: Slate grey `#475569`, `#94A3B8`
- **Waterways**: Muted blue `#6BA4B8`

### Typography
- **UI & Controls**: `IBM Plex Sans` (12 / 14 / 16 / 20 px)
- **Numeric & GIS Data**: `IBM Plex Mono` (Coordinates, counts, scores, dates)
- **Section Headings**: `Source Serif 4` (28 px bold, regulatory briefing look)

### Geometry & Constraints
- **Corner Radius**: Maximum `4px` (`rounded-[4px]` or `rounded-[2px]`). No pills or 2xl rounded cards.
- **Borders**: Exactly `1px solid #D9D6CE`.
- **Shadows**: Minimal `shadow-xs` or `shadow-map` on floating map controls only.
- **Negative Constraints**: Zero purple/pink gradients, zero glassmorphism (`backdrop-blur`), zero neon glow, zero emojis, zero "AI-powered" or "magic" marketing buzzwords.
- **Icons**: `lucide-react` only with consistent `strokeWidth={1.5}` and sizes (16 / 20 / 24).
- **Motion**: 150 ms ease for hover and state transitions only.

---

## 2. Text Count Audit: Before vs. After (Verified Final)

The baseline word count was measured across all `.tsx` pages and components using `scripts/audit_text_counts.py`. Paragraph-heavy descriptions were systematically replaced with:
1. **Icon + Big Mono Number + 1–3 Word Label** (Metric Stat Tiles)
2. **Symbol Legends** for instant visual pattern recognition
3. **Info Popovers (`InfoTooltip`)** for honest caveats and limits
4. **Collapsible Accordions (`DetailsCollapse`)** for deep methodology notes

| Page / Route | Baseline Word Count | Final Visible Words | Reduction (%) | Restyling Strategy |
| :--- | :---: | :---: | :---: | :--- |
| **Overview** (`/`) | 220 words | 72 words | **-67.3%** | Replaced explanatory text with 4-card metric strip, direct whiskers chart, compact precision/recall table, and collapsible caveats. |
| **Survey Map** (`/map`) | 115 words | 42 words | **-63.5%** | Dense symbol legend, compact filter pills, drawer with mono coordinates and 1-click clipboard actions. |
| **Field Verification** (`/field`) | 95 words | 20 words | **-78.9%** | Monospace table with fixed column widths, badge chips for status, routing summary tiles. |
| **Methodology** (`/method`) | 180 words | 71 words | **-60.6%** | Replaced essay paragraphs with 6-stage diagram, compact benchmark table, and technical limits inside `<DetailsCollapse>`. |
| **Downloads & Inference** (`/downloads`) | 80 words | 23 words | **-71.3%** | Replaced marketing copy with direct 10-package download grid, file metadata chips, and 2-page brief switcher. |
| **Area Ingestion** (`/map-area`) | 0 (New) | 167 words | **N/A (New feature)** | 3-step icon workflow (Upload, Process, Explore), 3 dropzones, status chips. |
| **Styleguide** (`/styleguide`) | 0 (New) | 333 words | **N/A (New route)** | Interactive token showcase, color palette swatches, component library. |

**Component-Level Visible Text Reduction**:
- `CountsComparisonChart`: 85 -> 36 words (-57.6%)
- `PrecisionRecallTable`: 210 -> 90 words (-57.1%)
- `UncertaintyPanel`: 245 -> 98 words (-60.0%)
- `ArchitecturePipeline`: 320 -> 140 words (-56.3%)
- `HonestLimitations`: 450 -> 205 words (-54.4%, preserved honest limits inside collapsible accordions)

---

## 3. Style Guide Route (`/styleguide`)

Accessible at `/#/styleguide`, the style guide renders:
- **Color Tokens**: Swatches for canvas `#F5F3EE`, white panels `#FFFFFF`, charcoal `#1F2328`, accent `#1F4E5F`, border `#D9D6CE`, and dark map `#14181C`.
- **Target Symbology**: FCBK circle `#E8710A`, Zigzag square `#1A73E8`, CFCBK triangle `#188038`, dashed boundary, road classes, waterways.
- **Typography Matrix**: Scale from 12px to 28px in IBM Plex Sans, IBM Plex Mono, and Source Serif 4.
- **Core Design Components**: `StatTile`, `Panel`, `SectionHeader`, `InfoTooltip`, `DetailsCollapse`, `Button`, `Badge`, and `SymbolLegend`.

---

## 4. Phase 6 Verification & Test Audit

### Backend Test Suite (`pytest tests/test_ingestion.py`): 13/13 Passed
1. `test_geotiff_pixel_to_latlon_exact`: Affine transform conversion matches exact ground truth coordinates.
2. `test_boundary_reprojection_projected_crs`: UTM Zone 43N projected polygon reprojected to EPSG:4326.
3. `test_geotiff_missing_crs_rejected`: Raster without CRS returns clear rejection message.
4. `test_bad_files_return_4xx`: Invalid boundary extensions (.exe) rejected with 400.
5. `test_overlap_deduplication`: Overlapping candidates within 15 m / IoU >= 0.50 merged, retaining highest confidence.
6. `test_no_nan_in_outputs`: Strict `allow_nan=False` verification across all GeoJSON and summary outputs.
7. `test_full_session_api_lifecycle`: Session creation, upload, run, status polling, result retrieval, KML/GPX/PDF exports, and data clearance.
8. `test_boundary_kml_format`: KML boundary correctly parsed and dissolved.
9. `test_boundary_zipped_shapefile`: Zipped shapefile archive (.shp, .shx, .dbf) extracted and processed.
10. `test_detections_only_csv_derives_boundary`: Detections CSV derives boundary from convex hull + 500m buffer and marks `derived: True`.
11. `test_drone_scale_geotiff_warning`: High-resolution imagery (< 2 m/px) flags `is_drone=True` with advisory warning and halts model inference.
12. `test_oversized_file_rejected`: Upload > 100 MB returns 413 Payload Too Large.
13. `test_overpass_offline_graceful_fallback`: Overpass network failure gracefully sets `roads_available=False` without halting the pipeline.

### Frontend Test Suite (`npx vitest run`): 11/11 Passed
1. `StepBar renders all 3 steps and respects canExplore flag`
2. `DropzoneCard renders chips when valid and displays error when present`
3. `ProcessProgress displays progress bar, 6 steps, and warnings as chips`
4. `ExploreResultView stat strip displays real summary metrics`
5. `ExploreResultView allows toggling layers and switching views`
6. `ExploreResultView allows comparing imagery via Before/After slider control`
7. `ExploreResultView handles Clear Data action`
8. `fetchJSON catches bare NaN, repairs it, and flags data as repaired`
9. `App renders with repaired warning banner when loader repairs NaN in fixture`
10. `standard JSON.parse fails on bare NaN`
11. `sanitizeBareNaNs replaces bare NaN with null while preserving string tokens`

### Documentation Screenshots Inventory (`frontend/docs/shots/`)
- `overview.png`: Overview dashboard with survey-office stat tiles and comparison charts.
- `map.png`: Survey map with distinct geometric kiln symbols and inspector drawer.
- `map-area-upload.png`: Area ingestion dropzones for Boundary, Imagery, and Detections.
- `map-area-process.png`: Real-time 6-stage ingestion progress pipeline.
- `map-area-explore.png`: Geo-Studio result view with layer panel, stat strip, and coordinate readouts.
- `field.png`: Field enforcement priority table and routing details.
- `method.png`: Model architecture and technical limitations.
- `downloads.png`: Geospatial packages and live tile demo.
- `styleguide.png`: Design tokens, typography matrix, and survey UI components.

