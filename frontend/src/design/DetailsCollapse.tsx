import React, { useState } from 'react';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';

interface DetailsCollapseProps {
  summary: string;
  count?: number | string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const DetailsCollapse: React.FC<DetailsCollapseProps> = ({
  summary,
  count,
  icon = <HelpCircle size={14} strokeWidth={1.5} />,
  children,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`border border-[#D9D6CE] rounded-[4px] bg-white overflow-hidden transition-all ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3 py-2.5 flex items-center justify-between gap-3 text-left bg-[#FAF9F5] hover:bg-[#F5F3EE] transition-colors focus:outline-none focus:ring-1 focus:ring-[#1F4E5F]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[#1F2328]">
          <span className="text-[#1F4E5F] flex-shrink-0">{icon}</span>
          <span>{summary}</span>
          {count !== undefined && (
            <span className="px-1.5 py-0.2 rounded-[2px] bg-[#E8E5DD] text-[#1F2328] font-mono text-2xs">
              {count}
            </span>
          )}
        </div>
        <div className="text-[#656D76] flex-shrink-0">
          {isOpen ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-[#D9D6CE] text-xs leading-relaxed text-[#1F2328] bg-white">
          {children}
        </div>
      )}
    </div>
  );
};
