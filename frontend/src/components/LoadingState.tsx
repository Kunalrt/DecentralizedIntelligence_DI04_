import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading Sentinel-2 surveillance data and compliance registry...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center font-mono">
      <div className="relative mb-3">
        <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-[#1F4E5F]" />
      </div>
      <h3 className="text-sm font-serif font-bold text-[#1F2328]">Demo District Surveillance</h3>
      <p className="mt-1 text-2xs text-[#656D76] max-w-md">{message}</p>
    </div>
  );
};
