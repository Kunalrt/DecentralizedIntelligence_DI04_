import React, { useState, useEffect } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Header } from './components/Header';
import type { TabKey } from './components/Header';
import { Footer } from './components/Footer';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { OverviewPage } from './pages/OverviewPage';
import { MapPage } from './pages/MapPage';
import { FieldListPage } from './pages/FieldListPage';
import { MapAreaPage } from './pages/MapAreaPage';
import { MethodPage } from './pages/MethodPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { StyleguidePage } from './pages/StyleguidePage';

const AppContent: React.FC = () => {
  const { data, loading, error, reload } = useData();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Sync activeTab with URL hash for shareable links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['overview', 'map', 'field', 'map-area', 'method', 'downloads', 'styleguide'].includes(hash)) {
        setActiveTab(hash as TabKey);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tab: TabKey) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F3EE] text-[#1F2328] selection:bg-[#1F4E5F] selection:text-white font-sans">
      <Header activeTab={activeTab} onSelectTab={handleSelectTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {data?.dataWarning && (
          <div
            id="data-repair-warning"
            role="alert"
            className="mb-4 p-2.5 bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E] rounded-[4px] flex items-center justify-between text-xs font-mono shadow-xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse flex-shrink-0" />
              <span>{data.dataWarning}</span>
            </div>
          </div>
        )}

        {loading && <LoadingState />}
        {error && !loading && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && (
          <>
            {activeTab === 'overview' && <OverviewPage onNavigateTab={handleSelectTab} />}
            {activeTab === 'map' && <MapPage />}
            {activeTab === 'field' && <FieldListPage />}
            {activeTab === 'map-area' && <MapAreaPage />}
            {activeTab === 'method' && <MethodPage />}
            {activeTab === 'downloads' && <DownloadsPage />}
            {activeTab === 'styleguide' && <StyleguidePage />}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
