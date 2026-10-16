import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AppData } from '../types/data';
import { loadAllData } from '../services/dataLoader';

interface DataContextType {
  data: AppData | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  data: null,
  loading: true,
  error: null,
  reload: async () => {},
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadAllData();
      setData(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown data loading error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DataContext.Provider value={{ data, loading, error, reload: fetchData }}>
      {children}
    </DataContext.Provider>
  );
};

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
