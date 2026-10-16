import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  ClipboardList,
  GraduationCap,
  Download,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { useData } from '../context/DataContext';

export type TabKey = 'overview' | 'map' | 'field' | 'method' | 'downloads';

interface HeaderProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const { data } = useData();

  const totalKilns = data?.kilns.features.length ?? 65;
  const fcbkViolations = data?.counts.find((c) => c.class === 'FCBK')?.detected ?? 27;

  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'map', label: 'Interactive Map', icon: <MapPin className="w-4 h-4" /> },
    { key: 'field', label: 'Field List & Top 20', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'method', label: 'Method & Uncertainty', icon: <GraduationCap className="w-4 h-4" /> },
    { key: 'downloads', label: 'Downloads', icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      {/* Top Banner: District & Officer Meta */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white m-0">
                Chimney Census: Demo District
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Zone A Active
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0">
              State Pollution Control Board &bull; Inspector Farida Khan Patrol Dispatch
            </p>
          </div>
        </div>

        {/* Quick KPI pills */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Active Kilns: <strong>{totalKilns}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-orange-950/60 border border-orange-800/60 text-orange-300">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
            <span>FCBK Violations: <strong>{fcbkViolations}</strong></span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelectTab(item.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
