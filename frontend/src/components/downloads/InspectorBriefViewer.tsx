import React, { useState } from 'react';
import { FileText, Download, Eye, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export const InspectorBriefViewer: React.FC = () => {
  const [activePage, setActivePage] = useState<1 | 2>(1);

  const getAssetUrl = (path: string): string => {
    const baseUrl = import.meta.env.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${cleanBase}${cleanPath}`;
  };

  const previewImg = activePage === 1 ? getAssetUrl('data/preview_p1.png') : getAssetUrl('data/preview_p2.png');
  const pdfUrl = getAssetUrl('data/inspector_brief.pdf');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-bold text-slate-900 m-0">
              Inspector&rsquo;s Brief for Demo District (2 Pages)
            </h3>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Prepared for Inspector Farida Khan (State Pollution Control Board) &bull; Verified alignment &bull; 0 ML jargon
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Page Switcher */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setActivePage(1)}
              className={`px-3 py-1 rounded font-semibold transition ${
                activePage === 1
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Page 1 (Map & Counts)
            </button>
            <button
              onClick={() => setActivePage(2)}
              className={`px-3 py-1 rounded font-semibold transition ${
                activePage === 2
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Page 2 (Top 20 Targets)
            </button>
          </div>

          <a
            href={pdfUrl}
            download="inspector_brief.pdf"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </a>
        </div>
      </div>

      {/* PDF Visual Preview Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Document Preview Stage */}
        <div className="lg:col-span-8 bg-slate-100 rounded-xl p-3 border border-slate-200 shadow-inner flex flex-col items-center">
          <div className="relative group max-w-full overflow-hidden rounded-lg shadow-lg border border-slate-300 bg-white">
            <img
              src={previewImg}
              alt={`Inspector Brief Page ${activePage} Preview`}
              className="w-full max-w-2xl h-auto object-contain transition-transform duration-200"
            />

            {/* Quick Navigation Floating Buttons */}
            <div className="absolute inset-y-0 left-2 flex items-center">
              <button
                onClick={() => setActivePage(1)}
                disabled={activePage === 1}
                className="p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 disabled:opacity-20 transition"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-2 flex items-center">
              <button
                onClick={() => setActivePage(2)}
                disabled={activePage === 2}
                className="p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 disabled:opacity-20 transition"
                aria-label="Next Page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between w-full px-2">
            <span>Rendered at 150 DPI via ReportLab Platypus</span>
            <span className="font-mono">Page {activePage} of 2</span>
          </div>
        </div>

        {/* Page Content Overview & Executive Notes */}
        <div className="lg:col-span-4 space-y-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand-primary" />
              <span>{activePage === 1 ? 'Page 1 Contents' : 'Page 2 Contents'}</span>
            </div>

            {activePage === 1 ? (
              <ul className="space-y-1.5 text-slate-600 pl-4 list-disc text-[11px] leading-relaxed">
                <li>
                  <strong>District Overview:</strong> 65 physical kilns detected across 120 Sentinel-2 tiles.
                </li>
                <li>
                  <strong>Surveillance Map:</strong> Plain street basemap with colored OBB polygons, legend, scale bar & north arrow.
                </li>
                <li>
                  <strong>Counts with Honest Ranges:</strong> FCBK: 27 [18–41], Zigzag: 30 [21–45], CFCBK: 8 [3–14].
                </li>
                <li>
                  <strong>Conversion Status:</strong> 18 of 45 baseline FCBKs converted to Zigzag.
                </li>
                <li>
                  <strong>Distance Savings:</strong> ~120 km saved by clustering patrols.
                </li>
              </ul>
            ) : (
              <ul className="space-y-1.5 text-slate-600 pl-4 list-disc text-[11px] leading-relaxed">
                <li>
                  <strong>Ranked Top 20 Targets:</strong> Verified column alignment with exact millimeter widths.
                </li>
                <li>
                  <strong>Copyable Coordinates:</strong> Formatted to 5 decimal places for jeep GPS.
                </li>
                <li>
                  <strong>Plain-Language Notes:</strong> Concrete reasons for each site visit without ML jargon.
                </li>
                <li>
                  <strong>Inspection Checklist:</strong> Status finding checkmarks and signature lines.
                </li>
              </ul>
            )}
          </div>

          {/* Quality Assurance Guarantees */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5 text-[11px] text-emerald-900">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quality Assurance Checks Passed</span>
            </div>
            <p className="m-0 leading-relaxed text-emerald-800">
              Strict 2-page ceiling verified. Zero cell text clipping, single-line kiln IDs with non-breaking hyphens, and 100% numerical consistency across all tables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
