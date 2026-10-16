# Regulatory Surveillance & Field Enforcement Brief
**District**: Demo District (Surveillance Zone A)  
**Surveillance Period**: 2025–26 Sentinel-2 High-Resolution Passes (10 m/px)  
**Authorized Purpose**: Compliance Monitoring under Central Pollution Control Mandates (Mandatory Zigzag Conversion)  
**Classification System**: FCBK (Non-Compliant Oval), CFCBK (Heritage Circular ~3%), Zigzag (Compliant Rectangular)

---

## 1. Executive Summary & District Overview

Satellite surveillance over **120 multispectral tiles** (153.6 sq km) identified **69 raw candidate detections**, which were deduplicated across 30 px (300 m) tile overlap boundaries to reveal **65 unique physical kilns** operating in the district.

### 2023–24 Baseline Conversion Progress:
- **Baseline 2023–24 FCBK Inventory**: 45 registered kilns
- **Successfully Converted to Zigzag**: **33 kilns** (Mandate Compliant)
- **Persistent Unconverted FCBKs**: **15 kilns** (Operating in Direct Violation of Environmental Rules)
- **Dismantled or Ceased Operations**: **10 sites**
- **High-Density Clustered Sites (within 1 km)**: **58 kilns** (Optimized for single-day patrol routing)

---

## 2. Official Kiln Inventory with Honest Uncertainty Intervals

Unlike naive detection summaries, this census mathematically adjusts raw satellite counts by held-out validation Precision and Recall to account for false alarms and missed structures.

| Kiln Class | Raw Satellite Detections | Validation Precision | Validation Recall | Estimated True Kiln Count | Honest 95% Confidence Interval | Compliance Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **FCBK** (Oval) | 27 | 0.885 | 0.850 | **28** | **[18, 41]** | **ILLEGAL OPERATION** |
| **Zigzag** (Rectangular) | 30 | 0.650 | 0.620 | **31** | **[20, 45]** | Mandate Compliant |
| **CFCBK** (Circular) | 8 | 0.900 | 0.950 | **8** | **[3, 13]** | Heritage / Special Review |

*Note on Uncertainty: Intervals reflect 1,000 bootstrap simulations incorporating spatial boundary variance and detector confidence envelopes.*

---

## 3. Priority Action Plan: Top 20 Kilns to Visit First

Ranked using transparent scoring: Base Violation (FCBK = +40), Cluster Efficiency (within 1 km = +20), Satellite Confidence (>0.70 = +20), and Verification Urgency.

| Priority | Kiln Identifier | Detected Type | Confidence | Latitude (°N) | Longitude (°E) | 1 km Cluster? | Actionable Directive for Inspector |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **#1** | `KILN-DEMO-025` | **FCBK** | 95.5% | 28.56011 | 77.18279 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.96); Clustered within 1 km of 1 neighboring kiln(s) - high routing efficiency |
| **#2** | `KILN-DEMO-053` | **FCBK** | 95.4% | 28.61186 | 77.19911 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.95); Clustered within 1 km of 4 neighboring kiln(s) - high routing efficiency |
| **#3** | `KILN-DEMO-022` | **FCBK** | 93.8% | 28.62286 | 77.17165 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.94); Clustered within 1 km of 2 neighboring kiln(s) - high routing efficiency |
| **#4** | `KILN-DEMO-056` | **FCBK** | 91.0% | 28.60109 | 77.11858 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.91); Clustered within 1 km of 3 neighboring kiln(s) - high routing efficiency |
| **#5** | `KILN-DEMO-052` | **FCBK** | 87.5% | 28.60813 | 77.18738 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.87); Clustered within 1 km of 3 neighboring kiln(s) - high routing efficiency |
| **#6** | `KILN-DEMO-030` | **FCBK** | 90.1% | 28.61137 | 77.13226 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.90); Clustered within 1 km of 4 neighboring kiln(s) - high routing efficiency |
| **#7** | `KILN-DEMO-048` | **FCBK** | 90.1% | 28.61167 | 77.14496 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.90); Clustered within 1 km of 3 neighboring kiln(s) - high routing efficiency |
| **#8** | `KILN-DEMO-032` | **FCBK** | 93.1% | 28.62078 | 77.15950 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.93); Clustered within 1 km of 5 neighboring kiln(s) - high routing efficiency |
| **#9** | `KILN-DEMO-028` | **FCBK** | 86.7% | 28.63773 | 77.12474 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.87); Clustered within 1 km of 2 neighboring kiln(s) - high routing efficiency |
| **#10** | `KILN-DEMO-047` | **FCBK** | 84.7% | 28.61114 | 77.13983 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.85); Clustered within 1 km of 6 neighboring kiln(s) - high routing efficiency |
| **#11** | `KILN-DEMO-042` | **FCBK** | 84.0% | 28.61673 | 77.19852 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.84); Clustered within 1 km of 4 neighboring kiln(s) - high routing efficiency |
| **#12** | `KILN-DEMO-057` | **FCBK** | 80.5% | 28.60287 | 77.12362 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.81); Clustered within 1 km of 4 neighboring kiln(s) - high routing efficiency |
| **#13** | `KILN-DEMO-027` | **FCBK** | 81.4% | 28.59298 | 77.19744 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.81); Clustered within 1 km of 1 neighboring kiln(s) - high routing efficiency |
| **#14** | `KILN-DEMO-023` | **FCBK** | 85.4% | 28.61803 | 77.15719 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.85); Clustered within 1 km of 5 neighboring kiln(s) - high routing efficiency |
| **#15** | `KILN-DEMO-045` | **FCBK** | 76.0% | 28.60901 | 77.11757 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.76); Clustered within 1 km of 3 neighboring kiln(s) - high routing efficiency |
| **#16** | `KILN-DEMO-039` | **FCBK** | 78.8% | 28.62041 | 77.16564 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.79); Clustered within 1 km of 4 neighboring kiln(s) - high routing efficiency |
| **#17** | `KILN-DEMO-021` | **FCBK** | 79.5% | 28.64266 | 77.19630 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.80); Clustered within 1 km of 4 neighboring kiln(s) - high routing efficiency |
| **#18** | `KILN-DEMO-026` | **FCBK** | 76.6% | 28.56293 | 77.19481 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.77); Clustered within 1 km of 1 neighboring kiln(s) - high routing efficiency |
| **#19** | `KILN-DEMO-020` | **FCBK** | 71.8% | 28.63486 | 77.15489 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.72); Clustered within 1 km of 1 neighboring kiln(s) - high routing efficiency |
| **#20** | `KILN-DEMO-059` | **FCBK** | 70.5% | 28.59700 | 77.14710 | YES | Non-compliant FCBK design operating under post-2022 ban; High-confidence satellite identification (0.71); Clustered within 1 km of 1 neighboring kiln(s) - high routing efficiency |

---

## 4. Instructions & Protocols for Field Officers

1. **Prioritize Red Callouts First**: Target ranked priority sites #1 through #10 immediately. All are persistent unconverted FCBKs operating with high emission factors.
2. **Cluster Patrol Strategy**: Kilns flagged with `YES` under 1 km Cluster should be audited sequentially in a single vehicle dispatch to minimize transit delays.
3. **Ambiguity Resolution**: For sites with confidence between 30% and 60%, inspect the draft trench arrangement on the ground. Verify whether forced-draft fans or internal zigzag baffles have been installed inside older oval trench outer walls.
4. **Data Integrity Note**: Model inference was conducted strictly on Sentinel-2 RGB satellite bands without external commercial basemaps. All geographic coordinates conform to WGS-84 datum.
