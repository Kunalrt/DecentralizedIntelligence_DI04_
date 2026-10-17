import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: React.ReactNode;
  label?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  label = 'Details',
  side = 'top',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const posClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }[side];

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
        className="text-[#656D76] hover:text-[#1F4E5F] p-0.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[#1F4E5F]"
      >
        <Info size={14} strokeWidth={1.5} />
      </button>

      {open && (
        <div
          role="tooltip"
          className={`absolute ${posClasses} z-50 w-64 max-w-xs p-2.5 bg-white text-[#1F2328] text-xs leading-relaxed border border-[#D9D6CE] rounded-[4px] shadow-sm animate-in fade-in`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
