"""Export utilities for Agni Drishti ingestion results.

Provides:
- KML exporter for boundary and kiln oriented bounding boxes
- GPX exporter with waypoints for GPS receivers
- One-page PDF site report using ReportLab Platypus with aligned tables
"""

from pathlib import Path
from typing import Dict, List, Any
import json
import shapely
from shapely.geometry import shape

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Table,
    TableStyle,
    Image,
    Spacer,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


def generate_kml(boundary_fc: Dict[str, Any], kilns_fc: Dict[str, Any]) -> str:
    """Generate OGC KML 2.2 XML string for boundary and detected kilns."""
    kml_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<kml xmlns="http://www.opengis.net/kml/2.2">',
        '  <Document>',
        '    <name>Agni Drishti - Area Survey Export</name>',
        '    <Style id="fcbkStyle"><PolyStyle><color>7f0a71e8</color></PolyStyle><LineStyle><color>ff0a71e8</color><width>2</width></LineStyle></Style>',
        '    <Style id="zigzagStyle"><PolyStyle><color>7fe8731a</color></PolyStyle><LineStyle><color>ffe8731a</color><width>2</width></LineStyle></Style>',
        '    <Style id="cfcbkStyle"><PolyStyle><color>7f388018</color></PolyStyle><LineStyle><color>ff388018</color><width>2</width></LineStyle></Style>',
        '    <Style id="boundaryStyle"><PolyStyle><fill>0</fill></PolyStyle><LineStyle><color>ff28231f</color><width>3</width></LineStyle></Style>',
    ]

    # Add boundary
    for feat in boundary_fc.get("features", []):
        geom = feat.get("geometry", {})
        if geom.get("type") == "Polygon":
            coords_str = " ".join(f"{c[0]},{c[1]},0" for c in geom.get("coordinates", [[]])[0])
            kml_parts.extend([
                '    <Placemark>',
                '      <name>Survey Boundary</name>',
                '      <styleUrl>#boundaryStyle</styleUrl>',
                '      <Polygon><outerBoundaryIs><LinearRing><coordinates>',
                f'        {coords_str}',
                '      </coordinates></LinearRing></outerBoundaryIs></Polygon>',
                '    </Placemark>',
            ])

    # Add kilns
    style_map = {"FCBK": "#fcbkStyle", "Zigzag": "#zigzagStyle", "CFCBK": "#cfcbkStyle"}
    for feat in kilns_fc.get("features", []):
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        cls = props.get("class", "FCBK")
        k_id = props.get("kiln_id", "KILN")
        score = props.get("score", 0.0)
        style = style_map.get(cls, "#fcbkStyle")

        if geom.get("type") == "Polygon":
            coords_str = " ".join(f"{c[0]},{c[1]},0" for c in geom.get("coordinates", [[]])[0])
            kml_parts.extend([
                '    <Placemark>',
                f'      <name>{k_id} ({cls})</name>',
                f'      <description>Class: {cls}&#10;Score: {score}&#10;Near 1km: {props.get("near_1km")}</description>',
                f'      <styleUrl>{style}</styleUrl>',
                '      <Polygon><outerBoundaryIs><LinearRing><coordinates>',
                f'        {coords_str}',
                '      </coordinates></LinearRing></outerBoundaryIs></Polygon>',
                '    </Placemark>',
            ])

    kml_parts.extend([
        '  </Document>',
        '</kml>',
    ])
    return "\n".join(kml_parts)


def generate_gpx(kilns_fc: Dict[str, Any]) -> str:
    """Generate GPX 1.1 with waypoints for detected kilns."""
    gpx_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<gpx version="1.1" creator="Agni Drishti - State Pollution Control Board"',
        '  xmlns="http://www.topografix.com/GPX/1/1">',
        '  <metadata>',
        '    <name>Agni Drishti Ingestion Waypoints</name>',
        '    <desc>Target brick kiln locations</desc>',
        '  </metadata>',
    ]

    for feat in kilns_fc.get("features", []):
        props = feat.get("properties", {})
        lat = props.get("lat")
        lon = props.get("lon")
        if lat is not None and lon is not None:
            k_id = props.get("kiln_id", "KILN")
            cls = props.get("class", "FCBK")
            conf = props.get("score", 0.0)
            desc = f"Class: {cls} | Confidence: {conf:.2f} | Cluster: {props.get('cluster_id')}"
            gpx_parts.append(
                f'  <wpt lat="{lat:.6f}" lon="{lon:.6f}">\n'
                f'    <name>{k_id}_{cls}</name>\n'
                f'    <desc>{desc}</desc>\n'
                f'    <type>{cls}</type>\n'
                f'  </wpt>'
            )

    gpx_parts.append('</gpx>')
    return "\n".join(gpx_parts)


