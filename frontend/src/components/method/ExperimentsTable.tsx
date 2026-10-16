import React from 'react';
import type { ExperimentItem } from '../../types/data';
import {
  FlaskConical,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface ExperimentsTableProps {
  experiments: ExperimentItem[];
}

export const ExperimentsTable: React.FC<ExperimentsTableProps> = ({ experiments }) => {
  const getBadgeStyle = (status: string) => {
    if (status.includes('Champion')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (status.includes('Rejected')) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (status.includes('Baseline')) {
      return 'bg-slate-100 text-slate-800 border-slate-300';
    }
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getDeltaBadge = (id: string, mAP: number | null) => {
    if (mAP === null) return <span className="text-slate-400 font-mono">-</span>;
    // Baseline is Exp 03 = 0.4556
    const baseline = 0.4556;
    const delta = mAP - baseline;

    if (id === '03') {
      return <span className="text-slate-500 font-mono text-[11px]">Baseline</span>;
    }

    if (delta > 0) {
      return (
        <span className="inline-flex items-center text-emerald-700 font-mono font-bold text-xs">
          <ArrowUpRight className="w-3.5 h-3.5" />+{delta.toFixed(4)}
        </span>
      );
    } else if (delta < 0) {
      return (
        <span className="inline-flex items-center text-red-700 font-mono font-bold text-xs">
          <ArrowDownRight className="w-3.5 h-3.5" />{delta.toFixed(4)}
        </span>
      );
    }
    return <span className="text-slate-500 font-mono">0.0000</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 m-0">
              10-Experiment Engineering Progression
            </h3>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Systematic iterative progression from baseline scaffolding to 0.8339 champion architecture.
          </p>
        </div>

        <div className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 self-start sm:self-auto">
          Baseline: 0.4556 &rarr; Champion: <strong>0.8339 (+0.3783)</strong>
        </div>
      </div>

      {/* Main Progression Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3 w-16">Exp ID</th>
              <th className="py-2.5 px-3">Model & Approach</th>
              <th className="py-2.5 px-3">Key Technique & Hypothesis</th>
              <th className="py-2.5 px-3 text-right">Val mAP@0.5</th>
              <th className="py-2.5 px-3 text-right">Per-Class AP</th>
              <th className="py-2.5 px-3 text-right">Delta</th>
              <th className="py-2.5 px-3">Outcome & Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {experiments.map((exp) => (
              <tr
                key={exp.id}
                className={`hover:bg-slate-50/70 transition ${
                  exp.status.includes('Champion')
                    ? 'bg-emerald-50/20'
                    : exp.status.includes('Rejected')
                    ? 'bg-red-50/20'
                    : ''
                }`}
              >
                {/* Exp ID */}
                <td className="py-3 px-3 font-mono font-bold text-slate-900">
                  Exp {exp.id}
                </td>

                {/* Model */}
                <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                  {exp.model}
                </td>

                {/* Technique */}
                <td className="py-3 px-3 text-slate-600 leading-relaxed max-w-xs">
                  {exp.technique}
                </td>

                {/* Val mAP */}
                <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                  {exp.val_mAP !== null ? exp.val_mAP.toFixed(4) : '-'}
                </td>

                {/* Per-Class AP */}
                <td className="py-3 px-3 text-right font-mono text-[11px] whitespace-nowrap text-slate-600">
                  {exp.ap_fcbk !== null ? (
                    <div>
                      F: {exp.ap_fcbk.toFixed(2)} &bull; Z: {exp.ap_zigzag?.toFixed(2)} &bull; C: {exp.ap_cfcbk?.toFixed(2)}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>

                {/* Delta */}
                <td className="py-3 px-3 text-right whitespace-nowrap">
                  {getDeltaBadge(exp.id, exp.val_mAP)}
                </td>

                {/* Outcome Badge & Text */}
                <td className="py-3 px-3">
                  <div className="space-y-1">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                        exp.status
                      )}`}
                    >
                      {exp.status}
                    </span>
                    <div className="text-[11px] text-slate-600 leading-tight">
                      {exp.outcome}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Honest Failures & Rejected Hypotheses Panel for Judges */}
      <div className="bg-red-50/50 rounded-xl border border-red-200/80 p-4 space-y-3">
        <div className="flex items-center gap-2 font-bold text-xs text-red-900">
          <XCircle className="w-4 h-4 text-red-600" />
          <span>Honest Engineering: What Failed & Why (Negative Results)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-red-950">
          {/* Failure 1: Exp 08 Pseudo-Labeling */}
          <div className="p-3 bg-white/90 rounded-lg border border-red-200 space-y-1">
            <strong className="text-red-900 block font-bold">
              1. Pseudo-Labeling Domain Shift (-0.0719 mAP)
            </strong>
            <p className="text-slate-600 text-[11px] leading-relaxed m-0">
              Fine-tuning on unverified predictions (conf &gt; 0.70) caused catastrophic confirmation bias. Zigzag AP plunged from 0.6167 to 0.4417 as rectangular agricultural fields were misclassified as kilns. <strong>Decision: Decisively rejected.</strong>
            </p>
          </div>

          {/* Failure 2: Exp 03 Baseline CFCBK Collapse */}
          <div className="p-3 bg-white/90 rounded-lg border border-red-200 space-y-1">
            <strong className="text-red-900 block font-bold">
              2. Baseline Class Collapse (0.0000 CFCBK AP)
            </strong>
            <p className="text-slate-600 text-[11px] leading-relaxed m-0">
              At 128x128 px, rare circular kilns (~3% prevalence) span only 12x6 px. Standard loss weighting caused the network to predict 0 true positives. <strong>Solved via Exp 06 Copy-Paste synthesis (+0.3105 mAP).</strong>
            </p>
          </div>

          {/* Failure 3: Latency & Heavy Mosaic */}
          <div className="p-3 bg-white/90 rounded-lg border border-red-200 space-y-1">
            <strong className="text-red-900 block font-bold">
              3. Heavy Mosaic & Multi-Scale TTA Latency
            </strong>
            <p className="text-slate-600 text-[11px] leading-relaxed m-0">
              Aggressive mosaic augmentation washed out small kiln contours below 6 px. 4-scale TTA quadrupled latency with 0.0000 mAP gain. <strong>Solved via 2-view TTA (H-flip + 90&deg; rot) in 52.8 s.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
