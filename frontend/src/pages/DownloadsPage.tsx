import React from 'react';
import { DownloadPackageCards } from '../components/downloads/DownloadPackageCards';
import { InspectorBriefViewer } from '../components/downloads/InspectorBriefViewer';
import { TileInferenceDemo } from '../components/downloads/TileInferenceDemo';
import { Download, ShieldCheck, Sparkles } from 'lucide-react';

export const DownloadsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 m-0">
              Downloads & Inspector Farida Khan&rsquo;s Brief
            </h2>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-1">
            Download verified geospatial vector layers, tabular inspection priority rosters, and the official 2-page brief
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            10 Verified Packages
          </span>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Live Demo Active
          </span>
        </div>
      </div>

      {/* 1. Official 2-Page Inspector's Brief Document Viewer */}
      <InspectorBriefViewer />

      {/* 2. Complete Set of Download Packages */}
      <DownloadPackageCards />

      {/* 3. Interactive Tile Inference Demo (Client-Side & FastAPI Backend) */}
      <TileInferenceDemo />
    </div>
  );
};
