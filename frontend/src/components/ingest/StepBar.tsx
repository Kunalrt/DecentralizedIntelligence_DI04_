import React from 'react';
import { Upload, Cpu, Compass, Check } from 'lucide-react';

export type IngestStep = 'upload' | 'process' | 'explore';

interface StepBarProps {
  currentStep: IngestStep;
  onSelectStep?: (step: IngestStep) => void;
  canExplore?: boolean;
}

export const StepBar: React.FC<StepBarProps> = ({
  currentStep,
  onSelectStep,
  canExplore = false,
}) => {
  const steps: { key: IngestStep; label: string; icon: React.ReactNode }[] = [
    { key: 'upload', label: 'Upload', icon: <Upload size={16} strokeWidth={1.5} /> },
    { key: 'process', label: 'Process', icon: <Cpu size={16} strokeWidth={1.5} /> },
    { key: 'explore', label: 'Explore', icon: <Compass size={16} strokeWidth={1.5} /> },
  ];

  const stepOrder: Record<IngestStep, number> = { upload: 1, process: 2, explore: 3 };
  const currentIdx = stepOrder[currentStep];

  return (
    <div className="grid grid-cols-3 gap-2 bg-white border border-[#D9D6CE] rounded-[4px] p-1.5 text-xs font-mono">
      {steps.map((st, i) => {
        const stepNum = i + 1;
        const isActive = currentStep === st.key;
        const isPast = currentIdx > stepNum;
        const isClickable = (st.key === 'upload') || (st.key === 'explore' && canExplore);

        return (
          <button
            key={st.key}
            type="button"
            disabled={!isClickable}
            onClick={() => isClickable && onSelectStep?.(st.key)}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[2px] transition-colors ${
              isActive
                ? 'bg-[#1F4E5F] text-white font-semibold shadow-xs'
                : isPast
                ? 'bg-[#FAF9F5] text-[#1F2328] hover:bg-[#F5F3EE]'
                : 'text-[#656D76] opacity-60 cursor-not-allowed'
            }`}
          >
            <span className="flex-shrink-0">
              {isPast ? <Check size={14} strokeWidth={2} className="text-[#16A34A]" /> : st.icon}
            </span>
            <span className="truncate">{st.label}</span>
          </button>
        );
      })}
    </div>
  );
};
