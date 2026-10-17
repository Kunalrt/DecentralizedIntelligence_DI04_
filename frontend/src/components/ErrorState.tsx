import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../design';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load surveillance dataset from disk.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 text-center font-mono">
      <div className="w-12 h-12 rounded-[4px] bg-[#FEF2F2] border border-[#DC2626] flex items-center justify-center mb-3">
        <AlertTriangle size={22} strokeWidth={1.5} className="text-[#DC2626]" />
      </div>
      <h3 className="text-sm font-serif font-bold text-[#1F2328]">Data Synchronization Error</h3>
      <p className="mt-2 text-2xs text-[#B91C1C] max-w-md bg-[#FEF2F2] p-2.5 rounded-[4px] border border-[#DC2626]">
        {message}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button
            size="sm"
            variant="primary"
            icon={<RefreshCw size={13} strokeWidth={1.5} />}
            onClick={onRetry}
          >
            Retry Data Load
          </Button>
        </div>
      )}
    </div>
  );
};
