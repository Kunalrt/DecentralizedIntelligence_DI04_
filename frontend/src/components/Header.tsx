import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  ClipboardList,
  GraduationCap,
  Download,
  ShieldAlert,
  Flame,
  Compass,
  Palette,
} from 'lucide-react';
import { useData } from '../context/DataContext';

export type TabKey =
  | 'overview'
  | 'map'
  | 'field'
  | 'map-area'
  | 'method'
  | 'downloads'
  | 'styleguide';

interface HeaderProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const { data } = useData();

  const totalKilns = data?.kilns.features.length ?? 65;
  const fcbkViolations = data?.counts.find((c) => c.class === 'FCBK')?.detected ?? 27;

  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} strokeWidth={1.5} /> },
    { key: 'map', label: 'Surveillance Map', icon: <MapPin size={16} strokeWidth={1.5} /> },
    { key: 'field', label: 'Field List', icon: <ClipboardList size={16} strokeWidth={1.5} /> },
    { key: 'map-area', label: 'Map Your Area', icon: <Compass size={16} strokeWidth={1.5} /> },
    { key: 'method', label: 'Method & Limits', icon: <GraduationCap size={16} strokeWidth={1.5} /> },
    { key: 'downloads', label: 'Downloads', icon: <Download size={16} strokeWidth={1.5} /> },
    { key: 'styleguide', label: 'Style Guide', icon: <Palette size={16} strokeWidth={1.5} /> },
  ];

  return (
    <header className="bg-[#1F2328] text-white border-b border-[#32383F] sticky top-0 z-50">
      {/* Top Banner: District & Officer Meta */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] bg-[#1F4E5F] border border-[#2E687D] flex items-center justify-center">
            <Flame size={18} strokeWidth={1.5} className="text-[#F5F3EE]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-serif font-bold tracking-tight text-white m-0">
                Agni Drishti: Demo District
              </h1>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-2xs font-mono font-medium bg-[#132A1C] text-[#86EFAC] border border-[#166534]">
                Zone A Active
              </span>
            </div>
            <p className="text-2xs text-[#9CA3AF] m-0">
              State Pollution Control Board &bull; Inspector Farida Khan Patrol Registry
            </p>
          </div>
        </div>

        {/* Quick KPI pills */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#14181C] border border-[#32383F] text-[#D1D5DB]">
            <span className="w-2 h-2 rounded-full bg-[#1A73E8]"></span>
            <span>Kilns: <strong className="text-white">{totalKilns}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#2E1505] border border-[#7C2D12] text-[#FDBA74]">
            <ShieldAlert size={14} strokeWidth={1.5} className="text-[#FB923C]" />
            <span>Violations: <strong className="text-white">{fcbkViolations}</strong></span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="bg-[#14181C] border-t border-[#32383F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1.5 no-scrollbar" aria-label="Tabs">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelectTab(item.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-[#1F4E5F] ${
                    isActive
                      ? 'bg-[#1F4E5F] text-white border border-[#2E687D]'
                      : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F2328]'
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

