import React, { useState } from 'react';
import { FileText, Download, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';


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
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] shadow-xs overflow-hidden space-y-3 p-4">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9D6CE] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
              <FileText size={15} strokeWidth={1.5} />
            </span>
            <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
              Inspector&rsquo;s Brief for Demo District (2 Pages)
            </h3>
          </div>
          <p className="text-2xs text-[#656D76] font-mono m-0 mt-0.5">
            Prepared for Inspector Farida Khan (SPCB) &bull; Verified alignment &bull; 0 ML jargon
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-2xs">
          {/* Page Switcher */}
          <div className="inline-flex items-center p-0.5 bg-[#FAF9F5] rounded-[2px] border border-[#D9D6CE]">
            <button
              type="button"
              onClick={() => setActivePage(1)}
              className={`px-2.5 py-0.5 rounded-[2px] font-medium transition-colors ${
                activePage === 1
                  ? 'bg-[#1F4E5F] text-white shadow-xs'
                  : 'text-[#656D76] hover:text-[#1F2328]'
              }`}
            >
              Page 1 (Map & Counts)
            </button>
            <button
              type="button"
              onClick={() => setActivePage(2)}
              className={`px-2.5 py-0.5 rounded-[2px] font-medium transition-colors ${
                activePage === 2
                  ? 'bg-[#1F4E5F] text-white shadow-xs'
                  : 'text-[#656D76] hover:text-[#1F2328]'
              }`}
            >
              Page 2 (Top 20 Targets)
            </button>
          </div>

          <a
            href={pdfUrl}
            download="inspector_brief.pdf"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1F4E5F] hover:bg-[#163B48] text-white rounded-[2px] text-xs font-mono font-medium transition-colors shadow-xs"
          >
            <Download size={12} strokeWidth={1.5} />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* Image Preview Canvas */}
      <div className="relative bg-[#FAF9F5] rounded-[4px] border border-[#D9D6CE] p-3 flex justify-center items-center min-h-[480px]">
        <img
          src={previewImg}
          alt={`Inspector's Brief Page ${activePage}`}
          className="max-h-[640px] w-auto object-contain rounded-[2px] shadow-sm border border-[#D9D6CE]"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Page Nav floating buttons */}
        <div className="absolute inset-y-0 left-2 flex items-center">
          <button
            type="button"
            onClick={() => setActivePage(1)}
            disabled={activePage === 1}
            className="p-1.5 rounded-[2px] bg-white/95 border border-[#D9D6CE] text-[#1F2328] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
            title="Previous Page"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="absolute inset-y-0 right-2 flex items-center">
          <button
            type="button"
            onClick={() => setActivePage(2)}
            disabled={activePage === 2}
            className="p-1.5 rounded-[2px] bg-white/95 border border-[#D9D6CE] text-[#1F2328] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
            title="Next Page"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Footer Meta Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-2xs font-mono text-[#656D76] pt-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={13} strokeWidth={1.5} className="text-[#16A34A]" />
          <span>Aligned to 2-page print layout: Page 1 Map & Table, Page 2 Ranked Roster</span>
        </div>
        <div>SentinelKilnDB &bull; CC BY-NC 4.0 Non-Commercial</div>
      </div>
    </div>
  );
};
