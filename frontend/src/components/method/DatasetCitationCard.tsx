import React, { useState } from 'react';
import { Award, Copy, Check, ShieldCheck } from 'lucide-react';
import { DATASET_CREDIT } from '../../config/constants';

export const DatasetCitationCard: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const bibtex = `@inproceedings{mondal2025sentinelkilndb,
  title={SentinelKilnDB: A Large-Scale Benchmark for Brick Kiln Detection and Compliance Monitoring across the Indo-Gangetic Plains},
  author={Mondal, et al.},
  booktitle={Thirty-ninth Conference on Neural Information Processing Systems (NeurIPS 2025) Datasets and Benchmarks Track},
  year={2025},
  institution={Sustainability Lab, IIT Gandhinagar},
  license={CC BY-NC 4.0}
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-amber-50/60 rounded-xl border border-amber-200/90 p-5 shadow-sm space-y-3 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-950 m-0">
              Official Benchmark & Dataset Citation
            </h3>
            <p className="text-[11px] text-amber-800 m-0 mt-0.5">
              Strictly non-commercial research and environmental compliance monitoring.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 border border-amber-300 text-amber-900 font-semibold self-start sm:self-auto text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          {DATASET_CREDIT.license}
        </span>
      </div>

      <div className="space-y-2 text-slate-700 leading-relaxed">
        <p className="m-0 font-medium text-slate-800">
          <strong>Dataset Credit:</strong> {DATASET_CREDIT.fullText}
        </p>

        <p className="text-[11px] text-slate-600 m-0">
          The SentinelKilnDB benchmark comprises 114,300 Sentinel-2 multispectral satellite tiles with expert-verified oriented bounding boxes (OBB) across India, Pakistan, and Bangladesh. Used under Creative Commons Attribution-NonCommercial (CC BY-NC 4.0) terms.
        </p>
      </div>

      {/* Copyable BibTeX Block */}
      <div className="bg-white rounded-lg border border-amber-200/80 p-3 relative group">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
            BibTeX Citation
          </span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">Copied BibTeX</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy BibTeX</span>
              </>
            )}
          </button>
        </div>

        <pre className="font-mono text-[10px] text-slate-700 overflow-x-auto m-0 leading-tight p-1 select-all">
          {bibtex}
        </pre>
      </div>
    </div>
  );
};
