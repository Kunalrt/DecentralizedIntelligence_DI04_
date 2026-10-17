import React from 'react';
import { DATASET_CREDIT, DISTRICT_INFO } from '../config/constants';
import { ShieldCheck, Database, Award } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#14181C] border-t border-[#32383F] text-[#9CA3AF] text-xs py-6 mt-auto font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-5 border-b border-[#32383F]">
          <div>
            <div className="flex items-center gap-2 text-white font-semibold mb-1.5 font-serif text-sm">
              <ShieldCheck size={16} strokeWidth={1.5} className="text-[#86EFAC]" />
              <span>SPCB Air Quality Enforcement</span>
            </div>
            <p className="text-[#9CA3AF] leading-relaxed text-2xs m-0 font-sans">
              Operational surveillance for {DISTRICT_INFO.inspector} ({DISTRICT_INFO.name}).
              Prioritizes high-emission unconverted FCBK kilns post-2022 CPCB directive.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-white font-semibold mb-1.5 font-serif text-sm">
              <Database size={16} strokeWidth={1.5} className="text-[#93C5FD]" />
              <span>Cartographic & Optical Standards</span>
            </div>
            <p className="text-[#9CA3AF] leading-relaxed text-2xs m-0 font-sans">
              10 m/px Sentinel-2 optical input. OpenStreetMap standard tiles and blank background ONLY.
              Zero external satellite basemaps.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-white font-semibold mb-1.5 font-serif text-sm">
              <Award size={16} strokeWidth={1.5} className="text-[#FCD34D]" />
              <span>Mandatory Dataset Citation</span>
            </div>
            <p className="text-[#D1D5DB] leading-relaxed text-2xs bg-[#1F2328] p-2 rounded-[2px] border border-[#32383F] m-0">
              {DATASET_CREDIT.fullText}
            </p>
          </div>
        </div>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between text-2xs text-[#6B7280] gap-2">
          <div>
            Agni Drishti &bull; v2.0 Cartographic Edition &bull; &copy; {CURRENT_YEAR} State Pollution Control Board &bull; CC BY-NC 4.0
          </div>
          <div>
            Basemap: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">OpenStreetMap</a> contributors
          </div>
        </div>
      </div>
    </footer>
  );
};
