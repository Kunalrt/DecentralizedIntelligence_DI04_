import React from 'react';
import type { ExperimentItem } from '../../types/data';
import {
  FlaskConical,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Badge, DetailsCollapse } from '../../design';

interface ExperimentsTableProps {
  experiments: ExperimentItem[];
}

export const ExperimentsTable: React.FC<ExperimentsTableProps> = ({ experiments }) => {
  const getBadgeVariant = (status: string): 'success' | 'warning' | 'outline' | 'accent' => {
    if (status.includes('Champion')) return 'success';
    if (status.includes('Rejected')) return 'warning';
    return 'outline';
  };

  const getDeltaBadge = (id: string, mAP: number | null) => {
    if (mAP === null) return <span className="text-[#656D76] font-mono">-</span>;
    const baseline = 0.4556;
    const delta = mAP - baseline;

    if (id === '03') {
      return <span className="text-[#656D76] font-mono text-2xs">Baseline</span>;
    }

    if (delta > 0) {
      return (
        <span className="inline-flex items-center text-[#16A34A] font-mono font-bold text-2xs">
          <ArrowUpRight size={13} strokeWidth={1.5} />+{delta.toFixed(4)}
        </span>
      );
    } else if (delta < 0) {
      return (
        <span className="inline-flex items-center text-[#DC2626] font-mono font-bold text-2xs">
          <ArrowDownRight size={13} strokeWidth={1.5} />{delta.toFixed(4)}
        </span>
      );
    }
    return <span className="text-[#656D76] font-mono">0.0000</span>;
  };

  return (
    <div className="bg-white rounded-[4px] border border-[#D9D6CE] shadow-xs overflow-hidden space-y-3 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9D6CE] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-[2px] bg-[#FAF9F5] border border-[#D9D6CE] text-[#1F4E5F]">
              <FlaskConical size={15} strokeWidth={1.5} />
            </span>
            <h3 className="text-sm font-serif font-bold text-[#1F2328] m-0">
              10-Experiment Engineering Progression
            </h3>
          </div>
          <p className="text-2xs text-[#656D76] font-mono m-0 mt-0.5">
            Systematic progression from baseline scaffolding to 0.8339 champion architecture.
          </p>
        </div>

        <Badge variant="accent">
          Baseline 0.4556 &rarr; Champion 0.8339 (+0.3783)
        </Badge>
      </div>

      {/* Main Progression Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-[#FAF9F5] text-[#656D76] font-semibold border-b border-[#D9D6CE] text-2xs uppercase tracking-wider">
              <th className="py-2.5 px-3 w-16">Exp ID</th>
              <th className="py-2.5 px-3">Model</th>
              <th className="py-2.5 px-3">Hypothesis & Technique</th>
              <th className="py-2.5 px-3 text-right">Val mAP@0.5</th>
              <th className="py-2.5 px-3 text-right">Per-Class AP</th>
              <th className="py-2.5 px-3 text-right">Delta</th>
              <th className="py-2.5 px-3">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D6CE]/60">
            {experiments.map((exp) => (
              <tr
                key={exp.id}
                className={`hover:bg-[#FAF9F5] transition-colors ${
                  exp.status.includes('Champion')
                    ? 'bg-[#FAFDFB]'
                    : exp.status.includes('Rejected')
                    ? 'bg-[#FEF2F2]/40'
                    : ''
                }`}
              >
                {/* Exp ID */}
                <td className="py-2.5 px-3 font-bold text-[#1F2328]">
                  Exp {exp.id}
                </td>

                {/* Model */}
                <td className="py-2.5 px-3 font-semibold text-[#1F2328] whitespace-nowrap">
                  {exp.model}
                </td>

                {/* Technique */}
                <td className="py-2.5 px-3 text-[#656D76] text-2xs truncate max-w-xs font-sans">
                  {exp.technique}
                </td>

                {/* Val mAP */}
                <td className="py-2.5 px-3 text-right font-bold text-[#1F2328]">
                  {exp.val_mAP !== null ? exp.val_mAP.toFixed(4) : '-'}
                </td>

                {/* Per-Class AP */}
                <td className="py-2.5 px-3 text-right text-2xs whitespace-nowrap text-[#656D76]">
                  {exp.ap_fcbk !== null ? (
                    <div>
                      F: {exp.ap_fcbk.toFixed(2)} &bull; Z: {exp.ap_zigzag?.toFixed(2)} &bull; C: {exp.ap_cfcbk?.toFixed(2)}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>

                {/* Delta */}
                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                  {getDeltaBadge(exp.id, exp.val_mAP)}
                </td>

                {/* Outcome Badge & Text */}
                <td className="py-2.5 px-3">
                  <div className="space-y-0.5">
                    <Badge variant={getBadgeVariant(exp.status)}>
                      {exp.status}
                    </Badge>
                    <div className="text-2xs text-[#656D76] truncate max-w-xs font-sans">
                      {exp.outcome}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Negative Results Collapsible */}
      <DetailsCollapse summary="Honest Engineering: Negative Results & Rejected Hypotheses">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs font-sans">
          <div className="p-2.5 bg-[#FAF9F5] rounded-[2px] border border-[#D9D6CE]">
            <strong className="text-[#B91C1C] block text-xs font-bold mb-1">
              1. Pseudo-Labeling (-0.0719 mAP)
            </strong>
            <p className="text-[#656D76] text-2xs m-0 leading-relaxed">
              Fine-tuning on unverified predictions caused confirmation bias. Zigzag AP plunged to 0.4417 as rectangular fields were misclassified. Decisively rejected.
            </p>
          </div>

          <div className="p-2.5 bg-[#FAF9F5] rounded-[2px] border border-[#D9D6CE]">
            <strong className="text-[#B91C1C] block text-xs font-bold mb-1">
              2. Baseline CFCBK Collapse (0.0000 AP)
            </strong>
            <p className="text-[#656D76] text-2xs m-0 leading-relaxed">
              At 128x128 px, rare circular kilns (~3% prevalence) span only 12x6 px. Standard loss caused 0 true positives. Solved via Copy-Paste synthesis (+0.3105 mAP).
            </p>
          </div>

          <div className="p-2.5 bg-[#FAF9F5] rounded-[2px] border border-[#D9D6CE]">
            <strong className="text-[#B91C1C] block text-xs font-bold mb-1">
              3. Heavy Mosaic & TTA Latency
            </strong>
            <p className="text-[#656D76] text-2xs m-0 leading-relaxed">
              Aggressive mosaic washed out small kiln contours. 4-scale TTA quadrupled latency with 0 gain. Solved via 2-view TTA in 52.8 s.
            </p>
          </div>
        </div>
      </DetailsCollapse>
    </div>
  );
};
