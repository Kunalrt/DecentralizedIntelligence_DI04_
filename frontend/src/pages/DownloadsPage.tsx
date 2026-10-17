import React from 'react';
import { DownloadPackageCards } from '../components/downloads/DownloadPackageCards';
import { InspectorBriefViewer } from '../components/downloads/InspectorBriefViewer';
import { TileInferenceDemo } from '../components/downloads/TileInferenceDemo';
import { SectionHeader, Badge } from '../design';

export const DownloadsPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Page Header */}
      <SectionHeader
        title="Downloads & Inspector Farida Khan&rsquo;s Brief"
        subtitle="Geospatial vector layers, tabular priority rosters, and the official 2-page brief for Demo District."
        badge={
          <div className="flex items-center gap-1.5">
            <Badge variant="accent">10 Verified Packages</Badge>
          </div>
        }
      />

      {/* 1. Official 2-Page Inspector's Brief Document Viewer */}
      <InspectorBriefViewer />

      {/* 2. Complete Set of Download Packages */}
      <DownloadPackageCards />

      {/* 3. Interactive Tile Inference Demo */}
      <TileInferenceDemo />
    </div>
  );
};
