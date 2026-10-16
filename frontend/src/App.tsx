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
import { MethodPage } from './pages/MethodPage';
import { DownloadsPage } from './pages/DownloadsPage';

const AppContent: React.FC = () => {
  const { loading, error, reload } = useData();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Sync activeTab with URL hash for shareable links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['overview', 'map', 'field', 'method', 'downloads'].includes(hash)) {
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-primary selection:text-white">
      <Header activeTab={activeTab} onSelectTab={handleSelectTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && <LoadingState />}
        {error && !loading && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && (
          <>
            {activeTab === 'overview' && <OverviewPage onNavigateTab={handleSelectTab} />}
            {activeTab === 'map' && <MapPage />}
            {activeTab === 'field' && <FieldListPage />}
            {activeTab === 'method' && <MethodPage />}
            {activeTab === 'downloads' && <DownloadsPage />}
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
