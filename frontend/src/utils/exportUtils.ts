/**
 * Data export utilities for Agni Drishti
 * - CSV export
 * - GPX export for handheld GPS devices / phone apps
 */

import type { Top20Row } from '../types/data';

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTop20ToCsv(rows: Top20Row[]) {
  const headers = [
    'rank',
    'kiln_id',
    'class',
    'lat',
    'lon',
    'confidence',
    'priority_score',
    'clustered_within_1km',
    'why_visit',
  ];

  const csvRows = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.rank,
        r.kiln_id,
        r.class,
        Number(r.lat).toFixed(5),
        Number(r.lon).toFixed(5),
        Number(r.confidence).toFixed(4),
        r.priority_score,
        `"${r.clustered_within_1km}"`,
        `"${(r.why_visit || '').replace(/"/g, '""')}"`,
      ].join(',')
    ),
  ];

  downloadFile(csvRows.join('\n'), 'AgniDrishti_Top20_Priority_FieldList.csv', 'text/csv;charset=utf-8;');
}

export function exportTop20ToGpx(rows: Top20Row[]) {
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Agni Drishti - State Pollution Control Board"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>Agni Drishti - Top 20 Priority Inspection Targets</name>
    <desc>Priority brick kiln enforcement patrol route for Inspector Farida Khan</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>`;

  const waypoints = rows
    .map((r) => {
      const name = `${r.rank.toString().padStart(2, '0')}_${r.kiln_id}_${r.class}`;
      const desc = `Priority ${r.priority_score} | Conf: ${(Number(r.confidence) * 100).toFixed(0)}% | ${r.why_visit}`;
      return `  <wpt lat="${Number(r.lat).toFixed(6)}" lon="${Number(r.lon).toFixed(6)}">
    <name>${name}</name>
    <desc>${desc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</desc>
    <sym>Industrial</sym>
    <type>${r.class}</type>
  </wpt>`;
    })
    .join('\n');

  const gpxFooter = '\n</gpx>';
  const fullGpx = `${gpxHeader}\n${waypoints}${gpxFooter}`;

  downloadFile(fullGpx, 'AgniDrishti_Top20_Waypoints.gpx', 'application/gpx+xml;charset=utf-8;');
}
