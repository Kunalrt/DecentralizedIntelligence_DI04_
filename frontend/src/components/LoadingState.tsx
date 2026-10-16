import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading Sentinel-2 surveillance data and compliance registry...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-brand-primary animate-pulse" />
        </div>
      </div>
      <h3 className="mt-6 text-lg font-semibold text-slate-800">Demo District Kiln Surveillance</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-md">{message}</p>
    </div>
  );
};
