import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load surveillance dataset from disk.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">Data Synchronization Error</h3>
      <p className="mt-2 text-sm text-slate-600 max-w-md bg-white p-3 rounded border border-red-200 text-red-700 font-mono text-xs">
        {message}
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow"
          >
            <RefreshCw className="w-4 h-4" /> Retry Data Load
          </button>
        )}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Run <code>npm run sync</code> or <code>bash frontend/scripts/sync_data.sh</code> to re-sync brief/outputs.
      </p>
    </div>
  );
};