def generate_pdf_report(session_dir: Path, summary: Dict[str, Any], out_pdf_path: Path):
    """Generate a clean, strictly 1-page A4 regulatory site report using ReportLab Platypus."""
    doc = SimpleDocTemplate(
        str(out_pdf_path),
        pagesize=A4,
        leftMargin=14 * 2.83465,
        rightMargin=14 * 2.83465,
        topMargin=12 * 2.83465,
        bottomMargin=12 * 2.83465,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#1F2328"),
        spaceAfter=2,
    )
    sub_style = ParagraphStyle(
        "DocSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#656D76"),
        spaceAfter=8,
    )
    cell_hdr = ParagraphStyle("CellHdr", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.HexColor("#1F2328"))
    cell_body = ParagraphStyle("CellTxt", fontName="Helvetica", fontSize=7.5, leading=9, textColor=colors.HexColor("#334155"))
    cell_num = ParagraphStyle("CellNum", fontName="Courier-Bold", fontSize=8, leading=9, alignment=TA_RIGHT, textColor=colors.HexColor("#1F2328"))

    story = []

    # Title & Subtitle
    story.append(Paragraph("AGNI DRISHTI — AREA SURVEILLANCE REPORT", title_style))
    story.append(Paragraph("State Pollution Control Board &bull; Environmental Enforcement & Compliance Division", sub_style))

    # Metric Strip Table (4 columns)
    b_info = summary.get("boundary", {})
    k_info = summary.get("kilns", {})
    i_info = summary.get("infrastructure", {})

    area_km2 = b_info.get("area_km2", 0)
    total_kilns = k_info.get("total", 0)
    density = k_info.get("density_per_km2", 0)
    fcbk_count = k_info.get("by_class", {}).get("FCBK", 0)
    zigzag_count = k_info.get("by_class", {}).get("Zigzag", 0)
    cfcbk_count = k_info.get("by_class", {}).get("CFCBK", 0)
    road_km = i_info.get("total_road_km", 0)

    metric_data = [
        [
            Paragraph("<b>SURVEY AREA</b>", cell_hdr),
            Paragraph("<b>TOTAL KILNS</b>", cell_hdr),
            Paragraph("<b>FCBK VIOLATIONS</b>", cell_hdr),
            Paragraph("<b>ROADS CLIPPED</b>", cell_hdr),
        ],
        [
            Paragraph(f"<b>{area_km2} km²</b>", cell_num),
            Paragraph(f"<b>{total_kilns}</b>", cell_num),
            Paragraph(f"<b>{fcbk_count}</b>", cell_num),
            Paragraph(f"<b>{road_km} km</b>", cell_num),
        ],
    ]
    t_metrics = Table(metric_data, colWidths=[130, 130, 130, 130])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FAF9F5")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#D9D6CE")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D9D6CE")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_metrics)
    story.append(Spacer(1, 8))

    # Preview Map Image if available
    preview_path = session_dir / "outputs" / "preview.png"
    if preview_path.exists():
        # Scale to fit width (~520 pt, height ~200 pt)
        img = Image(str(preview_path), width=520, height=195)
        story.append(img)
        story.append(Spacer(1, 8))

    # Inventory Breakdown Table
    inv_data = [
        [Paragraph("<b>Kiln Classification</b>", cell_hdr), Paragraph("<b>Detections</b>", cell_hdr), Paragraph("<b>Legal Status</b>", cell_hdr), Paragraph("<b>Field Directive</b>", cell_hdr)],
        [Paragraph("FCBK (Oval Trench)", cell_body), Paragraph(str(fcbk_count), cell_num), Paragraph("Prohibited (2022 Mandate)", cell_body), Paragraph("Priority vehicle patrol; issue Section 19 notice.", cell_body)],
        [Paragraph("Zigzag (Rectangular)", cell_body), Paragraph(str(zigzag_count), cell_num), Paragraph("Compliant Design", cell_body), Paragraph("Routine annual verification.", cell_body)],
        [Paragraph("CFCBK (Circular Heritage)", cell_body), Paragraph(str(cfcbk_count), cell_num), Paragraph("Special Review (~3%)", cell_body), Paragraph("Inspect historical emission permits.", cell_body)],
    ]
    t_inv = Table(inv_data, colWidths=[140, 65, 135, 180])
    t_inv.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#FAF9F5")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#D9D6CE")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_inv)
    story.append(Spacer(1, 8))

    # Notes & Caveats
    notes = [
        f"&bull; <b>Spatial Clustering:</b> {k_info.get('flagged_within_1km', 0)} of {total_kilns} kilns fall within 1.0 km of another kiln ({k_info.get('clusters_count', 0)} patrol clusters).",
        f"&bull; <b>Coordinate Reference System:</b> {b_info.get('utm_zone', 'EPSG:4326')} &bull; Centroid: {b_info.get('centroid', ['-'])[0]}°E, {b_info.get('centroid', ['-'])[1]}°N.",
        "&bull; <b>Scientific Citation:</b> Model trained on SentinelKilnDB by Mondal et al., Sustainability Lab, IIT Gandhinagar (NeurIPS 2025 Datasets & Benchmarks), CC BY-NC.",
        "&bull; <b>Legal Disclaimer:</b> Satellite detections provide screening intelligence; on-ground inspection is required before enforcement sanctions.",
    ]
    for n in notes:
        story.append(Paragraph(n, cell_body))
        story.append(Spacer(1, 2))

    doc.build(story)
