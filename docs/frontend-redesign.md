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

## 2. Text Count Audit: Before vs. After (Target)

The baseline word count was measured across all `.tsx` pages and components using `scripts/audit_text_counts.py`. Paragraph-heavy descriptions are systematically replaced with:
1. **Icon + Big Mono Number + 1–3 Word Label** (Metric Stat Tiles)
2. **Symbol Legends** for instant visual pattern recognition
3. **Info Popovers (`InfoTooltip`)** for honest caveats and limits
4. **Collapsible Accordions (`DetailsCollapse`)** for extended methodology notes

| Page / Component | Baseline Word Count | Redesigned Visible Word Count | Delta (%) | Restyling Strategy |
| :--- | :---: | :---: | :---: | :--- |
| **OverviewPage** & components | 260 | 95 | **-63.5%** | Replaced explanatory text with 4-card metric strip, direct whiskers chart, compact precision/recall table, and collapsible caveats. |
| **MapPage** & drawer/filters | 196 | 82 | **-58.2%** | Dense symbol legend, compact filter pills, drawer with mono coordinates and 1-click clipboard actions. |
| **FieldListPage** & Top 20 table | 253 | 110 | **-56.5%** | Monospace table with fixed column widths, badge chips for status, routing summary tiles. |
| **MethodPage** & architecture | 476 | 165 (visible) | **-65.3%** | Replaced essay paragraphs with 6-stage diagram, compact benchmark table, and technical limits inside `<DetailsCollapse>`. |
| **DownloadsPage** & brief viewer | 488 | 140 | **-71.3%** | Replaced marketing copy with direct 10-package download grid, file metadata chips, and 2-page brief switcher. |
| **MapAreaPage** (New Ingestion) | 0 | 75 | **+75** (New) | 3-step icon workflow (Upload, Process, Explore), 3 dropzones, status chips. |
| **StyleguidePage** (New Route) | 0 | 120 | **+120** (New) | Interactive token showcase, color palette swatches, component library. |
| **Header & Footer** | 38 | 32 | **-15.8%** | Crisp survey brand, mono metric badges, mandatory CC BY-NC citation. |
| **TOTAL VISIBLE WORDS** | **1,690** | **~819** | **-51.5%** | **Over 50% reduction in visible clutter** |

---

## 3. Style Guide Route (`/styleguide`)

Accessible at `/#styleguide`, the style guide renders:
- **Color Tokens**: Swatches for canvas `#F5F3EE`, white panels `#FFFFFF`, charcoal `#1F2328`, accent `#1F4E5F`, border `#D9D6CE`, and dark map `#14181C`.
- **Target Symbology**: FCBK circle `#E8710A`, Zigzag square `#1A73E8`, CFCBK triangle `#188038`, dashed boundary, road classes, waterways.
- **Typography Matrix**: Scale from 12px to 28px in IBM Plex Sans, IBM Plex Mono, and Source Serif 4.
- **Core Design Components**: `StatTile`, `Panel`, `SectionHeader`, `InfoTooltip`, `DetailsCollapse`, `Button`, `Badge`, and `SymbolLegend`.
