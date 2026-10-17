import React from 'react';
import { DATASET_CREDIT, DISTRICT_INFO } from '../config/constants';
import { ShieldCheck, Database, Award } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SPCB Air Quality Enforcement</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Surveillance package designed for {DISTRICT_INFO.inspector} ({DISTRICT_INFO.name}).
              Prioritizes high-emission unconverted FCBK kilns post the 2022 Supreme Court and CPCB mandate.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Sentinel-2 Earth Observation</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              10 m multispectral imagery. Rotated OBB detection with DOTA all-point interpolated mAP.
              No satellite imagery or commercial tiles displayed; strictly using OpenStreetMap standard tiles.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Mandatory Research Citation</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800">
              {DATASET_CREDIT.fullText}
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>
            Agni Drishti &copy; {CURRENT_YEAR} &bull; State Pollution Control Board &bull; Non-Commercial Research
          </div>
          <div>
            Basemap: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">OpenStreetMap</a> contributors
          </div>
        </div>
      </div>
    </footer>
  );
};
